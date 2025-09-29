import {
  createWorkflow,
  WorkflowTypes,
  WorkflowResponse,
} from "@medusajs/framework/types"
import { OdooProduct } from "../modules/odoo/service"
import { MedusaContainer } from "@medusajs/framework/types"

type WorkflowInput = {
  limit?: number
  offset?: number
}

export const syncFromErpWorkflow = createWorkflow(
  "sync-from-erp",
  function (input: WorkflowInput, container: MedusaContainer) {
    // Paso 1: Obtener el servicio Odoo del contenedor
    const odooService = container.resolve("odooService")
    
    // Paso 2: Obtener productos desde Odoo
    const odooProducts = odooService.listProducts([], {
      offset: input.offset || 0,
      limit: input.limit || 10,
    })

    // Paso 3: Transformar productos de Odoo a formato de Medusa
    const transformedProducts = this.transform(
      { odooProducts },
      async ({ odooProducts }: { odooProducts: OdooProduct[] }) => {
        const productsToCreate: any[] = []
        const productsToUpdate: any[] = []

        for (const odooProduct of odooProducts) {
          // Buscar si el producto ya existe en Medusa por external_id
          const existingProduct = await container
            .resolve("productService")
            .listProducts({ external_id: `${odooProduct.id}` })

          const product = {
            title: odooProduct.name,
            handle: odooProduct.name.toLowerCase().replace(/\s+/g, "-"),
            description: odooProduct.description || odooProduct.description_sale,
            status: odooProduct.is_published ? "published" : "draft",
            external_id: `${odooProduct.id}`,
            metadata: {
              odoo_id: odooProduct.id,
              odoo_url: odooProduct.website_url,
              currency: odooProduct.currency_id.display_name,
              stock_quantity: odooProduct.qty_available,
              allow_out_of_stock: odooProduct.allow_out_of_stock_order,
              is_kit: odooProduct.is_kits,
              hs_code: odooProduct.hs_code,
            },
            variants: [] as any[],
          }

          // Procesar variantes del producto
          if (odooProduct.product_variant_ids && odooProduct.product_variant_ids.length > 0) {
            product.variants = odooProduct.product_variant_ids.map((variant) => {
              const options: Record<string, string> = {}
              
              if (variant.product_template_variant_value_ids.length) {
                variant.product_template_variant_value_ids.forEach((value) => {
                  options[value.attribute_id.display_name] = value.name
                })
              } else {
                // Si no hay variantes específicas, usar valores por defecto
                product.options?.forEach((option: any) => {
                  options[option.title] = option.values[0]
                })
              }

              return {
                id: existingProduct.length > 0 
                  ? existingProduct[0].variants.find((v: any) => v.sku === variant.code)?.id 
                  : undefined,
                title: variant.display_name.replace(`[${variant.code}] `, ""),
                sku: variant.code || undefined,
                options,
                prices: [
                  {
                    amount: variant.list_price || odooProduct.list_price,
                    currency_code: odooProduct.currency_id.display_name.toLowerCase(),
                  },
                ],
                manage_inventory: false, // Cambiar a true si sincronizas inventario desde Odoo
                metadata: {
                  external_id: `${variant.id}`,
                  odoo_variant_id: variant.id,
                },
              }
            })
          } else {
            // Producto sin variantes específicas
            product.variants.push({
              id: existingProduct.length > 0 ? existingProduct[0].variants[0]?.id : undefined,
              title: "Default",
              options: {
                Default: "Default",
              },
              prices: [
                {
                  amount: odooProduct.list_price,
                  currency_code: odooProduct.currency_id.display_name.toLowerCase(),
                },
              ],
              manage_inventory: false,
              metadata: {
                external_id: `${odooProduct.id}`,
                odoo_product_id: odooProduct.id,
              },
            })
          }

          // Determinar si crear o actualizar
          if (existingProduct.length > 0) {
            productsToUpdate.push(product as any)
          } else {
            productsToCreate.push(product as any)
          }
        }

        return {
          productsToCreate,
          productsToUpdate,
        }
      }
    )

    // Paso 4: Crear productos nuevos
    const createResult = this.conditional(
      transformedProducts.productsToCreate.length > 0,
      {
        true: this.invoke("createProductsWorkflow", {
          input: { products: transformedProducts.productsToCreate },
        }),
        false: { products: [] },
      }
    )

    // Paso 5: Actualizar productos existentes
    const updateResult = this.conditional(
      transformedProducts.productsToUpdate.length > 0,
      {
        true: this.invoke("updateProductsWorkflow", {
          input: { products: transformedProducts.productsToUpdate },
        }),
        false: { products: [] },
      }
    )

    // Paso 6: Retornar resultado
    return new WorkflowResponse({
      odooProducts,
      createdProducts: createResult.products,
      updatedProducts: updateResult.products,
      summary: {
        totalOdooProducts: odooProducts.length,
        productsToCreate: transformedProducts.productsToCreate.length,
        productsToUpdate: transformedProducts.productsToUpdate.length,
      },
    })
  }
)

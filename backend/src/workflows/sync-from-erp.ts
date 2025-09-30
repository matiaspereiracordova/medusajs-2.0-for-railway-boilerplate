import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { OdooProduct } from "../modules/odoo/service"
import { MedusaContainer } from "@medusajs/framework/types"

// Tipos para los servicios
interface OdooService {
  listProducts(filters?: any, pagination?: { offset?: number; limit?: number }): Promise<OdooProduct[]>
}

interface ProductService {
  listProducts(filters: { external_id: string }): Promise<any[]>
  createProducts(data: any): Promise<any>
  createProductVariants(data: any): Promise<any>
  updateProducts(id: string, data: any): Promise<any>
  updateProductVariants(id: string, data: any): Promise<any>
}

type WorkflowInput = {
  limit?: number
  offset?: number
}

// Step 1: Obtener productos desde Odoo
const getOdooProductsStep = createStep(
  "get-odoo-products",
  async (input: WorkflowInput, { container }: { container: MedusaContainer }) => {
    const odooService = container.resolve("odooService") as OdooService
    const products = await odooService.listProducts([], {
      offset: input.offset || 0,
      limit: input.limit || 10,
    })
    
    return new StepResponse(products)
  }
)

// Step 2: Transformar productos de Odoo a formato de Medusa
const transformProductsStep = createStep(
  "transform-products",
  async (odooProducts: OdooProduct[], { container }: { container: MedusaContainer }) => {
    const productsToCreate: any[] = []
    const productsToUpdate: any[] = []

    for (const odooProduct of odooProducts) {
      // Buscar si el producto ya existe en Medusa por external_id
      const productService = container.resolve("productService") as ProductService
      const existingProduct = await productService.listProducts({ external_id: `${odooProduct.id}` })

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
            options["Default"] = "Default"
          }

          return {
            id: existingProduct.length > 0 
              ? existingProduct[0].variants.find((v: any) => v.sku === variant.code)?.id 
              : undefined,
            title: variant.code ? variant.code.replace(`[${variant.code}] `, "") : "Default",
            sku: variant.code || undefined,
            options,
            prices: [
              {
                amount: odooProduct.list_price, // Usar el precio del producto principal ya que las variantes no tienen list_price
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

    return new StepResponse({
      productsToCreate,
      productsToUpdate,
    })
  }
)

// Step 3: Crear productos nuevos
const createProductsStep = createStep(
  "create-products",
  async (productsToCreate: any[], { container }: { container: MedusaContainer }) => {
    if (productsToCreate.length === 0) {
      return new StepResponse({ products: [] })
    }

    const productService = container.resolve("productService") as ProductService
    const createdProducts = []

    for (const productData of productsToCreate) {
      try {
        // Crear el producto principal
        const product = await productService.createProducts({
          title: productData.title,
          handle: productData.handle,
          description: productData.description,
          status: productData.status || "draft",
          external_id: productData.external_id,
          metadata: productData.metadata,
        })

        // Crear las variantes del producto
        for (const variantData of productData.variants) {
          await productService.createProductVariants({
            product_id: product.id,
            title: variantData.title,
            sku: variantData.sku,
            options: variantData.options,
            prices: variantData.prices,
            manage_inventory: variantData.manage_inventory || false,
            metadata: variantData.metadata,
          })
        }

        createdProducts.push({
          success: true,
          product,
          message: `Producto ${productData.title} creado exitosamente`,
        })
      } catch (error) {
        createdProducts.push({
          success: false,
          product: null,
          error: error.message,
          message: `Error creando producto ${productData.title}: ${error.message}`,
        })
      }
    }

    return new StepResponse({ products: createdProducts })
  }
)

// Step 4: Actualizar productos existentes
const updateProductsStep = createStep(
  "update-products",
  async (productsToUpdate: any[], { container }: { container: MedusaContainer }) => {
    if (productsToUpdate.length === 0) {
      return new StepResponse({ products: [] })
    }

    const productService = container.resolve("productService") as ProductService
    const updatedProducts = []

    for (const productData of productsToUpdate) {
      try {
        // Buscar el producto existente por external_id
        const existingProducts = await productService.listProducts({
          external_id: productData.external_id,
        })

        if (existingProducts.length === 0) {
          throw new Error(`No se pudo encontrar el producto con external_id: ${productData.external_id}`)
        }

        const productId = existingProducts[0].id

        // Actualizar el producto principal
        const updatedProduct = await productService.updateProducts(productId, {
          title: productData.title,
          handle: productData.handle,
          description: productData.description,
          status: productData.status,
          metadata: productData.metadata,
        })

        // Actualizar las variantes del producto
        for (const variantData of productData.variants) {
          if (variantData.id) {
            // Actualizar variante existente
            await productService.updateProductVariants(variantData.id, {
              title: variantData.title,
              sku: variantData.sku,
              options: variantData.options,
              prices: variantData.prices,
              manage_inventory: variantData.manage_inventory || false,
              metadata: variantData.metadata,
            })
          } else {
            // Crear nueva variante si no existe
            await productService.createProductVariants({
              product_id: productId,
              title: variantData.title,
              sku: variantData.sku,
              options: variantData.options,
              prices: variantData.prices,
              manage_inventory: variantData.manage_inventory || false,
              metadata: variantData.metadata,
            })
          }
        }

        updatedProducts.push({
          success: true,
          product: updatedProduct,
          message: `Producto ${productData.title} actualizado exitosamente`,
        })
      } catch (error) {
        updatedProducts.push({
          success: false,
          product: null,
          error: error.message,
          message: `Error actualizando producto ${productData.title}: ${error.message}`,
        })
      }
    }

    return new StepResponse({ products: updatedProducts })
  }
)

// Workflow principal
export const syncFromErpWorkflow = createWorkflow(
  "sync-from-erp",
  function (input: WorkflowInput) {
    // Paso 1: Obtener productos desde Odoo
    const odooProducts = getOdooProductsStep(input)

    // Paso 2: Transformar productos de Odoo a formato de Medusa
    const transformed = transformProductsStep(odooProducts)

    // Paso 3: Crear productos nuevos
    const created = createProductsStep(transformed.productsToCreate)

    // Paso 4: Actualizar productos existentes
    const updated = updateProductsStep(transformed.productsToUpdate)

    // Paso 5: Retornar resultado
    return new WorkflowResponse({
      odooProducts,
      createdProducts: created.products,
      updatedProducts: updated.products,
      summary: {
        totalOdooProducts: odooProducts.length,
        productsToCreate: transformed.productsToCreate.length,
        productsToUpdate: transformed.productsToUpdate.length,
      },
    })
  }
)
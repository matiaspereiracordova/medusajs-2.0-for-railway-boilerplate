import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { MedusaContainer } from "@medusajs/types"

// Tipos para el servicio
interface ProductService {
  listProducts(filters: { external_id: string }): Promise<any[]>
  updateProducts(id: string, data: any): Promise<any>
  updateProductVariants(id: string, data: any): Promise<any>
  createProductVariants(data: any): Promise<any>
}

type UpdateProductWorkflowInput = {
  products: Array<{
    id?: string
    title: string
    handle: string
    description?: string
    status?: string
    external_id?: string
    metadata?: Record<string, any>
    variants: Array<{
      id?: string
      title: string
      sku?: string
      options?: Record<string, string>
      prices: Array<{
        amount: number
        currency_code: string
      }>
      manage_inventory?: boolean
      metadata?: Record<string, any>
    }>
  }>
}

// Step para actualizar productos
const updateProductsStep = createStep(
  "update-products",
  async (products: UpdateProductWorkflowInput["products"], { container }: { container: MedusaContainer }) => {
    const productService = container.resolve("productService") as ProductService
    const updatedProducts = []

    for (const productData of products) {
      try {
        // Buscar el producto existente por external_id si no se proporciona id
        let productId = productData.id
        if (!productId && productData.external_id) {
          const existingProducts = await productService.listProducts({
            external_id: productData.external_id,
          })
          if (existingProducts.length > 0) {
            productId = existingProducts[0].id
          }
        }

        if (!productId) {
          throw new Error(`No se pudo encontrar el producto con external_id: ${productData.external_id}`)
        }

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

    return new StepResponse({
      products: updatedProducts,
      summary: {
        total: products.length,
        successful: updatedProducts.filter(p => p.success).length,
        failed: updatedProducts.filter(p => !p.success).length,
      },
    })
  }
)

// Workflow principal
export const updateProductsWorkflow = createWorkflow(
  "updateProducts",
  function (input: UpdateProductWorkflowInput) {
    // Ejecutar el step de actualización de productos
    const result = updateProductsStep(input.products)

    // Retornar resultado
    return new WorkflowResponse({
      products: result.products,
      summary: result.summary,
    })
  }
)

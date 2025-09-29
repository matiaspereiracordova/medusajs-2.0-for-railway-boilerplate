import {
  createWorkflow,
  WorkflowTypes,
  WorkflowResponse,
} from "@medusajs/framework/types"

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

export const updateProductsWorkflow = createWorkflow(
  "updateProducts",
  function (input: UpdateProductWorkflowInput, container) {
    const productService = container.resolve("productService")
    
    const updatedProducts = input.products.map(async (productData) => {
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

        return {
          success: true,
          product: updatedProduct,
          message: `Producto ${productData.title} actualizado exitosamente`,
        }
      } catch (error) {
        return {
          success: false,
          product: null,
          error: error.message,
          message: `Error actualizando producto ${productData.title}: ${error.message}`,
        }
      }
    })

    return new WorkflowResponse({
      products: updatedProducts,
      summary: {
        total: input.products.length,
        successful: updatedProducts.filter(p => p.success).length,
        failed: updatedProducts.filter(p => !p.success).length,
      },
    })
  }
)

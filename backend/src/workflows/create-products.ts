import {
  createWorkflow,
  WorkflowTypes,
  WorkflowResponse,
} from "@medusajs/framework/types"

type CreateProductWorkflowInput = {
  products: Array<{
    title: string
    handle: string
    description?: string
    status?: string
    external_id?: string
    metadata?: Record<string, any>
    variants: Array<{
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

export const createProductsWorkflow = createWorkflow(
  "createProducts",
  function (input: CreateProductWorkflowInput, container) {
    const productService = container.resolve("productService")
    
    const createdProducts = input.products.map(async (productData) => {
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

        return {
          success: true,
          product,
          message: `Producto ${productData.title} creado exitosamente`,
        }
      } catch (error) {
        return {
          success: false,
          product: null,
          error: error.message,
          message: `Error creando producto ${productData.title}: ${error.message}`,
        }
      }
    })

    return new WorkflowResponse({
      products: createdProducts,
      summary: {
        total: input.products.length,
        successful: createdProducts.filter(p => p.success).length,
        failed: createdProducts.filter(p => !p.success).length,
      },
    })
  }
)

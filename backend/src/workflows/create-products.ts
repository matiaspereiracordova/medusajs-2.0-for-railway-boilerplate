import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/workflows-sdk"
import { MedusaContainer } from "@medusajs/framework/types"

// Tipos para el servicio
interface ProductService {
  createProducts(data: any): Promise<any>
  createProductVariants(data: any): Promise<any>
}

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

// Step para crear productos
const createProductsStep = createStep(
  "create-products",
  async (products: CreateProductWorkflowInput["products"], { container }: { container: MedusaContainer }) => {
    const productService = container.resolve("productService") as ProductService
    const createdProducts = []

    for (const productData of products) {
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

    return new StepResponse({
      products: createdProducts,
      summary: {
        total: products.length,
        successful: createdProducts.filter(p => p.success).length,
        failed: createdProducts.filter(p => !p.success).length,
      },
    })
  }
)

// Workflow principal
export const createProductsWorkflow = createWorkflow(
  "createProducts",
  function (input: CreateProductWorkflowInput) {
    // Ejecutar el step de creación de productos
    const result = createProductsStep(input.products)

    // Retornar resultado
    return new WorkflowResponse({
      products: result.products,
      summary: result.summary,
    })
  }
)
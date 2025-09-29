import {
  MedusaContainer,
} from "@medusajs/framework/types"
import { syncFromErpWorkflow } from "../workflows/sync-from-erp"
import { OdooProduct } from "../modules/odoo/service"

export default async function syncProductsJob(container: MedusaContainer) {
  console.log("🔄 Iniciando sincronización de productos desde ERP...")
  
  const limit = 10 // Procesar 10 productos por lote
  let offset = 0
  let totalProcessed = 0
  let totalCreated = 0
  let totalUpdated = 0
  let errors = 0

  try {
    do {
      console.log(`📦 Procesando lote: offset=${offset}, limit=${limit}`)
      
      // Ejecutar el workflow de sincronización
      const result = await syncFromErpWorkflow(container).run({
        input: {
          limit,
          offset,
        },
      })

      const workflowResult = result.result
      const odooProducts: OdooProduct[] = workflowResult.odooProducts || []
      
      console.log(`✅ Lote procesado: ${odooProducts.length} productos de Odoo`)
      console.log(`   - Productos para crear: ${workflowResult.summary?.productsToCreate || 0}`)
      console.log(`   - Productos para actualizar: ${workflowResult.summary?.productsToUpdate || 0}`)

      // Contar productos creados y actualizados
      if (workflowResult.createdProducts) {
        const created = Array.isArray(workflowResult.createdProducts) 
          ? workflowResult.createdProducts 
          : await workflowResult.createdProducts
        totalCreated += created.filter((p: any) => p.success).length
      }

      if (workflowResult.updatedProducts) {
        const updated = Array.isArray(workflowResult.updatedProducts) 
          ? workflowResult.updatedProducts 
          : await workflowResult.updatedProducts
        totalUpdated += updated.filter((p: any) => p.success).length
      }

      totalProcessed += odooProducts.length
      offset += limit

      // Si no hay más productos, salir del bucle
      if (odooProducts.length === 0) {
        break
      }

    } while (true)

    console.log("🎉 Sincronización completada exitosamente!")
    console.log(`📊 Resumen:`)
    console.log(`   - Total productos procesados: ${totalProcessed}`)
    console.log(`   - Productos creados: ${totalCreated}`)
    console.log(`   - Productos actualizados: ${totalUpdated}`)
    console.log(`   - Errores: ${errors}`)

  } catch (error) {
    console.error("❌ Error durante la sincronización:", error)
    console.error(`   Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}`)
    
    // No lanzar el error para que el job no falle completamente
    // En su lugar, registrar el error y continuar
    errors++
  }

  return {
    success: errors === 0,
    totalProcessed,
    totalCreated,
    totalUpdated,
    errors,
    timestamp: new Date().toISOString(),
  }
}

// Configuración del job programado
export const config = {
  name: "sync-products-from-erp",
  schedule: "0 0 * * *", // Ejecutar todos los días a medianoche
  description: "Sincroniza productos desde Odoo ERP hacia Medusa",
  retryOnFailure: true,
  maxRetries: 3,
}

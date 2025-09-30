import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { syncFromErpWorkflow } from "../../../workflows/sync-from-erp"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { limit = 5, offset = 0 } = (req.body as any) || {}

    console.log(`🔄 Ejecutando sincronización manual desde admin...`)
    console.log(`📦 Parámetros: limit=${limit}, offset=${offset}`)

    // Ejecutar el workflow de sincronización
    const result = await syncFromErpWorkflow(req.scope).run({
      input: {
        limit,
        offset,
      },
    })

    const workflowResult = result.result

    // Preparar respuesta con detalles de la sincronización
    const syncResult = {
      success: true,
      executedAt: new Date().toISOString(),
      parameters: {
        limit,
        offset
      },
      results: {
        odooProductsFetched: workflowResult.odooProducts?.length || 0,
        productsToCreate: workflowResult.summary?.productsToCreate || 0,
        productsToUpdate: workflowResult.summary?.productsToUpdate || 0,
        createdProducts: workflowResult.createdProducts?.length || 0,
        updatedProducts: workflowResult.updatedProducts?.length || 0
      },
      summary: workflowResult.summary,
      message: `Sincronización ejecutada exitosamente. Procesados ${workflowResult.odooProducts?.length || 0} productos de Odoo.`
    }

    console.log(`✅ Sincronización manual completada:`, syncResult.message)

    res.json(syncResult)
  } catch (error) {
    console.error(`❌ Error en sincronización manual:`, error)
    
    res.status(500).json({
      success: false,
      executedAt: new Date().toISOString(),
      error: error.message,
      message: "Error ejecutando sincronización manual"
    })
  }
}

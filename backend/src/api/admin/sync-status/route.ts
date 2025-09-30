import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Obtener el servicio de productos para verificar sincronización
    const productService = req.scope.resolve("productService") as any
    
    // Contar productos con external_id (sincronizados desde Odoo)
    const syncedProducts = await productService.listProducts({
      external_id: { $ne: null }
    })
    
    // Contar productos totales
    const totalProducts = await productService.listProducts({})
    
    // Obtener estadísticas de los últimos productos sincronizados
    const recentProducts = await productService.listProducts({
      external_id: { $ne: null }
    }, {
      take: 10,
      order: { created_at: "DESC" }
    })

    // Preparar respuesta
    const syncStatus = {
      status: "active",
      lastCheck: new Date().toISOString(),
      statistics: {
        totalProducts: totalProducts.length,
        syncedProducts: syncedProducts.length,
        syncPercentage: totalProducts.length > 0 
          ? Math.round((syncedProducts.length / totalProducts.length) * 100) 
          : 0
      },
      recentProducts: recentProducts.map(product => ({
        id: product.id,
        title: product.title,
        external_id: product.external_id,
        created_at: product.created_at,
        updated_at: product.updated_at,
        status: product.status,
        variants_count: product.variants?.length || 0
      })),
      nextSync: "Diariamente a medianoche (00:00 UTC)",
      jobConfig: {
        name: "sync-products-from-erp",
        schedule: "0 0 * * *",
        description: "Sincroniza productos desde Odoo ERP hacia Medusa"
      }
    }

    res.json(syncStatus)
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error obteniendo estado de sincronización",
      error: error.message
    })
  }
}

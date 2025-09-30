import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Set proper headers for Railway healthcheck
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "medusa-backend",
      uptime: process.uptime(),
      port: process.env.PORT || 9000
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      service: "medusa-backend",
      error: error.message
    });
  }
}

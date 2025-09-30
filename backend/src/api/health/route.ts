import { MedusaRequest, MedusaResponse } from "@medusajs/framework";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  // Simple health check that always returns 200
  // This ensures Railway can verify the service is running
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "medusa-backend"
  });
}

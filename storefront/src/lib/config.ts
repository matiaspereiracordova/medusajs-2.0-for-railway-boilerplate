import Medusa from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

// Railway environment variables
if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  // Use custom backend URL if provided
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
} else if (process.env.RAILWAY_BACKEND_URL) {
  // Use Railway backend URL if provided
  MEDUSA_BACKEND_URL = process.env.RAILWAY_BACKEND_URL
} else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  // Fallback: try to construct backend URL from Railway domain
  // This assumes backend is on a different subdomain or port
  const frontendDomain = process.env.RAILWAY_PUBLIC_DOMAIN
  if (frontendDomain.includes('storefront')) {
    // If this is storefront domain, try to find backend domain
    const backendDomain = frontendDomain.replace('storefront', 'backend')
    MEDUSA_BACKEND_URL = `https://${backendDomain}`
  } else {
    // Default fallback
    MEDUSA_BACKEND_URL = `https://${frontendDomain}`
  }
}

// Log the backend URL for debugging
console.log('🔗 Medusa Backend URL:', MEDUSA_BACKEND_URL)
console.log('🌍 Environment:', process.env.NODE_ENV)
console.log('🚂 Railway Domain:', process.env.RAILWAY_PUBLIC_DOMAIN)

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

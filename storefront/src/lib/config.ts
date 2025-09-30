import Medusa from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

// Railway environment variables
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  // Use Railway's public domain for backend
  MEDUSA_BACKEND_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
} else if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  // Use custom backend URL if provided
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
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

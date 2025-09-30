# Railway Environment Variables Setup

## Backend Service Variables

Configure these variables in your Railway backend service:

### Required Variables
```
DATABASE_URL=postgres://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-here
COOKIE_SECRET=your-super-secret-cookie-key-here
```

### Optional Variables
```
REDIS_URL=redis://username:password@host:port
ADMIN_CORS=*
AUTH_CORS=*
STORE_CORS=*
```

## Frontend Service Variables

Configure these variables in your Railway frontend service:

### Required Variables
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend-url.up.railway.app
```

## How to Set Variables in Railway

1. Go to your Railway project dashboard
2. Select the service (Backend or Frontend)
3. Go to the "Variables" tab
4. Add the required environment variables
5. Redeploy the service

## Backend URL

The backend URL should be the public domain of your backend service, which looks like:
`https://backend-production-xxxxx.up.railway.app`

You can find this URL in your Railway backend service dashboard.

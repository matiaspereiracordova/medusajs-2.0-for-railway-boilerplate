# Railway Environment Variables Setup - Frontend

## Required Environment Variables for Frontend Service

Para que el frontend se conecte correctamente al backend en Railway, necesitas configurar las siguientes variables de entorno en el servicio **Storefront**:

### 1. Backend URL (REQUIRED)
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://backend-production-34ac.up.railway.app
```
- **Importante**: Reemplaza `backend-production-34ac` con el ID real de tu servicio backend
- Esta variable le dice al frontend dónde encontrar el backend

### 2. Railway Backend URL (Alternative)
```
RAILWAY_BACKEND_URL=https://backend-production-34ac.up.railway.app
```
- Variable alternativa para la URL del backend
- Se usa si `NEXT_PUBLIC_MEDUSA_BACKEND_URL` no está definida

### 3. Publishable Key (Optional)
```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_a32aa2a6f5bfe1f0d8f98bd5a633757c4463842f43375276bdec75812db84169
```
- Se obtiene automáticamente del backend si no está definida
- Puedes dejarla vacía para que se auto-configure

## Cómo Configurar en Railway

1. **Ve a tu proyecto en Railway**
2. **Selecciona el servicio "Storefront"**
3. **Ve a la pestaña "Variables"**
4. **Agrega las variables de entorno:**
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL` = `https://backend-production-34ac.up.railway.app`
   - (Opcional) `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` = `pk_...`

## Verificar URLs de Servicios

Para encontrar la URL correcta del backend:
1. Ve a la pestaña "Architecture" en Railway
2. Busca el servicio "Backend"
3. Copia la URL que aparece (ej: `backend-production-34ac.up.railway.app`)
4. Úsala como valor para `NEXT_PUBLIC_MEDUSA_BACKEND_URL`

## Troubleshooting

### Error: "Not Found" o 404
- Verifica que la URL del backend sea correcta
- Asegúrate de que el backend esté funcionando (verifica logs)
- Confirma que el backend esté escuchando en el puerto correcto

### Error: CORS
- Verifica que el backend tenga `STORE_CORS=*` configurado
- Asegúrate de que las variables de CORS estén configuradas en el backend

### Error: Connection Refused
- Verifica que el backend esté desplegado y funcionando
- Revisa los logs del backend para errores
- Confirma que el health check del backend esté pasando


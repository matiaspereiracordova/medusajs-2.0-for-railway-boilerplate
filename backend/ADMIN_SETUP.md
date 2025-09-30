# 🚀 Configuración del Panel de Administración de Medusa

Este documento explica cómo configurar y acceder al panel de administración de Medusa en Railway.

## ✅ Estado Actual

El panel de administración está **HABILITADO** en la configuración actual.

## 🔧 Configuración Requerida

### Variables de Entorno en Railway

Asegúrate de que estas variables estén configuradas en tu proyecto de Railway:

```bash
# Variables básicas (REQUERIDAS)
BACKEND_PUBLIC_URL=https://tu-dominio-railway.com
JWT_SECRET=tu_jwt_secret_muy_seguro
COOKIE_SECRET=tu_cookie_secret_muy_seguro
DATABASE_URL=postgresql://...

# Variables opcionales
MEDUSA_DISABLE_ADMIN=false  # o simplemente no configurar esta variable
```

### Variables de Odoo (Opcional)

Si quieres usar la integración con Odoo:

```bash
ODOO_URL=https://tu-instancia-odoo.com
ODOO_DB=tu_base_de_datos
ODOO_USERNAME=tu_usuario
ODOO_API_KEY=tu_api_key_odoo
```

## 🌐 Acceso al Panel de Administración

Una vez que tu aplicación esté desplegada en Railway:

1. **URL del Admin**: `https://tu-dominio-railway.com/admin`
2. **Primera vez**: Se te pedirá crear un usuario administrador
3. **Siguientes accesos**: Usa las credenciales que creaste

## 🔍 Verificación

### Script de Prueba

Puedes verificar que el admin esté funcionando ejecutando:

```bash
npm run test:admin
```

Este script verificará:
- ✅ Variables de entorno configuradas
- ✅ Configuración del admin habilitada
- ✅ Archivos del admin construidos
- ✅ URLs de acceso

### Verificación Manual

1. **Health Check**: `https://tu-dominio-railway.com/health`
2. **Admin Panel**: `https://tu-dominio-railway.com/admin`
3. **API Endpoints**: `https://tu-dominio-railway.com/admin/*`

## 🚨 Solución de Problemas

### Admin No Se Carga

1. **Verifica las variables de entorno**:
   ```bash
   # En Railway Dashboard > Variables
   BACKEND_PUBLIC_URL=https://tu-dominio-railway.com
   JWT_SECRET=valor_seguro
   COOKIE_SECRET=valor_seguro
   ```

2. **Verifica que el admin esté habilitado**:
   - En `medusa-config.js`: `disable: false`
   - No configurar `MEDUSA_DISABLE_ADMIN=true`

3. **Revisa los logs de Railway**:
   - Busca errores relacionados con el admin
   - Verifica que el build del admin sea exitoso

### Error 404 en /admin

1. **Verifica que el build del admin funcione**:
   ```bash
   npm run build
   ```

2. **Verifica que existan los archivos**:
   - `admin/dist/index.html`
   - `admin/dist/assets/`

### Error de Autenticación

1. **Verifica JWT_SECRET y COOKIE_SECRET**
2. **Limpia cookies del navegador**
3. **Intenta crear un nuevo usuario administrador**

## 📊 Monitoreo

### Logs Importantes

Busca estos mensajes en los logs de Railway:

```
✅ Admin built successfully
Server is ready on port: 9001
🔄 Proxying GET /admin to Medusa on port 9001
```

### Endpoints de Verificación

```bash
# Health check
curl https://tu-dominio-railway.com/health

# Admin panel
curl https://tu-dominio-railway.com/admin

# API de admin
curl https://tu-dominio-railway.com/admin/users/me
```

## 🔄 Proceso de Build

El admin se construye automáticamente durante el deploy:

1. **Build de Medusa**: `medusa build`
2. **Build del Admin**: `node build-admin.js`
3. **Post-build**: `node src/scripts/postBuild.js`

## 📝 Notas Importantes

- El admin se sirve desde `admin/dist/`
- El backend corre en el puerto 9001 internamente
- Railway expone el puerto 8080 externamente
- El health server maneja el proxy entre puertos

## 🆘 Soporte

Si tienes problemas:

1. Ejecuta `npm run test:admin` para diagnóstico
2. Revisa los logs de Railway
3. Verifica la configuración de variables de entorno
4. Asegúrate de que el build sea exitoso

---

**¡El panel de administración debería estar funcionando correctamente después del próximo deploy!** 🎉

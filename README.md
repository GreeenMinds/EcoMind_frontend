# EcoMind Frontend

## Links

| Servicio | URL |
|---|---|
| Frontend (Firebase) | https://ecomind-app.web.app |
| Backend Real (API) | https://ecomind-backend-t2nh.onrender.com |
| Swagger API Docs | https://ecomind-backend-t2nh.onrender.com/swagger-ui/index.html |
| Mock DB (json-server) | https://db-server-eco-1.onrender.com |

## Stack

- **Frontend:** Angular 21 (standalone components)
- **Hosting:** Firebase Hosting
- **Backend Real:** Render
- **Mock DB:** Render (json-server con db.json)

---

## Cómo desplegar

### Frontend (Firebase) — Paso a paso

#### 1. Crear proyecto en Firebase Console
1. Ve a https://console.firebase.google.com
2. Click en **Crear un proyecto**
3. Ponle un nombre (ej: `ecomind-app`)
4. Desactiva Google Analytics
5. Espera a que se cree

#### 2. Inicializar Firebase en el proyecto local
```bash
firebase login
firebase init hosting
```
Responde:
- **Select project** → elige el proyecto que creaste
- **Public directory** → `dist/EcoMind_frontend/browser`
- **Configure as a single-page app** → `Yes`
- **Set up automatic builds** → `No`
- **File index.html already exists** → `No`

#### 3. Build y deploy manual (primera vez)
```bash
ng build
firebase deploy
```

#### 4. Configurar GitHub Actions (auto-deploy)
```bash
firebase login:ci
```
- Copia el token que te da
- Ve a GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- Name: `FIREBASE_TOKEN`
- Value: pega el token

#### 5. Deploy automático
Después de eso, cada `git push` a `master`:
1. GitHub Actions corre `ng build`
2. Firebase Hosting se actualiza automáticamente
3. El cambio se ve en https://ecomind-app.web.app

---

### Backend Real (Render) — Paso a paso

1. Ve a https://dashboard.render.com
2. Click en **New +** → **Web Service**
3. Conecta tu repositorio de GitHub del backend
4. Configura:
   - **Name:** `ecomind-backend`
   - **Region:** la más cercana
   - **Branch:** `master`
   - **Runtime:** el que corresponda (Java, Node, etc.)
   - **Build Command:** el comando de build de tu backend
   - **Start Command:** el comando de inicio
   - **Plan:** Free
5. Click en **Create Web Service**

#### Auto-deploy
Render se configura con auto-deploy por defecto. Cada `git push` a `master`:
1. Render detecta el cambio
2. Reconstruye y redeploya automáticamente
3. El cambio se ve en https://ecomind-backend-t2nh.onrender.com

---

### Mock DB (json-server en Render) — Paso a paso

1. Ve a https://dashboard.render.com
2. Click en **New +** → **Web Service**
3. Conecta **este mismo repositorio** (EcoMind_frontend)
4. Configura:
   - **Name:** `db-server-eco`
   - **Region:** la más cercana
   - **Branch:** `master`
   - **Runtime:** `Node`
   - **Build Command:** (vacío)
   - **Start Command:**
     ```bash
     npx json-server --watch server/db.json --routes server/routes.json --port $PORT
     ```
   - **Plan:** Free
5. Click en **Create Web Service**

> ⚠️ Importante: Usa `$PORT` en el Start Command, no un puerto fijo como `3000`.

#### Auto-deploy
Cada `git push` a `master`:
1. Render detecta cambios en `server/db.json`
2. Reinicia json-server automáticamente

---

## Conexión Frontend ↔ Backend

El frontend apunta a **2 servidores distintos**:

| Funcionalidad | Apunta a | Servidor |
|---|---|---|
| Users (perfil, login, gemas) | `https://ecomind-backend-t2nh.onrender.com/api/v1/user` | Backend Real |
| Comunidad, Quests, Eventos, Tienda, Ranking, etc. | `https://db-server-eco-1.onrender.com/{recurso}` | Mock DB |

## Configuración de URLs

Las URLs se configuran en `src/environments/environment.ts`:

```typescript
platformProviderApiBaseUrl: 'https://db-server-eco-1.onrender.com',
platformProviderBackendApiBaseUrl: 'https://ecomind-backend-t2nh.onrender.com/api/v1',
```

Para desarrollo local se usa `src/environments/environment.development.ts`.

## Desarrollo Local

```bash
# 1. Iniciar json-server mock
npm run server

# 2. Iniciar frontend
npm start

# 3. Abrir en el navegador
http://localhost:4200
```

## Build Manual

```bash
ng build
firebase deploy
```

## Conclusiones

### Frontend (Angular + Firebase)
Se realizó el despliegue de la aplicación web en Firebase Hosting, configurando integración continua mediante GitHub Actions para que cada `git push` a la rama `master` ejecute automáticamente el build y deploy. La aplicación está disponible en **https://ecomind-app.web.app** y consume datos desde dos servidores independientes: el backend real para usuarios y un mock DB (json-server en Render) para el resto de funcionalidades (comunidad, quests, tienda, ranking, etc.).

### Backend Real (Spring Boot / Render)
El backend fue desarrollado y desplegado en Render, con auto-deploy desde el repositorio de GitHub. Los endpoints fueron validados mediante Swagger UI, accesible en **https://ecomind-backend-t2nh.onrender.com/swagger-ui/index.html**. Pendiente habilitar CORS para permitir peticiones desde el frontend en Firebase.

### Mock DB (json-server en Render)
Base de datos simulada con json-server desplegada en Render, utilizando el archivo `server/db.json` del repositorio. Se configuró el auto-deploy para que cualquier cambio en los datos se refleje automáticamente.

## Eliminar rastros de IA (opcional)

Si quieres borrar el archivo de configuración de Copilot:

```bash
rm .github/copilot-instructions.md
git add -A
git commit -m "chore: remove copilot config"
git push
```

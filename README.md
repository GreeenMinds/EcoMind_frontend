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

## Cómo desplegar

### Frontend (Firebase) — Automático
Cada `git push` a `master`:
1. GitHub Actions corre `ng build`
2. Firebase Hosting se actualiza automáticamente
3. El cambio se ve en https://ecomind-app.web.app

No necesitas deployar manualmente nunca más.

### Backend Real (Render) — Automático
Cada `git push` a `master`:
1. Render detecta el cambio en el repositorio del backend
2. Reconstruye y redeploya automáticamente

### Mock DB (Render) — Automático
Cada `git push` a `master`:
1. Render detecta el cambio en `server/db.json`
2. Reinicia json-server automáticamente

## Conexión Frontend ↔ Backend

El frontend apunta a **2 servidores distintos**:

| Funcionalidad | Apunta a | Servidor |
|---|---|---|
| Users (perfil, login) | `https://ecomind-backend-t2nh.onrender.com/api/v1/user` | Backend Real |
| Comunidad, Quests, Eventos, Tienda, Ranking, etc. | `https://db-server-eco-1.onrender.com/{recurso}` | Mock DB |

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

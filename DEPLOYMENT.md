# CloudNet Monitor Deployment

## 1. Database

Use MongoDB Atlas or another cloud-accessible MongoDB deployment.

Required backend value:

```env
MONGODB_URI=mongodb+srv://...
```

Do not put this value in the frontend.

## 2. Backend on Render

Create a Render Web Service.

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:

```env
NODE_ENV=production
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-long-random-secret
CORS_ORIGIN=https://your-vercel-app.vercel.app
AGENT_REGISTRATION_TOKEN=optional-long-random-token
```

After deploy, test:

```text
https://your-render-service.onrender.com/api/health
```

Expected database status:

```json
"status": "connected"
```

## 3. Frontend on Vercel

Create a Vercel project.

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Environment variable:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

After deploy, open the Vercel URL, register a user, log in, then run Demo Mode seed.

## 4. Final Demo Checklist

- Backend `/api/health` returns connected.
- Frontend can register and log in.
- Demo Mode seed creates devices and metrics.
- Dashboard displays data.
- Devices and Device Details work.
- Analytics charts show data.
- Alerts show demo alerts and support read/resolve actions.
- Topology shows registered demo devices.

## Security Reminder

Rotate any MongoDB password that was shared in chat, screenshots, commits, or recordings before deployment.

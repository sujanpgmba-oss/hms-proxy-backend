# HMS Backend Proxy

Backend proxy server to handle HMS API calls and avoid CORS issues.

## Deploy to Render

1. Push this repo to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Add environment variable: `HMS_MANAGEMENT_TOKEN`
5. Deploy!

## Environment Variables

- `HMS_MANAGEMENT_TOKEN` - Your 100ms Management Token (required)
- `PORT` - Auto-set by Render (default: 10000)

## Endpoints

- `GET /health` - Health check
- `POST /api/hms/auth-token` - Get auth token
- `POST /api/hms/rooms` - Create room
- `GET /api/hms/rooms/:roomId` - Check room

## Local Testing

```bash
npm install
npm start
```

Server runs on http://localhost:10000

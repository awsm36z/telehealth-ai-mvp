# TeleHealth AI - Backend API

Node.js + Express + TypeScript backend for TeleHealth AI platform.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm run dev
```

## Environment Variables

```bash
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-your-openai-key
DATA_STORE_MODE=memory
# DATABASE_URL=postgresql://...
# DATABASE_SSL=false
# CORS_ORIGIN=http://localhost:8081
```

### Storage Modes

- `DATA_STORE_MODE=memory` (default): in-process storage, resets on restart.
- `DATA_STORE_MODE=postgres`: persisted storage via PostgreSQL (`DATABASE_URL` required).

When `postgres` mode is enabled, the backend creates and uses an `app_state` table automatically.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Triage
- `POST /api/triage/chat` - Continue AI triage conversation

### Insights
- `GET /api/insights/:patientId` - Get AI health insights

### Patients
- `GET /api/patients/queue` - Get patient queue (doctor)

## Development

```bash
npm run dev   # Development with auto-reload
npm run build # Build TypeScript
npm start     # Production
```

## Project Structure

```
src/
├── routes/
│   ├── auth.ts       # Authentication endpoints
│   ├── triage.ts     # AI triage endpoints
│   ├── insights.ts   # Health insights endpoints
│   └── patients.ts   # Patient management
└── server.ts         # Express app setup
```

## Production Deployment

### Render (Recommended)

1. Use repo root `render.yaml` to create:
   - `telehealth-backend` web service
   - `telehealth-postgres` managed database
2. Set required secrets in Render dashboard:
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `CORS_ORIGIN`
   - optional `DAILY_API_KEY`, `SENTRY_DSN`
3. Ensure runtime env:
   - `DATA_STORE_MODE=postgres`
   - `DATABASE_SSL=true`
4. Deploy and verify:
   - `GET /health` returns `status: ok`
   - core API routes operate and data survives restarts

### Mobile app API URL

Set `EXPO_PUBLIC_API_BASE_URL` in mobile env to your deployed backend URL + `/api`.
Example:

```bash
EXPO_PUBLIC_API_BASE_URL=https://telehealth-backend.onrender.com/api
```

## Security Notes

⚠️ This is a development/demo version. For production:
- Use a real database (PostgreSQL)
- Implement refresh tokens
- Add rate limiting
- Use HTTPS
- Implement HIPAA compliance
- Add comprehensive logging and monitoring

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
```

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

1. Set up PostgreSQL database
2. Replace in-memory storage with database queries
3. Add proper error handling and logging
4. Implement rate limiting
5. Set up HTTPS
6. Configure CORS for production domain

## Security Notes

⚠️ This is a development/demo version. For production:
- Use a real database (PostgreSQL)
- Implement refresh tokens
- Add rate limiting
- Use HTTPS
- Implement HIPAA compliance
- Add comprehensive logging and monitoring

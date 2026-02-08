# TeleHealth AI - Mobile App

React Native mobile application for TeleHealth AI platform.

## Setup

```bash
npm install
npm start
```

## Run

```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## API Configuration

Update the API URL in screens to match your backend:

```typescript
const API_URL = 'http://localhost:3000/api';  // Development
// const API_URL = 'https://your-api.com/api';  // Production
```

For Android emulator, use: `http://10.0.2.2:3000/api`
For physical device, use your computer's local IP address.

## Project Structure

```
src/
├── screens/          # All app screens
│   ├── auth/        # Authentication screens
│   ├── patient/     # Patient app screens
│   └── doctor/      # Doctor app screens
├── navigation/      # Navigation configuration
├── theme.ts         # Design system
└── ...
```

## Features Implemented

✅ Authentication (Login, Register)
✅ Patient Home Dashboard
✅ Biometric Entry
✅ AI Triage Chat
✅ Health Insights Display
✅ Doctor Dashboard
✅ Patient Queue

## TODO

- [ ] Video consultation integration
- [ ] Push notifications
- [ ] Offline support
- [ ] Image upload for symptoms
- [ ] Calendar integration for appointments

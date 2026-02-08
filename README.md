# 🏥 TeleHealth AI - AI-Powered Telehealth Platform

A modern telehealth application with AI-powered triage, health insights, and video consultation capabilities. Built with React Native (Expo) for mobile and Node.js/Express for the backend.

## ✨ Features

### Patient Features
- 📱 **AI-Powered Triage**: Intelligent symptom assessment using GPT-4
- 📊 **Health Insights**: AI-generated health analysis and recommendations
- 🩺 **Biometric Entry**: Manual entry of vital signs (blood pressure, heart rate, temperature, etc.)
- 📹 **Video Consultations**: Connect with healthcare providers (UI ready, integration pending)
- 📜 **Consultation History**: Track past appointments and health records
- 👤 **User Profile Management**: Manage personal health information

### Doctor Features
- 📋 **Patient Queue**: View waiting patients with urgency indicators
- 🔍 **AI Insights**: Pre-consultation AI analysis of patient symptoms
- 📊 **Dashboard Analytics**: Patient statistics and metrics
- 👥 **Patient Management**: Access patient health records and history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- OpenAI API key

### Backend Setup

```bash
cd backend
npm install

# Create .env file and add:
# OPENAI_API_KEY=sk-your-key-here
# JWT_SECRET=your-secret-here

npm run dev
```

### Mobile App Setup

```bash
cd mobile
npm install
npx expo start

# Then press 'i' for iOS or 'a' for Android
```

## 🛠️ Tech Stack

- **Mobile**: React Native (Expo), TypeScript, React Navigation
- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenAI GPT-4
- **Auth**: JWT

## 📝 License

MIT

---

**⚠️ Medical Disclaimer**: This is a proof-of-concept. Do not use for actual medical diagnosis.

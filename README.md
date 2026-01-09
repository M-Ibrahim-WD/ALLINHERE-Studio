# ALLINHERE Studio

A modern mobile video & image editing platform built with React Native and Supabase.

## 🎯 Project Overview

ALLINHERE Studio is a production-ready MVP for a Native Mobile SaaS application similar to CapCut, designed with a scalable architecture.

**Author:** Mohamed Ibrahim Hassan  
**Brand:** All In Here  
**Author URI:** https://m-ibrahim.carrd.co  
**App URI:** https://studio.allinhere.org

## 🛠️ Tech Stack

### Frontend
- React Native + TypeScript (Android & iOS)
- React Navigation
- React Native Vision Camera
- Light/Dark mode support
- i18n (LTR/RTL support)

### Backend
- Supabase
  - Authentication (Email, Google, Apple)
  - PostgreSQL Database
  - Storage (media files)
  - Realtime
  - Edge Functions

### Payments
- Stripe
- PayPal
- Modular payment provider layer

## ✨ Features

### Authentication & Users
- Email / Google / Apple authentication
- User profiles
- Subscription & trial status tracking
- Role-based access control
- Multi-device session awareness

### Free Trial
- 30-day free trial (no credit card required)
- Server-side validation
- Automatic trial tracking

### Subscription Plans

#### BASIC/CREATOR
- Core editor features
- Timeline & layers
- Templates
- Basic filters & music
- Storage: 5GB
- Max 10 projects
- Export: 1080p
- Watermark enabled

#### PRO/STUDIO
- Everything in Basic
- Live camera filters
- Real-time collaboration
- Export presets for social platforms
- Storage: 25GB
- Unlimited projects
- Export: 4K
- No watermark

### Editor Features (MVP)
- Clip sequencing
- Cut / trim / split / merge
- Preset transitions
- Basic layers system
- Undo / redo
- Live preview

### Multi-Language Support
- English
- Arabic (RTL)
- Italian
- French
- Spanish

## 📋 Prerequisites

- Node.js (v16+)
- npm or yarn
- React Native development environment
- Android Studio (for Android)
- Xcode (for iOS)

## 🚀 Getting Started

### 1. Clone and Install

```bash
cd allinhere-studio
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `PAYPAL_CLIENT_ID`

### 3. Run the App

```bash
# iOS
npm run ios

# Android
npm run android
```

## 📁 Project Structure

```
allinhere-studio/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API & service layers
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── store/            # State management
│   ├── types/            # TypeScript types
│   ├── locales/          # i18n translations
│   ├── theme/            # Theme & styling
│   └── config/           # App configuration
├── assets/               # Images, fonts, etc.
├── ios/                  # iOS native code
├── android/              # Android native code
└── supabase/            # Supabase migrations & functions
```

## 🔒 Security

- No hardcoded secrets in source code
- Environment variables for sensitive data
- Secure API endpoints
- Input validation
- File size limits
- Audit logs

## 📄 License

All rights reserved - Mohamed Ibrahim Hassan

## 🤝 Support

For support and inquiries, visit: https://m-ibrahim.carrd.co

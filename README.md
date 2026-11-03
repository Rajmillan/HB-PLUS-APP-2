# HBPLUS Cross-Platform Application (Phase 1)

A cross-platform corporate application for HBPLUS built with **React Native**, **Expo (SDK 58)**, **Expo Router**, and **Supabase Auth**. Runs from a single TypeScript codebase across:
- **Web Browser** (React Native Web)
- **Android Device / Emulator**
- **iOS Device / Simulator**

Strict corporate access policy: **Only verified Google accounts with the exact domain `@hbplus.fit` are permitted.** All other domains are immediately signed out, state is purged, and restricted access feedback is displayed.

---

## Phase 1 Architecture Overview

```
├── app/                          # Expo Router routes & layouts
│   ├── _layout.tsx               # Root layout: AuthProvider, SafeAreaProvider, and route guard
│   ├── index.tsx                 # Protected Home / Dashboard for verified @hbplus.fit accounts
│   ├── login.tsx                 # Polished responsive Login screen (header, notice, CTA, error banner)
│   └── auth/
│       └── callback.tsx          # OAuth redirect handler (Web & deep link token exchange)
├── src/
│   ├── components/               # UI components
│   │   ├── GoogleSignInButton.tsx # Official Google branded CTA with loading & disabled states
│   │   ├── LoadingScreen.tsx     # Prevents flash of protected content during session checks
│   │   ├── ErrorBanner.tsx       # Accessible dismissible alert for domain / auth errors
│   │   └── index.ts
│   ├── constants/
│   │   ├── config.ts             # Domain constants, Supabase URLs, user-facing error messages
│   │   └── index.ts
│   ├── features/
│   │   └── auth/                 # Core Auth feature slice
│   │       ├── AuthProvider.tsx  # React Context: session restoration, listeners, domain rejection
│   │       ├── authService.ts    # Cross-platform Supabase OAuth & WebBrowser deep linking
│   │       ├── domainPolicy.ts   # isAllowedEmail (ends with @hbplus.fit, NO includes()), verification
│   │       ├── useAuth.ts        # Custom hook for consuming auth context
│   │       └── index.ts
│   ├── lib/
│   │   └── supabase.ts           # Single Supabase client (AsyncStorage for native, web URL detection)
│   └── theme/
│       ├── colors.ts             # Brand, status, surface, and text palettes
│       ├── spacing.ts            # Spacing, border radius, and shadows
│       └── index.ts
├── test/
│   ├── verify-phase1.ts          # Comprehensive verification tests for domain policy & rejection
│   └── tsconfig.json
├── .env.example                  # Template with public variable placeholders
└── app.json                      # Expo config with scheme: "hbplus"
```

---

## Setup & Dashboard Configuration Guide

### 1. Configure Google Cloud Console

1. Navigate to the **[Google Cloud Console](https://console.cloud.google.com/)** -> **APIs & Services** -> **Credentials**.
2. Click **Create Credentials** -> **OAuth client ID**.
3. Application type: Select **Web application**.
4. Name: `HBPLUS Supabase Auth`.
5. **Authorized JavaScript origins**:
   ```
   https://<your-supabase-project-ref>.supabase.co
   ```
6. **Authorized redirect URIs**:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```
7. Click **Create** and copy the generated **Client ID** and **Client Secret**.

---

### 2. Configure Supabase Dashboard

1. Navigate to your project on **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Go to **Authentication** -> **Providers** -> **Google**:
   - Enable the Google provider toggle.
   - Paste the **Client ID** and **Client Secret** obtained from Google Cloud Console.
   - Click **Save**.
3. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**:
     - For local development: `http://localhost:8081`
     - For production: Your deployed web URL.
   - **Redirect URLs** (add each of the following):
     - `http://localhost:8081/**`
     - `http://localhost:8081/auth/callback`
     - `hbplus://auth/callback` *(for standalone iOS/Android native deep link)*
     - `exp://**` *(for Expo Go development)*
4. Go to **Project Settings** -> **API**:
   - Copy **Project URL**
   - Copy **Project API Key (`anon` / `public`)**

---

### 3. Local Environment Variables

Create your local `.env` file from the example template:

```bash
cp .env.example .env
```

Populate `.env` with your real Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
```

> **Security Rule**: Only the public `anon` key is used client-side. The `service_role` key must **NEVER** be committed or exposed in `EXPO_PUBLIC_` variables. Real `.env` files are gitignored.

---

## Running the Application

### Install Dependencies
```bash
npm install
```

### Run on Web (React Native Web)
```bash
npm run web
```
Opens in your default browser at `http://localhost:8081`.

### Run on Android
```bash
npm run android
```
Launches on connected Android device or active Android emulator.

### Run on iOS
```bash
npm run ios
```
Launches in macOS iOS Simulator.

---

## Verification & Typechecks

Run TypeScript type validation across the whole codebase:
```bash
npm run typecheck
```

Run Phase 1 domain policy and security rejection verification test suite:
```bash
npm test
```

Test suite verifies:
- Exactly `@hbplus.fit` suffix allowed.
- Subdomain spoofing, uppercase variants, leading/trailing whitespace, and multi-at injections tested.
- `String.prototype.includes()` is NOT used in `isAllowedEmail`.
- Unverified emails and non-domain accounts are rejected with the exact required message:
  `"Access restricted. Please login using your official domain email."`

---

## Security Architecture (Phase 1 vs Phase 2)

- **Phase 1 (Client Gating)**: The app inspects verified identity claims from the Supabase session after OAuth token exchange. If an account does not end in `@hbplus.fit` or is unverified, `supabase.auth.signOut()` is executed immediately, user state is purged, and the restricted notice is shown.
- **Phase 2 (Database Security)**: Client-side domain validation alone does not secure database records. In Phase 2, Supabase Row Level Security (RLS) policies must be applied directly to database tables to enforce domain boundaries at the PostgreSQL layer.

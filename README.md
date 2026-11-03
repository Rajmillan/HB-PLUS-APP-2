# HBPLUS Cross-Platform Corporate Application

A production-grade cross-platform enterprise application for **HBPLUS** built with **TypeScript**, **React Native**, **Expo (SDK 58)**, **Expo Router**, and **Supabase Auth with PostgreSQL Row Level Security (RLS)**.

The application runs from a single unified codebase across:
- **Web Browser** (React Native Web, deployed on Vercel)
- **Android Device / Emulator** (via Expo Go or native APK)
- **iOS Device / Simulator** (via Expo Go or native IPA)

---

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Authentication Flow](#authentication-flow)
3. [How Domain Restriction Works](#how-domain-restriction-works)
4. [Architecture & Codebase Map](#architecture--codebase-map)
5. [Responsive Design & Breakpoints Matrix](#responsive-design--breakpoints-matrix)
6. [Database Migration & Security (Supabase)](#database-migration--security-supabase)
7. [Verification & Test Commands](#verification--test-commands)
8. [Vercel Web Deployment Guide](#vercel-web-deployment-guide)
9. [Mobile Native Builds (Android & iOS)](#mobile-native-builds-android--ios)

---

## Setup Instructions

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher, LTS recommended)
- **npm** (or `bun` / `pnpm`)
- **A Supabase Project** ([supabase.com](https://supabase.com))
- **Google Cloud Console Project** (for Google OAuth credentials)

### 2. Clone & Install Dependencies
```bash
git clone <repository-url>
cd "HB PLUS APP 2"

# Install dependencies cleanly
npm install
```

### 3. Environment Variables Configuration
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```
Populate `.env` with your project's credentials:
```env
# Supabase Configuration (Client-side safe public keys)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Google OAuth Web Client ID (Optional for web prompt, configured in Google Cloud)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# (Optional) Developer overrides for local off-domain testing
# EXPO_PUBLIC_DEV_ALLOWED_EMAILS=developer@gmail.com,tester@example.com
# EXPO_PUBLIC_DEV_ALLOW_ALL_EMAILS=false
```

> **Security Note**: Never expose your Supabase `service_role` secret key in `.env`, client code, or version control. Only public anon keys are client-accessible.

### 4. Supabase Database Setup
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar.
3. Open [`supabase/migrations/20261103000000_phase2_profiles_and_rls.sql`](supabase/migrations/20261103000000_phase2_profiles_and_rls.sql) and paste its contents into the editor.
4. Click **Run** to execute the migration. This provisions:
   - `public.profiles` table with foreign key cascade to `auth.users`
   - Explicit Row Level Security (RLS) policies for least-privilege data access
   - Automated provisioning trigger (`handle_new_user`)
   - Role escalation prevention trigger (`trg_prevent_role_modification`)
   - `public.admin_announcements` secured by server-evaluated admin checks

### 5. Google OAuth Configuration in Supabase
1. In the Supabase Dashboard, navigate to **Authentication** → **Providers** → **Google**.
2. Toggle Google to **Enabled**.
3. Enter your Google **Client ID** and **Client Secret** (from Google Cloud Console).
4. Copy the **Callback URL** provided by Supabase (e.g., `https://<project-ref>.supabase.co/auth/v1/callback`).
5. In your [Google Cloud Console](https://console.cloud.google.com/) under **APIs & Services** → **Credentials** → **OAuth 2.0 Client ID**:
   - Add the Supabase callback URL under **Authorized redirect URIs**.
   - Add your web origin (e.g. `http://localhost:8081` and `https://your-app.vercel.app`) under **Authorized JavaScript origins**.

### 6. Running the Application Locally
```bash
# Start Web in your browser (React Native Web)
npm run web

# Start Android (requires Android Studio emulator or device connected via ADB)
npm run android

# Start iOS (requires macOS and Xcode simulator)
npm run ios

# Start generic Expo Metro bundler
npx expo start
```

---

## Authentication Flow

The application provides a hybrid authentication model supporting both **Corporate Google OAuth** and **Direct Email & Password** credentials.

```
                              [ User visits App ]
                                       │
                         Is user session in storage?
                                ┌──────┴──────┐
                              YES             NO
                               │              │
                    Fetch Session & Profile   │
                               │              │
                   Validate @hbplus.fit       │
                        ┌──────┴──────┐       │
                      VALID        INVALID    │
                        │             │       │
                        ▼             ▼       ▼
                  [ Dashboard ]   [ Sign Out & Redirect to /login ]
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
             [ Google OAuth CTA ]             [ Email & Password Form ]
                      │                                 │
           Opens Auth Session Window           Pre-validates @hbplus.fit
                      │                                 │
            Redirects to /auth/callback        Authenticates via Supabase
                      │                                 │
           Exchanges Token (PKCE)                       │
                      └────────────────┬────────────────┘
                                       ▼
                         Validate @hbplus.fit Domain
                                ┌──────┴──────┐
                            PASSED         FAILED
                                │             │
                                ▼             ▼
                         [ Dashboard ]   Immediate Eviction:
                                         • signOut()
                                         • Purge Auth State
                                         • Show Restriction Error
```

### 1. Dual Sign-In Options
- **Sign In with Email & Password**:
  Users can authenticate directly using corporate email credentials. The client pre-validates that the email meets domain policies before issuing network requests.
- **Sign in with Google OAuth**:
  Cross-platform OAuth using `expo-web-browser` and `expo-auth-session`. On Web, it handles standard browser redirects to `/auth/callback`; on Native (iOS/Android), it initiates deep linking via the `hbplus://auth/callback` scheme.

### 2. Session Restoration & Flash Prevention
- When the application boots, `AuthProvider` initializes and checks local storage (`AsyncStorage` on native, web storage on browser).
- `isLoading` remains `true` while the session is validated.
- `NavigationGuard` in [`app/_layout.tsx`](app/_layout.tsx) renders [`LoadingScreen.tsx`](src/components/LoadingScreen.tsx), preventing any flash of protected dashboard content before authentication state is resolved.

### 3. Route Protection & Navigation Guard
- All protected routes reside in the `app/(app)` directory (`app/(app)/index.tsx`, `app/(app)/profile.tsx`).
- If an unauthenticated user attempts to access any route under `(app)`, the `NavigationGuard` immediately redirects them to `/login`.
- If an authenticated user navigates to `/login`, they are redirected automatically to the Dashboard `/(app)`.

### 4. Safe Sign-Out
- Sign out triggers `authService.signOutUser()`, which revokes the session on Supabase and clears all local tokens.
- `AuthProvider` and `ProfileProvider` reset their states, triggering navigation back to `/login`.

---

## How Domain Restriction Works

The application enforces a strict corporate boundary: only verified users with the exact suffix **`@hbplus.fit`** may access application resources.

### 1. Client-Side Domain Validation (`isAllowedEmail`)
Located in [`src/features/auth/domainPolicy.ts`](src/features/auth/domainPolicy.ts):
- **Trimming & Lowercasing**: Normalizes the incoming email address.
- **Strict Suffix Matching**: Validates that the normalized string ends exactly with `@hbplus.fit`.
- **Prohibition of `String.prototype.includes()`**: Per security requirements, `.includes()` is **strictly prohibited** to prevent substring injection bypasses (e.g., `attacker@hbplus.fit.malicious.com` or `attacker@gmail.com?extra=@hbplus.fit`).
- **Local-Part Verification**: Ensures valid characters precede the `@` symbol (no empty local parts like `@hbplus.fit`).
- **No Multi-`@` Injections**: Rejects emails with multiple `@` signs.

```typescript
// Strict domain check implementation (src/features/auth/domainPolicy.ts)
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();

  const atPos = normalized.indexOf('@');
  if (atPos <= 0 || atPos === normalized.length - 1) return false;

  // Exact suffix check without .includes()
  if (!normalized.endsWith('@hbplus.fit')) return false;

  const localPart = normalized.slice(0, normalized.length - '@hbplus.fit'.length);
  if (!localPart || localPart.indexOf('@') !== -1) return false;

  return true;
}
```

### 2. Immediate Post-Auth Eviction & State Purge
Even if an unauthorized user completes Google authentication with an unapproved account (e.g. `user@gmail.com`):
1. The Supabase auth listener fires in [`AuthProvider.tsx`](src/features/auth/AuthProvider.tsx).
2. `validateAuthorizedUser(user)` inspects the identity.
3. If the domain is non-matching or the email is unverified:
   - The client immediately issues `supabase.auth.signOut()`.
   - All in-memory user and profile states are wiped.
   - The user is evicted back to `/login`.
   - The application displays the required corporate compliance alert:
     > **"Access restricted. Please login using your official domain email."**
4. No rejected account is ever left in an authenticated app state.

### 3. Server-Side PostgreSQL Row Level Security (RLS)
Client-side checks provide a smooth user experience, but **database RLS is the true security boundary**:
- **Domain Function**: PostgreSQL function `public.is_allowed_hbplus_email(email)` runs inside the database engine:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_allowed_hbplus_email(email TEXT)
  RETURNS BOOLEAN AS $$
  BEGIN
    IF email IS NULL OR length(trim(email)) <= 11 THEN
      RETURN FALSE;
    END IF;
    RETURN lower(trim(email)) LIKE '%@hbplus.fit'
      AND length(trim(email)) - length(replace(trim(email), '@', '')) = 1;
  END;
  $$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;
  ```
- **Profiles RLS**: `SELECT` policy ensures users can only read their own row if their email belongs to `@hbplus.fit`.
- **Role Escalation Block**: A database trigger `trg_prevent_role_modification` aborts any client update attempt targeting the `role` column with an exception.
- **Admin Panel Access**: Announcements in `public.admin_announcements` can only be queried if `public.is_admin()` evaluates to `true` in PostgreSQL.

### 4. Sandbox & Developer Overrides
For local development when testers do not yet have an official `@hbplus.fit` Google Workspace mailbox:
- Set `EXPO_PUBLIC_DEV_ALLOWED_EMAILS=tester@gmail.com` in `.env` to whitelist specific test accounts.
- Or set `EXPO_PUBLIC_DEV_ALLOW_ALL_EMAILS=true` for local sandbox mode.
- In production, these variables remain unset, reverting strictly to the `@hbplus.fit` corporate rule.

---

## Architecture & Codebase Map

```
├── app/                          # Expo Router file-based navigation routes
│   ├── _layout.tsx               # Root layout: AuthProvider, ProfileProvider, top-level guard
│   ├── login.tsx                 # Responsive login screen (Email/Password + Google OAuth)
│   ├── auth/
│   │   └── callback.tsx          # OAuth redirect & PKCE token exchange handler
│   └── (app)/                    # Protected Route Group
│       ├── _layout.tsx           # Responsive shell: desktop sidebar (<1024px: top nav with tabs)
│       ├── index.tsx             # Dashboard: greeting, profile card, security overview, Admin panel
│       └── profile.tsx           # Profile: name update, immutable email, server-managed role badge
├── src/
│   ├── components/               # Accessible cross-platform UI components
│   │   ├── EyeIcon.tsx           # Clean vector eye toggle icon (no emoji, no extra dependencies)
│   │   ├── GoogleSignInButton.tsx # Official Google branded CTA (≥44px touch target)
│   │   ├── LoadingScreen.tsx     # Prevents flash of protected content during session checks
│   │   ├── ErrorBanner.tsx       # Accessible dismissible alert (≥44px touch target)
│   │   ├── RoleBadge.tsx         # Visual role indicator (Admin / User)
│   │   ├── Avatar.tsx            # Avatar with Google picture & fallback letter badge
│   │   └── index.ts
│   ├── constants/
│   │   ├── config.ts             # Domain constants, Supabase URLs, error messages
│   │   └── index.ts
│   ├── features/
│   │   ├── auth/                 # Core Authentication slice
│   │   │   ├── AuthProvider.tsx  # React Context: session restoration, listeners, domain rejection
│   │   │   ├── authService.ts    # Cross-platform Supabase OAuth & Email/Password sign-in
│   │   │   ├── domainPolicy.ts   # Strict @hbplus.fit validation (NO includes()), email verification
│   │   │   ├── useAuth.ts        # Custom hook for consuming auth context
│   │   │   └── index.ts
│   │   └── profile/              # Profile & Authorization slice
│   │       ├── types.ts          # Profile, UserRole, AdminAnnouncement type contracts
│   │       ├── roleUtils.ts      # Role checks, validation, and payload sanitization
│   │       ├── profileService.ts # Service layer for public.profiles & public.admin_announcements
│   │       ├── ProfileProvider.tsx # Profile Context providing active profile & reactive updates
│   │       └── index.ts
│   ├── lib/
│   │   └── supabase.ts           # Unified Supabase client (AsyncStorage for native, web URL detection)
│   └── theme/
│       ├── colors.ts             # Brand, status, surface, and text palettes
│       ├── spacing.ts            # Spacing, border radius, and elevation tokens
│       ├── breakpoints.ts        # Centralized responsive tokens (320px to 1920px) & touch targets
│       └── index.ts
├── supabase/
│   └── migrations/
│       └── 20261103000000_phase2_profiles_and_rls.sql # PostgreSQL database migration
├── test/
│   ├── verify-phase2.ts          # Automated unit test suite (49 comprehensive tests)
│   └── tsconfig.json
├── .env.example                  # Safe template with public variable placeholders
├── app.json                      # Expo config with scheme: "hbplus"
└── vercel.json                   # Vercel deployment configuration for static Expo web export
```

---

## Responsive Design & Breakpoints Matrix

All screens are designed responsively using `useResponsive()`, flex layouts, and `maxWidth` constraints without hardcoded pixel screen widths. All interactive touch targets strictly comply with the **minimum 44x44px** accessibility standard.

| Breakpoint | Target Devices | Navigation Shell | Layout Behavior | Card & Content Padding |
| :--- | :--- | :--- | :--- | :--- |
| **320px** | Small phones (iPhone SE, Galaxy Mini) | Stacked mobile header (Brand row + segmented nav tabs) | Single column, stacked avatar and form fields | 12px padding, full-width buttons |
| **375px** | Standard phones (iPhone 12/13/14/15) | Compact mobile header + segmented nav tabs | Single column, compact overview cards | 16px padding |
| **430px** | Large phones (Pro Max, Galaxy Ultra) | Compact mobile header + segmented nav tabs | Single column, spacious touch targets | 16px padding |
| **768px** | Tablets portrait (iPad Mini, iPad Air) | Expanded top bar with full logo, nav pills, avatar & logout | Balanced 2-column card grid | 24px padding |
| **1024px** | Tablet landscape / Small laptops | 260px fixed left sidebar with active nav states | Multi-column grid, max content width 1140px | 32px padding |
| **1366px** | Standard laptops & desktop monitors | 260px fixed left sidebar with active nav states | Multi-column grid, max content width 1140px | 32px padding |
| **1920px** | Ultrawide & 1080p+ external monitors | 260px fixed left sidebar with active nav states | Centered multi-column grid, max content width 1400px | 32px padding |

---

## Database Migration & Security (Supabase)

### Creating the First Admin Safely
All new sign-ups default to `role = 'user'` through the automated database trigger. To safely promote an account to `admin`:
1. Sign in once with an authorized corporate account (e.g., `admin@hbplus.fit`).
2. Open the **Supabase Dashboard → SQL Editor** and execute:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@hbplus.fit';
   ```
3. Refresh the application. The app immediately updates the role badge to **Admin (🛡️)** and unlocks the **Administrator Management Panel**.

---

## Verification & Test Commands

```bash
# 1. Typecheck the entire codebase (zero errors required)
npm run typecheck

# 2. Run the automated unit test suite (49/49 passed)
npm test

# 3. Verify static production web export (builds to dist/)
npm run build:web
```

### Automated Test Coverage Summary
- **49 total unit tests** covering:
  - Exact domain suffix checks (`@hbplus.fit`)
  - Case normalization and whitespace trimming
  - Missing, null, undefined, and non-string inputs
  - Attacker suffix, subdomain, and domain spoofing injections
  - Prohibition of `String.prototype.includes()`
  - Profile update sanitization (stripping `role`, `id`, `email`)
  - Admin role validation and permission helpers
  - Email verification checks (`email_confirmed_at` / `email_verified`)

---

## Vercel Web Deployment Guide

### 1. Deployment Settings in Vercel
When importing this repository into Vercel:
- **Framework Preset**: `Other` (handled by `vercel.json`)
- **Build Command**: `npx expo export --platform web` (or `npm run build:web`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2. Environment Variables in Vercel
Add the following in **Vercel Project Settings → Environment Variables**:
- `EXPO_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOi...`

### 3. Production OAuth Configuration
Once Vercel assigns your production domain (e.g. `https://hbplus-app.vercel.app`):
1. **Google Cloud Console**:
   - Add `https://hbplus-app.vercel.app` to **Authorized JavaScript origins**.
2. **Supabase Dashboard** (Authentication → URL Configuration):
   - Set **Site URL**: `https://hbplus-app.vercel.app`
   - Under **Redirect URLs**, add:
     - `https://hbplus-app.vercel.app/**`
     - `https://hbplus-app.vercel.app/auth/callback`
     - `http://localhost:8081/**` (for local development)
     - `hbplus://auth/callback` (for native builds)

---

## Mobile Native Builds (Android & iOS)

> **Note**: Deploying the web export to Vercel provides the web runtime only. Native Android and iOS application packages are separate native binaries.

### Running Locally with Native Runtime
```bash
# Android (requires Android Studio / ADB connected device)
npm run android

# iOS (requires macOS and Xcode Simulator)
npm run ios
```

### Cloud Builds via EAS (Expo Application Services)
To build distributable native binaries (`.apk`/`.aab` for Android, `.ipa` for iOS TestFlight):
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Log in to Expo
eas login

# 3. Configure project
eas build:configure

# 4. Build for Android
eas build --platform android --profile preview

# 5. Build for iOS
eas build --platform ios --profile preview
```

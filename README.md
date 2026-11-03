# HBPLUS Cross-Platform Corporate Application

A production-ready cross-platform enterprise application for HBPLUS built with **TypeScript**, **React Native**, **Expo (SDK 58)**, **Expo Router**, and **Supabase Auth with PostgreSQL Row Level Security (RLS)**.

The application runs from a single unified codebase across:
- **Web Browser** (React Native Web, deployed on Vercel)
- **Android Device / Emulator**
- **iOS Device / Simulator**

### Access & Identity Policy
Access is strictly restricted to verified corporate accounts ending in the exact domain **`@hbplus.fit`**. Unauthorized or non-domain accounts are evicted immediately post-OAuth callback, their local and remote session is purged, and access is denied.

---

## Architecture & Codebase Map

```
├── app/                          # Expo Router file-based navigation routes
│   ├── _layout.tsx               # Root layout: AuthProvider, ProfileProvider, top-level guard
│   ├── login.tsx                 # Accessible, responsive Login screen (brand header, domain notice, Google CTA)
│   ├── auth/
│   │   └── callback.tsx          # Cross-platform OAuth redirect handler (Web & deep link token exchange)
│   └── (app)/                    # Protected Route Group
│       ├── _layout.tsx           # Responsive shell: fixed desktop sidebar (<1024px: top nav with tab switcher), signout
│       ├── index.tsx             # Dashboard: greeting, profile card, RLS architecture card, Admin panel
│       └── profile.tsx           # Profile: name update, immutable email, server-managed role badge
├── src/
│   ├── components/               # Reusable accessible UI components
│   │   ├── GoogleSignInButton.tsx # Official Google branded CTA (minHeight: 50px touch target)
│   │   ├── LoadingScreen.tsx     # Prevents flash of protected content during session checks
│   │   ├── ErrorBanner.tsx       # Accessible dismissible alert (minHeight: 44px touch target)
│   │   ├── RoleBadge.tsx         # Visual role indicator (Admin / User)
│   │   ├── Avatar.tsx            # Avatar with Google picture & fallback letter badge
│   │   └── index.ts
│   ├── constants/
│   │   ├── config.ts             # Domain constants, Supabase URLs, user-facing error messages
│   │   └── index.ts
│   ├── features/
│   │   ├── auth/                 # Core Authentication slice
│   │   │   ├── AuthProvider.tsx  # React Context: session restoration, listeners, domain rejection
│   │   │   ├── authService.ts    # Cross-platform Supabase OAuth & WebBrowser deep linking
│   │   │   ├── domainPolicy.ts   # isAllowedEmail (ends with @hbplus.fit, NO includes()), verification
│   │   │   ├── useAuth.ts        # Custom hook for consuming auth context
│   │   │   └── index.ts
│   │   └── profile/              # Profile & Authorization slice
│   │       ├── types.ts          # Profile, UserRole, AdminAnnouncement type contracts
│   │       ├── roleUtils.ts      # Role checks, validation, and payload sanitization
│   │       ├── profileService.ts # Service layer for public.profiles & public.admin_announcements
│   │       ├── ProfileProvider.tsx # Profile Context providing active profile & reactive updates
│   │       └── index.ts
│   ├── lib/
│   │   └── supabase.ts           # Single Supabase client (AsyncStorage for native, web URL detection)
│   └── theme/
│       ├── colors.ts             # Brand, status, surface, and text palettes
│       ├── spacing.ts            # Spacing, border radius, and shadows
│       ├── breakpoints.ts        # Centralized responsive tokens (320px to 1920px) & touch targets
│       └── index.ts
├── supabase/
│   └── migrations/
│       └── 20261103000000_phase2_profiles_and_rls.sql # PostgreSQL database migration
├── test/
│   ├── verify-phase2.ts          # Automated unit test suite (46 comprehensive test cases)
│   └── tsconfig.json
├── .env.example                  # Template with public variable placeholders
├── app.json                      # Expo config with scheme: "hbplus"
└── vercel.json                   # Vercel deployment configuration for static Expo export
```

---

## Responsive Design & Breakpoints Matrix

All screens and navigation structures are designed responsively using `useResponsive()`, flex layouts, and `maxWidth` constraints without hardcoded pixel screen widths. All interactive touch targets strictly comply with the **minimum 44x44px** standard.

| Breakpoint | Target Devices | Navigation Shell | Layout Behavior | Card & Content Padding |
| :--- | :--- | :--- | :--- | :--- |
| **320px** | Small phones (iPhone SE, Galaxy Mini) | Stacked mobile header (Brand/User row + segmented nav tabs) | Single column, stacked avatar and form fields, no horizontal overflow | 12px padding, full-width buttons |
| **375px** | Standard phones (iPhone 12/13/14/15) | Compact mobile header + segmented nav tabs | Single column, compact overview cards | 16px padding |
| **430px** | Large phones (Pro Max, Galaxy Ultra) | Compact mobile header + segmented nav tabs | Single column, spacious touch targets | 16px padding |
| **768px** | Tablets portrait (iPad Mini, iPad Air) | Expanded top bar with full logo, nav pills, avatar & logout | Balanced 2-column card grid | 24px padding |
| **1024px** | Tablet landscape / Small laptops | 260px fixed left sidebar with active nav states | Multi-column grid, max content width 1140px | 32px padding |
| **1366px** | Standard laptops & desktop monitors | 260px fixed left sidebar with active nav states | Multi-column grid, max content width 1140px | 32px padding |
| **1920px** | Ultrawide & 1080p+ external monitors | 260px fixed left sidebar with active nav states | Centered multi-column grid, max content width 1400px | 32px padding |

---

## Database Migration & Setup (Supabase)

The migration is located at:
[`supabase/migrations/20261103000000_phase2_profiles_and_rls.sql`](supabase/migrations/20261103000000_phase2_profiles_and_rls.sql)

### How to Apply the Migration
1. Log in to your project in the **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Navigate to **SQL Editor** in the left menu.
3. Paste the contents of `supabase/migrations/20261103000000_phase2_profiles_and_rls.sql`.
4. Click **Run**.

### What the Migration Configures
1. **`public.profiles` Table**:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `email TEXT NOT NULL`
   - `full_name TEXT`
   - `avatar_url TEXT`
   - `role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
   - Justified indexes on `role` and `email` for fast policy execution.
2. **Explicit Row Level Security (RLS)**:
   - `SELECT`: Authenticated users can only read **their own** profile row, conditioned on their email ending in `@hbplus.fit`.
   - `INSERT`: Authenticated users can only insert **their own** record with default `role = 'user'`.
   - `UPDATE`: Authenticated users can update display name and avatar, but **cannot modify their role**.
   - Trigger `trg_prevent_role_modification`: Database trigger raises an exception if an authenticated client attempts to modify the `role` column.
3. **Automated User Provisioning**:
   - Trigger `handle_new_user()` on `auth.users` automatically provisions a `role = 'user'` record in `public.profiles` when a user signs up with a verified `@hbplus.fit` email.
4. **Admin Capability Table (`public.admin_announcements`)**:
   - RLS strictly evaluates `public.is_admin()`, querying `public.profiles.role = 'admin'` server-side.

### How to Create the First Admin Safely
All new users default to `role = 'user'`. To grant administrator privileges safely:
1. Sign in once with an authorized corporate account (e.g., `admin@hbplus.fit`).
2. Open the **Supabase Dashboard -> SQL Editor** and execute:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@hbplus.fit';
   ```
3. Refresh the application. The app immediately reflects the `admin` role, updates the badge to **Admin (🛡️)**, and unlocks the **Administrator Management Panel**.

---

## Security Review & Boundaries

### 1. Why a UI Route Guard is NOT a Security Boundary
A UI route guard (e.g. `if (!user) router.replace('/login')` or hiding admin UI in React) runs entirely in client-side JavaScript on end-user hardware.
- Any user can bypass or edit client code using browser DevTools or runtime modifiers.
- An attacker can issue direct HTTPS requests with their JWT to Supabase endpoints using Postman or `curl`.
- Route guards are **strictly user experience conveniences** to avoid rendering screens for unauthenticated users.
- **The true security boundary is PostgreSQL Row Level Security (RLS)**: Even if client code is manipulated to display the Admin Panel, queries against `public.admin_announcements` or other users' rows in `public.profiles` are evaluated by the PostgreSQL engine. Unauthorized queries return empty sets or fail with permission errors.

### 2. Role Storage & Tampering Prevention
- **No reliance on `user_metadata`**: Google OAuth claims or Supabase `user_metadata` are user-editable in standard Supabase configurations and are never used as a source of truth for authorization.
- **Server-enforced role column**: `role` resides in `public.profiles.role` with a strict `CHECK (role IN ('admin', 'user'))`.
- **Dual-layer escalation prevention**:
  1. `UPDATE` RLS policy has a `WITH CHECK (role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))`.
  2. `BEFORE UPDATE` trigger `prevent_role_modification()` raises a database exception if `NEW.role != OLD.role` when called by an authenticated client.
- **Client Sanitization**: `sanitizeProfileUpdate()` strips `role`, `id`, and `email` before sending payloads to the API.

### 3. Zero Secret Key Exposure
- Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are used in client code.
- The `service_role` key is **never** referenced or committed.
- `.env` is gitignored; `.env.example` contains placeholders.

### 4. Exact Domain Validation (`@hbplus.fit`)
- **In PostgreSQL**: `public.is_allowed_hbplus_email()` verifies `lower(trim(email)) LIKE '%@hbplus.fit'` and ensures there is exactly one `@` character with length > 11.
- **In TypeScript**: `isAllowedEmail()` normalizes (trim, lowercase), checks `endsWith('@hbplus.fit')`, verifies non-empty local part and no additional `@` symbol, and strictly avoids `String.prototype.includes()`.

---

## Vercel Web Deployment Guide

### 1. Deployment Settings in Vercel
When importing the repository into Vercel:
- **Framework Preset**: `Other` (handled by `vercel.json`)
- **Build Command**: `npx expo export --platform web` (or `npm run build:web`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2. Environment Variables in Vercel
Add the following in **Vercel Project Settings -> Environment Variables**:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anon key | `eyJhbGciOi...` |

### 3. Production OAuth Configuration (Post-Deploy Requirement)
Once Vercel assigns your production domain (e.g. `https://hbplus-app.vercel.app`):

#### A. In Google Cloud Console ([console.cloud.google.com](https://console.cloud.google.com)):
1. Navigate to **APIs & Services -> Credentials -> OAuth 2.0 Client ID**.
2. Under **Authorized JavaScript origins**, add:
   - `https://hbplus-app.vercel.app`
3. Under **Authorized redirect URIs**, ensure your Supabase auth callback is present:
   - `https://<your-project-id>.supabase.co/auth/v1/callback`
4. Click **Save**.

#### B. In Supabase Dashboard ([supabase.com/dashboard](https://supabase.com/dashboard)):
1. Navigate to **Authentication -> URL Configuration**.
2. Set **Site URL**: `https://hbplus-app.vercel.app`
3. Under **Redirect URLs**, add:
   - `https://hbplus-app.vercel.app/**`
   - `https://hbplus-app.vercel.app/auth/callback`
   - `http://localhost:8081/**` *(keep for local development)*
   - `hbplus://auth/callback` *(keep for native builds)*
4. Click **Save**.

---

## Post-Deployment Smoke Test Protocol

Perform this manual verification on the deployed Vercel URL:

1. **Unauthenticated Redirect Check**:
   - Open an incognito/private browser window.
   - Navigate to `https://hbplus-app.vercel.app/`.
   - Verify that the app immediately redirects to `/login` without flashing protected dashboard content.
2. **Unauthorized Domain Eviction Check**:
   - On the login screen, click **Sign in with Google**.
   - Authenticate with a personal, non-corporate Google account (e.g. `user@gmail.com`).
   - Verify that upon return, the app immediately terminates the session, executes `supabase.auth.signOut()`, purges state, and displays:
     > *"Access restricted. Please login using your official domain email."*
3. **Authorized Corporate Sign-In Check**:
   - Sign in using an official corporate Google account (`user@hbplus.fit`).
   - Verify that the Dashboard loads with the user's name greeting, verified domain badge (`✓ @hbplus.fit`), role badge (`User`), and account details.
4. **Profile Display Name Update Check**:
   - Navigate to `/profile`.
   - Update the display name and click **Save**.
   - Confirm the success message appears and the updated name is displayed in the dashboard.
5. **Admin RLS Access Control Check**:
   - While signed in as a regular user, verify the Admin card shows the RLS restriction notice.
   - Promote the user to `admin` in Supabase SQL editor.
   - Refresh the page and verify that the Admin Panel unlocks and announcements are readable.
6. **Logout Functionality Check**:
   - Click **Sign Out**.
   - Confirm the sign-out dialog, verify the loading state, and confirm the app returns to `/login`.

---

## Mobile Native Builds (Android & iOS)

> **Important**: Deploying the web export to Vercel provides the web runtime only. Native Android and iOS application packages are separate native binaries.

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
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview
```

---

## Verification & Test Commands

```bash
# 1. Typecheck the entire codebase
npm run typecheck

# 2. Run the automated unit test suite (46 tests)
npm test

# 3. Verify static production web export
npm run build:web
```

---

## GitHub Submission Checklist

- [x] Single unified TypeScript codebase for Web, Android, and iOS.
- [x] Real Google OAuth integration via Supabase Auth (no fake/mock login).
- [x] Exact corporate domain enforcement for `@hbplus.fit` (without using `includes()`).
- [x] Unauthorized domains evicted immediately with required error message.
- [x] Protected route group `app/(app)` with `_layout.tsx`, `index.tsx`, and `profile.tsx`.
- [x] PostgreSQL migration with explicit RLS, triggers, automated provisioning, and admin table.
- [x] Responsive layout audited across 320px, 375px, 430px, 768px, 1024px, 1366px, 1920px.
- [x] Touch targets meet minimum 44x44px accessibility guidelines.
- [x] Vercel deployment configuration (`vercel.json`, `dist` output, SPA rewrites, security headers).
- [x] `.env` is gitignored; `.env.example` contains safe placeholders only.
- [x] Automated unit test suite passes 100% (46/46 passed).
- [x] Strict TypeScript compiler check passes with 0 errors.

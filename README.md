# HBPLUS Cross-Platform Application

A secure cross-platform corporate application for HBPLUS built with **React Native**, **Expo (SDK 58)**, **Expo Router**, and **Supabase Auth**. Runs from a single TypeScript codebase across:
- **Web Browser** (React Native Web)
- **Android Device / Emulator**
- **iOS Device / Simulator**

Strict corporate access policy: **Only verified Google accounts with the exact domain `@hbplus.fit` are permitted.** All other domains are rejected immediately upon callback, session state is purged, and access is restricted.

---

## Architecture Overview (Phase 1 & Phase 2)

```
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout: AuthProvider, ProfileProvider, top-level guard
│   ├── login.tsx                 # Responsive Login screen (brand header, domain notice, Google CTA)
│   ├── auth/
│   │   └── callback.tsx          # OAuth redirect handler (Web & deep link token exchange)
│   └── (app)/                    # Protected Route Group
│       ├── _layout.tsx           # Protected layout: responsive desktop sidebar / mobile header, signout
│       ├── index.tsx             # Dashboard: greeting, profile card, RLS architecture card, Admin panel
│       └── profile.tsx           # Profile: name update, immutable email, server-managed role badge
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── GoogleSignInButton.tsx # Official Google branded CTA with loading & disabled states
│   │   ├── LoadingScreen.tsx     # Prevents flash of protected content during session checks
│   │   ├── ErrorBanner.tsx       # Accessible dismissible alert for domain / auth errors
│   │   ├── RoleBadge.tsx         # Visual role indicator (Admin / User)
│   │   ├── Avatar.tsx            # Avatar with Google picture & fallback letter badge
│   │   └── index.ts
│   ├── constants/
│   │   ├── config.ts             # Domain constants, Supabase URLs, user-facing error messages
│   │   └── index.ts
│   ├── features/
│   │   ├── auth/                 # Core Auth feature slice
│   │   │   ├── AuthProvider.tsx  # React Context: session restoration, listeners, domain rejection
│   │   │   ├── authService.ts    # Cross-platform Supabase OAuth & WebBrowser deep linking
│   │   │   ├── domainPolicy.ts   # isAllowedEmail (ends with @hbplus.fit, NO includes()), verification
│   │   │   ├── useAuth.ts        # Custom hook for consuming auth context
│   │   │   └── index.ts
│   │   └── profile/              # Profile & Authorization feature slice (Phase 2)
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
│       └── index.ts
├── supabase/
│   └── migrations/
│       └── 20261103000000_phase2_profiles_and_rls.sql # Phase 2 database migration
├── test/
│   ├── verify-phase2.ts          # Automated unit test suite (46 comprehensive test cases)
│   └── tsconfig.json
├── .env.example                  # Template with public variable placeholders
└── app.json                      # Expo config with scheme: "hbplus"
```

---

## Phase 2 Database Migration & Setup

The database migration is located at:
[`supabase/migrations/20261103000000_phase2_profiles_and_rls.sql`](supabase/migrations/20261103000000_phase2_profiles_and_rls.sql)

### How to Apply the Migration in Supabase

1. Open your project in the **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Navigate to the **SQL Editor** tab in the left navigation.
3. Open or paste the full contents of `supabase/migrations/20261103000000_phase2_profiles_and_rls.sql`.
4. Click **Run** to execute the migration.

### Database Capabilities Provisioned

1. **`public.profiles` Table**:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `email TEXT NOT NULL`
   - `full_name TEXT`
   - `avatar_url TEXT`
   - `role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())`
   - Indexes on `role` and `email` for fast policy resolution.

2. **Row Level Security (RLS) on `public.profiles`**:
   - **SELECT**: Authenticated users can read **only their own** profile, conditioned on their verified email ending in `@hbplus.fit`.
   - **INSERT**: Authenticated users can insert **only their own** record with default `role = 'user'`.
   - **UPDATE**: Authenticated users can modify their display name and avatar, but **cannot modify or escalate their role**.
   - **Trigger `trg_prevent_role_modification`**: A `BEFORE UPDATE` trigger raises an exception if an authenticated client attempts to modify the `role` column.

3. **Automated Profile Provisioning Trigger**:
   - `handle_new_user()` trigger on `auth.users` automatically provisions a `role = 'user'` profile in `public.profiles` when a user signs in with a verified `@hbplus.fit` email.
   - Ignores non-matching domains so unauthorized signups are not provisioned in application tables.

4. **Admin-Only Table: `public.admin_announcements`**:
   - Explicit RLS policies (SELECT, INSERT, UPDATE, DELETE) restricted to users where `public.is_admin()` evaluates to `TRUE`.
   - Evaluated server-side against `public.profiles.role = 'admin'` (not client claims or `user_metadata`).

---

## How to Create the First Admin Safely

By default, all new accounts are assigned `role = 'user'` by the database trigger, and client-side users cannot escalate their role. To designate the first administrator safely:

1. Have the user sign in with their corporate Google account (`your_admin@hbplus.fit`).
2. In the **Supabase Dashboard** -> **SQL Editor**, execute:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your_admin@hbplus.fit';
   ```
3. Refresh the app. The app immediately detects `role: 'admin'`, updates the header role badge to **Admin (🛡️)**, and unlocks the **Administrator Management Panel** with live read/write access to `public.admin_announcements`.

---

## Security Review & Boundaries

### 1. Why a UI Route Guard is NOT a Security Boundary
A UI route guard (e.g., checking `if (!user) router.replace('/login')` or `if (!isAdmin) return <AccessDenied />`) is strictly a **user experience (UX) convenience**. Client-side JavaScript executes entirely on untrusted end-user hardware. Any user can:
- Modify JavaScript memory, React state, or local storage using browser DevTools.
- Intercept and rewrite client bundle code.
- Send raw HTTP/REST requests directly to the Supabase PostgREST endpoint using `curl` or Postman with their JWT.

**The True Security Boundary is PostgreSQL Row Level Security (RLS)**:
Even if an attacker modifies client code to render the Admin Panel, any database request sent to `public.admin_announcements` or other users' rows in `public.profiles` executes against PostgreSQL RLS. The PostgreSQL engine evaluates `auth.uid()` and `public.is_admin()`, rejecting unauthorized requests at the database layer with zero data leakage.

### 2. Explicit Database RLS Policies
Every database table created has RLS explicitly enabled:
- `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;`
No default permissive policies are used. Every operation (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) has an explicit policy.

### 3. Role Storage & Tampering Prevention
- **No reliance on `user_metadata`**: Google OAuth claims or Supabase `user_metadata` are user-editable in standard Supabase configurations and are never used as a source of truth for authorization.
- **Server-enforced role column**: `role` resides in `public.profiles.role` with a strict `CHECK (role IN ('admin', 'user'))`.
- **Dual-layer escalation prevention**:
  1. `UPDATE` RLS policy has a `WITH CHECK (role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))`.
  2. `BEFORE UPDATE` trigger `prevent_role_modification()` raises a database exception if `NEW.role != OLD.role` when called by an authenticated client.
- **Client Sanitization**: `sanitizeProfileUpdate()` strips `role`, `id`, and `email` before sending payloads to the API.

### 4. Zero Secret Key Exposure
- Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are used in client code.
- The `service_role` key is **never** referenced or committed.
- `.env` is gitignored.

### 5. Exact Domain Validation (`@hbplus.fit`)
- **In PostgreSQL**: `public.is_allowed_hbplus_email()` verifies `lower(trim(email)) LIKE '%@hbplus.fit'` and ensures there is exactly one `@` symbol with length > 11.
- **In TypeScript**: `isAllowedEmail()` normalizes (trim, lowercase), checks `endsWith('@hbplus.fit')`, verifies non-empty local part and no additional `@` symbol, and strictly avoids `String.prototype.includes()`.

---

## Commands to Run

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

### Run on iOS
```bash
npm run ios
```

### Run Verification & Typecheck
```bash
npm test            # Runs Phase 2 automated test suite (46/46 passed)
npm run typecheck   # Runs strict TypeScript validation (0 errors)
```

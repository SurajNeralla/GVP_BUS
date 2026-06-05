# GVPCDPGC Smart Bus Portal — Deployment Guide

## 🏗️ Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Name it: `gvpcdpgc-bus-portal`
4. Choose a strong database password (save it!)
5. Select the **Asia Pacific (Mumbai)** region for best latency
6. Wait for project to initialize (~2 minutes)

---

## 🗄️ Step 2: Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Copy and paste the contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Click **Run**
4. Then paste the contents of [`supabase/rls.sql`](./supabase/rls.sql)
5. Click **Run**

---

## 🔐 Step 3: Configure Supabase Auth

1. Go to **Authentication → Settings**
2. Under **Email Auth**: Enable **Email OTP** (magic link)
3. Set **Site URL** to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
4. Add redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:5173/auth/callback` (for local dev)
5. Under **Email Templates**, customize the magic link email if desired

---

## 👨‍💼 Step 4: Create Admin Account

1. Go to **Authentication → Users** in Supabase
2. Click **"Invite User"**
3. Enter the admin email (e.g., `admin@gvpcdpgc.edu.in`)
4. After they sign up, go to **SQL Editor** and run:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@gvpcdpgc.edu.in';
```

---

## 🔑 Step 5: Get API Keys

1. In Supabase, go to **Settings → API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon (public) key** → `VITE_SUPABASE_ANON_KEY`

---

## 📁 Step 6: Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=GVPCDPGC Smart Bus Portal
VITE_COLLEGE_EMAIL_DOMAIN=gvpcdpgc.edu.in
VITE_VAPID_PUBLIC_KEY=your-vapid-key  # Optional for push notifications
```

---

## 🚀 Step 7: Deploy to Vercel

### Option A: Via Vercel CLI (recommended)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B: Via GitHub + Vercel Dashboard
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → "New Project"
3. Import your GitHub repository
4. Add all environment variables from `.env` in the Vercel dashboard
5. Click **Deploy**

> [!IMPORTANT]
> Make sure to add all `VITE_*` environment variables in the Vercel project settings, not just locally.

---

## 🚌 Step 8: Create Initial Data (via Admin Panel)

Log in as admin and:

1. **Create Routes** → Admin → Routes → Add routes with stop names and GPS coordinates
2. **Create Buses** → Admin → Buses → Add buses and assign routes
3. **Create Driver Accounts** → Admin → Drivers → Add drivers
4. **Assign Drivers to Buses** → Admin → Drivers → Select bus from dropdown

---

## 👥 Step 9: Student Registration Workflow

1. Student logs in with their college email at your site URL
2. They receive a magic link email
3. They click the link → redirected to "Pending Assignment" page
4. They complete their profile (name, roll number, department, year, phone)
5. Admin goes to **Admin → Registrations** → finds the student
6. Admin selects a bus from the dropdown and clicks **Approve**
7. Student receives a notification and is automatically redirected to `/bus/:busId` on next login

---

## 📱 Step 10: PWA Installation

**On Mobile (Android/iOS):**
- Open the site in Chrome/Safari
- Tap the "Share" icon or browser menu
- Select "Add to Home Screen"

**On Desktop (Chrome):**
- Click the install icon (⊕) in the address bar

---

## 🗺️ Step 11: Adding Route GPS Coordinates

When creating routes, enter GPS coordinates for each stop:
- Use [Google Maps](https://maps.google.com) → right-click any location → click the coordinates to copy them
- Latitude: ~17.7 for Visakhapatnam area
- Longitude: ~83.2 for Visakhapatnam area

---

## 🔧 Local Development

```bash
# Clone and install
git clone <your-repo>
cd bus
npm install

# Set up environment
cp .env.example .env
# Fill in your Supabase credentials

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📊 Database Schema Overview

| Table | Purpose |
|-------|---------|
| `profiles` | All user profiles (student/driver/admin) |
| `routes` | Bus routes with stops (JSON array) |
| `buses` | Individual buses assigned to routes |
| `drivers` | Driver records linked to profiles and buses |
| `registrations` | Student bus registrations (pending/approved/rejected) |
| `bus_locations` | Real-time GPS from driver app (Realtime-enabled) |
| `notifications` | In-app notifications (Realtime-enabled) |

---

## 🛡️ Security Notes

- All tables have **Row Level Security (RLS)** enabled
- Students can only access **their own data**
- Drivers can only update **their assigned bus location**
- Admins have **full access** to all tables
- College email validation is enforced **on the frontend**
- Magic link auth is **passwordless and secure** via Supabase

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|---------|
| Student can't sign in | Ensure email ends with `@gvpcdpgc.edu.in` |
| Magic link not received | Check spam folder; verify Supabase email settings |
| Bus not showing on map | Driver must start trip and allow location permission |
| Map tiles not loading | Check internet connection (uses OpenStreetMap) |
| Admin can't approve | Ensure admin profile has `role = 'admin'` in DB |
| Push notifications not working | Must use HTTPS (Vercel provides this automatically) |

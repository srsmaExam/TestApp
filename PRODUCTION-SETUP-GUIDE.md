# Production Setup & Deployment Guide (Supabase + Vercel)
**Project**: SRSMA Exam Platform (`srsmaExam`)  
**Target Environment**: Supabase (PostgreSQL) + Vercel (Next.js Serverless)  
**Host OS**: Windows (PowerShell)  
**Cost**: **$0.00 / month (100% Free Forever Tier)**

---

## 0. Is "100% Free" a Problem? (Free-Tier Feasibility Analysis)

**Short answer: No, it will not be a problem at all.** You can run this entire platform completely free. Here is the breakdown:

| Service | Free Tier Limits | How SRSMA Uses It | Status |
|---|---|---|---|
| **Supabase PostgreSQL** | 500 MB database, 50,000 monthly active users, 5 GB bandwidth. | All student profiles, exam papers, KaTeX questions, options, and scorecards take < 20 MB for hundreds of tests. | ✅ **Plenty of room** |
| **Vercel Hosting** | 100 GB bandwidth/month, max 12 Serverless Functions per deployment, free SSL & custom domain. | All 39 API routes are consolidated into 1 unified Serverless Function (`/api/[[...slug]]`), keeping total functions at ~2 (far below the 12-function cap). | ✅ **100% Free** |
| **Exam Sweep Cron** | Vercel Hobby tier allows native cron only once per day (`0 0 * * *`). | Use **[cron-job.org](https://cron-job.org)** (100% free forever) to ping the sweep endpoint every 2 minutes. | ✅ **100% Free** |

> [!TIP]
> **Bonus Benefit of Free Cron**: Supabase free projects pause after 7 days of complete inactivity. Having `cron-job.org` ping your `/api/cron/sweep-expired` endpoint every 2 minutes keeps your Supabase database alive and awake 24/7 so it **never pauses**!

---

## 1. Special Characters in Database Password (Resolved)

In PostgreSQL connection URIs, `@` is the delimiter that separates credentials from the server host.
- **Your Supabase Database Password**: `SRSMA@108!!`
- **Special Characters**:
  - `@` is encoded to `%40`
  - `!` is encoded to `%21`
- **Your Encoded Password**: **`SRSMA%40108%21%21`**

Your complete, ready-to-use Supabase Connection String:
```
postgresql://postgres.dpxjyeofofgizlfvwvkv:SRSMA%40108%21%21@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
```

*(Notice port `6543` and user `postgres.dpxjyeofofgizlfvwvkv`: this uses Supabase's Supavisor Transaction Pooler, which is required for Vercel serverless connections).*

---

## 2. Step-by-Step Deployment Guide

### Step 1: Run Database Migrations (From Windows PowerShell)

Before launching the site, run the schema migrations from your local development machine to create all tables in your Supabase database.

Open **PowerShell** in `c:\Users\panga\OneDrive\Desktop\Seva\SRSMA\Study_App` and run:

```powershell
$env:DATABASE_URL="postgresql://postgres.dpxjyeofofgizlfvwvkv:SRSMA%40108%21%21@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
npm run migrate
```

*Expected output:*
```
[migrate] all migrations applied successfully.
```

---

### Step 2: Seed the Master Faculty Account (SRSMA)

Create the verified teacher account used to log in at the staff portal (`/SRSMA`):

In **PowerShell**, run:

```powershell
$env:DATABASE_URL="postgresql://postgres.dpxjyeofofgizlfvwvkv:SRSMA%40108%21%21@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
$env:ADMIN_USERNAME="Teacher"
$env:ADMIN_PASSWORD="SRSMA@108"
$env:ADMIN_FULLNAME="SRSMA"
$env:ADMIN_EMAIL="exams.srsma@gmail.com"
npm run seed:admin
```

*Expected output:*
```
[seed-admin] provisioning faculty admin: "Teacher" (exams.srsma@gmail.com)...
[seed-admin] created new faculty admin account: "Teacher"
[seed-admin] done. Staff can now log in at /SRSMA with these credentials.
```

> [!NOTE]
> Your faculty web login credentials will be:
> - **URL**: `https://your-domain.vercel.app/SRSMA`
> - **Username**: `Teacher`
> - **Password**: `SRSMA@108`

---

### Step 3: Push Code to GitHub

Commit your changes and push them to your repository:

```powershell
git add .
git commit -m "Configure production credentials and Vercel compatibility"
git push origin main
```

---

### Step 4: Import and Configure Project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
2. Select your repository and click **Import**.
3. Leave Framework Preset as **Next.js**.
4. Under **Environment Variables**, add the following 7 variables:

| Variable Name | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.dpxjyeofofgizlfvwvkv:SRSMA%40108%21%21@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require` | Supabase Transaction Pooler connection string |
| `DATABASE_POOL_MAX` | `10` | Max connection pool limit per serverless container |
| `SESSION_SECRET` | `kO87M9iPWSqCTtHasbSjHQ1Sfbru4TFFbw35n4tKxQA` | Secret key for 90-day student/faculty auth cookies |
| `COOKIE_SECURE` | `true` | Enforces HTTPS-only cookies in production |
| `CRON_SECRET` | `cee0fa379c396c15290ea1a528c9cc92` | Security key for the auto-submit sweep endpoint |
| `DISABLE_SWEEP_TIMER` | `true` | Disables in-process setInterval timer for Vercel serverless |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` *(or your custom domain)* | Base application URL |

5. Click **Deploy**. Vercel will build and launch your production site.

---

### Step 5: Set Up the Free 2-Minute Sweep Cron (100% Free)

In CBT exams, when a student's countdown timer expires or if they disconnect, the platform automatically submits and scores their test attempt.

Because Vercel's free Hobby plan restricts native crons to once daily (`0 0 * * *`), use **[cron-job.org](https://cron-job.org)** (completely free) to ping the sweep endpoint every 2 minutes:

1. Create a free account at [cron-job.org](https://cron-job.org).
2. Click **Create Cronjob**.
3. On the **Common** tab, simply fill in:
   - **Title**: `SRSMA Exam Timer Sweep`
   - **URL**: `https://test-app-rouge-eight.vercel.app/api/cron/sweep-expired?key=cee0fa379c396c15290ea1a528c9cc92`
   - **Schedule**: Every `2` minutes (e.g. choose *User-defined* or *Every 2 minutes*).
4. *(Note: You do not need to change the HTTP method — `GET` is already the built-in default on cron-job.org under the Advanced tab).*
5. Click **Create / Save**.

*This will run 24/7 without cost, auto-submit expired exams, and keep your Supabase database continuously active so it never goes to sleep!*

---

## 3. Production Verification Checklist

Once deployed on Vercel, verify all features:

- [ ] **Faculty Login**:
  - Visit `https://your-project.vercel.app/SRSMA`.
  - Enter username `Teacher` and password `SRSMA@108`.
  - Verify access to the `/teacher` management dashboard.
- [ ] **Student Mobile Login**:
  - Visit `https://your-project.vercel.app/login`.
  - Enter a mobile number (e.g. `9876543210`).
  - Verify you are signed in and routed to `/student`.
  - Close the browser and reopen the site to confirm your 90-day persistent session.
- [ ] **Exam Submission & Scoring**:
  - Start an exam under `/student`.
  - Answer questions and submit.
  - Check that instant scorecard, KaTeX formulas, and rank analytics render properly.
- [ ] **Cron Sweep Endpoint**:
  - In your browser, test:
    ```
    https://your-project.vercel.app/api/cron/sweep-expired?key=cee0fa379c396c15290ea1a528c9cc92
    ```
  - Verify JSON response: `{"ok":true,"closedCount":0,...}`.
- [ ] **Local Development Mode Intact**:
  - On your local PC without `DATABASE_URL` set, run `npm run dev`.
  - Confirm local development continues working with embedded PGlite.

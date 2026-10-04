# Production Database Migrations Rule

## Context
In `src/db/client.ts`, runtime migrations on Vercel Serverless cold starts are intentionally disabled in production (`NODE_ENV === 'production'`) to optimize Vercel Active Fluid CPU and eliminate ~250ms cold-start latency.

## Permanent Instructions for Antigravity & Developers
1. **Never re-enable runtime migrations during request serving in production without explicit justification.**
2. **Whenever new database migrations or schema alterations are created:**
   - Always remember and remind the user to run:
     ```bash
     npm run migrate
     ```
     against the production database (or ensure `DATABASE_URL` in `.env` targets production) before or during deployment.
3. **If schema changes cause `column does not exist` or `relation does not exist` in production:**
   - The first step is always checking if `npm run migrate` was run on the production database.
4. **Alternative for Vercel Build Pipeline:**
   - If automated deployment migration is desired, `npm run migrate` can be triggered via `"build": "tsx scripts/migrate.ts && next build"` or setting the temporary env var `RUN_MIGRATIONS=true` in Vercel settings.

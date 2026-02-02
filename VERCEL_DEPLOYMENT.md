# Vercel Deployment Guide - Gym Streak Tracker

This guide walks you through deploying the Gym Streak Tracker app to Vercel.

## Prerequisites

- GitHub account with your repo pushed
- Vercel account (free at https://vercel.com)
- Environment variables ready

## Step 1: Prepare Your Repository

1. Make sure all files are committed to Git:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. Verify your `.env.example` file exists (already created)

3. Ensure `.gitignore` includes:
   - `venv/`
   - `__pycache__/`
   - `.env` (don't commit actual secrets)
   - `gym_streak.db` (database file)

## Step 2: Deploy to Vercel

### Option A: Using Vercel Web Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository from the list
4. Click "Import"
5. In the "Configure Project" section:
   - Framework: Select "Other"
   - Root Directory: Leave as `./` (or select the folder if your app is in a subfolder)
6. Click "Environment Variables" and add:
   - **KEY**: `SECRET_KEY`
   - **VALUE**: Generate a secure key:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```
7. Click "Deploy"

### Option B: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. In your project directory, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Confirm project name
   - Set production environment
   - Add environment variable `SECRET_KEY` with a secure value

4. After first deployment, run again for production:
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

After deployment, set the `SECRET_KEY` environment variable in Vercel:

1. Go to your project on Vercel dashboard
2. Click "Settings" → "Environment Variables"
3. Add a new variable:
   - **Name**: `SECRET_KEY`
   - **Value**: `your-super-secret-key-here` (generate a unique one)
   - **Environments**: Select "Production"
4. Redeploy after adding variables

## Step 4: Database Persistence (Important!)

### Current Setup (Development)
- Uses SQLite (`gym_streak.db`)
- Works locally but **NOT** for Vercel (serverless architecture)

### For Production on Vercel

You have two options:

#### Option 1: Use PostgreSQL (Recommended)
1. Create a free PostgreSQL database at [Supabase](https://supabase.com) or [Railway](https://railway.app)
2. Get your connection string (looks like: `postgresql://user:password@host:port/database`)
3. Add to Vercel environment variables:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
4. Update `app.py` database URI:
   ```python
   database_url = os.getenv('DATABASE_URL')
   if database_url:
       app.config['SQLALCHEMY_DATABASE_URI'] = database_url
   else:
       app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///gym_streak.db'
   ```

#### Option 2: Use Vercel Postgres (Easiest)
1. In Vercel dashboard, go to "Storage" → "Create New" → "Postgres"
2. Follow the setup wizard
3. Copy the connection string to environment variables
4. Update app.py as shown above

## Step 5: Verify Deployment

1. Your app will be live at `https://your-project-name.vercel.app`
2. Try the following:
   - Create a new account
   - Log in
   - Add a workout
   - Check the stats

3. If you see database errors, check:
   - Environment variables are set correctly
   - DATABASE_URL is accessible
   - Vercel logs: Dashboard → Project → Deployments → View logs

## Troubleshooting

### Error: "ModuleNotFoundError"
- **Cause**: Missing Python packages or native build dependencies
- **Fix**: Check `requirements.txt` includes all packages. For PostgreSQL in serverless deployments prefer a pure-Python driver like `pg8000` to avoid system-level build dependencies (e.g. `libpq-dev`, `pg_config`). Example entry:
  ```
  pg8000
  ```

- If you intentionally use `psycopg2-binary`, ensure your build environment can compile it (has `pg_config` available) or use a pre-built wheel from the deployment platform.

### Note: instance path & read-only filesystems
- Vercel serverless functions run on a read-only filesystem; the app sets a writable `instance_path` automatically (using a temp dir) but you can override it with an env var `INSTANCE_PATH` if desired.

### Error: "SECRET_KEY not set"
- **Cause**: Environment variable not configured
- **Fix**: Add `SECRET_KEY` to Vercel environment variables (Settings → Environment Variables)

### Error: "database is locked"
- **Cause**: Using SQLite on Vercel (not supported)
- **Fix**: Use PostgreSQL or Vercel Postgres instead

### Workouts/Routines not saving
- **Cause**: Database connection issue
- **Fix**: Check DATABASE_URL environment variable and database credentials

## Redeployment

After making changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel automatically redeploys on push to main branch.

Or manually trigger from dashboard: Deployments → "Redeploy"

## Local Development

Continue development locally with:

```bash
python app.py
# Or with environment variables:
python -m flask run
```

## File Structure

```
Gym Streak/
├── app.py                 # Flask application
├── models.py              # Database models
├── requirements.txt       # Python dependencies
├── vercel.json            # Vercel configuration
├── .env.example           # Environment variables template
├── .gitignore             # Git exclusion rules
├── templates/             # HTML templates
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   └── routines.html
└── static/                # CSS and JavaScript
    ├── css/
    ├── js/
```

## Quick Checklist ✅

Before deploying to Vercel or triggering a production deploy, ensure the following are set:

- [ ] **Commit & push** all changes to `main` branch (or your production branch).
- [ ] **Environment variables** (Vercel dashboard → Settings → Environment Variables):
  - `SECRET_KEY` = (generate via `python -c "import secrets; print(secrets.token_hex(32))"`)
  - `DATABASE_URL` = (Postgres connection string if using a hosted DB)
  - Optional: `INSTANCE_PATH` = (override instance path if needed)
- [ ] `requirements.txt` includes `pg8000` (the app prefers `pg8000` on serverless platforms to avoid native build deps).
- [ ] If using Postgres, confirm network/access from Vercel (e.g., allowlist Vercel IPs or use a managed DB with public URL).
- [ ] Trigger a deploy (push to `main` will auto-deploy; or use `vercel --prod` if you have the CLI and are logged in).

## Support

For issues:
1. Check Vercel dashboard logs: Project → Deployments → Function Logs
2. Verify environment variables are set
3. Check that all dependencies are in `requirements.txt`

---

**Your App is Live!** 🚀

Share your Gym Streak Tracker with the world at `https://your-project-name.vercel.app`

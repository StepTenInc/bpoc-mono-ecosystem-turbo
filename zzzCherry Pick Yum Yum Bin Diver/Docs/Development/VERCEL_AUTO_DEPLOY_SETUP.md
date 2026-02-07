# Vercel Auto-Deployment Setup Guide

## 🚀 Quick Start: Redeploy with New Repository

Your repository has been moved from `shoreagents/bpoc-cloned` to `StepTen2024/bpoc-stepten`. Follow these steps to redeploy on Vercel.

---

## Step 1: Connect New GitHub Repository to Vercel

### Option A: If you have an existing Vercel project
1. Go to https://vercel.com/dashboard
2. Select your existing project (or create a new one)
3. Go to **Settings** → **Git**
4. Click **Disconnect** (if connected to old repo)
5. Click **Connect Git Repository**
6. Select: `StepTen2024/bpoc-stepten`
7. Click **Connect**

### Option B: Create a new Vercel project
1. Go to https://vercel.com/dashboard
2. Click **Add New...** → **Project**
3. Import your GitHub repository: `StepTen2024/bpoc-stepten`
4. Vercel will detect it's a Next.js project automatically

---

## Step 2: Configure Production Branch

1. In Vercel project settings, go to **Settings** → **Git**
2. Set **Production Branch** to: `main`
3. Ensure **Auto-deploy** is enabled (should be by default)

---

## Step 3: Configure Environment Variables ⚠️ IMPORTANT

Go to **Settings** → **Environment Variables** and add ALL of these:

### Required: BPOC Database (Main Database)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-bpoc-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-bpoc-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-bpoc-service-role-key
```

### Required: ShoreAgents Database (Interview System)
```
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL=https://your-shoreagents-project.supabase.co
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY=your-shoreagents-anon-key
SHOREAGENTS_SERVICE_ROLE_KEY=your-shoreagents-service-role-key
```

### Required: Application URLs
```
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Required: Database Connection (if using Prisma)
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Required: AI/Anthropic API
```
ANTHROPIC_API_KEY=your-anthropic-api-key
```
OR
```
CLAUDE_API_KEY=your-claude-api-key
```

### Optional: Feature Flags
```
FEATURE_SUPABASE_AUTH=true
FEATURE_SUPABASE_CANDIDATES=true
FEATURE_SUPABASE_PROFILES=true
FEATURE_SUPABASE_RESUMES=true
FEATURE_SUPABASE_ASSESSMENTS=true
FEATURE_SUPABASE_AGENCIES=true
FEATURE_SUPABASE_JOBS=true
FEATURE_SUPABASE_APPLICATIONS=true
```

### ⚠️ Important Notes:
- **Set for all environments**: Production, Preview, and Development
- **Copy values from your old Vercel project** (if you had one) or from your local `.env.local`
- **Never commit these values** to Git - they're sensitive!

---

## Step 4: Configure Build Settings

1. Go to **Settings** → **General**
2. Verify these settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Root Directory**: Leave empty (unless your Next.js app is in a subfolder)

---

## Step 5: Deploy

### Option A: Automatic Deploy (Recommended)
1. After connecting the repository, Vercel will automatically start deploying
2. Go to **Deployments** tab to watch the progress
3. Wait for build to complete (usually 2-5 minutes)

### Option B: Manual Deploy
1. Go to **Deployments** tab
2. Click **Deploy** → **Deploy from GitHub**
3. Select `main` branch
4. Click **Deploy**

---

## Step 6: Verify GitHub Integration

1. Go to your GitHub repo: https://github.com/StepTen2024/bpoc-stepten
2. Go to **Settings** → **Webhooks**
3. Look for Vercel webhook (should be there automatically)
4. Verify it's **Active** and receiving events

The Vercel webhook should listen for:
- ✅ Push events
- ✅ Pull request events (optional)

---

## Step 7: Test Auto-Deployment

1. Make a small change to any file
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. Check Vercel dashboard - deployment should start automatically within seconds

---

## Troubleshooting

### If deployments don't trigger automatically:

1. **Check Vercel Dashboard**:
   - Go to project → Settings → Git
   - Verify repository is connected to `StepTen2024/bpoc-stepten`
   - Check if "Auto-deploy" toggle is ON

2. **Check GitHub Webhooks**:
   - GitHub repo → Settings → Webhooks
   - Find Vercel webhook
   - Check "Recent Deliveries" tab
   - Look for failed deliveries (red X)
   - Click on failed delivery to see error

3. **Reconnect Repository**:
   - Vercel Dashboard → Settings → Git
   - Click "Disconnect" then "Connect" again
   - This recreates the webhook

4. **Manual Trigger**:
   - Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment
   - Or click "Deploy" → "Deploy from GitHub" → Select `main` branch

5. **Check Branch Protection**:
   - GitHub repo → Settings → Branches
   - Ensure `main` branch doesn't have restrictions blocking webhooks

### If build fails:

1. **Check Build Logs**:
   - Go to **Deployments** → Click on failed deployment
   - Check the build logs for errors

2. **Common Issues**:
   - Missing environment variables → Add them in Settings → Environment Variables
   - Build timeout → Check `vercel.json` for function timeouts
   - Puppeteer/Chromium issues → Already configured in `package.json` postinstall script

3. **Verify Environment Variables**:
   - Make sure ALL required variables are set
   - Check for typos in variable names
   - Ensure values don't have extra spaces or quotes

---

## Current Setup Status

- ✅ Repository: `StepTen2024/bpoc-stepten`
- ✅ Production Branch: `main`
- ✅ Latest Commit: Check with `git log -1 --oneline`
- ✅ Webhook: Should be auto-created by Vercel

---

## Quick Test Command

```bash
# Create empty commit to trigger deployment
git commit --allow-empty -m "Test auto-deploy"
git push origin main
```

Then check Vercel dashboard - deployment should start automatically!

---

## 📋 Checklist

- [ ] Connected repository `StepTen2024/bpoc-stepten` to Vercel
- [ ] Set production branch to `main`
- [ ] Added all required environment variables
- [ ] Verified environment variables are set for Production, Preview, and Development
- [ ] First deployment completed successfully
- [ ] Verified GitHub webhook is active
- [ ] Tested auto-deployment with a push to `main`

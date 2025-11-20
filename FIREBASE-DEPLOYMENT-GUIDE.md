# Firebase Deployment Guide

## ✅ Configuration Status

Your Firebase deployment is configured correctly! Here's what's set up:

### Files in Place:
- ✅ `.github/workflows/deploy.yml` - GitHub Actions workflow
- ✅ `firebase.json` (root) - Main Firebase config
- ✅ `frontend/firebase.json` - Frontend-specific config
- ✅ `frontend/.firebaserc` - Firebase project reference
- ✅ `.firebaserc` (root) - Project configuration

### Current Setup:
- **Project ID**: kids-in-motion-website-b1c09
- **Hosting URL**: https://kidsinmotionpa.org
- **Backend API**: https://kidsinmotion-website-839796180413.us-east4.run.app/api

---

## 🔐 Step 1: Verify GitHub Secrets

The GitHub Action requires two secrets to be set up. Check if they exist:

### Go to GitHub Secrets:
```
https://github.com/dannygardner26/kidsinmotion-website/settings/secrets/actions
```

### Required Secrets:

#### 1. `FIREBASE_SERVICE_ACCOUNT_KIDS_IN_MOTION_WEBSITE_B1C09`
This is the Firebase service account key for deploying to Firebase Hosting.

**To create/update:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `kids-in-motion-website-b1c09`
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Copy the ENTIRE JSON content
7. Paste it as the secret value in GitHub

#### 2. `GCP_SA_KEY`
This is the Google Cloud service account key for Cloud Build (backend deployment).

**To create/update:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Find or create a service account with these roles:
   - Cloud Build Editor
   - Cloud Run Admin
   - Service Account User
4. Click on the service account
5. Go to **Keys** tab
6. Click **Add Key** → **Create New Key** → **JSON**
7. Download the JSON file
8. Copy the ENTIRE JSON content
9. Paste it as the secret value in GitHub

---

## 🧪 Step 2: Test the Deployment

### Option A: Manual Trigger (Recommended for Testing)

1. Go to: https://github.com/dannygardner26/kidsinmotion-website/actions
2. Click on **"Deploy to Firebase and Cloud Run"** workflow
3. Click **"Run workflow"** button
4. Select branch: `main`
5. Click **"Run workflow"**
6. Watch the deployment progress

### Option B: Push to Main Branch

The workflow automatically triggers when you push to `main`:

```bash
git checkout main
git pull origin main
git merge claude/user-list-table-format-01ErkKYBuQEYScsB3Te8HVw2
git push origin main
```

---

## 📊 Step 3: Monitor Deployment

### Check GitHub Actions:
```
https://github.com/dannygardner26/kidsinmotion-website/actions
```

### Check Firebase Hosting:
```bash
firebase hosting:channel:list
```

### View Deployed Site:
- Production: https://kidsinmotionpa.org
- Firebase default: https://kids-in-motion-website-b1c09.web.app

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Secret not found" error

**Solution:** Add the missing secret following Step 1 above.

### Issue 2: "Permission denied" error

**Solution:** Ensure the service account has correct permissions:
- Firebase: Service Account Token Creator, Firebase Admin
- GCP: Cloud Build Editor, Cloud Run Admin

### Issue 3: Build fails with "Module not found"

**Solution:** Check if all dependencies are in package.json:
```bash
cd frontend
npm install
npm run build  # Test locally
```

### Issue 4: Deployment succeeds but site shows old content

**Solution:** Clear Firebase hosting cache:
```bash
# Manual cache bust
firebase hosting:channel:deploy preview --expires 1h

# Or update cache headers in firebase.json
```

### Issue 5: Backend not updating

**Solution:** Check Cloud Build status:
```bash
gcloud builds list --limit=5 --project=kids-in-motion-website-b1c09
```

---

## 🚀 Manual Deployment (Alternative)

If GitHub Actions aren't working, you can deploy manually:

### Deploy Frontend:
```bash
cd frontend
npm install
npm run build
firebase deploy --only hosting
```

### Deploy Backend:
```bash
gcloud builds submit --config cloudbuild.yaml \
  --project kids-in-motion-website-b1c09 \
  --region us-east4
```

---

## 📝 Workflow Details

The GitHub Action does the following:

### Frontend Deployment:
1. Checkout code
2. Install Node.js 18
3. Install npm dependencies
4. Build React app with environment variables
5. Deploy to Firebase Hosting

### Backend Deployment:
1. Checkout code
2. Authenticate with Google Cloud
3. Trigger Cloud Build
4. Cloud Build builds Docker image
5. Deploy to Cloud Run

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] GitHub Action completed successfully (green checkmark)
- [ ] Frontend is accessible at https://kidsinmotionpa.org
- [ ] No console errors in browser (F12 → Console)
- [ ] Backend API is responding: https://kidsinmotion-website-839796180413.us-east4.run.app/api/health
- [ ] User authentication works (OAuth login)
- [ ] Admin panel shows updated changes
- [ ] Firebase shows new deployment timestamp

---

## 🔄 Rollback Instructions

If something goes wrong:

### Rollback Frontend:
```bash
# View recent deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

### Rollback Backend:
```bash
# List recent revisions
gcloud run revisions list --service=kidsinmotion-website --region=us-east4

# Route traffic to previous revision
gcloud run services update-traffic kidsinmotion-website \
  --to-revisions=REVISION_NAME=100 \
  --region=us-east4
```

---

## 📞 Support

If you continue to have issues:

1. Check workflow logs in GitHub Actions
2. Check Cloud Build logs: https://console.cloud.google.com/cloud-build/builds
3. Check Cloud Run logs: https://console.cloud.google.com/run
4. Review this guide: https://firebase.google.com/docs/hosting/github-integration

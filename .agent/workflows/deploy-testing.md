---
description: how to manage deployments for testing vs stable
---

# Deployment Workflow

Use this workflow to safely develop features in the `testing` branch before merging them into the stable `main` branch.

## 1. Feature Development (`testing`)
Always start your work on the `testing` branch.

```bash
# Switch to testing
git checkout testing

# [Make your changes]

# Push to see a Preview URL on Vercel
git add .
git commit -m "feat: [your description]"
git push origin testing
```

> [!TIP]
> After pushing to `testing`, check your **Vercel Dashboard** for the unique Preview URL. This allows you to test on your phone without affecting the live production site.

## 2. Pushing to Production (`main`)
Once you are happy with the features in `testing`, merge them into `main`.

```bash
# Switch to main
git checkout main

# Pull latest changes from testing
git merge testing

# Push to trigger production deployment
git push origin main

# Deploy to Firebase Hosting as well
npm run deploy
```

## 3. Syncing Mobile
After deploying the web app, always sync your Android project.

```bash
npx cap sync android
```

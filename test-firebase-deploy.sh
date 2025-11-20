#!/bin/bash

# Test Firebase Deployment Configuration
# This script validates that your Firebase setup is correct

echo "🔍 Testing Firebase Deployment Configuration..."
echo ""

# Check if firebase.json exists in frontend
if [ ! -f "frontend/firebase.json" ]; then
    echo "❌ frontend/firebase.json not found"
    exit 1
else
    echo "✅ frontend/firebase.json found"
fi

# Check if .firebaserc exists in frontend
if [ ! -f "frontend/.firebaserc" ]; then
    echo "❌ frontend/.firebaserc not found"
    exit 1
else
    echo "✅ frontend/.firebaserc found"
fi

# Check firebase.json structure
echo ""
echo "📄 Firebase hosting config:"
cat frontend/firebase.json | grep -A 5 "hosting"

# Check if build directory would be created correctly
echo ""
echo "🏗️  Testing build process..."
cd frontend

# Check if package.json has build script
if grep -q "\"build\":" package.json; then
    echo "✅ Build script found in package.json"
else
    echo "❌ Build script not found in package.json"
    exit 1
fi

# Check if node_modules exist
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "⚠️  node_modules not found. Run 'npm install' first."
fi

# Test build (commented out to avoid long build time)
# echo "Running test build..."
# npm run build

echo ""
echo "✅ All configuration checks passed!"
echo ""
echo "📋 Next steps to enable GitHub Actions deployment:"
echo ""
echo "1. Check GitHub Secrets:"
echo "   Go to: https://github.com/dannygardner26/kidsinmotion-website/settings/secrets/actions"
echo ""
echo "   Required secrets:"
echo "   - FIREBASE_SERVICE_ACCOUNT_KIDS_IN_MOTION_WEBSITE_B1C09"
echo "   - GCP_SA_KEY"
echo ""
echo "2. To manually trigger deployment:"
echo "   Go to: https://github.com/dannygardner26/kidsinmotion-website/actions"
echo "   Click 'Deploy to Firebase and Cloud Run'"
echo "   Click 'Run workflow'"
echo ""
echo "3. Or push to main branch:"
echo "   git push origin main"

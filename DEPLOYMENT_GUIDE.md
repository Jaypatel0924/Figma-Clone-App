# 🚀 Deployment Guide - Figma Clone App

## Quick Deployment to Vercel (Recommended)

### Step 1: Prepare Your Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### Step 2: Deploy on Vercel

#### Option A: Using Vercel CLI (Fastest)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project root
vercel
# Follow the prompts:
# - Select your GitHub organization
# - Confirm project name
# - Link to existing project (if redeploying)
# - Set environment variables
```

#### Option B: Using Vercel Dashboard (Easiest)
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import GitHub repository
4. Configure:
   - **Framework**: Other (Monorepo)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Root Directory**: ./

### Step 3: Set Environment Variables on Vercel

Go to **Settings → Environment Variables** and add:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://jayshubham2324:d9q92BFUNyMoU9yQ@cluster0.4ledzs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=JayPatel2324@
CLIENT_URL=https://your-vercel-url.vercel.app
PORT=3001
```

### Step 4: Deploy!
Your app will auto-deploy on every push to main branch.

---

## Alternative: Deploy Backend Separately

### Option 1: Railway (Recommended for Backend)

1. **Create Railway Account** at https://railway.app
2. **Connect GitHub**
3. **Create New Service** → Select your repository
4. **Configure**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Add Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-secret
   CLIENT_URL=your-vercel-frontend-url
   PORT=3001
   ```
6. **Deploy!** Railway gives you a URL

### Option 2: Render

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub
4. Configure:
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Add environment variables
6. Deploy!

---

## Project Structure for Deployment

```
Figma_App/
├── frontend/              # React + Vite app
│   ├── src/
│   ├── public/
│   ├── dist/             # Built files (generated)
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Express + MongoDB API
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── .env
├── api/                  # Vercel serverless functions
│   └── index.js
├── package.json          # Root monorepo config
├── vercel.json           # Vercel configuration
└── .env                  # Environment variables
```

---

## Deployment Checklist

### Frontend
- [ ] `npm run build` succeeds locally
- [ ] No TypeScript errors
- [ ] `frontend/dist/` folder created
- [ ] All assets optimized

### Backend
- [ ] All environment variables set
- [ ] MongoDB connection string verified
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] CORS origins configured
- [ ] Routes tested locally

### Vercel Settings
- [ ] Environment variables added
- [ ] Build command correct
- [ ] Output directory correct
- [ ] Auto-deploy enabled
- [ ] Domain configured (optional)

---

## Troubleshooting Deployment

### Error: "Build failed"
```
Solution: Check build logs in Vercel dashboard
- Click "Deployments" → latest → "View Build Logs"
- Look for TypeScript or npm errors
```

### Error: "Cannot find module"
```
Solution: Ensure dependencies are installed
- Run: npm install
- Check package.json has all dependencies
```

### Error: "MongoDB connection failed"
```
Solution: Verify connection string
1. Go to MongoDB Atlas dashboard
2. Check IP whitelist includes Vercel IPs
3. Verify connection string in .env
4. Test locally first
```

### Error: "CORS error"
```
Solution: Update CLIENT_URL in backend .env
- Should match your Vercel frontend URL
- Example: https://your-app.vercel.app
```

### Error: "Frontend not showing"
```
Solution: Check vercel.json configuration
- Ensure outputDirectory is correct: frontend/dist
- Verify rewrites are configured
- Check build command
```

---

## Verifying Deployment

### Test Your Deployment

1. **Visit Your URL**: https://your-app.vercel.app

2. **Test Features**:
   - [ ] Login/Signup works
   - [ ] Create canvas
   - [ ] Draw shapes
   - [ ] Save canvas
   - [ ] Share canvas

3. **Check Console**:
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API calls

4. **Test API**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```
   Should return: `{"status":"OK"}`

---

## Performance Optimization

### Frontend
- ✅ Code splitting enabled
- ✅ Minification active
- ✅ Gzip compression
- ✅ Image optimization

### Backend
- ✅ Database connection pooling
- ✅ Response compression
- ✅ Security headers (Helmet)
- ✅ Request logging

---

## Custom Domain Setup (Optional)

1. **Buy Domain**: Namecheap, Google Domains, etc.
2. **Add to Vercel**:
   - Go to **Settings → Domains**
   - Click "Add Domain"
   - Enter your domain
3. **Update DNS**: Follow Vercel's instructions
   - Add CNAME record to your domain registrar
4. **Wait 24-48 hours** for DNS to propagate

Example DNS settings:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## Monitoring & Debugging

### View Deployment Logs
```bash
vercel logs --prod
```

### Check Database
```bash
# MongoDB Atlas dashboard
1. Go to https://cloud.mongodb.com
2. Select your cluster
3. View collections and data
```

### Monitor Performance
- Vercel Analytics: https://vercel.com/analytics
- MongoDB Metrics: https://cloud.mongodb.com
- Check response times and errors

---

## CI/CD with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## Summary

Your Figma Clone App is now **production-ready** and can be deployed to:

| Platform | Cost | Ease | Time |
|----------|------|------|------|
| **Vercel** | Free | ⭐⭐⭐⭐⭐ | 5 min |
| **Railway** | $5-25/mo | ⭐⭐⭐⭐ | 10 min |
| **Render** | Free/paid | ⭐⭐⭐⭐ | 10 min |

**Recommended**: Deploy frontend to **Vercel** + backend to **Railway** or **Render**

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://railway.app/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Express.js: https://expressjs.com

**Your Figma app is ready to go live! 🎉**

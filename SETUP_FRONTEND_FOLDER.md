# 🚀 Deployment Guide - New Frontend/Backend Structure

## ✅ Project Structure After Reorganization

```
Figma_App/
├── frontend/                  ← All frontend code
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env                   ← Frontend env
│   └── dist/                  ← Built files (after npm run build)
│
├── backend/                   ← All backend code
│   ├── server.js              ← Serves both API and frontend
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── package.json
│   ├── .env                   ← Backend env
│   └── node_modules/
│
├── package.json               ← Root scripts
├── Dockerfile                 ← Docker setup
├── docker-compose.yml         ← Docker Compose
└── nginx.conf                 ← Nginx config (optional)
```

## 🎯 Step-by-Step Setup

### 1. Reorganize Project Structure

**On Windows (PowerShell):**
```powershell
# Navigate to project root
cd "C:\Users\jaypa\OneDrive\Documents\Jay College Practicle Data\Figma_App"

# Run the reorganization script
.\reorganize-frontend.ps1
```

**On Mac/Linux:**
```bash
cd ~/path/to/Figma_App
bash reorganize-frontend.sh
```

### 2. Install All Dependencies

```bash
npm run install:all
```

This runs:
```bash
npm install                    # Root dependencies
npm install --prefix frontend # Frontend dependencies
npm install --prefix backend  # Backend dependencies
```

### 3. Configure Environment Variables

**Frontend (.env):**
```bash
cd frontend
# Edit .env
VITE_API_URL=http://localhost:3001/api
```

**Backend (.env):**
```bash
cd ../backend
# Edit .env with your MongoDB URI and secrets
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/figma-app
JWT_SECRET=your-strong-secret-here
CLIENT_URL=http://localhost:5173
```

### 4. Development Mode

Run frontend and backend concurrently:
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Frontend
npm run frontend    # Runs on http://localhost:5173

# Terminal 2 - Backend  
npm run backend     # Runs on http://localhost:3001
```

### 5. Production Build

Build both frontend and backend:
```bash
npm run build
```

This will:
- Build frontend to `frontend/dist/`
- Ready backend for production

### 6. Start Production Server

```bash
npm start
```

Backend will serve:
- API endpoints: `http://localhost:3001/api/*`
- Frontend: `http://localhost:3001/*`

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t figma-app:latest .
```

### Run with Docker
```bash
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb+srv://... \
  -e JWT_SECRET=your-secret \
  figma-app:latest
```

### Run with Docker Compose
```bash
docker-compose up -d
```

---

## 🚀 Deploy to Production

### Option 1: Vercel + Backend Deployment

**Frontend to Vercel:**
```bash
# In frontend/ folder
npm install -g vercel
vercel
```

Update backend `CLIENT_URL`:
```bash
CLIENT_URL=https://your-vercel-domain.vercel.app
```

**Backend to Railway/Render:**
- Push to GitHub
- Connect Railway/Render
- Set environment variables
- Deploy!

### Option 2: Heroku (Single Dyno)

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create figma-app

# Add MongoDB add-on
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

### Option 3: DigitalOcean Droplet

```bash
# SSH into droplet
ssh root@your_ip

# Clone repo
git clone https://github.com/Jaypatel0924/Figma-Clone-App.git
cd Figma-Clone-App

# Install dependencies
npm run install:all

# Build
npm run build

# Install PM2
npm install -g pm2

# Start backend
pm2 start backend/server.js --name "figma"
pm2 startup
pm2 save

# Setup nginx (optional)
# Copy nginx.conf to /etc/nginx/sites-available/figma
sudo systemctl restart nginx
```

### Option 4: AWS (EC2 + CodeDeploy)

1. Create EC2 instance
2. Install Node.js and MongoDB
3. Clone repository
4. Setup PM2
5. Configure security groups
6. Use CodePipeline for CI/CD

---

## ✅ Testing Checklist

- [ ] Frontend builds without errors: `npm run build --prefix frontend`
- [ ] Backend starts: `npm run backend`
- [ ] API endpoints work: `curl http://localhost:3001/api/health`
- [ ] Frontend loads: `http://localhost:5173`
- [ ] Share feature works
- [ ] Canvas operations work
- [ ] Authentication works
- [ ] Database connection works

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

### CORS Error
```bash
# Update backend/.env
CLIENT_URL=http://your-frontend-url
```

### Build Fails
```bash
# Clear and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules package-lock.json
npm run install:all
npm run build
```

### MongoDB Connection Failed
```bash
# Check MONGODB_URI in backend/.env
# Verify IP whitelist in MongoDB Atlas
# Test connection locally first
```

---

## 📊 File Structure After Reorganization

```
frontend/
├── dist/                     (Created after build)
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env

backend/
├── server.js                 (Now serves frontend too!)
├── routes/
│   ├── auth.js
│   └── canvas.js
├── models/
├── middleware/
├── package.json
└── .env
```

---

## 🎯 Deployment Summary

| Deployment | Frontend | Backend | Database | Cost |
|-----------|----------|---------|----------|------|
| **Local Dev** | npm run dev | npm run dev | Local | $0 |
| **Vercel + Railway** | Vercel | Railway | MongoDB Atlas | Free-$5 |
| **Docker** | In backend | Node + Docker | Any | Free |
| **Heroku** | Built-in | Heroku Dyno | Add-on | $7+ |
| **DigitalOcean** | Nginx | Node/PM2 | Managed | $5-6 |

---

**Your app is now production-ready with a clean folder structure! 🎉**

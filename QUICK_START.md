# ⚡ Quick Reference - Frontend Folder Setup

## 🚀 Quick Start (After Reorganization)

```bash
# 1. Run reorganization script (Windows)
.\reorganize-frontend.ps1

# Or on Mac/Linux
bash reorganize-frontend.sh

# 2. Install all dependencies
npm run install:all

# 3. Development
npm run dev

# 4. Production build
npm run build

# 5. Start production
npm start
```

---

## 📁 What Gets Created

```
frontend/                    ← New folder with ALL frontend code
├── src/                     ← React components, pages
├── public/                  ← Static assets
├── package.json             ← Frontend dependencies
├── vite.config.ts           ← Build config
├── tsconfig.json            ← TypeScript config
├── .env                     ← Frontend environment (VITE_API_URL)
└── dist/                    ← Built output (after npm run build)
```

---

## 🔧 Configuration Files

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

### Backend (.env - Already configured)
```
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=JayPatel2324@
CLIENT_URL=http://localhost:5173
```

---

## 📋 NPM Commands

```bash
npm run dev             # Run dev (frontend + backend)
npm run frontend        # Frontend only
npm run backend         # Backend only
npm run build           # Build frontend
npm start               # Start production server
npm run install:all     # Install all dependencies
```

---

## ✅ Verification Checklist

After running the script:

- [ ] `frontend/` folder exists with all files
- [ ] `frontend/src/` contains React code
- [ ] `frontend/package.json` exists
- [ ] `backend/` folder still exists
- [ ] Root `package.json` created

Run these commands to test:

```bash
# Test build
npm run build

# Test it starts
npm run backend
# Visit: http://localhost:3001/health
```

---

## 🐛 If Something Goes Wrong

### "frontend folder not found"
→ Make sure you're in the root directory: `cd Figma_App`

### "PORT already in use"
→ Change PORT in `backend/.env` or kill process on 3001

### "npm: command not found"
→ Install Node.js from nodejs.org

### "VITE_API_URL error"
→ Create `frontend/.env` with: `VITE_API_URL=http://localhost:3001/api`

---

## 🎯 Next Steps After Setup

1. ✅ Run reorganization script
2. ✅ Install dependencies: `npm run install:all`
3. ✅ Test dev mode: `npm run dev`
4. ✅ Build for production: `npm run build`
5. ✅ Deploy to your platform (Vercel, Railway, etc.)

---

## 📱 Deployment Paths

**Vercel (Frontend only):**
```bash
cd frontend
vercel
```

**Railway (Backend):**
- Push to GitHub
- Connect Railway
- Select backend folder
- Deploy!

**Docker (Both):**
```bash
docker build -t figma-app .
docker-compose up -d
```

---

**That's it! Your project is now properly organized for production deployment! 🎉**

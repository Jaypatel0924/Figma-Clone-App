# 🎯 COMPLETE SETUP CHECKLIST

## ✅ PHASE 1: REORGANIZATION

- [ ] **Read QUICK_START.md** - Quick overview of what to do
- [ ] **Navigate to project root**
  ```bash
  cd "C:\Users\jaypa\OneDrive\Documents\Jay College Practicle Data\Figma_App"
  ```

- [ ] **Run reorganization script**
  - **Windows:** `.\reorganize-frontend.ps1`
  - **Mac/Linux:** `bash reorganize-frontend.sh`

- [ ] **Verify folders created**
  ```bash
  ls frontend/              # Should exist
  ls backend/              # Should exist
  cat package.json         # Should exist at root
  ```

---

## ✅ PHASE 2: DEPENDENCIES

- [ ] **Install all dependencies**
  ```bash
  npm run install:all
  ```

- [ ] **Verify installations**
  ```bash
  npm --version            # Should be 9+
  node --version           # Should be 18+
  npm list --depth=0       # Check root packages
  npm list --depth=0 --prefix frontend
  npm list --depth=0 --prefix backend
  ```

---

## ✅ PHASE 3: ENVIRONMENT SETUP

- [ ] **Frontend .env** (`frontend/.env`)
  ```bash
  cat frontend/.env
  # Should contain:
  # VITE_API_URL=http://localhost:3001/api
  ```

- [ ] **Backend .env** (`backend/.env`)
  ```bash
  cat backend/.env
  # Should contain:
  # NODE_ENV=development
  # PORT=3001
  # MONGODB_URI=...
  # JWT_SECRET=...
  # CLIENT_URL=http://localhost:5173
  ```

---

## ✅ PHASE 4: DEVELOPMENT TEST

- [ ] **Start development mode**
  ```bash
  npm run dev
  ```

- [ ] **Wait for servers to start**
  - Frontend: Vite starting...
  - Backend: Server running on port 3001...

- [ ] **Test Frontend** (in browser)
  ```
  http://localhost:5173
  ```
  - [ ] App loads
  - [ ] No console errors
  - [ ] Can login/signup

- [ ] **Test Backend API** (in another terminal)
  ```bash
  curl http://localhost:3001/health
  # Should return: {"status":"OK"}
  ```

- [ ] **Test Canvas Feature**
  - [ ] Create new canvas
  - [ ] Draw shapes
  - [ ] Save canvas
  - [ ] Share with another user email

---

## ✅ PHASE 5: PRODUCTION BUILD

- [ ] **Stop development servers** (Ctrl+C)

- [ ] **Build frontend**
  ```bash
  npm run build
  ```
  - [ ] No errors
  - [ ] `frontend/dist/` created
  - [ ] `frontend/dist/index.html` exists

- [ ] **Verify build output**
  ```bash
  ls -la frontend/dist/
  # Should see: index.html, assets/
  ```

---

## ✅ PHASE 6: PRODUCTION START

- [ ] **Set production mode**
  ```bash
  # Edit backend/.env
  NODE_ENV=production
  ```

- [ ] **Start production server**
  ```bash
  npm start
  ```
  - [ ] No errors
  - [ ] "🚀 Server running on port 3001"

- [ ] **Test production frontend**
  ```
  http://localhost:3001
  ```
  - [ ] App loads from backend
  - [ ] All features work
  - [ ] No 404 errors

- [ ] **Test production API**
  ```bash
  curl http://localhost:3001/api/health
  # Should work
  curl http://localhost:3001/health
  # Should work
  ```

---

## ✅ PHASE 7: CLEANUP (Optional - After All Tests Pass)

- [ ] **Delete original root-level frontend files** (NOT frontend/ folder!)
  ```bash
  rm -rf src public index.html
  ```

- [ ] **Delete duplicate config files from root**
  ```bash
  rm -f vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json eslint.config.js
  ```

- [ ] **Delete duplicate package files from root** (keep ROOT_PACKAGE.json as package.json)
  ```bash
  rm -f package-lock.json  # Will regenerate
  ```

- [ ] **Verify only these exist at root**
  ```bash
  ls -la
  # Should see:
  # frontend/
  # backend/
  # package.json
  # Dockerfile
  # docker-compose.yml
  # nginx.conf
  # .gitignore
  # README.md
  # And doc files
  ```

---

## ✅ PHASE 8: DOCKER VERIFICATION (Optional)

- [ ] **Build Docker image**
  ```bash
  docker build -t figma-app:latest .
  ```
  - [ ] Build succeeds
  - [ ] No errors

- [ ] **Run Docker container**
  ```bash
  docker run -p 3001:3001 \
    -e NODE_ENV=production \
    -e MONGODB_URI=your-mongodb-uri \
    -e JWT_SECRET=your-secret \
    figma-app:latest
  ```

- [ ] **Test Docker container**
  ```
  http://localhost:3001
  ```
  - [ ] Frontend loads
  - [ ] API works

---

## ✅ PHASE 9: GIT COMMIT

- [ ] **Check git status**
  ```bash
  git status
  ```

- [ ] **Add all changes**
  ```bash
  git add .
  ```

- [ ] **Commit changes**
  ```bash
  git commit -m "Reorganize: Move frontend to separate folder for production"
  ```

- [ ] **Push to GitHub**
  ```bash
  git push origin main
  ```

---

## ✅ PHASE 10: DEPLOYMENT PREP

### For Vercel + Railway

- [ ] **Frontend ready for Vercel**
  - [ ] `frontend/` folder exists with src/
  - [ ] `frontend/package.json` has build script
  - [ ] `frontend/.env` has VITE_API_URL

- [ ] **Backend ready for Railway**
  - [ ] `backend/` folder exists
  - [ ] `backend/package.json` has start script
  - [ ] `backend/.env` configured
  - [ ] MongoDB URI set

### For Docker

- [ ] **Docker ready**
  - [ ] Dockerfile updated for new structure
  - [ ] docker-compose.yml configured
  - [ ] docker-compose.yml can start with: `docker-compose up -d`

### For Single VPS

- [ ] **All-in-one ready**
  - [ ] Can run: `npm run build`
  - [ ] Can run: `npm start`
  - [ ] Works on: http://yourserver:3001

---

## 🎯 COMMAND REFERENCE

```bash
# Development
npm run dev                 # Frontend + Backend together
npm run frontend           # Frontend only
npm run backend            # Backend only

# Production
npm run build              # Build frontend
npm start                  # Start production server

# Utilities
npm run install:all        # Install all dependencies
npm run build --prefix frontend

# Docker
docker build -t figma-app .
docker-compose up -d
```

---

## 📋 FILE STRUCTURE VERIFICATION

```
✅ Should exist:
  frontend/src/
  frontend/package.json
  frontend/.env
  backend/server.js
  backend/package.json
  backend/.env
  package.json (root)
  Dockerfile
  docker-compose.yml

❌ Should NOT exist at root:
  src/           (moved to frontend/)
  public/        (moved to frontend/)
  vite.config.ts (moved to frontend/)
  index.html     (moved to frontend/)
```

---

## ✅ TESTING CHECKLIST

```
Development Mode:
  ☑ npm run dev starts both
  ☑ Frontend loads on :5173
  ☑ Backend runs on :3001
  ☑ Can create canvas
  ☑ Can share canvas
  ☑ Can login/signup
  ☑ API endpoints work

Production Mode:
  ☑ npm start runs backend
  ☑ Frontend accessible on :3001
  ☑ All features work
  ☑ No console errors
  ☑ Share feature works
  ☑ API health check works

Docker:
  ☑ Image builds
  ☑ Container runs
  ☑ Port 3001 works
  ☑ Frontend loads
  ☑ API works
```

---

## 🚀 NEXT STEPS AFTER ALL CHECKS PASS

1. **Deploy Frontend** (if using separate service)
   ```bash
   cd frontend && vercel
   ```

2. **Deploy Backend** (if using separate service)
   - Push to GitHub
   - Connect to Railway/Render
   - Deploy!

3. **Or Deploy as Single Docker**
   ```bash
   docker-compose up -d
   ```

4. **Update DNS**
   - Point domain to your server

5. **Monitor**
   - Check backend logs
   - Monitor database

---

## 🆘 TROUBLESHOOTING DURING SETUP

### "reorganize-frontend.ps1 not found"
- Make sure you're in root directory
- File should be at: `C:\....\Figma_App\reorganize-frontend.ps1`

### "npm: command not found"
- Install Node.js from nodejs.org
- Restart terminal

### "PORT 3001 in use"
- Kill process: `netstat -ano | findstr :3001`
- Or change PORT in `backend/.env`

### "Cannot find frontend folder"
- Run the reorganization script
- Script creates the folder

### Build fails
- Delete node_modules: `rm -rf node_modules frontend/node_modules backend/node_modules`
- Reinstall: `npm run install:all`
- Rebuild: `npm run build`

### Database connection fails
- Check MONGODB_URI in backend/.env
- Verify MongoDB is running locally OR MongoDB Atlas is accessible
- Check IP whitelist in MongoDB Atlas

---

## ✨ YOU'RE ALL SET!

Once all checkboxes are ✅, your project is:
- ✅ Properly organized
- ✅ Development ready
- ✅ Production ready
- ✅ Docker ready
- ✅ Deployment ready

**Congratulations! 🎉**

---

**Need help?** Check these files:
- QUICK_START.md
- SETUP_FRONTEND_FOLDER.md
- PROJECT_STRUCTURE_VISUALIZATION.md
- FRONTEND_FOLDER_SETUP_COMPLETE.md

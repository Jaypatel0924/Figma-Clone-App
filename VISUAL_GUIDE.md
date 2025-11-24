# 🎯 VISUAL STEP-BY-STEP FIX

## What's Wrong
❌ Backend not running  
❌ "Error fetching canvases" showing on dashboard  
❌ Looks like Tailwind CSS is broken (it's not!)

## What's Actually Happening
```
Browser (http://localhost:5173)
    ↓ tries to fetch from
Backend (http://localhost:3001)
    ↗ DOESN'T EXIST (not running)
    └→ Error: Connection refused
       Displays: "Error fetching canvases" 🔴
```

## The Fix

### STEP 1: Open PowerShell
```
Windows Key → type "powershell" → Open
```

### STEP 2: Navigate to Project
```powershell
cd "C:\Users\jaypa\OneDrive\Documents\Jay College Practicle Data\Figma_App"
```

### STEP 3: Start MongoDB (PowerShell Terminal #1)
```powershell
mongod
```

**Expected Output:**
```
[initandlisten] waiting for connections on port 27017
```

✅ Keep this running! Don't close it!

---

### STEP 4: Start Backend (PowerShell Terminal #2)
```powershell
# Open NEW PowerShell window

cd "C:\Users\jaypa\OneDrive\Documents\Jay College Practicle Data\Figma_App"
cd backend
npm install   # if you haven't done this yet
npm start
```

**Expected Output:**
```
✅ MongoDB Connected
🚀 Server running on port 3001
```

✅ Keep this running! Don't close it!

---

### STEP 5: Start Frontend (PowerShell Terminal #3)
```powershell
# Open NEW PowerShell window

cd "C:\Users\jaypa\OneDrive\Documents\Jay College Practicle Data\Figma_App"
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in 234 ms

➜  Local:   http://localhost:5173/
```

✅ Keep this running! Don't close it!

---

### STEP 6: Open Browser
```
Go to: http://localhost:5173
```

### STEP 7: Click "Continue as Guest"

### STEP 8: Enjoy! 🎉

---

## How It Should Look

### Terminal 1 (MongoDB)
```
$ mongod
[initandlisten] waiting for connections on port 27017
(runs in background, stays here)
```

### Terminal 2 (Backend)
```
$ npm start
✅ MongoDB Connected
🚀 Server running on port 3001
(runs in background, stays here)
```

### Terminal 3 (Frontend)
```
$ npm run dev

VITE v5.0.0  ready in 345 ms

➜  Local:   http://localhost:5173/
(runs in background, stays here)
```

### Browser
```
Dashboard showing:
- "Welcome, Guest!"
- "0 canvases" (empty state)
- "New Canvas" button
- Dark beautiful UI ✨
NO RED ERROR! ✅
```

---

## Testing the Fix

### Test 1: Backend Health Check
Open NEW PowerShell and run:
```powershell
curl http://localhost:3001/health
```

Should show:
```json
{"status":"OK","message":"Server is running"}
```

### Test 2: Frontend Working
1. Go to http://localhost:5173
2. Should show dashboard (no error)
3. Click "New Canvas"
4. Should open editor with all tools

### Test 3: Create & Save
1. Draw some shapes
2. Right-click → Save
3. Go back to dashboard
4. Canvas should appear in list
5. Refresh page
6. Canvas should still be there!

---

## If Something Goes Wrong

### Problem: "Cannot find module"
```powershell
# Run in project folder:
npm install

# Run in backend folder:
cd backend
npm install
cd ..
```

### Problem: "Port already in use"
```powershell
# Kill port 3001:
Stop-Process -Force -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess

# Kill port 27017:
Stop-Process -Force -Id (Get-NetTCPConnection -LocalPort 27017).OwningProcess

# Try again
```

### Problem: "Cannot connect to MongoDB"
**Solution 1:** Make sure `mongod` is running in Terminal 1

**Solution 2:** Use MongoDB Atlas (cloud)
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Update `backend/.env.local`:
   ```env
   MONGODB_URI=<your atlas connection string>
   ```

### Problem: Still seeing error in browser
1. Hard refresh: `Ctrl+Shift+R`
2. Clear cache: F12 → Application → Clear Storage
3. Close all browser tabs with localhost:5173
4. Open fresh: http://localhost:5173

---

## Success Checklist

After following all steps:

- [ ] 3 PowerShell terminals open with running processes
- [ ] Terminal 1 shows: "waiting for connections on port 27017"
- [ ] Terminal 2 shows: "Server running on port 3001"
- [ ] Terminal 3 shows: "Local: http://localhost:5173/"
- [ ] Browser shows dashboard (no red error)
- [ ] Can see "Welcome, Guest!"
- [ ] Can click "New Canvas"
- [ ] Editor opens with toolbar
- [ ] Can draw shapes
- [ ] Dark theme visible (beautiful Tailwind UI!)

---

## That's It!

You now have:
- ✅ Frontend running
- ✅ Backend running  
- ✅ Database connected
- ✅ All styling working
- ✅ Full Figma editor functional

Go create something amazing! 🚀

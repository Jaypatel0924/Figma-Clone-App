# ⚡ BACKEND NOT RUNNING - FIX NOW

## The Issue (Copy-Pasted from Error)

```
Error fetching canvases
```

**What this means:** Backend server on port 3001 is not responding.

---

## 60-Second Fix

### Step 1: Terminal 1 - Start MongoDB
```powershell
mongod
```
Should show: `waiting for connections on port 27017`

### Step 2: Terminal 2 - Start Backend
```powershell
cd backend
npm start
```
Should show:
```
✅ MongoDB Connected
🚀 Server running on port 3001
```

### Step 3: Browser - Refresh
- Go to http://localhost:5173
- Hard refresh: `Ctrl+Shift+R`
- Error should be GONE ✅

Done!

---

## Stuck? Check This

### Backend Not Starting?

**Error: Cannot connect to MongoDB**
- Make sure `mongod` is running in Terminal 1
- OR use MongoDB Atlas (cloud) - see below

**Error: Port 3001 already in use**
```powershell
# Kill it:
Stop-Process -Force -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess

# Then try npm start again
```

**Error: Module not found**
```powershell
cd backend
npm install
npm start
```

### Still Getting Error in Browser?

1. **Is backend running?**
   ```powershell
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"OK"}`

2. **Hard refresh browser:**
   - `Ctrl+Shift+R`
   
3. **Clear cache:**
   - Press F12
   - Right-click reload button
   - Click "Empty cache and hard refresh"

---

## Don't Have MongoDB?

### Use MongoDB Atlas (Cloud)

1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (takes 2-3 minutes)
4. Get connection string
5. Update `backend/.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/canvas-editor
   ```
6. Run `npm start` - done!

No `mongod` needed!

---

## Verify It's Fixed

✅ Backend terminal shows `🚀 Server running on port 3001`
✅ Browser at http://localhost:5173 shows NO red error
✅ Dashboard shows "0 canvases" (working!)
✅ Can click "New Canvas" button
✅ Tailwind CSS styling is visible (dark theme)

---

That's it! 🎉

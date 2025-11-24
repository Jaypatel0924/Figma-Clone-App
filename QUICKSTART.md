# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Guest Mode (No Setup Required)

```bash
# Frontend only
npm run dev
# Visit http://localhost:5173
# Click "Continue as Guest"
```

### Option 2: Full Setup with Database

#### Step 1: Start MongoDB
```bash
mongod
```

#### Step 2: Start Backend
```bash
cd backend
npm install
cp .env.example .env.local
npm start
# Backend running on http://localhost:3001
```

#### Step 3: Start Frontend
```bash
npm install
npm run dev
# Frontend running on http://localhost:5173
```

#### Step 4: Access the App
- Open http://localhost:5173
- Sign up or login
- Create and edit designs!

## 📋 First Canvas

1. **Create Account** or use Guest Mode
2. **Click "New Canvas"**
3. **Enter a name** (e.g., "My First Design")
4. **Select tools** from the left sidebar
5. **Draw shapes** by clicking and dragging
6. **Edit properties** on the right panel
7. **Save automatically** or Ctrl+S

## 🎮 Interactive Demo

### Shapes
- **Rectangle**: Select tool → drag on canvas
- **Circle**: Select circle tool → drag on canvas
- **Text**: Select text tool → drag on canvas
- **Arrow/Line**: Select arrow tool → drag on canvas

### Editing
- **Move**: Select → click and drag shape
- **Resize**: Drag shape edges
- **Color**: Select shape → change fill/stroke colors
- **Rotate**: Change rotation value in properties

### Canvas Controls
- **Zoom**: + / - buttons or scroll
- **Pan**: Alt + click and drag
- **Undo**: Ctrl+Z
- **Redo**: Ctrl+Y
- **Save**: Ctrl+S

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| API not responding | Check backend is running on port 3001 |
| Designs not saving | Verify you're logged in, check network tab |
| Shapes not appearing | Ensure tool is selected before drawing |
| Can't zoom/pan | Use Ctrl+ mouse wheel or Alt+click drag |

## 📚 Full Documentation

See `SETUP.md` for complete setup instructions and all features!

## 💡 Pro Tips

- **Snap to Grid**: Enable for precise designs
- **Copy & Paste**: Ctrl+C / Ctrl+V to duplicate shapes
- **Multiple Selection**: Shift+click to select multiple shapes
- **Lock Shapes**: Lock important shapes to prevent accidents
- **Export**: Save your design as JSON for backup
- **Keyboard Shortcuts**: All listed in SETUP.md

---

**You're all set! Start creating amazing designs!** 🎨✨

# 🚀 Complete Setup Guide - Canvas Design Editor

A full-featured Figma-like design editor with user authentication and cloud storage. Create, edit, and manage your designs easily!

## ⚡ QUICK START (Choose One)

### Option 1: MongoDB Atlas Cloud (EASIEST - NO LOCAL SETUP!)
```powershell
# 1. Get free cluster from: https://www.mongodb.com/cloud/atlas
# 2. Copy connection string from Atlas
# 3. Update backend/.env.local with your connection string
# 4. Run in Terminal 1:
cd backend
npm install
npm start

# 5. Run in Terminal 2:
npm run dev

# 6. Visit: http://localhost:5173
```

### Option 2: Local MongoDB
```powershell
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
npm install
npm start

# Terminal 3: Start Frontend
npm run dev

# Visit: http://localhost:5173
```

### Option 3: Guest Mode Only
```powershell
# Just run frontend (no backend needed):
npm run dev

# Visit: http://localhost:5173 and click "Continue as Guest"
```

## Features

✨ **Design Tools**
- Draw rectangles, circles, lines, and arrows
- Add text to designs
- Pan and zoom with smooth interaction
- Grid and snap-to-grid functionality
- Color customization (fill, stroke)
- Shape rotation and opacity control
- Layer management (bring forward, send backward)
- Shape alignment tools

🔐 **Authentication**
- User registration and login
- JWT-based authentication
- Guest mode for quick testing
- Session persistence

💾 **Canvas Management**
- Create, read, update, delete canvases
- Auto-save designs
- Undo/Redo (50 actions deep)
- Export/Import designs as JSON
- Canvas version tracking

📱 **User Experience**
- Responsive dashboard
- Search canvases
- Duplicate canvases
- Beautiful dark theme UI

## Project Structure

```
├── frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx      # Authentication UI
│   │   │   ├── Dashboard.tsx      # Canvas management
│   │   │   └── CanvasPage.tsx     # Canvas editor wrapper
│   │   ├── components/
│   │   │   └── CanvasEditor.tsx   # Main editor component
│   │   ├── App.tsx                # Router setup
│   │   └── main.tsx               # Entry point
│   └── package.json
│
└── backend (Express + MongoDB)
    ├── routes/
    │   ├── auth.js                # Authentication endpoints
    │   └── canvas.js              # Canvas CRUD endpoints
    ├── models/
    │   ├── User.js                # User schema
    │   └── Canvas.js              # Canvas schema
    ├── middleware/
    │   └── auth.js                # JWT verification
    ├── server.js                  # Express server
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/canvas-editor
PORT=3001
JWT_SECRET=your-super-secret-key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

4. **Start MongoDB** (if running locally)
```bash
mongod
```

5. **Start the backend server**
```bash
npm start
```

Server will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory** (from root)
```bash
cd ../
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_URL=http://localhost:3001/api
```

4. **Start development server**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

### First Time Setup

1. **Create an account**
   - Click "Sign Up" on the login page
   - Enter username, email, and password (min 6 characters)
   - Click "Create Account"

2. **Or use Guest Mode**
   - Click "Continue as Guest" for immediate access
   - Guest data is stored locally (no backend persistence)

### Creating a Canvas

1. **Navigate to Dashboard** (after login)
2. **Click "New Canvas"** button
3. **Enter canvas name** and create
4. You'll be redirected to the canvas editor

### Drawing Shapes

1. **Select a tool** from the left sidebar:
   - Select (pointer icon)
   - Rectangle (square icon)
   - Circle (circle icon)
   - Arrow/Line (arrow icon)
   - Text (T icon)

2. **Click and drag** on the canvas to create shapes

3. **Click on a shape** to select it and see properties

### Editing Properties

**When a shape is selected:**
- **Position** (X, Y coordinates)
- **Size** (Width, Height)
- **Rotation** (0-360 degrees)
- **Colors** (Fill & Stroke)
- **Stroke Width** (Border thickness)
- **Opacity** (0-100%)
- **Lock/Unlock** (prevent accidental edits)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+D | Duplicate |
| Ctrl+A | Select All |
| Ctrl+S | Save Canvas |
| Delete | Delete Selected |
| Alt+Middle-Click | Pan Canvas |

### Canvas Tools

- **Zoom**: Use +/- buttons or scroll wheel
- **Pan**: Alt+Click and drag, or middle-click drag
- **Grid Toggle**: Click grid icon to show/hide
- **Snap to Grid**: Enable for precise alignment
- **Alignment**: Align left, center, right, top, middle, bottom

### Import/Export

**Export Design**
- Click download icon to save as JSON
- Use this to backup or share designs

**Import Design**
- Click upload icon to load a JSON design file

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update` - Update profile
- `DELETE /api/auth/delete` - Delete account

### Canvas
- `POST /api/canvas` - Create canvas
- `GET /api/canvas` - Get all canvases for user
- `GET /api/canvas/:id` - Get single canvas
- `PUT /api/canvas/:id` - Update canvas
- `DELETE /api/canvas/:id` - Delete canvas
- `POST /api/canvas/:id/duplicate` - Duplicate canvas
- `POST /api/canvas/:id/share` - Share canvas (future)
- `GET /api/canvas/public/list` - Get public canvases

## Technologies Used

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **BCryptjs** - Password hashing
- **CORS** - Cross-origin support

## Production Deployment

### Environment Changes

**Frontend (.env.production)**
```env
VITE_API_URL=https://your-api-domain.com/api
```

**Backend (.env)**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/canvas-editor
PORT=3001
JWT_SECRET=your-production-secret-key
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Deployment Services
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, Render
- **Database**: MongoDB Atlas

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`

### "Frontend can't reach API"
- Verify backend is running on port 3001
- Check VITE_API_URL in `.env.local`
- Ensure CORS is enabled in backend

### "Guest mode not working"
- Guest token is hardcoded as `guest123`
- Ensure backend middleware allows it

### "Designs not saving"
- Check browser console for errors
- Verify user is authenticated
- Check network tab for API responses

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Canvas sharing & permissions
- [ ] Image upload & insertion
- [ ] Custom brushes
- [ ] Design templates
- [ ] Export to PNG/SVG
- [ ] Comments & annotations
- [ ] Version history
- [ ] Team workspaces
- [ ] Advanced shapes library

## License

MIT License - feel free to use for personal and commercial projects!

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check backend logs
4. Create an issue with details

---

**Happy Designing!** 🎨

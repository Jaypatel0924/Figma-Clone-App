FROM node:18-alpine

WORKDIR /app

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy frontend source
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Copy and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy backend source
COPY backend/ ./backend/

EXPOSE 3001

ENV NODE_ENV=production

# Start backend (it serves both backend API and frontend)
CMD ["node", "backend/server.js"]

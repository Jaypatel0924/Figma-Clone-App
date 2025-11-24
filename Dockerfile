FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd backend && npm install

# Copy application files
COPY . .

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 3001 5173

# Set environment
ENV NODE_ENV=production

# Start backend (it will also serve frontend)
CMD ["npm", "--prefix", "backend", "run", "prod"]

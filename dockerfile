# Use Debian-based Node image (Prisma-compatible)
FROM node:22

# Set working directory
WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

# Disable postinstall during install
RUN npm install --ignore-scripts --include=dev

# Copy rest of the project (including prisma folder)
COPY . .

# Manually generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Expose backend port
EXPOSE 6000

# Start the app
CMD ["node", "dist/index.js"]

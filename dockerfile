# Use Debian-based Node image for better Prisma compatibility
FROM node:22

# Set working directory
WORKDIR /app

# Copy package.json and install all dependencies
COPY package*.json ./
RUN npm install --include=dev

# Copy project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "dist/index.js"]

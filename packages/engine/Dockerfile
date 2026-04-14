FROM node:20-alpine

WORKDIR /app

# Install dependencies for better-sqlite3 native build
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Run migrations and build
RUN npx prisma migrate deploy --schema=prisma/schema.prisma || true
RUN npm run build

EXPOSE 7842

CMD ["node", "dist/main.js"]

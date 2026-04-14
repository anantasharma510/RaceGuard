FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build Next.js for production
RUN npm run build

EXPOSE 3004

ENV PORT=3004

CMD ["npm", "start", "--", "-p", "3004"]

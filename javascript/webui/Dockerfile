FROM node:latest
WORKDIR /app/webui
COPY package*.json ./
RUN npm install
RUN npm run build
COPY . .

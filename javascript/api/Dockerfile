FROM node:latest
WORKDIR /app
RUN apt update && apt install ffmpeg -y
COPY package*.json ./
RUN npm install
COPY . .

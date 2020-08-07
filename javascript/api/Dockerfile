FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apt update && apt install ffmpeg -y

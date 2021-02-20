FROM node:latest
RUN apt-get update && apt-get install streamlink -y
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

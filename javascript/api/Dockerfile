FROM debian:sid
RUN apt-get update && apt-get install streamlink nodejs npm -y
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

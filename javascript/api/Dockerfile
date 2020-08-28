FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN apt update && apt install wget -y
RUN wget https://dl.google.com/go/go1.13.4.linux-amd64.tar.gz && tar -C /usr/local -xzf go1.13.4.linux-amd64.tar.gz
RUN npm install
COPY . .

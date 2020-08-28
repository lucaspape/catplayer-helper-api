FROM node:latest
WORKDIR /app
COPY package*.json ./
COPY calc.go ./
RUN apt update && apt install wget -y
RUN wget https://dl.google.com/go/go1.13.4.linux-amd64.tar.gz && tar -C /usr/local -xzf go1.13.4.linux-amd64.tar.gz
RUN /usr/local/go/bin/go build calc.go
RUN npm install
COPY . .

FROM node:latest
WORKDIR /app
RUN wget https://dl.google.com/go/go1.13.4.linux-amd64.tar.gz && tar -C /usr/local -xzf go1.13.4.linux-amd64.tar.gz
COPY package*.json ./
RUN npm install
COPY calc.go ./
RUN /usr/local/go/bin/go build calc.go
COPY . .

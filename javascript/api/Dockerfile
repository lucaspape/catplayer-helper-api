FROM node:latest
RUN echo "deb http://deb.debian.org/debian buster-backports main" | tee "/etc/apt/sources.list.d/streamlink.list" && apt-get update && apt-get install streamlink -y
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

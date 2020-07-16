FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN echo "deb http://deb.debian.org/debian buster-backports main" | tee "/etc/apt/sources.list.d/streamlink.list"
RUN apt-get update
RUN apt-get install tesseract-ocr ffmpeg streamlink -y
RUN npm install
COPY . .
RUN mkdir recognition/

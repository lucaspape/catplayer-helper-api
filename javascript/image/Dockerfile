FROM debian:sid
WORKDIR /app
COPY package*.json ./
RUN apt-get update
RUN apt-get install nodejs npm tesseract-ocr ffmpeg streamlink -y
RUN npm install
COPY . .
RUN mkdir recognition/

FROM node:10
WORKDIR /app
COPY package*.json ./
RUN apt-get update
RUN apt-get install tesseract-ocr -y
RUN npm install
COPY . .
EXPOSE 5000
RUN mkdir recognition/
CMD bash scripts/run-api.sh & bash scripts/run-recg.sh

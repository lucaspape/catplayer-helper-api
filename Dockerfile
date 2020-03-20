FROM heroku/nodejs
RUN apt-get update
RUN apt-get install tesseract-ocr -y
RUN mkdir recognition/

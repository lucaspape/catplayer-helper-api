FROM node:10
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD [ "node", "javascript/index.js" ]
CMD [ "node", "javascript/recognitiontask.js" ]

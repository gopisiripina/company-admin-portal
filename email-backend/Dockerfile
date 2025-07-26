FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install -g pm2 && npm install

EXPOSE 5000

CMD ["pm2-runtime", "server.js", "--name", "email-backend"]

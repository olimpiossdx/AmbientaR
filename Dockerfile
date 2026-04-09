FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 9002

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD [ "npm", "start" ]

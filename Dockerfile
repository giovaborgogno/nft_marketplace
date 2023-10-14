FROM node:18-alpine
WORKDIR /frontend

COPY  package.json package-lock.json /frontend
RUN  npm install
COPY .env ./.env
COPY . .
EXPOSE 3000

RUN npm run build
CMD ["npm", "start"]
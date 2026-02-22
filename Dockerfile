FROM node:20-alpine
WORKDIR /app
COPY . . 

COPY package*.json ./
RUN npm ci

EXPOSE 8000
CMD ["npm", "start"]
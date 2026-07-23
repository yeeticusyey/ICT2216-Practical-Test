FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

COPY public ./public
COPY src ./src

USER node
EXPOSE 3000
CMD ["npm", "start"]

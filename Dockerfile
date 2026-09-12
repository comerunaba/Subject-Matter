FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/data
ENV NODE_ENV=production
ENV PORT=4173
EXPOSE 4173
VOLUME ["/app/data"]
CMD ["node", "server.js"]

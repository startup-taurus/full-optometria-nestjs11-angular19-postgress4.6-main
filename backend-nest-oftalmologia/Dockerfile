# Build stage
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S zgames_app && \
    adduser -u 1001 -S zgames_app -G zgames_app

RUN apk add --no-cache vips-dev

COPY --from=build --chown=zgames_app:zgames_app /app/dist ./dist
COPY --from=build --chown=zgames_app:zgames_app /app/node_modules ./node_modules
COPY --chown=zgames_app:zgames_app package*.json ./

RUN mkdir -p /app/uploads/product/product_image /app/uploads/user/profile_photo /app/uploads/whatsapp-auth && \
    chown -R zgames_app:zgames_app /app/uploads && \
    chmod -R 750 /app/uploads

USER zgames_app

EXPOSE 3000
CMD ["npm","run","start:prod:with-db-patch"]

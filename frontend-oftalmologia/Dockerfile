# Build stage
FROM node:20-alpine AS build
WORKDIR /app
ARG FRONTEND_API_BASE_URL=https://api-optometria.zgameslatam.com/v1/api
ARG FRONTEND_FILE_BASE_URL=https://api-optometria.zgameslatam.com
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN sed -i "s|apiBaseUrl: '.*'|apiBaseUrl: '${FRONTEND_API_BASE_URL}'|" src/environments/environment.prod.ts && \
	sed -i "s|fileBaseUrl: '.*'|fileBaseUrl: '${FRONTEND_FILE_BASE_URL}'|" src/environments/environment.prod.ts
RUN npm run build

# Nginx stage
FROM nginx:1.25-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/osen/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Accept build-time env vars for Vite
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Nginx serving stage ───────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# React Router needs all routes to serve index.html
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Inline nginx config for SPA
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/css application/javascript application/json image/svg+xml;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|webp|woff2?)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/app.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

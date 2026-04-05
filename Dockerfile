# Étape 1 : Construction de l'application
FROM node:20-alpine AS build

WORKDIR /app

# Copie des fichiers de package
COPY package*.json ./
RUN npm install

# Copie du reste des fichiers source
COPY . .

# Variables d'environnement Supabase nécessaires au build Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Étape 2 : Serveur de production (Nginx)
FROM nginx:stable-alpine

# Supprime la config par défaut de Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Écrit la config Nginx directement (pas de COPY pour éviter les problèmes de cache/ignore)
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    location /assets/ {\n\
        alias /usr/share/nginx/html/assets/;\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        access_log off;\n\
    }\n\
\n\
    error_page 500 502 503 504 /50x.html;\n\
    location = /50x.html {\n\
        root /usr/share/nginx/html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Copie du build vers le répertoire de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Permissions correctes pour Nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

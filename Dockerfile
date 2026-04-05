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

# Copie du build vers le répertoire de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration Nginx pour gérer le routage SPA (React)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Permissions correctes pour Nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

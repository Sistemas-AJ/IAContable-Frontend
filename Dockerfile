# --- Etapa 1: CONSTRUIR la App de React ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia package.json y package-lock.json
COPY package.json package-lock.json ./

# Instala dependencias de forma optimizada
RUN npm ci

# Copia el resto del código fuente
COPY . .

# Construye la aplicación para producción
RUN npm run build
# El resultado estará en /app/dist

# --- Etapa 2: SERVIR con Nginx ---
FROM nginx:alpine

# Copia los archivos estáticos construidos desde la etapa 'builder'
COPY --from=builder /app/dist /usr/share/nginx/html

# Elimina la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nuestra configuración personalizada de Nginx
# (El archivo que crearás a continuación)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expone el puerto 80
EXPOSE 80

# Comando para mantener Nginx corriendo
CMD ["nginx", "-g", "daemon off;"]
	# Build stage
	FROM node:18-alpine as build

	WORKDIR /app

	# Copiar archivos de package
	COPY package*.json ./

	# Instalar dependencias
	RUN npm install

	# Copiar código fuente
	COPY . .

	# Construir aplicación
	RUN npm run build

	# Production stage
	FROM nginx:alpine

	# Copiar build
	COPY --from=build /app/build /usr/share/nginx/html

	# Configuración básica de nginx
	RUN echo 'server { \
		listen 80; \
		location / { \
			try_files $uri $uri/ /index.html; \
		} \
		location /api/ { \
			proxy_pass http://backend:3001/api/; \
			proxy_set_header Host $host; \
			proxy_set_header X-Real-IP $remote_addr; \
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
			proxy_set_header X-Forwarded-Proto $scheme; \
		} \
	}' > /etc/nginx/conf.d/default.conf

	# Exponer puerto
	EXPOSE 80

	CMD ["nginx", "-g", "daemon off;"]
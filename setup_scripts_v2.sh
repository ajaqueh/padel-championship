#!/bin/bash
# setup.sh - Script de configuración automática

set -e

echo "🚀 Configurando Sistema de Gestión de Campeonatos de Pádel"
echo "============================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar prerequisites
check_prerequisites() {
    log_info "Verificando prerequisites..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi
    
    log_success "Prerequisites verificados"
}

# Crear estructura de directorios
create_structure() {
    log_info "Creando estructura de directorios..."
    
    mkdir -p backend/src/{controllers,services,middleware,routes,tests,utils}
    mkdir -p backend/migrations
    mkdir -p backend/seeds
    mkdir -p backend/uploads
    mkdir -p frontend/src/{components/{common,layout,championships,teams,matches},pages,services,contexts,types,utils}
    mkdir -p frontend/public
    
    log_success "Estructura de directorios creada"
}

# Configurar archivos de entorno
setup_env() {
    log_info "Configurando archivos de entorno..."
    
    # Backend .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=padel_championship
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=padel-championship-super-secret-jwt-key-$(date +%s)

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
EOF
        log_success "Backend .env creado"
    else
        log_warning "Backend .env ya existe, saltando..."
    fi
    
    # Frontend .env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_APP_NAME=Pádel Championship Manager
REACT_APP_VERSION=1.0.0
EOF
        log_success "Frontend .env creado"
    else
        log_warning "Frontend .env ya existe, saltando..."
    fi
}

# Construir e iniciar servicios
build_and_start() {
    log_info "Construyendo e iniciando servicios..."
    
    # Detener servicios existentes si están corriendo
    docker-compose down 2>/dev/null || true
    
    # Construir imágenes
    log_info "Construyendo imágenes Docker..."
    docker-compose build --no-cache
    
    # Iniciar servicios
    log_info "Iniciando servicios..."
    docker-compose up -d
    
    log_success "Servicios iniciados"
}

# Esperar a que los servicios estén listos
wait_for_services() {
    log_info "Esperando a que los servicios estén listos..."
    
    # Esperar PostgreSQL
    log_info "Esperando PostgreSQL..."
    timeout=60
    counter=0
    while ! docker-compose exec -T postgres pg_isready -U postgres -q; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            log_error "Timeout esperando PostgreSQL"
            exit 1
        fi
    done
    log_success "PostgreSQL está listo"
    
    # Esperar Backend
    log_info "Esperando Backend API..."
    timeout=120
    counter=0
    while ! curl -s http://localhost:3001/health > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            log_error "Timeout esperando Backend API"
            exit 1
        fi
    done
    log_success "Backend API está listo"
    
    # Esperar Frontend
    log_info "Esperando Frontend..."
    timeout=60
    counter=0
    while ! curl -s http://localhost:3000 > /dev/null 2>&1; do
        sleep 2
        counter=$((counter + 2))
        if [ $counter -ge $timeout ]; then
            log_error "Timeout esperando Frontend"
            exit 1
        fi
    done
    log_success "Frontend está listo"
}

# Ejecutar tests
run_tests() {
    log_info "Ejecutando tests..."
    
    if docker-compose exec -T backend npm test; then
        log_success "Todos los tests pasaron"
    else
        log_warning "Algunos tests fallaron, pero el sistema está funcionando"
    fi
}

# Mostrar información de acceso
show_access_info() {
    echo ""
    echo "🎉 ¡Sistema configurado exitosamente!"
    echo "====================================="
    echo ""
    log_info "URLs de acceso:"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🔌 Backend API: http://localhost:3001"
    echo "  📊 Health Check: http://localhost:3001/health"
    echo "  🗄️  PostgreSQL: localhost:5432"
    echo ""
    log_info "Credenciales de acceso:"
    echo "  👤 Admin: admin@padel.com / admin123"
    echo "  👤 Gestor: gestor@padel.com / gestor123"
    echo ""
    log_info "Caso de prueba específico:"
    echo "  🎯 Campeonato con escenario 18/16/10/10 pre-configurado"
    echo "  📈 Ver 'Liga de Pádel Ejemplo - Caso 18/16/10/10'"
    echo ""
    log_info "Comandos útiles:"
    echo "  📋 Ver logs: docker-compose logs -f [servicio]"
    echo "  🔄 Reiniciar: docker-compose restart"
    echo "  🛑 Detener: docker-compose down"
    echo "  🧪 Tests: docker-compose exec backend npm test"
    echo ""
}

# Función main
main() {
    echo "Iniciando configuración del sistema..."
    echo ""
    
    check_prerequisites
    create_structure
    setup_env
    build_and_start
    wait_for_services
    run_tests
    show_access_info
    
    log_success "¡Configuración completada exitosamente!"
}

# Manejo de errores
trap 'log_error "Error durante la configuración. Ejecutar: docker-compose logs para más detalles."; exit 1' ERR

# Ejecutar solo si es llamado directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

---

# Makefile

.PHONY: help setup start stop restart logs test clean build

# Variables
COMPOSE_FILE = docker-compose.yml
BACKEND_CONTAINER = padel_backend
FRONTEND_CONTAINER = padel_frontend
POSTGRES_CONTAINER = padel_postgres

help: ## Mostrar ayuda
	@echo "🚀 Sistema de Gestión de Campeonatos de Pádel"
	@echo "============================================="
	@echo ""
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## Configuración completa del sistema
	@echo "🚀 Configurando sistema completo..."
	./setup.sh

start: ## Iniciar todos los servicios
	@echo "▶️  Iniciando servicios..."
	docker-compose up -d
	@echo "✅ Servicios iniciados"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔌 Backend: http://localhost:3001"

stop: ## Detener todos los servicios
	@echo "⏹️  Deteniendo servicios..."
	docker-compose down
	@echo "✅ Servicios detenidos"

restart: ## Reiniciar todos los servicios
	@echo "🔄 Reiniciando servicios..."
	docker-compose restart
	@echo "✅ Servicios reiniciados"

build: ## Construir imágenes Docker
	@echo "🔨 Construyendo imágenes..."
	docker-compose build --no-cache
	@echo "✅ Imágenes construidas"

logs: ## Ver logs de todos los servicios
	docker-compose logs -f

logs-backend: ## Ver logs del backend
	docker-compose logs -f $(BACKEND_CONTAINER)

logs-frontend: ## Ver logs del frontend  
	docker-compose logs -f $(FRONTEND_CONTAINER)

logs-db: ## Ver logs de la base de datos
	docker-compose logs -f $(POSTGRES_CONTAINER)

test: ## Ejecutar tests del backend
	@echo "🧪 Ejecutando tests..."
	docker-compose exec $(BACKEND_CONTAINER) npm test
	@echo "✅ Tests completados"

test-watch: ## Ejecutar tests en modo watch
	docker-compose exec $(BACKEND_CONTAINER) npm run test:watch

test-coverage: ## Ejecutar tests con cobertura
	docker-compose exec $(BACKEND_CONTAINER) npm run test:coverage

shell-backend: ## Acceder al shell del backend
	docker-compose exec $(BACKEND_CONTAINER) sh

shell-db: ## Acceder al shell de PostgreSQL
	docker-compose exec $(POSTGRES_CONTAINER) psql -U postgres -d padel_championship

migrate: ## Ejecutar migraciones
	docker-compose exec $(BACKEND_CONTAINER) npm run migrate

seed: ## Ejecutar seeds (datos de prueba)
	docker-compose exec $(BACKEND_CONTAINER) npm run seed

reset-db: ## Resetear base de datos (CUIDADO: elimina todos los datos)
	@echo "⚠️  CUIDADO: Esto eliminará todos los datos de la base de datos"
	@read -p "¿Estás seguro? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v
	docker-compose up -d postgres
	@sleep 5
	docker-compose up -d $(BACKEND_CONTAINER)
	@echo "✅ Base de datos reseteada"

clean: ## Limpiar contenedores, volúmenes e imágenes
	@echo "🧹 Limpiando sistema..."
	docker-compose down -v --rmi all
	docker system prune -f
	@echo "✅ Sistema limpiado"

status: ## Ver estado de los servicios
	@echo "📊 Estado de los servicios:"
	docker-compose ps

health: ## Verificar salud de los servicios
	@echo "🏥 Verificando salud de los servicios:"
	@echo "Backend API:"
	@curl -s http://localhost:3001/health | jq . || echo "❌ Backend no responde"
	@echo ""
	@echo "Frontend:"
	@curl -s -o /dev/null -w "Status: %{http_code}" http://localhost:3000 && echo " ✅" || echo "❌ Frontend no responde"
	@echo ""
	@echo "PostgreSQL:"
	@docker-compose exec -T $(POSTGRES_CONTAINER) pg_isready -U postgres && echo "✅ PostgreSQL listo" || echo "❌ PostgreSQL no responde"

backup: ## Crear backup de la base de datos
	@echo "💾 Creando backup de la base de datos..."
	mkdir -p backups
	docker-compose exec -T $(POSTGRES_CONTAINER) pg_dump -U postgres padel_championship > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup creado en backups/"

restore: ## Restaurar backup de la base de datos
	@echo "🔄 Restaurar backup:"
	@ls -la backups/ || echo "No hay backups disponibles"
	@read -p "Nombre del archivo de backup: " backup_file; \
	if [ -f "backups/$$backup_file" ]; then \
		docker-compose exec -T $(POSTGRES_CONTAINER) psql -U postgres -d padel_championship < backups/$$backup_file; \
		echo "✅ Backup restaurado"; \
	else \
		echo "❌ Archivo no encontrado"; \
	fi

demo: ## Configurar datos de demostración
	@echo "🎯 Configurando datos de demostración..."
	$(MAKE) seed
	@echo "✅ Datos de demostración configurados"
	@echo "👤 Admin: admin@padel.com / admin123"
	@echo "👤 Gestor: gestor@padel.com / gestor123"
	@echo "🏆 Campeonato de ejemplo con caso 18/16/10/10 configurado"

dev: ## Modo desarrollo (con hot reload)
	@echo "⚡ Iniciando modo desarrollo..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

prod: ## Modo producción
	@echo "🏭 Iniciando modo producción..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

---

# package.json (raíz del proyecto)

{
  "name": "padel-championship",
  "version": "1.0.0",
  "description": "Sistema completo para gestión de campeonatos de pádel",
  "main": "index.js",
  "scripts": {
    "setup": "./setup.sh",
    "start": "make start",
    "stop": "make stop",
    "restart": "make restart",
    "test": "make test",
    "logs": "make logs",
    "clean": "make clean"
  },
  "keywords": [
    "padel",
    "championship",
    "tournament",
    "sports",
    "management"
  ],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "backend/src/**/*.{ts,js}": [
      "cd backend && npm run lint:fix",
      "git add"
    ],
    "frontend/src/**/*.{ts,tsx,js,jsx}": [
      "cd frontend && npm run lint:fix", 
      "git add"
    ]
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}

---

# .github/workflows/ci.yml

name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: padel_championship_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run backend linting
      run: |
        cd backend
        npm run lint
    
    - name: Run backend tests
      run: |
        cd backend
        npm run test:coverage
      env:
        NODE_ENV: test
        DB_HOST: localhost
        DB_PORT: 5432
        DB_NAME: padel_championship_test
        DB_USER: postgres
        DB_PASSWORD: postgres
        JWT_SECRET: test-secret
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        directory: backend/coverage

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run frontend linting
      run: |
        cd frontend
        npm run lint
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build

  integration-test:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Build and run with Docker Compose
      run: |
        docker-compose build
        docker-compose up -d
        
    - name: Wait for services
      run: |
        timeout 120 bash -c 'until curl -s http://localhost:3001/health > /dev/null; do sleep 2; done'
        timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 2; done'
        
    - name: Run integration tests
      run: |
        docker-compose exec -T backend npm run test:integration
        
    - name: Cleanup
      run: docker-compose down

---

# docs/DEPLOYMENT.md

# Guía de Deployment

## 🚀 Deployment en Producción

### Requisitos del Servidor
- **OS**: Ubuntu 20.04+ o CentOS 8+
- **RAM**: Mínimo 2GB, recomendado 4GB
- **CPU**: Mínimo 2 cores
- **Disco**: Mínimo 10GB disponibles
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Variables de Entorno de Producción

```bash
# Backend (.env.production)
NODE_ENV=production
PORT=3001
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=padel_championship_prod
DB_USER=padel_user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
FRONTEND_URL=https://your-domain.com
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads

# Frontend (.env.production)
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_APP_NAME=Pádel Championship Manager
REACT_APP_VERSION=1.0.0
```

### Deployment con Docker

```bash
# 1. Clonar repositorio en servidor
git clone <your-repo-url>
cd padel-championship

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
# Editar archivos con valores de producción

# 3. Crear archivo docker-compose.prod.yml
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14
    restart: unless-stopped
    environment:
      POSTGRES_USER: padel_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: padel_championship_prod
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    networks:
      - padel_network

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
    env_file:
      - backend/.env.production
    depends_on:
      - postgres
    networks:
      - padel_network
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:3000"
      - "443:3000"
    env_file:
      - frontend/.env.production
    depends_on:
      - backend
    networks:
      - padel_network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - padel_network

volumes:
  postgres_prod_data:

networks:
  padel_network:
    driver: bridge
EOF

# 4. Configurar Nginx para HTTPS
cat > nginx.conf << 'EOF'
upstream backend {
    server backend:3001;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # API requests
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 5. Deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 6. Verificar deployment
docker-compose -f docker-compose.prod.yml ps
curl -s https://your-domain.com/api/health
```

### Configuración SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d your-domain.com

# Renovación automática
sudo crontab -e
# Agregar línea:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Monitoreo y Logs

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Métricas del sistema
docker stats

# Backup automático
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U padel_user padel_championship_prod > backups/backup_$DATE.sql
find backups/ -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Agregar a crontab para backup diario
sudo crontab -e
# Agregar línea:
0 2 * * * /path/to/backup.sh
```

## 🔧 Deployment en Kubernetes

### Manifiestos K8s

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: padel-championship

---

# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: padel-config
  namespace: padel-championship
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "padel_championship"
  FRONTEND_URL: "https://your-domain.com"

---

# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: padel-secrets
  namespace: padel-championship
type: Opaque
stringData:
  DB_PASSWORD: "your-secure-password"
  DB_USER: "padel_user"
  JWT_SECRET: "your-super-secure-jwt-secret"

---

# k8s/postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: padel-championship
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: padel-config
              key: DB_NAME
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: padel-secrets
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: padel-secrets
              key: DB_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc

---

# k8s/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: padel-championship
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/padel-backend:latest
        envFrom:
        - configMapRef:
            name: padel-config
        - secretRef:
            name: padel-secrets
        ports:
        - containerPort: 3001
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---

# k8s/frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: padel-championship
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/padel-frontend:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Deploy en K8s

```bash
# Aplicar manifiestos
kubectl apply -f k8s/

# Verificar deployment
kubectl get pods -n padel-championship
kubectl get services -n padel-championship

# Ver logs
kubectl logs -f deployment/backend -n padel-championship
kubectl logs -f deployment/frontend -n padel-championship
```

## 📊 Monitoreo y Alertas

### Prometheus + Grafana

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'padel-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: /metrics
    
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']
```

### Health Checks

```bash
# Script de health check
cat > healthcheck.sh << 'EOF'
#!/bin/bash

BACKEND_URL="https://your-domain.com/api/health"
FRONTEND_URL="https://your-domain.com"

# Check backend
if curl -s -f $BACKEND_URL > /dev/null; then
    echo "✅ Backend healthy"
else
    echo "❌ Backend unhealthy"
    # Enviar alerta (email, Slack, etc.)
fi

# Check frontend
if curl -s -f $FRONTEND_URL > /dev/null; then
    echo "✅ Frontend healthy"
else
    echo "❌ Frontend unhealthy"
    # Enviar alerta
fi
EOF

# Ejecutar cada minuto
echo "* * * * * /path/to/healthcheck.sh" | crontab -
```

## 🔐 Seguridad

### Configuraciones de Seguridad

```bash
# Firewall (UFW)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Actualizar sistema regularmente
sudo apt update && sudo apt upgrade -y

# Docker security
docker run --security-opt no-new-privileges:true
docker run --read-only --tmpfs /tmp
```

### Variables Seguras

```bash
# Generar JWT secret seguro
openssl rand -hex 32

# Generar password de DB seguro  
openssl rand -base64 32
```

## 🔄 CI/CD con GitLab

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

test-backend:
  stage: test
  image: node:18
  services:
    - postgres:14
  variables:
    POSTGRES_DB: padel_championship_test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
    DB_HOST: postgres
  script:
    - cd backend
    - npm ci
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA ./backend
    - docker build -t $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA ./frontend
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - curl -X POST $WEBHOOK_URL
  only:
    - main
```
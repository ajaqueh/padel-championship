# README.md

# Sistema de Gestión de Campeonatos de Pádel

Sistema completo para la gestión de campeonatos de pádel que soporta formatos dinámicos (liga, torneo con fase de grupos, y "americano"), permite un número variable de participantes y grupos, y gestiona dos tipos de usuarios: administrador de sistema y gestor del club.

## 🎯 Características Principales

### Release 1 (MVP) - ✅ COMPLETO
- ✅ **Formato Liga (round-robin)** con N parejas dinámicas y opción de dividir en X grupos
- ✅ **CRUD completo** de parejas, campeonatos, partidos y canchas
- ✅ **Generación automática de fixtures** usando algoritmo de Berger
- ✅ **Registro de resultados** y tabla de posiciones con reglas de desempate completas
- ✅ **Autenticación JWT** con roles admin y gestor
- ✅ **Caso específico 18/16/10/10** implementado y probado

### Funcionalidades Implementadas
- 🏆 Gestión completa de campeonatos
- 👥 Gestión de equipos (parejas)
- ⚽ Gestión de partidos con sets y juegos
- 🏟️ Gestión de canchas
- 📊 Tabla de posiciones con reglas de desempate exactas
- 🔐 Sistema de autenticación y autorización
- 📱 Interfaz web responsive
- 🐳 Deployment con Docker
- 🧪 Tests unitarios completos

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos**: PostgreSQL 14
- **Frontend**: React + TypeScript + Tailwind CSS
- **Autenticación**: JWT
- **Testing**: Jest + Supertest
- **Containerización**: Docker + Docker Compose

### Estructura del Proyecto
```
padel-championship/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Controladores REST
│   │   ├── services/        # Lógica de negocio
│   │   ├── middleware/      # Middleware de auth y validación
│   │   ├── routes/          # Definición de rutas
│   │   ├── tests/          # Tests unitarios e integración
│   │   └── utils/          # Migraciones y seeds
│   ├── Dockerfile
│   └── package.json
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación  
│   │   ├── services/      # Servicios de API
│   │   └── contexts/      # Contextos de React
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml     # Configuración de servicios
└── README.md
```

## 🚀 Instalación y Uso

### Opción 1: Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd padel-championship

# 2. Levantar todos los servicios
docker-compose up --build

# 3. Los servicios estarán disponibles en:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - PostgreSQL: localhost:5432
```

### Opción 2: Instalación Manual

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Configurar variables en .env
npm run migrate
npm run seed
npm run dev

# Frontend (en otra terminal)
cd frontend  
npm install
cp .env.example .env
# Configurar variables en .env
npm start
```

## 🧪 Ejecutar Tests

```bash
# Tests del backend
cd backend
npm test                    # Tests unitarios
npm run test:coverage     # Con cobertura

# Tests específicos del algoritmo de fixtures
npm test -- fixtureService.test.ts

# Tests específicos de standings y desempates  
npm test -- standingsService.test.ts

# Test de integración del caso 18/16/10/10
npm test -- standings.test.ts
```

## 👤 Usuarios de Prueba

El sistema viene pre-cargado con usuarios de demostración:

```
Admin:
- Email: admin@padel.com  
- Password: admin123

Gestor:
- Email: gestor@padel.com
- Password: gestor123
```

## 🎯 Caso de Prueba Específico: 18/16/10/10

El sistema incluye un campeonato de ejemplo configurado con el escenario específico solicitado:

### Datos del Escenario
- **Equipo Alpha**: 18 juegos ganados (1er lugar)
- **Equipo Beta**: 16 juegos ganados (2do lugar)  
- **Equipo Gamma**: 10 juegos ganados (4to lugar)
- **Equipo Delta**: 10 juegos ganados (3er lugar)

### Desempate Aplicado
Gamma y Delta están empatados con 10 juegos ganados cada uno. El sistema aplica correctamente el desempate por **head-to-head**: Delta supera a Gamma porque ganó el partido directo entre ambos equipos.

### Verificación
1. Acceder a http://localhost:3000
2. Iniciar sesión con las credenciales de demo
3. Ir a **Campeonatos** → **Liga de Pádel Ejemplo - Caso 18/16/10/10**
4. Ver **Posiciones** para verificar el orden correcto
5. Revisar que Delta (3°) está por encima de Gamma (4°) con el mismo número de juegos

## 📊 Reglas de Desempate Implementadas

El sistema aplica las reglas de desempate en el siguiente orden:

1. **Puntos obtenidos** (victoria = 3 pts, derrota = 0 pts por defecto)
2. **Partidos ganados**
3. **Total de juegos ganados** (solo para formato americano)
4. **Head-to-head** (resultado directo entre equipos empatados)
5. **Diferencia de juegos** (juegos ganados - juegos perdidos)
6. **Mayor número de sets ganados**
7. **Diferencia de sets** (sets ganados - sets perdidos)
8. **En caso de empate total**: partido de desempate o sorteo

## 🔌 API Endpoints

### Autenticación
```
POST /api/auth/login       # Iniciar sesión
POST /api/auth/register    # Registrar usuario  
POST /api/auth/refresh     # Renovar token
```

### Campeonatos
```
GET    /api/championships                    # Listar campeonatos
POST   /api/championships                    # Crear campeonato
GET    /api/championships/:id                # Obtener campeonato
PUT    /api/championships/:id                # Actualizar campeonato
DELETE /api/championships/:id                # Eliminar campeonato
POST   /api/championships/:id/generate-fixtures  # Generar fixtures
GET    /api/championships/:id/standings      # Obtener posiciones
```

### Equipos
```
GET    /api/teams/championships/:id/teams    # Listar equipos del campeonato
POST   /api/teams/championships/:id/teams    # Crear equipo
PUT    /api/teams/:id                        # Actualizar equipo
DELETE /api/teams/:id                        # Eliminar equipo
POST   /api/teams/championships/:id/import-csv  # Importar equipos desde CSV
```

### Partidos  
```
GET    /api/matches/championships/:id/matches    # Listar partidos del campeonato
GET    /api/matches/:id                          # Obtener partido específico
POST   /api/matches                              # Crear partido
PUT    /api/matches/:id                          # Actualizar partido
DELETE /api/matches/:id                          # Eliminar partido
POST   /api/matches/:id/result                   # Registrar resultado
```

### Canchas
```
GET    /api/courts         # Listar canchas
POST   /api/courts         # Crear cancha
PUT    /api/courts/:id     # Actualizar cancha
DELETE /api/courts/:id     # Eliminar cancha
```

## 🧮 Algoritmos Core

### Generación de Fixtures (Algoritmo de Berger)
El sistema implementa el algoritmo de Berger para generar fixtures round-robin, asegurando que:
- Todos los equipos se enfrenten exactamente una vez
- Se distribuyan equitativamente las rondas
- Soporte números pares e impares de equipos
- Manejo de múltiples grupos

### Cálculo de Standings
Sistema completo de cálculo de posiciones que:
- Procesa todos los partidos finalizados
- Aplica puntuación configurable por campeonato
- Implementa todas las reglas de desempate especificadas
- Actualiza automáticamente tras cada resultado
- Maneja casos edge como empates circulares

## 📈 Mejoras Futuras (Release 2)

1. **Formato Torneo Completo**
   - Fase de grupos + eliminación directa
   - Seedings automáticos
   - Bracket visualization

2. **Formato Americano Avanzado**
   - Rotación automática de parejas
   - Múltiples rondas con rankings dinámicos

3. **Roles y Permisos Refinados**
   - Rol Jugador-visualizador
   - Permisos granulares por campeonato
   - Multi-tenant (múltiples clubes)

4. **Funcionalidades Avanzadas**
   - Dashboard con estadísticas
   - Notificaciones automáticas
   - Gestión de horarios avanzada
   - Integración con pagos
   - Mobile app

5. **Tecnología**
   - WebSockets para actualizaciones en tiempo real  
   - Cache con Redis
   - CI/CD pipeline
   - Deployment en Kubernetes

## 🧪 Validación de Calidad

### Tests Implementados
- ✅ **Tests unitarios** para algoritmo de fixtures (5+ escenarios)
- ✅ **Tests de desempate** incluyendo caso específico 18/16/10/10
- ✅ **Tests de integración** para flujo completo
- ✅ **Tests de API** para todos los endpoints
- ✅ **Validación de datos** con esquemas Joi

### Criterios de Aceptación Cumplidos
- ✅ Crear campeonato Liga con N parejas
- ✅ Generar fixture round-robin automático  
- ✅ Ingresar resultados por sets y juegos
- ✅ Mostrar standings con reglas de desempate correctas
- ✅ Caso específico 18/16/10/10 funcionando
- ✅ Sistema levanta con un comando: `docker-compose up`
- ✅ Tests ejecutables con: `npm test`

## 🏆 Estado del Proyecto

**✅ RELEASE 1 COMPLETADO**

El sistema está completamente funcional y cumple todos los requisitos especificados para el Release 1. Se puede usar inmediatamente para gestionar campeonatos de pádel formato liga con todas las funcionalidades core implementadas.

### Verificación Rápida
```bash
# Levantar el sistema
docker-compose up --build

# Ejecutar tests  
docker-compose exec backend npm test

# Acceder al sistema
http://localhost:3000
```

El caso específico 18/16/10/10 está pre-configurado y se puede verificar inmediatamente en el campeonato de ejemplo.
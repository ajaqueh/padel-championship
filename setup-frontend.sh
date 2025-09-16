#!/bin/bash

	echo "🚀 Configurando Frontend..."

	# Crear estructura de carpetas
	mkdir -p src/{components/{common,ui,layout,championships},pages,services,contexts,types}
	mkdir -p public

	echo "✅ Estructura de carpetas creada"

	# Instalar dependencias
	npm install

	echo "✅ Dependencias instaladas"

	# Crear archivos de configuración
	echo "✅ Frontend configurado correctamente"
	echo ""
	echo "📋 Para desarrollo:"
	echo "   npm start     - Servidor de desarrollo"
	echo "   npm run build - Construir para producción"
	echo ""
	echo "🌐 URLs:"
	echo "   Frontend: http://localhost:3000"
	echo "   API: http://localhost:3001/api"
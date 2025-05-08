#!/bin/bash

# Script para configurar y ejecutar el proyecto Marcus Bikes

echo "=== Configuración del proyecto Marcus Bikes ==="
echo "Este script configurará y ejecutará todos los servicios del proyecto."

# Verificar que Docker y Docker Compose estén instalados
if ! command -v docker &> /dev/null || ! command -v docker compose &> /dev/null; then
  echo "Error: Docker y Docker Compose deben estar instalados."
  echo "Por favor, instálalos antes de continuar."
  exit 1
fi

# Crear volúmenes de Docker si no existen
echo "Creando volúmenes de Docker..."
docker volume create postgres_data || true

# Construir y levantar los contenedores
echo "Construyendo y levantando contenedores..."
docker compose build
docker compose up -d

echo
echo "=== El proyecto está en ejecución ==="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo
echo "Para detener todos los servicios: docker-compose down"
echo "Para ver los logs: docker compose logs -f" 
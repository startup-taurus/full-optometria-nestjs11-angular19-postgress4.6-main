# Deploy

## 1) Construir imágenes

docker compose build

## 2) Iniciar servicios (primer plano)

docker compose up -d

## 3) Acceso

# Frontend
https://optometria.zgameslatam.com/catalog

# Backend
https://api-optometria.zgameslatam.com

## 4) Backup de base de datos

docker compose exec db pg*dump -U ${DB_USER} -d ${DB_NAME} > backup*$(date +%Y%m%d).sql

## 5) Restaurar base de datos

cat backup.sql | docker compose exec -T db psql -U ${DB_USER} -d ${DB_NAME}

## 6) Detener (si está en primer plano usa Ctrl+C):

docker compose down

## 7) Reinicializar con datos limpios (borra volúmenes)

docker compose down -v

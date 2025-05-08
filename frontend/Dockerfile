FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de archivos
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar en desarrollo
CMD ["npm", "run", "dev"] 
# Usa la imagen base oficial de Node.js
FROM node:20-slim

# Instala las dependencias necesarias para Playwright
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Instala Playwright y sus navegadores
RUN npx playwright install --with-deps

# Copia el resto de los archivos de la aplicación al contenedor
COPY . .

RUN npm run build

# Expone el puerto en el que corre la aplicación (ajústalo al puerto que uses en Express)
EXPOSE 3000

# Comando para iniciar la aplicación desde la carpeta src
CMD ["node", "dist/app.js"]

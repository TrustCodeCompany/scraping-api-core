# 🚀 Qontar Backend - Sistema de Scraping SUNAT

Backend optimizado con TypeScript para scraping de notificaciones de SUNAT con pool de browsers persistente.

## ⚡ Quick Start

```bash
# 1. Clonar e instalar
git clone <tu-repo>
cd qontar-backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Instalar Playwright browsers
npx playwright install chromium

# 4. Desarrollo
npm run dev

# 5. Producción
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
src/
├── config/          # ⚙️ Configuración centralizada
├── core/            # 🎯 Core del scraping
│   ├── scraper/     # Pool de browsers
│   └── sunat/       # Lógica específica SUNAT
├── modules/         # 📦 Módulos de negocio
├── shared/          # 🔧 Utilidades compartidas
├── app.ts           # 🚀 Setup de Express
└── server.ts        # 🌐 Entry point
```

## 🎯 Filosofía del Código

### 1. **Separación de responsabilidades**
- `core/` = Scraping puro (sin lógica de negocio)
- `modules/` = Lógica de negocio
- `shared/` = Utilidades reutilizables

### 2. **Todo es tipado**
TypeScript estricto en toda la aplicación.

### 3. **Sin complicaciones**
No hay ORMs complejos, factories innecesarios ni patrones rebuscados.

### 4. **Fácil de extender**
¿Nuevo módulo? Crea una carpeta en `modules/` y listo.

## 📦 Agregar Nuevo Módulo

```bash
# 1. Crear estructura
mkdir -p src/modules/tu-modulo

# 2. Crear archivos
touch src/modules/tu-modulo/tu-modulo.model.ts
touch src/modules/tu-modulo/tu-modulo.service.ts
touch src/modules/tu-modulo/tu-modulo.routes.ts
touch src/modules/tu-modulo/tu-modulo.types.ts

# 3. Registrar rutas en app.ts
# import { tuModuloRoutes } from '@modules/tu-modulo/tu-modulo.routes';
# app.use('/api/v1/tu-modulo', tuModuloRoutes);
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm start            # Producción
npm run type-check   # Verificar tipos
npm run lint         # Linting
npm test             # Tests (cuando los agregues)
```

## 🌐 API Endpoints

### Health Check
```http
GET /health
```

### Test
```http
GET /api/v1/test
```

## 🔐 Variables de Entorno

Ver `.env.example` para todas las opciones disponibles.

**Críticas:**
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (cambiar en producción)

**Opcionales:**
- `BROWSER_POOL_SIZE` (default: 3)
- `MAX_CONCURRENT` (default: 10)
- `LOG_LEVEL` (default: info)

## 🚀 Deployment

### Docker (Recomendado)

```dockerfile
# Dockerfile simple
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

# Instalar Playwright
RUN npx playwright install-deps chromium
RUN npx playwright install chromium

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Manual

```bash
# Servidor con PM2
npm install -g pm2
npm run build
pm2 start dist/server.js --name qontar-backend
```

## 📊 Monitoreo

### Ver logs
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### Status del browser pool
```http
GET /api/v1/scraper/status
```

## 🐛 Troubleshooting

### Playwright no funciona
```bash
npx playwright install-deps chromium
npx playwright install chromium
```

### Errores de memoria
Reduce `BROWSER_POOL_SIZE` en `.env`:
```env
BROWSER_POOL_SIZE=2
MAX_CONCURRENT=5
```

### Errores de timeout
Aumenta `SCRAPER_TIMEOUT`:
```env
SCRAPER_TIMEOUT=45000
```

## 🎓 Conceptos Clave

### Browser Pool
Pool de navegadores persistente que se reutiliza entre requests. Mejora performance 20x-60x.

### Graceful Shutdown
El servidor cierra correctamente los browsers al apagarse.

### Types Everywhere
Todo está tipado para evitar errores en runtime.

## 📚 Ejemplos de Uso

### Usar el scraper desde un service

```typescript
import { sunatScraper } from '@core/sunat/SunatScraper';

async function procesarCliente(url: string) {
  const result = await sunatScraper.scrapeNotifications(url);
  
  if (result.success) {
    console.log('Notificaciones:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}
```

### Batch processing

```typescript
const urls = ['url1', 'url2', 'url3'];
const results = await sunatScraper.scrapeNotificationsBatch(urls);
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📝 Licencia

MIT

## 👨‍💻 Autor

Tu Nombre - [tu-email@ejemplo.com]

## 🙏 Agradecimientos

- Playwright team por el excelente framework
- TypeScript team por hacer JavaScript mantenible

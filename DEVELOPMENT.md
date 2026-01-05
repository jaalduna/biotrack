# BioTrack - Local Development Guide

## 🚀 Quick Start (Frontend Only - Fastest)

Si solo necesitas probar el frontend con la BD que ya está corriendo:

```bash
npm run dev
```

**Accede a:** http://localhost:5173

**Credenciales de prueba:**
- Email: `jaalduna@gmail.com`
- Contraseña: `Monito1505`

---

## 🔧 Full Local Development Setup

Para correr frontend + backend + base de datos localmente:

### Opción 1: Automática (Recomendado)

```bash
./run-dev.sh
```

Esto hará automáticamente:
1. ✓ Inicia PostgreSQL en Docker (puerto 5434)
2. ✓ Instala dependencias del backend
3. ✓ Ejecuta migraciones de BD
4. ✓ Inicia FastAPI backend (puerto 8000)
5. ✓ Inicia Vite dev server (puerto 5173)

### Opción 2: Manual paso a paso

#### 1. Inicia la Base de Datos

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Espera a que esté lista:
```bash
docker-compose -f docker-compose.dev.yml exec db pg_isready -U user
```

#### 2. Configura y ejecuta el Backend

```bash
cd backend

# Crear entorno virtual (primera vez)
python -m venv venv

# Activar entorno
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend disponible en:** http://localhost:8000

#### 3. En otra terminal, ejecuta el Frontend

```bash
# Desde la raíz del proyecto
npm run dev
```

**Frontend disponible en:** http://localhost:5173

---

## 📊 Servicios en Desarrollo Local

| Servicio | URL | Puerto |
|----------|-----|--------|
| Frontend (Vite) | http://localhost:5173 | 5173 |
| Backend (FastAPI) | http://localhost:8000 | 8000 |
| Base de Datos | localhost:5434 | 5434 |
| API Docs | http://localhost:8000/docs | - |

---

## 🔑 Variables de Entorno

### Frontend
No requiere configuración especial. Usa `http://localhost:8000` por defecto.

### Backend
El archivo `.env` está configurado para desarrollo local:

```
DATABASE_URL=postgresql://user:password@localhost:5434/biotrack
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Pruebas Rápidas

### 1. Test del API

```bash
# Ver documentación interactiva
curl http://localhost:8000/docs

# Test endpoint
curl http://localhost:8000/
```

### 2. Test de la BD

```bash
docker-compose -f docker-compose.dev.yml exec db psql -U user -d biotrack
```

Dentro de psql:
```sql
SELECT * FROM unit_configs;
```

---

## 🛑 Detener Servicios

### Si usaste `run-dev.sh`
```bash
Ctrl+C  # Detiene todo automáticamente
```

### Si ejecutaste manualmente

**Terminal 1 (Backend):**
```bash
Ctrl+C
```

**Terminal 2 (Frontend):**
```bash
Ctrl+C
```

**Terminal 3 (BD):**
```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 📝 Credenciales de Prueba

```
Email: jaalduna@gmail.com
Password: Monito1505
Role: advanced (para acceso a Advanced Settings)
```

---

## 🐛 Troubleshooting

### Puerto 5434 ya está en uso
```bash
# Cambiar puerto en docker-compose.dev.yml
# Modificar: ports: - "5435:5432"

# O matar el proceso
lsof -i :5434
kill <PID>
```

### Dependencias no instalan
```bash
# Usar pip con --break-system-packages (si en Linux)
pip install -r requirements.txt --break-system-packages

# O usar poetry
poetry install
```

### BD no conecta
```bash
# Verificar que está corriendo
docker ps

# Ver logs
docker logs biotrack-db-1

# Reconectar
docker-compose -f docker-compose.dev.yml restart db
```

### Frontend no compila
```bash
# Limpiar cache
rm -rf node_modules dist
npm install
npm run dev
```

---

## 📚 Rutas Útiles

| Ruta | Descripción |
|------|-------------|
| `/` | Redirige a login |
| `/login` | Login page |
| `/patients` | Lista de pacientes |
| `/admin/settings` | Advanced Settings (solo usuarios avanzados) |
| `/team/settings` | Configuración del equipo |

---

## 🎯 Tips de Desarrollo

1. **Hot Reload Activo**: Tanto el frontend como el backend tienen hot reload habilitado
2. **Documentación API**: Accede a http://localhost:8000/docs para Swagger UI
3. **TypeScript Checking**: Ejecuta `npm run build` antes de commit para verificar tipos
4. **Linting**: Ejecuta `npm run lint` para verificar código

---

## 🚀 Deploy a Producción

Para deploy con Docker (ver `docker-compose.yml`):

```bash
docker-compose up --build
```

Esto levantará:
- Frontend (Nginx en puerto 5173)
- Backend (FastAPI en puerto 8000)
- Base de datos (PostgreSQL)

---

**¡Listo para desarrollar! 🎉**

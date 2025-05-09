from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import products, cart, admin
from app.db.database import create_tables, get_db
from app.db.init_db import create_initial_data

app = FastAPI(
    title="Marcus Bikes API",
    description="API para el e-commerce de bicicletas personalizables",
    version="1.0.0",
)

# Configurar CORS con orígenes específicos permitidos
origins = [
    "http://localhost:3000",  # Frontend en desarrollo local
    "http://127.0.0.1:3000",
    "http://frontend:3000",   # Nombre del servicio dentro de Docker
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Importante para permitir cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization", "X-Requested-With"],
    expose_headers=["Set-Cookie"],  # Exponer el encabezado Set-Cookie
)

# Incluir rutas
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(cart.router, prefix="/api", tags=["cart"])
app.include_router(admin.router, prefix="/api", tags=["admin"])

@app.on_event("startup")
async def startup():
    # Crear tablas si no existen
    create_tables()
    
    # Inicializar datos de ejemplo
    db = next(get_db())
    create_initial_data(db)

@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de Marcus Bikes"} 
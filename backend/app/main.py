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

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambiar a los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
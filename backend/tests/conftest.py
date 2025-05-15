import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base

# Usar una base de datos SQLite en memoria para los tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db():
    """Fixture que proporciona una sesión de base de datos para los tests"""
    # Crear el motor de base de datos
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    
    # Crear una nueva sesión
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        # Limpiar la base de datos después de cada test
        Base.metadata.drop_all(bind=engine) 
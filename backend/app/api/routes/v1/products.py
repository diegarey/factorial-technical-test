from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.services import product_service
from app.schemas.product import (
    Product, ProductCreate, ProductDetail,
    PartType, PartTypeCreate,
    PartOption, PartOptionCreate,
    OptionDependency, OptionDependencyCreate,
    ConditionalPrice, ConditionalPriceCreate
)

router = APIRouter()

@router.get("/products/", response_model=None)
def read_products(
    skip: int = Query(0, description="Elementos a saltar"), 
    limit: int = Query(100, description="Límite de elementos a retornar"),
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de productos disponibles.
    """
    products = product_service.get_products(db, skip=skip, limit=limit)
    # Obtener el total de productos para la paginación
    total = product_service.get_total_products(db)
    
    return {
        "items": products,
        "total": total
    }

@router.get("/products/featured", response_model=List[Product])
def read_featured_products(
    limit: int = Query(3, description="Número de productos destacados a retornar"),
    db: Session = Depends(get_db)
):
    """
    Obtiene la lista de productos destacados.
    """
    featured_products = product_service.get_featured_products(db, limit=limit)
    return featured_products

@router.get("/products/{product_id}", response_model=ProductDetail)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el detalle de un producto específico con todas sus opciones y restricciones.
    """
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_product

@router.get("/products/{product_id}/options")
def get_product_options(
    product_id: int, 
    current_selection: List[int] = Query(None, description="IDs de opciones actualmente seleccionadas"),
    db: Session = Depends(get_db)
):
    """
    Obtiene las opciones disponibles para un producto considerando las selecciones actuales.
    """
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return product_service.get_available_options(db, product_id, current_selection)

@router.post("/products/validate-compatibility")
def validate_compatibility(request: dict, db: Session = Depends(get_db)):
    """
    Valida si un conjunto de opciones seleccionadas son compatibles entre sí.
    """
    selected_options = request.get("selected_options", [])
    print(f"Validando compatibilidad para opciones: {selected_options}")
    result = product_service.validate_compatibility(db, selected_options)
    return result

@router.post("/products/calculate-price")
def calculate_price(request: dict, db: Session = Depends(get_db)):
    """
    Calcula el precio total adicional para una configuración de opciones seleccionadas.
    Este precio NO incluye el precio base del producto, solo el costo adicional de las opciones.
    El frontend debe sumar el precio base del producto para obtener el precio total final.
    """
    selected_options = request.get("selected_options", [])
    print(f"Calculando precio para opciones: {selected_options}")
    
    # Primero validar compatibilidad
    compatibility_result = product_service.validate_compatibility(db, selected_options)
    if not compatibility_result["is_compatible"]:
        details = compatibility_result["incompatibility_details"]
        if details:
            message = f"Incompatibilidad: "
            if details["type"] == "excludes":
                message += f"La opción '{details['option_name']}' no es compatible con '{details['excluded_option_name']}'"
            elif details["type"] == "requires":
                message += f"La opción '{details['option_name']}' requiere '{details['required_option_name']}'"
            raise HTTPException(status_code=400, detail=message)
        else:
            raise HTTPException(status_code=400, detail="Las opciones seleccionadas no son compatibles")
    
    total_price = product_service.calculate_price(db, selected_options)
    print(f"Precio adicional total: {total_price}")
    return {"total_price": total_price} 
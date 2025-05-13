from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
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

# Rutas para gestionar productos
@router.post("/admin/products", response_model=Product, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Crea un nuevo producto.
    """
    return product_service.create_product(db=db, product=product)

@router.post("/admin/products/{product_id}/part-types", response_model=PartType, status_code=201)
def create_part_type(product_id: int, part_type: PartTypeCreate, db: Session = Depends(get_db)):
    """
    Añade un nuevo tipo de parte a un producto.
    """
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product_service.create_part_type(db=db, part_type=part_type, product_id=product_id)

@router.post("/admin/part-types/{part_type_id}/options", response_model=PartOption, status_code=201)
def create_part_option(part_type_id: int, part_option: PartOptionCreate, db: Session = Depends(get_db)):
    """
    Añade una nueva opción a un tipo de parte.
    """
    return product_service.create_part_option(db=db, part_option=part_option, part_type_id=part_type_id)

@router.post("/admin/options/{option_id}/dependencies", response_model=OptionDependency, status_code=201)
def create_option_dependency(option_id: int, dependency: OptionDependencyCreate, db: Session = Depends(get_db)):
    """
    Añade una dependencia a una opción.
    """
    return product_service.create_option_dependency(db=db, dependency=dependency, option_id=option_id)

@router.post("/admin/options/{option_id}/conditional-prices", response_model=ConditionalPrice, status_code=201)
def create_conditional_price(option_id: int, conditional_price: ConditionalPriceCreate, db: Session = Depends(get_db)):
    """
    Añade un precio condicional a una opción.
    """
    return product_service.create_conditional_price(db=db, conditional_price=conditional_price, option_id=option_id)

# Rutas para actualizar stock
@router.put("/admin/options/{option_id}/stock")
def update_option_stock(option_id: int, in_stock: bool, db: Session = Depends(get_db)):
    """
    Actualiza el estado de stock de una opción.
    """
    option = db.query(PartOption).filter(PartOption.id == option_id).first()
    if not option:
        raise HTTPException(status_code=404, detail="Opción no encontrada")
    
    option.in_stock = in_stock
    db.commit()
    db.refresh(option)
    return {"message": f"Stock actualizado para {option.name}", "in_stock": option.in_stock}

@router.delete("/admin/part-types/{part_type_id}", status_code=204)
def delete_part_type(part_type_id: int, db: Session = Depends(get_db)):
    """
    Elimina un tipo de parte y todas sus opciones asociadas.
    """
    product_service.delete_part_type(db=db, part_type_id=part_type_id)
    return {"message": "Tipo de parte eliminado correctamente"}

@router.delete("/admin/part-types/{part_type_id}/options/{option_id}", status_code=204)
def delete_part_option(part_type_id: int, option_id: int, db: Session = Depends(get_db)):
    """
    Elimina una opción de un tipo de parte.
    """
    product_service.delete_part_option(db=db, part_type_id=part_type_id, option_id=option_id)
    return {"message": "Opción eliminada correctamente"} 
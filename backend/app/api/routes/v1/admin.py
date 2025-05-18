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
from app.models.product import PartOption as PartOptionModel, OptionDependency as OptionDependencyModel

router = APIRouter()

# Routes for managing products
@router.post("/admin/products", response_model=Product, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Creates a new product.
    """
    return product_service.create_product(db=db, product=product)

@router.post("/admin/products/{product_id}/part-types", response_model=PartType, status_code=201)
def create_part_type(product_id: int, part_type: PartTypeCreate, db: Session = Depends(get_db)):
    """
    Adds a new part type to a product.
    """
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product_service.create_part_type(db=db, part_type=part_type, product_id=product_id)

@router.post("/admin/part-types/{part_type_id}/options", response_model=PartOption, status_code=201)
def create_part_option(part_type_id: int, part_option: PartOptionCreate, db: Session = Depends(get_db)):
    """
    Adds a new option to a part type.
    """
    return product_service.create_part_option(db=db, part_option=part_option, part_type_id=part_type_id)

@router.post("/admin/options/{option_id}/dependencies", response_model=OptionDependency, status_code=201)
def create_option_dependency(option_id: int, dependency: OptionDependencyCreate, db: Session = Depends(get_db)):
    """
    Adds a dependency to an option.
    """
    return product_service.create_option_dependency(db=db, dependency=dependency, option_id=option_id)

@router.post("/admin/products/{product_id}/dependencies", response_model=OptionDependency, status_code=201)
def create_product_dependency(product_id: int, dependency: dict, db: Session = Depends(get_db)):
    """
    Adds a dependency through product ID.
    """
    # Convert field names from frontend to those expected by the backend
    dependency_create = OptionDependencyCreate(
        depends_on_option_id=dependency["dependsOnOptionId"],
        type=dependency["type"]
    )
    
    # Crear la dependencia y obtener el resultado
    result = product_service.create_option_dependency(db=db, dependency=dependency_create, option_id=dependency["optionId"])
    
    # Convertir el tipo de dependencia de enum a string para evitar errores de serialización
    if hasattr(result.type, 'value'):
        result.type = result.type.value
    
    return result

@router.post("/admin/options/{option_id}/conditional-prices", response_model=ConditionalPrice, status_code=201)
def create_conditional_price(option_id: int, conditional_price: ConditionalPriceCreate, db: Session = Depends(get_db)):
    """
    Adds a conditional price to an option.
    """
    return product_service.create_conditional_price(db=db, conditional_price=conditional_price, option_id=option_id)

# Routes for updating stock
@router.put("/admin/options/{option_id}/stock")
def update_option_stock(option_id: int, in_stock: bool, db: Session = Depends(get_db)):
    """
    Updates the stock status of an option.
    """
    option = db.query(PartOptionModel).filter(PartOptionModel.id == option_id).first()
    if not option:
        raise HTTPException(status_code=404, detail="Opción no encontrada")
    
    option.in_stock = in_stock
    db.commit()
    db.refresh(option)
    return {"message": f"Stock actualizado para {option.name}", "in_stock": option.in_stock}

@router.delete("/admin/part-types/{part_type_id}", status_code=204)
def delete_part_type(part_type_id: int, db: Session = Depends(get_db)):
    """
    Deletes a part type and all its associated options.
    """
    try:
        product_service.delete_part_type(db, part_type_id=part_type_id)
        return None
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al eliminar tipo de parte {part_type_id}:", str(e))
        raise HTTPException(status_code=500, detail=f"Error al eliminar tipo de parte: {str(e)}")

@router.delete("/admin/part-types/{part_type_id}/options/{option_id}", status_code=204)
def delete_part_option(part_type_id: int, option_id: int, db: Session = Depends(get_db)):
    """
    Deletes an option from a part type.
    """
    try:
        product_service.delete_part_option(db, part_type_id=part_type_id, option_id=option_id)
        return None
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al eliminar opción {option_id} del tipo de parte {part_type_id}:", str(e))
        raise HTTPException(status_code=500, detail=f"Error al eliminar opción: {str(e)}")

@router.delete("/admin/dependencies/{dependency_id}", status_code=204)
def delete_dependency(dependency_id: int, db: Session = Depends(get_db)):
    """
    Deletes a dependency between options.
    """
    try:
        # Find the dependency
        dependency = db.query(OptionDependencyModel).filter(OptionDependencyModel.id == dependency_id).first()
        
        if not dependency:
            raise HTTPException(status_code=404, detail="Dependencia no encontrada")
        
        # Delete the dependency
        db.delete(dependency)
        db.commit()
        return None
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error al eliminar dependencia {dependency_id}:", str(e))
        raise HTTPException(status_code=500, detail=f"Error al eliminar dependencia: {str(e)}")

@router.get("/admin/products/{product_id}/dependencies", response_model=List[OptionDependency])
def get_product_dependencies(product_id: int, db: Session = Depends(get_db)):
    """
    Gets all dependencies of a product.
    """
    return product_service.get_product_dependencies(db=db, product_id=product_id) 
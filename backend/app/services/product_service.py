from sqlalchemy.orm import Session
from app.models.product import Product, PartType, PartOption, OptionDependency, ConditionalPrice
from app.schemas.product import ProductCreate, PartTypeCreate, PartOptionCreate, OptionDependencyCreate, ConditionalPriceCreate
from typing import List
from decimal import Decimal
from app.models.product import DependencyType

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()

def get_featured_products(db: Session, limit: int = 3):
    """
    Obtiene los productos marcados como destacados.
    """
    return db.query(Product).filter(Product.featured == True).limit(limit).all()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def create_part_type(db: Session, part_type: PartTypeCreate, product_id: int):
    db_part_type = PartType(**part_type.dict(), product_id=product_id)
    db.add(db_part_type)
    db.commit()
    db.refresh(db_part_type)
    return db_part_type

def create_part_option(db: Session, part_option: PartOptionCreate, part_type_id: int):
    db_part_option = PartOption(**part_option.dict(), part_type_id=part_type_id)
    db.add(db_part_option)
    db.commit()
    db.refresh(db_part_option)
    return db_part_option

def create_option_dependency(db: Session, dependency: OptionDependencyCreate, option_id: int):
    db_dependency = OptionDependency(**dependency.dict(), option_id=option_id)
    db.add(db_dependency)
    db.commit()
    db.refresh(db_dependency)
    return db_dependency

def create_conditional_price(db: Session, conditional_price: ConditionalPriceCreate, option_id: int):
    db_conditional_price = ConditionalPrice(**conditional_price.dict(), option_id=option_id)
    db.add(db_conditional_price)
    db.commit()
    db.refresh(db_conditional_price)
    return db_conditional_price

def calculate_price(db: Session, selected_option_ids: List[int]) -> Decimal:
    """
    Calcula el precio total de las opciones seleccionadas, teniendo en cuenta precios condicionales.
    """
    total = Decimal('0')
    selected_options = db.query(PartOption).filter(PartOption.id.in_(selected_option_ids)).all()
    
    for option in selected_options:
        # Buscar si hay un precio condicional aplicable
        conditional_price = db.query(ConditionalPrice).filter(
            ConditionalPrice.option_id == option.id,
            ConditionalPrice.condition_option_id.in_(selected_option_ids)
        ).first()
        
        # Si hay un precio condicional, usar ese, de lo contrario usar el precio base
        if conditional_price:
            total += conditional_price.conditional_price
        else:
            total += option.base_price
            
    return total

def validate_compatibility(db: Session, selected_option_ids: List[int]) -> bool:
    """
    Verifica si las opciones seleccionadas son compatibles entre sí.
    Retorna True si son compatibles, False si no lo son.
    """
    for option_id in selected_option_ids:
        # Buscar todas las dependencias para esta opción
        dependencies = db.query(OptionDependency).filter(
            OptionDependency.option_id == option_id
        ).all()
        
        for dependency in dependencies:
            if dependency.type == DependencyType.requires:
                # Si requiere una opción que no está seleccionada, no es compatible
                if dependency.depends_on_option_id not in selected_option_ids:
                    return False
            elif dependency.type == DependencyType.excludes:
                # Si excluye una opción que está seleccionada, no es compatible
                if dependency.depends_on_option_id in selected_option_ids:
                    return False
    
    return True

def get_available_options(db: Session, product_id: int, current_selection: List[int] = None):
    """
    Obtiene todas las opciones disponibles para un producto, considerando las selecciones actuales.
    Marca las opciones como disponibles o no según las reglas de compatibilidad.
    """
    if current_selection is None:
        current_selection = []
        
    # Obtener todas las opciones para el producto
    part_types = db.query(PartType).filter(PartType.product_id == product_id).all()
    
    result = []
    for part_type in part_types:
        part_type_data = {
            "id": part_type.id,
            "name": part_type.name,
            "options": []
        }
        
        for option in part_type.options:
            # Comprobar si la opción está en stock
            if not option.in_stock:
                continue
                
            # Verificar compatibilidad de esta opción con la selección actual
            is_compatible = True
            
            # Si la opción ya está seleccionada, es compatible
            if option.id in current_selection:
                is_compatible = True
            else:
                # Comprobar con una selección temporal que incluya esta opción
                temp_selection = current_selection + [option.id]
                is_compatible = validate_compatibility(db, temp_selection)
            
            part_type_data["options"].append({
                "id": option.id,
                "name": option.name,
                "base_price": option.base_price,
                "is_compatible": is_compatible
            })
            
        result.append(part_type_data)
        
    return result 
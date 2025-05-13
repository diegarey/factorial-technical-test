from sqlalchemy.orm import Session
from app.models.product import Product, PartType, PartOption, OptionDependency, ConditionalPrice, DependencyType
from app.models.cart import CartItemOption
from app.schemas.product import ProductCreate, PartTypeCreate, PartOptionCreate, OptionDependencyCreate, ConditionalPriceCreate
from typing import List, Optional
from decimal import Decimal
from fastapi import HTTPException

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()

def get_total_products(db: Session):
    """
    Obtiene el número total de productos disponibles.
    """
    return db.query(Product).count()

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
    No incluye el precio base del producto, solo el precio adicional de las opciones.
    """
    # Si no hay opciones seleccionadas, retornar cero
    if not selected_option_ids:
        print("No hay opciones seleccionadas para calcular precio")
        return Decimal('0')
    
    total = Decimal('0')
    
    try:
        # Obtener las opciones seleccionadas
        selected_options = db.query(PartOption).filter(PartOption.id.in_(selected_option_ids)).all()
        
        if not selected_options:
            print("No se encontraron opciones para los IDs proporcionados")
            return Decimal('0')
            
        # Calcular precio total de las opciones
        for option in selected_options:
            # Buscar si hay un precio condicional aplicable
            conditional_price = db.query(ConditionalPrice).filter(
                ConditionalPrice.option_id == option.id,
                ConditionalPrice.condition_option_id.in_(selected_option_ids)
            ).first()
            
            # Si hay un precio condicional, usar ese, de lo contrario usar el precio base
            if conditional_price:
                total += conditional_price.conditional_price
                print(f"Usando precio condicional para opción {option.name}: {conditional_price.conditional_price}")
            else:
                total += option.base_price
                print(f"Usando precio base para opción {option.name}: {option.base_price}")
        
        print(f"Precio total calculado: {total}")
        return total
    except Exception as e:
        print(f"Error al calcular precio: {e}")
        return Decimal('0')

def validate_compatibility(db: Session, selected_option_ids: List[int]) -> dict:
    """
    Verifica si las opciones seleccionadas son compatibles entre sí.
    Retorna un diccionario con el resultado y detalles de la incompatibilidad si existe.
    """
    result = {
        "is_compatible": True,
        "incompatibility_details": None
    }
    
    print(f"Validando compatibilidad para opciones: {selected_option_ids}")
    
    if len(selected_option_ids) == 0:
        return result
    
    # Obtener los nombres de las opciones para mejor información
    options_info = {}
    db_options = db.query(PartOption).filter(PartOption.id.in_(selected_option_ids)).all()
    for option in db_options:
        options_info[option.id] = option.name
    
    for option_id in selected_option_ids:
        # Buscar todas las dependencias para esta opción
        dependencies = db.query(OptionDependency).filter(
            OptionDependency.option_id == option_id
        ).all()
        
        for dependency in dependencies:
            if dependency.type == DependencyType.requires:
                # Si requiere una opción que no está seleccionada, no es compatible
                if dependency.depends_on_option_id not in selected_option_ids:
                    required_option = db.query(PartOption).filter(PartOption.id == dependency.depends_on_option_id).first()
                    result["is_compatible"] = False
                    result["incompatibility_details"] = {
                        "type": "requires",
                        "option_id": option_id,
                        "option_name": options_info.get(option_id, f"Opción {option_id}"),
                        "required_option_id": dependency.depends_on_option_id,
                        "required_option_name": required_option.name if required_option else f"Opción {dependency.depends_on_option_id}"
                    }
                    print(f"Incompatibilidad: {options_info.get(option_id)} requiere {required_option.name if required_option else dependency.depends_on_option_id}")
                    return result
            elif dependency.type == DependencyType.excludes:
                # Si excluye una opción que está seleccionada, no es compatible
                if dependency.depends_on_option_id in selected_option_ids:
                    excluded_option = db.query(PartOption).filter(PartOption.id == dependency.depends_on_option_id).first()
                    result["is_compatible"] = False
                    result["incompatibility_details"] = {
                        "type": "excludes",
                        "option_id": option_id,
                        "option_name": options_info.get(option_id, f"Opción {option_id}"),
                        "excluded_option_id": dependency.depends_on_option_id,
                        "excluded_option_name": excluded_option.name if excluded_option else f"Opción {dependency.depends_on_option_id}"
                    }
                    print(f"Incompatibilidad: {options_info.get(option_id)} excluye {excluded_option.name if excluded_option else dependency.depends_on_option_id}")
                    return result
    
    print("Todas las opciones son compatibles")
    return result

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
                compatibility_result = validate_compatibility(db, temp_selection)
                is_compatible = compatibility_result["is_compatible"]
            
            part_type_data["options"].append({
                "id": option.id,
                "name": option.name,
                "base_price": option.base_price,
                "is_compatible": is_compatible
            })
            
        result.append(part_type_data)
        
    return result

def update_product(db: Session, product_id: int, product: ProductCreate):
    """
    Actualiza un producto existente.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    
    # Actualizar los campos del producto
    product_data = product.dict(exclude_unset=True)
    for key, value in product_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_part_type(db: Session, part_type_id: int):
    """
    Elimina un tipo de parte y todas sus opciones asociadas.
    Maneja la eliminación de todas las relaciones dependientes.
    """
    part_type = db.query(PartType).filter(PartType.id == part_type_id).first()
    if not part_type:
        raise HTTPException(status_code=404, detail="Tipo de parte no encontrado")
    
    try:
        # Obtener todas las opciones del tipo de parte
        options = db.query(PartOption).filter(PartOption.part_type_id == part_type_id).all()
        
        for option in options:
            # Eliminar dependencias y precios condicionales
            db.query(OptionDependency).filter(
                (OptionDependency.option_id == option.id) |
                (OptionDependency.depends_on_option_id == option.id)
            ).delete(synchronize_session=False)
            
            db.query(ConditionalPrice).filter(
                (ConditionalPrice.option_id == option.id) |
                (ConditionalPrice.condition_option_id == option.id)
            ).delete(synchronize_session=False)
            
            # Eliminar referencias en el carrito
            db.query(CartItemOption).filter(
                CartItemOption.part_option_id == option.id
            ).delete(synchronize_session=False)
        
        # Ahora podemos eliminar el tipo de parte de forma segura
        db.delete(part_type)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar tipo de parte: {str(e)}"
        )

def delete_part_option(db: Session, part_type_id: int, option_id: int):
    """
    Elimina una opción de un tipo de parte.
    Primero verifica si la opción existe y si pertenece al tipo de parte especificado.
    También elimina todas las dependencias relacionadas.
    """
    # Primero verificar si el tipo de parte existe
    part_type = db.query(PartType).filter(PartType.id == part_type_id).first()
    if not part_type:
        raise HTTPException(status_code=404, detail=f"Tipo de parte {part_type_id} no encontrado")

    # Luego verificar si la opción existe y pertenece a este tipo de parte
    option = db.query(PartOption).filter(
        PartOption.id == option_id,
        PartOption.part_type_id == part_type_id
    ).first()
    
    if not option:
        raise HTTPException(status_code=404, detail=f"Opción {option_id} no encontrada en el tipo de parte {part_type_id}")
    
    try:
        # Eliminar primero las dependencias y precios condicionales
        db.query(OptionDependency).filter(
            (OptionDependency.option_id == option_id) |
            (OptionDependency.depends_on_option_id == option_id)
        ).delete(synchronize_session=False)
        
        db.query(ConditionalPrice).filter(
            (ConditionalPrice.option_id == option_id) |
            (ConditionalPrice.condition_option_id == option_id)
        ).delete(synchronize_session=False)
        
        # Eliminar referencias en el carrito
        db.query(CartItemOption).filter(
            CartItemOption.part_option_id == option_id
        ).delete(synchronize_session=False)
        
        # Finalmente eliminar la opción
        db.delete(option)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al eliminar la opción: {str(e)}"
        )

def delete_product(db: Session, product_id: int) -> None:
    """
    Elimina un producto y todos sus componentes asociados.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        db.delete(product)
        db.commit()
    return None 
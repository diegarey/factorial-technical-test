from sqlalchemy.orm import Session
from app.models.product import Product, PartType, PartOption, OptionDependency, ConditionalPrice, DependencyType
from app.models.cart import CartItemOption
from app.schemas.product import ProductCreate, PartTypeCreate, PartOptionCreate, OptionDependencyCreate, ConditionalPriceCreate
from typing import List, Optional
from decimal import Decimal
from fastapi import HTTPException

def get_product(db: Session, product_id: int):
    """
    Obtiene un producto por su ID, incluyendo todos sus tipos de partes, opciones y dependencias.
    Convierte los valores enum a strings para evitar errores de serialización.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if product:
        # Asegurar que los tipos de dependencia sean strings
        for part_type in product.part_types:
            for option in part_type.options:
                for dependency in option.dependencies:
                    # Convertir enum a string para la serialización
                    if hasattr(dependency.type, 'value'):
                        dependency.type = dependency.type.value
    
    return product

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

def validate_compatibility(db: Session, product_id=None, selected_option_ids: List[int] = None) -> dict:
    """
    Verifica la compatibilidad de las opciones para un producto.
    """
    if selected_option_ids is None:
        selected_option_ids = []
    
    print(f"Validando compatibilidad para opciones: {selected_option_ids}")
    
    # Obtener el producto y sus tipos de componentes
    if product_id is None and selected_option_ids:
        # Intentar obtener el product_id de la primera opción seleccionada
        first_option = db.query(PartOption).filter(PartOption.id == selected_option_ids[0]).first()
        if first_option:
            part_type = db.query(PartType).filter(PartType.id == first_option.part_type_id).first()
            if part_type:
                product_id = part_type.product_id
    
    if not product_id:
        raise HTTPException(status_code=400, detail="No se pudo determinar el producto")
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    result = {
        "product": {
            "id": product.id,
            "name": product.name,
            "components": []
        }
    }
    
    # Si no hay selecciones, todas las opciones son compatibles
    if not selected_option_ids:
        part_types = db.query(PartType).filter(PartType.product_id == product_id).all()
        for part_type in part_types:
            component_data = {
                "id": part_type.id,
                "name": part_type.name,
                "options": []
            }
            
            options = db.query(PartOption).filter(PartOption.part_type_id == part_type.id).all()
            for option in options:
                option_data = {
                    "id": option.id,
                    "name": option.name,
                    "base_price": option.base_price,
                    "in_stock": option.in_stock,
                    "selected": False,
                    "is_compatible": option.in_stock  # Solo incompatible si no hay stock
                }
                
                # Añadir motivo de disponibilidad
                if not option.in_stock:
                    option_data["availability_reason"] = "out_of_stock"
                
                component_data["options"].append(option_data)
            
            result["product"]["components"].append(component_data)
        
        return result
    
    # Obtener todas las dependencias relevantes
    all_dependencies = []
    for option_id in selected_option_ids:
        # Obtener dependencias directas (donde la opción es el origen)
        direct_deps = db.query(OptionDependency).filter(
            OptionDependency.option_id == option_id
        ).all()
        all_dependencies.extend(direct_deps)
        
        # Obtener dependencias inversas (donde la opción es el destino)
        inverse_deps = db.query(OptionDependency).filter(
            OptionDependency.depends_on_option_id == option_id
        ).all()
        all_dependencies.extend(inverse_deps)
    
    # Verificar si hay incompatibilidades en las selecciones actuales
    has_incompatibilities = False
    incompatible_options = set()  # Conjunto para almacenar IDs de opciones incompatibles
    incompatible_reasons = {}  # Diccionario para almacenar motivos de incompatibilidad
    
    for option_id in selected_option_ids:
        option = db.query(PartOption).filter(PartOption.id == option_id).first()
        if not option:
            continue
            
        # Verificar dependencias requires
        requires_deps = db.query(OptionDependency).filter(
            OptionDependency.option_id == option_id,
            OptionDependency.type == DependencyType.requires
        ).all()
        
        for dep in requires_deps:
            if dep.depends_on_option_id not in selected_option_ids:
                has_incompatibilities = True
                incompatible_options.add(option_id)  # La opción que requiere algo no satisfecho es incompatible
                required = db.query(PartOption).filter(PartOption.id == dep.depends_on_option_id).first()
                
                # Guardar el motivo de incompatibilidad
                incompatible_reasons[option_id] = {
                    "reason": "requires",
                    "dependency_id": dep.depends_on_option_id,
                    "dependency_name": required.name if required else f"Opción {dep.depends_on_option_id}"
                }
                
                print(f"Incompatibilidad: {option.name} requiere {required.name if required else dep.depends_on_option_id}")
                break
        
        # Verificar dependencias excludes
        excludes_deps = db.query(OptionDependency).filter(
            OptionDependency.option_id == option_id,
            OptionDependency.type == DependencyType.excludes
        ).all()
        
        for dep in excludes_deps:
            if dep.depends_on_option_id in selected_option_ids:
                has_incompatibilities = True
                incompatible_options.add(option_id)  # La opción que excluye es incompatible
                incompatible_options.add(dep.depends_on_option_id)  # La opción excluida es incompatible
                excluded = db.query(PartOption).filter(PartOption.id == dep.depends_on_option_id).first()
                
                # Guardar motivos para ambas opciones
                incompatible_reasons[option_id] = {
                    "reason": "excludes",
                    "dependency_id": dep.depends_on_option_id,
                    "dependency_name": excluded.name if excluded else f"Opción {dep.depends_on_option_id}"
                }
                
                incompatible_reasons[dep.depends_on_option_id] = {
                    "reason": "excluded_by",
                    "dependency_id": option_id,
                    "dependency_name": option.name
                }
                
                print(f"Incompatibilidad: {option.name} excluye {excluded.name if excluded else dep.depends_on_option_id}")
                break
    
    # Identificar opciones requeridas
    required_options = set()
    required_by = {}  # Diccionario para almacenar qué opción requiere a cuál
    
    for dep in all_dependencies:
        if dep.type == DependencyType.requires and dep.option_id in selected_option_ids:
            required_options.add(dep.depends_on_option_id)
            required = db.query(PartOption).filter(PartOption.id == dep.depends_on_option_id).first()
            requiring = db.query(PartOption).filter(PartOption.id == dep.option_id).first()
            
            # Guardar información sobre quién requiere esta opción
            if dep.depends_on_option_id not in required_by:
                required_by[dep.depends_on_option_id] = []
            required_by[dep.depends_on_option_id].append({
                "option_id": dep.option_id,
                "option_name": requiring.name if requiring else f"Opción {dep.option_id}"
            })
            
            print(f"Opción {required.name if required else dep.depends_on_option_id} es requerida por una opción seleccionada")
    
    # Solo auto-seleccionar si no hay incompatibilidades
    final_selected_ids = selected_option_ids.copy()
    if not has_incompatibilities:
        final_selected_ids = list(set(selected_option_ids) | required_options)
        print("No hay incompatibilidades, auto-seleccionando opciones requeridas")
    else:
        print("Hay incompatibilidades, no se auto-seleccionarán las opciones requeridas")
    
    # Procesar cada tipo de componente
    part_types = db.query(PartType).filter(PartType.product_id == product_id).all()
    for part_type in part_types:
        component_data = {
            "id": part_type.id,
            "name": part_type.name,
            "options": []
        }
        
        # Obtener todas las opciones para este tipo de componente
        options = db.query(PartOption).filter(PartOption.part_type_id == part_type.id).all()
        
        # Determinar si ya hay algo seleccionado para este tipo de componente
        part_type_selected_option_ids = [opt_id for opt_id in selected_option_ids if db.query(PartOption).filter(PartOption.id == opt_id, PartOption.part_type_id == part_type.id).first()]
        has_selection_for_part_type = len(part_type_selected_option_ids) > 0
        
        for option in options:
            option_data = {
                "id": option.id,
                "name": option.name,
                "base_price": option.base_price,
                "in_stock": option.in_stock,
                "selected": option.id in final_selected_ids,
                "is_compatible": True
            }
            
            # Las opciones seleccionadas siempre son compatibles
            if option.id in selected_option_ids:
                # Si la opción fue seleccionada por el usuario pero tiene incompatibilidades,
                # indicamos que es compatible pero requiere otras opciones
                if option.id in incompatible_options:
                    option_data["requires_additional_selection"] = True
                    if option.id in incompatible_reasons:
                        option_data["compatibility_details"] = incompatible_reasons[option.id]
                component_data["options"].append(option_data)
                continue
            
            # Si no hay stock, marcar como no compatible
            if not option.in_stock:
                option_data["is_compatible"] = False
                option_data["availability_reason"] = "out_of_stock"
                print(f"Opción {option.name} no compatible por falta de stock")
                component_data["options"].append(option_data)
                continue
            
            # Si ya hay una opción seleccionada para este componente y esta no está seleccionada,
            # marcarla como no disponible para selección pero aún es compatible
            if has_selection_for_part_type and option.id not in final_selected_ids:
                option_data["is_compatible"] = True
                option_data["available_for_selection"] = False
                option_data["availability_reason"] = "another_option_selected"
                component_data["options"].append(option_data)
                continue
            
            # Si la opción está en las incompatibilidades, marcarla como incompatible
            if option.id in incompatible_options:
                option_data["is_compatible"] = False
                
                # Añadir motivo de incompatibilidad
                if option.id in incompatible_reasons:
                    option_data["availability_reason"] = incompatible_reasons[option.id]["reason"]
                    option_data["compatibility_details"] = incompatible_reasons[option.id]
                
                print(f"Opción {option.name} marcada como incompatible por conflictos")
                component_data["options"].append(option_data)
                continue
            
            # Si hay incompatibilidades y esta opción es requerida, es compatible pero no auto-seleccionada
            if has_incompatibilities and option.id in required_options:
                # Añadir información sobre quién requiere esta opción
                if option.id in required_by:
                    option_data["required_by"] = required_by[option.id]
                
                component_data["options"].append(option_data)
                continue
            
            # Verificar si esta opción es compatible con las selecciones actuales
            is_compatible = True
            compatibility_reason = None
            
            # 1. Verificar si alguna opción seleccionada requiere específicamente otra opción de este tipo
            for dep in all_dependencies:
                if dep.type == DependencyType.requires:
                    required_option = db.query(PartOption).filter(PartOption.id == dep.depends_on_option_id).first()
                    if required_option and required_option.part_type_id == part_type.id:
                        # Si se requiere una opción específica y esta no es esa opción, es incompatible
                        if option.id != required_option.id:
                            is_compatible = False
                            requiring_option = db.query(PartOption).filter(PartOption.id == dep.option_id).first()
                            
                            compatibility_reason = {
                                "reason": "requires_other",
                                "requiring_id": dep.option_id,
                                "requiring_name": requiring_option.name if requiring_option else f"Opción {dep.option_id}",
                                "required_id": required_option.id,
                                "required_name": required_option.name
                            }
                            
                            print(f"Opción {option.name} incompatible porque se requiere específicamente {required_option.name}")
                            break
            
            # 2. Verificar dependencias propias de la opción
            if is_compatible:
                option_deps = db.query(OptionDependency).filter(
                    OptionDependency.option_id == option.id
                ).all()
                
                for dep in option_deps:
                    if dep.type == DependencyType.requires:
                        # Si esta opción requiere algo que no está seleccionado
                        if dep.depends_on_option_id not in final_selected_ids:
                            is_compatible = False
                            required = db.query(PartOption).filter(PartOption.id == dep.depends_on_option_id).first()
                            
                            compatibility_reason = {
                                "reason": "requires",
                                "dependency_id": dep.depends_on_option_id,
                                "dependency_name": required.name if required else f"Opción {dep.depends_on_option_id}"
                            }
                            
                            print(f"Opción {option.name} incompatible porque requiere {required.name if required else dep.depends_on_option_id}")
                            break
                    elif dep.type == DependencyType.excludes:
                        # Si esta opción excluye algo que está seleccionado
                        if dep.depends_on_option_id in final_selected_ids:
                            is_compatible = False
                            excluded = db.query(PartOption).filter(PartOption.id == dep.depends_on_option_id).first()
                            
                            compatibility_reason = {
                                "reason": "excludes",
                                "dependency_id": dep.depends_on_option_id,
                                "dependency_name": excluded.name if excluded else f"Opción {dep.depends_on_option_id}"
                            }
                            
                            print(f"Opción {option.name} incompatible porque excluye {excluded.name if excluded else dep.depends_on_option_id}")
                            break
            
            # 3. Si hay incompatibilidades en las selecciones actuales, verificar si esta opción es parte del conflicto
            if has_incompatibilities:
                # Verificar si esta opción es excluida por alguna opción seleccionada
                excluding_deps = db.query(OptionDependency).filter(
                    OptionDependency.option_id.in_(selected_option_ids),
                    OptionDependency.type == DependencyType.excludes,
                    OptionDependency.depends_on_option_id == option.id
                ).all()
                
                if excluding_deps:
                    is_compatible = False
                    excluder = db.query(PartOption).filter(PartOption.id == excluding_deps[0].option_id).first()
                    
                    compatibility_reason = {
                        "reason": "excluded_by",
                        "dependency_id": excluding_deps[0].option_id,
                        "dependency_name": excluder.name if excluder else f"Opción {excluding_deps[0].option_id}"
                    }
                    
                    print(f"Opción {option.name} incompatible porque es excluida por {excluder.name if excluder else excluding_deps[0].option_id}")
                
                # Verificar si esta opción es requerida por una opción que tiene conflictos
                requiring_deps = db.query(OptionDependency).filter(
                    OptionDependency.depends_on_option_id == option.id,
                    OptionDependency.type == DependencyType.requires
                ).all()
                
                for dep in requiring_deps:
                    if dep.option_id in selected_option_ids and not all(
                        req.depends_on_option_id in selected_option_ids
                        for req in db.query(OptionDependency).filter(
                            OptionDependency.option_id == dep.option_id,
                            OptionDependency.type == DependencyType.requires
                        ).all()
                    ):
                        is_compatible = False
                        requiring = db.query(PartOption).filter(PartOption.id == dep.option_id).first()
                        
                        compatibility_reason = {
                            "reason": "required_by_incompatible",
                            "dependency_id": dep.option_id,
                            "dependency_name": requiring.name if requiring else f"Opción {dep.option_id}"
                        }
                        
                        print(f"Opción {option.name} incompatible porque es requerida por {requiring.name if requiring else dep.option_id} que tiene conflictos")
                        break
            
            option_data["is_compatible"] = is_compatible
            
            # Añadir motivo de incompatibilidad
            if not is_compatible and compatibility_reason:
                option_data["availability_reason"] = compatibility_reason["reason"]
                option_data["compatibility_details"] = compatibility_reason
                
            component_data["options"].append(option_data)
        
        result["product"]["components"].append(component_data)
    
    print("Resultado de validación:", result)
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
                # Verificamos si esta opción tiene dependencias incompatibles
                is_compatible = True
                
                # Comprobar dependencias de esta opción
                dependencies = db.query(OptionDependency).filter(
                    OptionDependency.option_id == option.id
                ).all()
                
                for dependency in dependencies:
                    if dependency.type == DependencyType.requires:
                        if dependency.depends_on_option_id not in temp_selection:
                            is_compatible = False
                            break
                    elif dependency.type == DependencyType.excludes:
                        if dependency.depends_on_option_id in temp_selection:
                            is_compatible = False
                            break
                
                # Verificar si alguna de las opciones seleccionadas excluye esta opción
                if is_compatible and current_selection:
                    excluding_dependencies = db.query(OptionDependency).filter(
                        OptionDependency.option_id.in_(current_selection),
                        OptionDependency.type == DependencyType.excludes,
                        OptionDependency.depends_on_option_id == option.id
                    ).all()
                    
                    if excluding_dependencies:
                        is_compatible = False
            
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

def get_product_dependencies(db: Session, product_id: int) -> List[OptionDependency]:
    """
    Obtiene todas las dependencias de las opciones de un producto.
    """
    print(f"Buscando dependencias para el producto {product_id}")
    
    # Obtener todas las opciones del producto
    part_types = db.query(PartType).filter(PartType.product_id == product_id).all()
    print(f"Tipos de parte encontrados: {len(part_types)}")
    print("Tipos de parte:", [{"id": pt.id, "name": pt.name} for pt in part_types])
    
    option_ids = []
    for part_type in part_types:
        options = db.query(PartOption).filter(PartOption.part_type_id == part_type.id).all()
        print(f"Opciones encontradas para tipo de parte {part_type.name}:", [{"id": opt.id, "name": opt.name} for opt in options])
        option_ids.extend([option.id for option in options])
    
    print(f"IDs de opciones encontradas: {option_ids}")
    
    # Obtener todas las dependencias donde la opción principal está en las opciones del producto
    dependencies = db.query(OptionDependency).filter(
        OptionDependency.option_id.in_(option_ids)
    ).all()
    
    print(f"Dependencias encontradas: {len(dependencies)}")
    for dep in dependencies:
        option = db.query(PartOption).filter(PartOption.id == dep.option_id).first()
        depends_on = db.query(PartOption).filter(PartOption.id == dep.depends_on_option_id).first()
        print(f"Dependencia: {option.name if option else 'Opción no encontrada'} ({dep.option_id}) {dep.type.value} {depends_on.name if depends_on else 'Opción no encontrada'} ({dep.depends_on_option_id})")
    
    # Convertir el tipo de dependencia a string antes de devolverlo
    for dep in dependencies:
        dep.type = dep.type.value
    
    return dependencies 

def get_product_id_from_options(db: Session, selected_option_ids: List[int]) -> Optional[int]:
    """
    Obtiene el ID del producto al que pertenecen las opciones seleccionadas.
    Asume que todas las opciones pertenecen al mismo producto.
    
    Args:
        db: Sesión de base de datos
        selected_option_ids: Lista de IDs de opciones seleccionadas
        
    Returns:
        ID del producto o None si no se encuentran opciones
    """
    if not selected_option_ids:
        return None
    
    # Tomamos la primera opción para obtener el tipo de parte y luego el producto
    first_option = db.query(PartOption).filter(PartOption.id == selected_option_ids[0]).first()
    if not first_option:
        return None
    
    # Obtenemos el tipo de parte
    part_type = db.query(PartType).filter(PartType.id == first_option.part_type_id).first()
    if not part_type:
        return None
    
    # Devolvemos el ID del producto
    return part_type.product_id 
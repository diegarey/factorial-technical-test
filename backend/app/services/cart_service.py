from sqlalchemy.orm import Session
from app.models.cart import Cart, CartItem, CartItemOption
from app.models.product import Product, PartOption
from app.schemas.cart import CartCreate, CartItemCreate
from app.services.product_service import calculate_price, validate_compatibility
from typing import List

def get_cart(db: Session, cart_id: int):
    return db.query(Cart).filter(Cart.id == cart_id).first()

def create_cart(db: Session, cart: CartCreate):
    db_cart = Cart(**cart.dict())
    db.add(db_cart)
    db.commit()
    db.refresh(db_cart)
    return db_cart

def add_to_cart(db: Session, cart_id: int, product_id: int, selected_option_ids: List[int], quantity: int = 1):
    """
    Añade un producto configurado al carrito.
    """
    # Validar que las opciones seleccionadas sean compatibles
    compatibility_result = validate_compatibility(db, product_id=product_id, selected_option_ids=selected_option_ids)
    
    # Comprobar si el resultado tiene la estructura esperada (el nuevo formato) o el formato antiguo
    if isinstance(compatibility_result, dict) and "product" in compatibility_result:
        # Nuevo formato - necesitamos determinar la compatibilidad general
        is_compatible = True
        incompatibility_details = None
        
        # Verificar si alguna opción seleccionada es incompatible
        for component in compatibility_result["product"]["components"]:
            for option in component["options"]:
                if option.get("selected", False) and not option.get("is_compatible", True):
                    is_compatible = False
                    # Intentar extraer detalles de incompatibilidad si existen
                    if "compatibility_details" in option:
                        incompatibility_details = {
                            "type": option["compatibility_details"].get("reason", "unknown"),
                            "option_name": option["name"],
                            "option_id": option["id"]
                        }
                        # Añadir detalles específicos según el tipo de incompatibilidad
                        if option["compatibility_details"]["reason"] == "requires":
                            incompatibility_details["required_option_name"] = option["compatibility_details"]["dependency_name"]
                            incompatibility_details["required_option_id"] = option["compatibility_details"]["dependency_id"]
                        elif option["compatibility_details"]["reason"] == "excludes":
                            incompatibility_details["excluded_option_name"] = option["compatibility_details"]["dependency_name"]
                            incompatibility_details["excluded_option_id"] = option["compatibility_details"]["dependency_id"]
                    break
            if not is_compatible:
                break
                
        # Crear un objeto de resultado en el formato que espera el resto del código
        compatibility_result = {
            "is_compatible": is_compatible,
            "incompatibility_details": incompatibility_details
        }
    
    # Ahora usamos el objeto compatibility_result normalizado
    if not compatibility_result.get("is_compatible", False):
        details = compatibility_result.get("incompatibility_details")
        if details:
            if details.get("type") == "excludes":
                raise ValueError(f"La opción '{details['option_name']}' no es compatible con '{details['excluded_option_name']}'")
            elif details.get("type") == "requires":
                raise ValueError(f"La opción '{details['option_name']}' requiere '{details['required_option_name']}'")
            else:
                raise ValueError(f"Hay una incompatibilidad con la opción '{details['option_name']}'")
        else:
            raise ValueError("Las opciones seleccionadas no son compatibles")
    
    # Verificar que todas las opciones estén en stock
    options = db.query(PartOption).filter(PartOption.id.in_(selected_option_ids)).all()
    for option in options:
        if not option.in_stock:
            raise ValueError(f"La opción '{option.name}' no está disponible")
    
    # Obtener el producto para acceder a su precio base
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Producto con ID {product_id} no encontrado")
    
    # Calcular el precio de las opciones
    options_price = calculate_price(db, selected_option_ids)
    
    # Sumar el precio base del producto y el precio de las opciones
    total_price = product.base_price + options_price
    
    print(f"Añadiendo al carrito - Producto ID: {product_id}, Precio base: {product.base_price}, Precio opciones: {options_price}, Precio total: {total_price}")
    
    # Crear el ítem del carrito con el precio total
    db_cart_item = CartItem(
        cart_id=cart_id,
        product_id=product_id,
        price_snapshot=total_price,
        quantity=quantity
    )
    db.add(db_cart_item)
    db.commit()
    db.refresh(db_cart_item)
    
    # Agregar las opciones seleccionadas al ítem
    for option_id in selected_option_ids:
        db_cart_item_option = CartItemOption(
            cart_item_id=db_cart_item.id,
            part_option_id=option_id
        )
        db.add(db_cart_item_option)
    
    db.commit()
    return db_cart_item

def get_cart_items(db: Session, cart_id: int):
    """
    Obtiene todos los ítems en un carrito con sus opciones.
    """
    return db.query(CartItem).filter(CartItem.cart_id == cart_id).all()

def update_cart_item_quantity(db: Session, cart_item_id: int, quantity: int):
    """
    Actualiza la cantidad de un ítem en el carrito.
    """
    db_cart_item = db.query(CartItem).filter(CartItem.id == cart_item_id).first()
    if not db_cart_item:
        raise ValueError("Ítem no encontrado en el carrito")
    
    db_cart_item.quantity = quantity
    db.commit()
    db.refresh(db_cart_item)
    return db_cart_item

def remove_cart_item(db: Session, cart_item_id: int):
    """
    Elimina un ítem del carrito.
    """
    db_cart_item = db.query(CartItem).filter(CartItem.id == cart_item_id).first()
    if not db_cart_item:
        raise ValueError("Ítem no encontrado en el carrito")
    
    db.delete(db_cart_item)
    db.commit()
    return True

def get_or_create_cart(db: Session, user_id: str = None):
    """
    Obtiene o crea un carrito para un usuario o sesión.
    """
    if user_id:
        # Si hay un ID de usuario, intentar encontrar su carrito
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        if cart:
            return cart
    
    # Si no hay carrito o no hay usuario, crear uno nuevo
    new_cart = Cart(user_id=user_id)
    db.add(new_cart)
    db.commit()
    db.refresh(new_cart)
    return new_cart 
from fastapi import APIRouter, Depends, HTTPException, Cookie, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.services import cart_service, product_service
from app.schemas.cart import Cart, CartCreate, AddToCartRequest
import uuid

router = APIRouter()

@router.get("/cart", response_model=Cart)
def get_cart(
    response: Response,
    user_id: Optional[str] = None,
    query_cart_id: Optional[str] = None,
    cart_id: Optional[str] = Cookie(None, alias="cart_id"),
    db: Session = Depends(get_db)
):
    """
    Obtiene o crea un carrito.
    Acepta el ID del carrito ya sea de la cookie o como parámetro de consulta.
    """
    # Usar cart_id de la cookie o del parámetro de consulta
    cart_id_to_use = cart_id
    source = "cookie"
    
    # Si no hay ID en la cookie pero sí en el parámetro de consulta, usar ese
    if (not cart_id or cart_id == "undefined") and query_cart_id:
        cart_id_to_use = query_cart_id
        source = "query param"
    
    print(f"Obteniendo carrito - cookie cart_id: {cart_id}, query cart_id: {query_cart_id}, usando: {cart_id_to_use} de {source}")
    
    # Si hay un ID de carrito, buscar ese carrito
    if cart_id_to_use:
        try:
            cart_id_int = int(cart_id_to_use)
            db_cart = cart_service.get_cart(db, cart_id_int)
            if db_cart:
                print(f"Carrito encontrado con ID: {cart_id_int}")
                # Asegurar que la cookie esté establecida incluso si usamos el parámetro de consulta
                response.set_cookie(
                    key="cart_id", 
                    value=str(db_cart.id), 
                    max_age=30*24*60*60,
                    httponly=False,
                    samesite="lax",
                    secure=False,
                    path="/"
                )
                return db_cart
            else:
                print(f"No se encontró carrito con ID: {cart_id_int}")
        except (ValueError, TypeError) as e:
            print(f"Error al convertir cart_id: {cart_id_to_use} a entero: {e}")
    else:
        print("No se recibió cart_id válido ni de cookie ni de query param")
    
    # Si hay un ID de usuario, buscar o crear un carrito para ese usuario
    if user_id:
        db_cart = cart_service.get_or_create_cart(db, user_id)
        print(f"Carrito obtenido/creado para usuario {user_id}: {db_cart.id}")
    else:
        # Si no hay ni ID de carrito ni ID de usuario, crear un carrito nuevo
        db_cart = cart_service.get_or_create_cart(db)
        print(f"Nuevo carrito creado: {db_cart.id}")
    
    # Establecer cookie con el ID del carrito
    response.set_cookie(
        key="cart_id", 
        value=str(db_cart.id), 
        max_age=30*24*60*60,
        httponly=False,
        samesite="lax",
        secure=False,
        path="/"
    )
    print(f"Cookie cart_id establecida: {db_cart.id}, modo lax")
    
    return db_cart

@router.post("/cart/items", status_code=201)
def add_to_cart(
    request: AddToCartRequest,
    response: Response,
    query_cart_id: Optional[str] = None,
    cart_id: Optional[str] = Cookie(None, alias="cart_id"),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Añade un producto al carrito con las opciones seleccionadas.
    Acepta el ID del carrito ya sea de la cookie o como parámetro de consulta.
    """
    # Usar cart_id de la cookie o del parámetro de consulta
    cart_id_to_use = cart_id
    source = "cookie"
    
    # Si no hay ID en la cookie pero sí en el parámetro de consulta, usar ese
    if (not cart_id or cart_id == "undefined") and query_cart_id:
        cart_id_to_use = query_cart_id
        source = "query param"
        
    print(f"Añadiendo al carrito - cookie cart_id: {cart_id}, query cart_id: {query_cart_id}, usando: {cart_id_to_use} de {source}")
    
    # Validar compatibilidad de opciones
    compatibility_result = product_service.validate_compatibility(db, request.selected_options)
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
    
    # Obtener o crear carrito
    db_cart = None
    if cart_id_to_use:
        try:
            cart_id_int = int(cart_id_to_use)
            db_cart = cart_service.get_cart(db, cart_id_int)
            print(f"Carrito encontrado con ID: {cart_id_int}")
        except (ValueError, TypeError) as e:
            print(f"Error al convertir cart_id: {cart_id_to_use} a entero: {e}")
            db_cart = None
    
    if not db_cart:
        db_cart = cart_service.get_or_create_cart(db, user_id)
        print(f"Nuevo carrito creado con ID: {db_cart.id}")
    
    # Establecer cookie con el ID del carrito con la misma configuración que get_cart
    response.set_cookie(
        key="cart_id", 
        value=str(db_cart.id), 
        max_age=30*24*60*60,
        httponly=False,
        samesite="lax",
        secure=False,
        path="/"
    )
    print(f"Cookie cart_id establecida: {db_cart.id}, modo lax")
    
    # Añadir producto al carrito
    try:
        cart_item = cart_service.add_to_cart(
            db, 
            db_cart.id, 
            request.product_id, 
            request.selected_options, 
            request.quantity
        )
        result = {"message": "Producto añadido al carrito", "cart_item_id": cart_item.id, "cart_id": db_cart.id}
        print(f"Producto añadido con éxito: {result}")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/cart/items/{cart_item_id}")
def update_cart_item(
    cart_item_id: int,
    quantity: int,
    db: Session = Depends(get_db)
):
    """
    Actualiza la cantidad de un ítem en el carrito.
    """
    try:
        cart_item = cart_service.update_cart_item_quantity(db, cart_item_id, quantity)
        return {"message": "Cantidad actualizada", "cart_item": cart_item}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/cart/items/{cart_item_id}")
def remove_from_cart(
    cart_item_id: int,
    db: Session = Depends(get_db)
):
    """
    Elimina un ítem del carrito.
    """
    try:
        cart_service.remove_cart_item(db, cart_item_id)
        return {"message": "Ítem eliminado del carrito"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) 
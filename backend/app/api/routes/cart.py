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
    user_id: Optional[str] = None,
    cart_id: Optional[str] = Cookie(None, alias="cart_id"),
    db: Session = Depends(get_db)
):
    """
    Obtiene o crea un carrito.
    """
    # Si hay un ID de carrito en cookie, buscar ese carrito
    if cart_id:
        db_cart = cart_service.get_cart(db, int(cart_id))
        if db_cart:
            return db_cart
    
    # Si hay un ID de usuario, buscar o crear un carrito para ese usuario
    if user_id:
        db_cart = cart_service.get_or_create_cart(db, user_id)
    else:
        # Si no hay ni ID de carrito ni ID de usuario, crear un carrito nuevo
        db_cart = cart_service.get_or_create_cart(db)
    
    return db_cart

@router.post("/cart/items", status_code=201)
def add_to_cart(
    request: AddToCartRequest,
    response: Response,
    cart_id: Optional[str] = Cookie(None, alias="cart_id"),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Añade un producto al carrito con las opciones seleccionadas.
    """
    # Validar compatibilidad de opciones
    is_valid = product_service.validate_compatibility(db, request.selected_options)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Las opciones seleccionadas no son compatibles")
    
    # Obtener o crear carrito
    db_cart = None
    if cart_id:
        db_cart = cart_service.get_cart(db, int(cart_id))
    
    if not db_cart:
        db_cart = cart_service.get_or_create_cart(db, user_id)
    
    # Establecer cookie con el ID del carrito
    response.set_cookie(key="cart_id", value=str(db_cart.id), max_age=30*24*60*60)  # 30 días
    
    # Añadir producto al carrito
    try:
        cart_item = cart_service.add_to_cart(
            db, 
            db_cart.id, 
            request.product_id, 
            request.selected_options, 
            request.quantity
        )
        return {"message": "Producto añadido al carrito", "cart_item_id": cart_item.id}
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
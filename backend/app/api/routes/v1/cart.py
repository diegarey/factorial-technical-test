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
    Gets or creates a cart.
    Accepts the cart ID either from the cookie or as a query parameter.
    """
    # Debug to see what values are arriving
    print(f"DEBUG - get_cart - Headers: {query_cart_id}, Cookie cart_id: {cart_id}")
    
    # Use cart_id from cookie or query parameter
    cart_id_to_use = cart_id if cart_id and cart_id != "undefined" else query_cart_id
    source = "cookie" if cart_id and cart_id != "undefined" else "query param" if query_cart_id else None
    
    print(f"Getting cart - cookie cart_id: {cart_id}, query cart_id: {query_cart_id}, using: {cart_id_to_use} from {source}")
    
    db_cart = None
    if cart_id_to_use:
        try:
            cart_id_int = int(cart_id_to_use)
            db_cart = cart_service.get_cart(db, cart_id_int)
            if db_cart:
                print(f"Cart found with ID: {cart_id_int}")
        except (ValueError, TypeError) as e:
            print(f"Error converting cart_id: {cart_id_to_use} to integer: {e}")
    
    # If no cart was found, create a new one
    if not db_cart:
        db_cart = cart_service.get_or_create_cart(db, user_id)
        print(f"New cart created with ID: {db_cart.id}")
    
    # Always set the cookie with the current cart ID
    response.set_cookie(
        key="cart_id",
        value=str(db_cart.id),
        max_age=30*24*60*60,  # 30 days
        httponly=False,
        samesite="none",  # To allow cross-origin access
        secure=True,      # Required when samesite=none
        path="/"
    )
    print(f"Cookie cart_id set: {db_cart.id} with SameSite=None")
    
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
    Adds a product to the cart with the selected options.
    Accepts the cart ID either from the cookie or as a query parameter.
    """
    # Debug to see what values are arriving
    print(f"DEBUG - add_to_cart - Headers: {query_cart_id}, Cookie cart_id: {cart_id}")
    
    # Use cart_id from cookie or query parameter
    cart_id_to_use = cart_id if cart_id and cart_id != "undefined" else query_cart_id
    source = "cookie" if cart_id and cart_id != "undefined" else "query param" if query_cart_id else None
    
    print(f"Adding to cart - cookie cart_id: {cart_id}, query cart_id: {query_cart_id}, using: {cart_id_to_use} from {source}")
    
    # Validate options compatibility
    compatibility_result = product_service.validate_compatibility(
        db, 
        product_id=request.product_id,
        selected_option_ids=request.selected_options
    )
    
    # Check if the result has the expected structure (the new format) or the old format
    if isinstance(compatibility_result, dict) and "product" in compatibility_result:
        # New format - we need to determine overall compatibility
        is_compatible = True
        incompatibility_details = None
        
        # Check if any selected option is incompatible
        for component in compatibility_result["product"]["components"]:
            for option in component["options"]:
                if option.get("selected", False) and not option.get("is_compatible", True):
                    is_compatible = False
                    # Try to extract incompatibility details if they exist
                    if "compatibility_details" in option:
                        incompatibility_details = {
                            "type": option["compatibility_details"].get("reason", "unknown"),
                            "option_name": option["name"],
                            "option_id": option["id"]
                        }
                        # Add specific details based on the type of incompatibility
                        if option["compatibility_details"]["reason"] == "requires":
                            incompatibility_details["required_option_name"] = option["compatibility_details"]["dependency_name"]
                            incompatibility_details["required_option_id"] = option["compatibility_details"]["dependency_id"]
                        elif option["compatibility_details"]["reason"] == "excludes":
                            incompatibility_details["excluded_option_name"] = option["compatibility_details"]["dependency_name"]
                            incompatibility_details["excluded_option_id"] = option["compatibility_details"]["dependency_id"]
                    break
            if not is_compatible:
                break
                
        # Create a result object in the format expected by the rest of the code
        compatibility_result = {
            "is_compatible": is_compatible,
            "incompatibility_details": incompatibility_details
        }
    
    # Now we use the normalized compatibility_result object
    if not compatibility_result.get("is_compatible", False):
        details = compatibility_result.get("incompatibility_details")
        if details:
            message = f"Incompatibility: "
            if details.get("type") == "excludes":
                message += f"Option '{details['option_name']}' is not compatible with '{details['excluded_option_name']}'"
            elif details.get("type") == "requires":
                message += f"Option '{details['option_name']}' requires '{details['required_option_name']}'"
            else:
                message += f"There is an incompatibility with option '{details['option_name']}'"
            raise HTTPException(status_code=400, detail=message)
        else:
            raise HTTPException(status_code=400, detail="The selected options are not compatible")
    
    # Get or create cart
    db_cart = None
    if cart_id_to_use:
        try:
            cart_id_int = int(cart_id_to_use)
            db_cart = cart_service.get_cart(db, cart_id_int)
            if db_cart:
                print(f"Cart found with ID: {cart_id_int}")
        except (ValueError, TypeError) as e:
            print(f"Error converting cart_id: {cart_id_to_use} to integer: {e}")
    
    if not db_cart:
        db_cart = cart_service.get_or_create_cart(db, user_id)
        print(f"New cart created with ID: {db_cart.id}")
    
    # Always set the cookie with the current cart ID
    response.set_cookie(
        key="cart_id",
        value=str(db_cart.id),
        max_age=30*24*60*60,  # 30 days
        httponly=False,
        samesite="none",  # To allow cross-origin access
        secure=True,      # Required when samesite=none
        path="/"
    )
    print(f"Cookie cart_id set: {db_cart.id} with SameSite=None")
    
    # Add product to cart
    try:
        cart_item = cart_service.add_to_cart(
            db,
            db_cart.id,
            request.product_id,
            request.selected_options,
            request.quantity
        )
        result = {
            "message": "Product added to cart",
            "cart_item_id": cart_item.id,
            "cart_id": db_cart.id
        }
        print(f"Product successfully added: {result}")
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
    Updates the quantity of an item in the cart.
    """
    try:
        cart_item = cart_service.update_cart_item_quantity(db, cart_item_id, quantity)
        return {"message": "Quantity updated", "cart_item": cart_item}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/cart/items/{cart_item_id}")
def remove_from_cart(
    cart_item_id: int,
    db: Session = Depends(get_db)
):
    """
    Removes an item from the cart.
    """
    try:
        cart_service.remove_cart_item(db, cart_item_id)
        return {"message": "Item removed from cart"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) 
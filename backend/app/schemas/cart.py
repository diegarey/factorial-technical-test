from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

# Base schemas
class CartItemOptionBase(BaseModel):
    part_option_id: int

class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartBase(BaseModel):
    user_id: Optional[str] = None

# Create schemas
class CartItemOptionCreate(CartItemOptionBase):
    pass

class CartItemCreate(CartItemBase):
    options: List[CartItemOptionCreate]

class CartCreate(CartBase):
    pass

# Read schemas
class CartItemOption(CartItemOptionBase):
    id: int
    cart_item_id: int

    class Config:
        orm_mode = True

class CartItem(CartItemBase):
    id: int
    cart_id: int
    price_snapshot: Decimal
    options: List[CartItemOption] = []

    class Config:
        orm_mode = True

class Cart(CartBase):
    id: int
    created_at: datetime
    items: List[CartItem] = []

    class Config:
        orm_mode = True

# Schemas for custom functionality
class AddToCartRequest(BaseModel):
    product_id: int
    selected_options: List[int]
    quantity: int = 1 
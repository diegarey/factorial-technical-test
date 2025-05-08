from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    price_snapshot = Column(Numeric(10, 2))
    quantity = Column(Integer, default=1)
    
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    options = relationship("CartItemOption", back_populates="cart_item", cascade="all, delete-orphan")

class CartItemOption(Base):
    __tablename__ = "cart_item_options"

    id = Column(Integer, primary_key=True, index=True)
    cart_item_id = Column(Integer, ForeignKey("cart_items.id"))
    part_option_id = Column(Integer, ForeignKey("part_options.id"))
    
    cart_item = relationship("CartItem", back_populates="options")
    part_option = relationship("PartOption", back_populates="cart_items") 
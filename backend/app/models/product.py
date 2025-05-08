from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class DependencyType(enum.Enum):
    requires = "requires"
    excludes = "excludes"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    is_active = Column(Boolean, default=True)
    featured = Column(Boolean, default=False)
    base_price = Column(Numeric(10, 2), nullable=True)
    image_url = Column(String, nullable=True)
    
    part_types = relationship("PartType", back_populates="product", cascade="all, delete-orphan")

class PartType(Base):
    __tablename__ = "part_types"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    name = Column(String)
    
    product = relationship("Product", back_populates="part_types")
    options = relationship("PartOption", back_populates="part_type", cascade="all, delete-orphan")

class PartOption(Base):
    __tablename__ = "part_options"

    id = Column(Integer, primary_key=True, index=True)
    part_type_id = Column(Integer, ForeignKey("part_types.id"))
    name = Column(String)
    base_price = Column(Numeric(10, 2))
    in_stock = Column(Boolean, default=True)
    
    part_type = relationship("PartType", back_populates="options")
    dependencies = relationship("OptionDependency", 
                               foreign_keys="OptionDependency.option_id",
                               back_populates="option", 
                               cascade="all, delete-orphan")
    conditional_prices = relationship("ConditionalPrice", 
                                     foreign_keys="ConditionalPrice.option_id",
                                     back_populates="option", 
                                     cascade="all, delete-orphan")
    cart_items = relationship("CartItemOption", back_populates="part_option")

class OptionDependency(Base):
    __tablename__ = "option_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    option_id = Column(Integer, ForeignKey("part_options.id"))
    depends_on_option_id = Column(Integer, ForeignKey("part_options.id"))
    type = Column(Enum(DependencyType))
    
    option = relationship("PartOption", foreign_keys=[option_id], back_populates="dependencies")
    depends_on_option = relationship("PartOption", foreign_keys=[depends_on_option_id])

class ConditionalPrice(Base):
    __tablename__ = "conditional_prices"

    id = Column(Integer, primary_key=True, index=True)
    option_id = Column(Integer, ForeignKey("part_options.id"))
    condition_option_id = Column(Integer, ForeignKey("part_options.id"))
    conditional_price = Column(Numeric(10, 2))
    
    option = relationship("PartOption", foreign_keys=[option_id], back_populates="conditional_prices")
    condition_option = relationship("PartOption", foreign_keys=[condition_option_id]) 
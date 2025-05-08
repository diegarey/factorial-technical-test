from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from enum import Enum

class DependencyType(str, Enum):
    requires = "requires"
    excludes = "excludes"

# Base schemas
class PartOptionBase(BaseModel):
    name: str
    base_price: Decimal
    in_stock: bool = True

class PartTypeBase(BaseModel):
    name: str

class ProductBase(BaseModel):
    name: str
    category: str
    is_active: bool = True
    featured: bool = False
    base_price: Optional[Decimal] = None
    image_url: Optional[str] = None

class OptionDependencyBase(BaseModel):
    depends_on_option_id: int
    type: DependencyType

class ConditionalPriceBase(BaseModel):
    condition_option_id: int
    conditional_price: Decimal

# Create schemas
class PartOptionCreate(PartOptionBase):
    pass

class PartTypeCreate(PartTypeBase):
    pass

class ProductCreate(ProductBase):
    pass

class OptionDependencyCreate(OptionDependencyBase):
    pass

class ConditionalPriceCreate(ConditionalPriceBase):
    pass

# Read schemas
class PartOption(PartOptionBase):
    id: int
    part_type_id: int

    class Config:
        orm_mode = True

class PartType(PartTypeBase):
    id: int
    product_id: int
    options: List[PartOption] = []

    class Config:
        orm_mode = True

class Product(ProductBase):
    id: int
    part_types: List[PartType] = []

    class Config:
        orm_mode = True

class OptionDependency(OptionDependencyBase):
    id: int
    option_id: int

    class Config:
        orm_mode = True

class ConditionalPrice(ConditionalPriceBase):
    id: int
    option_id: int

    class Config:
        orm_mode = True

# Full detailed schemas with relationships
class PartOptionDetail(PartOption):
    dependencies: List[OptionDependency] = []
    conditional_prices: List[ConditionalPrice] = []

class PartTypeDetail(PartType):
    options: List[PartOptionDetail] = []

class ProductDetail(Product):
    part_types: List[PartTypeDetail] = [] 
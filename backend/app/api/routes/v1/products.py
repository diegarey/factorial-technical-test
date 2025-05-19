from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.services import product_service
from app.schemas.product import (
    Product, ProductCreate, ProductDetail,
    PartType, PartTypeCreate,
    PartOption, PartOptionCreate,
    OptionDependency, OptionDependencyCreate,
    ConditionalPrice, ConditionalPriceCreate
)

router = APIRouter()

@router.get("/products/", response_model=None)
def read_products(
    skip: int = Query(0, description="Elements to skip"), 
    limit: int = Query(100, description="Limit of elements to return"),
    db: Session = Depends(get_db)
):
    """
    Gets the list of available products.
    """
    products = product_service.get_products(db, skip=skip, limit=limit)
    # Get the total number of products for pagination
    total = product_service.get_total_products(db)
    
    return {
        "items": products,
        "total": total
    }

@router.post("/products/", response_model=Product)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Creates a new product.
    """
    try:
        # Print the data we receive for debugging
        print("Creating product with data:", product)
        
        # Call the service to create the product
        db_product = product_service.create_product(db, product)
        print("Product created:", db_product)
        
        return db_product
    except Exception as e:
        print("Error creating product:", str(e))
        raise HTTPException(status_code=400, detail=f"Error creating product: {str(e)}")

@router.get("/products/featured", response_model=List[Product])
def read_featured_products(
    limit: int = Query(3, description="Number of featured products to return"),
    db: Session = Depends(get_db)
):
    """
    Gets the list of featured products.
    """
    featured_products = product_service.get_featured_products(db, limit=limit)
    return featured_products

@router.get("/products/{product_id}", response_model=ProductDetail)
def read_product(product_id: int, db: Session = Depends(get_db)):
    """
    Gets the detail of a specific product with all its options and restrictions.
    """
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db_product

@router.get("/products/{product_id}/options")
def get_product_options(
    product_id: int, 
    current_selection: List[int] = Query(None, description="IDs of currently selected options"),
    db: Session = Depends(get_db)
):
    """
    Gets the available options for a product considering the current selections.
    """
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return product_service.get_available_options(db, product_id, current_selection)

@router.post("/products/validate-compatibility")
def validate_compatibility(request: dict, db: Session = Depends(get_db)):
    """
    Validates if a set of selected options are compatible with each other.
    """
    selected_options = request.get("selected_options", [])
    product_id = request.get("product_id")
    
    # If product_id is not provided, we try to get it from the selected options
    if product_id is None and selected_options:
        product_id = product_service.get_product_id_from_options(db, selected_options)
        print(f"Product inferred from options: {product_id}")
    
    print(f"Validating compatibility for product {product_id} with options: {selected_options}")
    
    if product_id is None:
        # Previous compatibility mode
        result = product_service.validate_compatibility(db, None, selected_options)
    else:
        # Use the new mode with product ID
        result = product_service.validate_compatibility(db, product_id, selected_options)
    
    return result

@router.post("/products/calculate-price")
def calculate_price(request: dict, db: Session = Depends(get_db)):
    """
    Calculates the total additional price for a configuration of selected options.
    This price does NOT include the base price of the product, only the additional cost of the options.
    The frontend must add the base price of the product to get the final total price.
    """
    # Aceptar tanto "selected_options" como "selected_option_ids" para compatibilidad
    selected_options = request.get("selected_option_ids", request.get("selected_options", []))
    product_id = request.get("product_id")
    
    # Verificar si los IDs son strings (para manejar el caso de números como cadenas)
    if selected_options and all(isinstance(opt_id, str) for opt_id in selected_options):
        try:
            selected_options = [int(opt_id) for opt_id in selected_options]
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail="Los IDs de opciones deben ser números enteros"
            )
    
    # If product_id is not provided, we try to get it from the selected options
    if product_id is None and selected_options:
        product_id = product_service.get_product_id_from_options(db, selected_options)
        print(f"Product inferred from options: {product_id}")
    
    print(f"Calculating price for product {product_id} with options: {selected_options}")
    
    # First validate compatibility
    if product_id is None:
        # Backward compatibility mode
        compatibility_result = product_service.validate_compatibility(db, None, selected_options)
    else:
        # Use the new mode with product ID
        compatibility_result = product_service.validate_compatibility(db, product_id, selected_options)
        
    # Check if there are incompatibilities
    if "product" not in compatibility_result and not compatibility_result.get("is_compatible", False):
        # Extract the details or use a generic message if there are no details
        details = compatibility_result.get("incompatibility_details", None)
        
        if details:
            message = f"Incompatibilidad: "
            if details.get("type") == "excludes":
                message += f"Opción '{details['option_name']}' no es compatible con '{details['excluded_option_name']}'"
            elif details.get("type") == "requires":
                message += f"Opción '{details['option_name']}' requiere '{details['required_option_name']}'"
            else:
                message += f"Opción '{details['option_name']}' tiene incompatibilidades"
            
            print(f"Error de compatibilidad: {message}")
            raise HTTPException(status_code=400, detail=message)
        else:
            print("Las opciones seleccionadas no son compatibles (sin detalles específicos)")
            raise HTTPException(status_code=400, detail="Las opciones seleccionadas no son compatibles")
    
    # Si llegamos aquí, calculamos el precio y preparamos la respuesta
    # Primero, calcula el precio total de las opciones seleccionadas
    total_price = product_service.calculate_price(db, selected_options)
    
    # Preparar el resultado básico
    result = {"total_price": total_price}
    
    # Obtener precio condicional directamente de la base de datos para las opciones seleccionadas
    from app.models.product import ConditionalPrice, PartOption
    from sqlalchemy import or_
    
    # Para cada opción seleccionada, ver si aplica algún precio condicional
    conditional_prices = {}
    for option_id in selected_options:
        # Buscar precios condicionales donde esta opción es la principal y la condición está entre las seleccionadas
        conditional_price_entries = db.query(ConditionalPrice).filter(
            ConditionalPrice.option_id == option_id,
            ConditionalPrice.condition_option_id.in_(selected_options)
        ).all()
        
        # Si encontramos precios condicionales, los añadimos al resultado
        for cp in conditional_price_entries:
            option = db.query(PartOption).filter(PartOption.id == cp.option_id).first()
            condition_option = db.query(PartOption).filter(PartOption.id == cp.condition_option_id).first()
            
            if option and condition_option:
                conditional_prices[option.id] = {
                    "option_id": option.id,
                    "option_name": option.name,
                    "base_price": float(option.base_price),
                    "conditional_price": float(cp.conditional_price),
                    "condition_option_id": condition_option.id,
                    "condition_option_name": condition_option.name
                }
    
    # Añadir los precios condicionales al resultado
    if conditional_prices:
        result["conditional_prices"] = conditional_prices
        print(f"Precios condicionales encontrados: {conditional_prices}")
    
    print(f"Precio total adicional: {total_price}")
    print(f"Resultado completo: {result}")
    return result

@router.put("/products/{product_id}", response_model=Product)
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    """
    Updates an existing product.
    """
    try:
        # Verify if the product exists
        db_product = product_service.get_product(db, product_id=product_id)
        if db_product is None:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
            
        # Print the data we receive for debugging
        print(f"Updating product {product_id} with data:", product)
        
        # Update the product
        updated_product = product_service.update_product(db, product_id=product_id, product=product)
        print(f"Product {product_id} updated:", updated_product)
        
        return updated_product
    except Exception as e:
        print(f"Error updating product {product_id}:", str(e))
        raise HTTPException(status_code=400, detail=f"Error updating product: {str(e)}")

@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Deletes an existing product and all its associated components.
    """
    try:
        # Verify if the product exists
        db_product = product_service.get_product(db, product_id=product_id)
        if db_product is None:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
            
        # Delete the product
        product_service.delete_product(db, product_id=product_id)
        
        return None
    except Exception as e:
        print(f"Error deleting product {product_id}:", str(e))
        raise HTTPException(status_code=400, detail=f"Error deleting product: {str(e)}") 
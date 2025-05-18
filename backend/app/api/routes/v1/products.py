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
    selected_options = request.get("selected_options", [])
    product_id = request.get("product_id")
    
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
        # If we use the new format, we need to extract the compatibility result
        # This is temporary until we update all clients
        if "product" in compatibility_result:
            # Convert the new format to the previous format
            is_compatible = True
            incompatibility_details = None
            problem_option = None
            
            # Go through all components and options to verify compatibility
            for component in compatibility_result["product"]["components"]:
                for option in component["options"]:
                    if option["selected"] and not option["is_compatible"]:
                        is_compatible = False
                        problem_option = option
                        
                        # Try to determine the type of incompatibility
                        incompatibility_type = "unknown"
                        # Look for "requires" type dependencies for this option
                        dependencies = db.query(product_service.OptionDependency).filter(
                            product_service.OptionDependency.option_id == option["id"],
                            product_service.OptionDependency.type == product_service.DependencyType.requires
                        ).all()
                        
                        # If it has "requires" type dependencies, check if any are missing
                        for dependency in dependencies:
                            if dependency.depends_on_option_id not in selected_options:
                                incompatibility_type = "requires"
                                # Get the name of the required option
                                required_option = db.query(product_service.PartOption).filter(
                                    product_service.PartOption.id == dependency.depends_on_option_id
                                ).first()
                                
                                # Save detailed information about the incompatibility
                                incompatibility_details = {
                                    "type": "requires",
                                    "option_id": option["id"],
                                    "option_name": option["name"],
                                    "required_option_id": dependency.depends_on_option_id,
                                    "required_option_name": required_option.name if required_option else f"Option {dependency.depends_on_option_id}"
                                }
                                break
                                
                        # If we didn't find a "requires" type incompatibility, look for "excludes" type
                        if incompatibility_type == "unknown":
                            # Look for "excludes" type dependencies for this option
                            excludes_dependencies = db.query(product_service.OptionDependency).filter(
                                product_service.OptionDependency.option_id == option["id"],
                                product_service.OptionDependency.type == product_service.DependencyType.excludes
                            ).all()
                            
                            # Check if any of the excluded options are selected
                            for dependency in excludes_dependencies:
                                if dependency.depends_on_option_id in selected_options:
                                    incompatibility_type = "excludes"
                                    # Get the name of the excluded option
                                    excluded_option = db.query(product_service.PartOption).filter(
                                        product_service.PartOption.id == dependency.depends_on_option_id
                                    ).first()
                                    
                                    # Save detailed information about the incompatibility
                                    incompatibility_details = {
                                        "type": "excludes",
                                        "option_id": option["id"],
                                        "option_name": option["name"],
                                        "excluded_option_id": dependency.depends_on_option_id,
                                        "excluded_option_name": excluded_option.name if excluded_option else f"Option {dependency.depends_on_option_id}"
                                    }
                                    break
                        
                        # If we still haven't identified the type of incompatibility, use a generic type
                        if incompatibility_type == "unknown" and incompatibility_details is None:
                            incompatibility_details = {
                                "type": "unknown",
                                "option_id": option["id"],
                                "option_name": option["name"]
                            }
                        
                        break
                if not is_compatible:
                    break
            
            # Add additional information to help with debugging
            print(f"Options compatibility: {is_compatible}")
            if not is_compatible and problem_option:
                print(f"Problematic option: {problem_option['name']} (ID: {problem_option['id']})")
            
            compatibility_result = {
                "is_compatible": is_compatible,
                "incompatibility_details": incompatibility_details
            }
    
    # Check if there are incompatibilities
    if not compatibility_result.get("is_compatible", False):
        # Extract the details or use a generic message if there are no details
        details = compatibility_result.get("incompatibility_details", None)
        
        if details:
            message = f"Incompatibility: "
            if details.get("type") == "excludes":
                message += f"Option '{details['option_name']}' is not compatible with '{details['excluded_option_name']}'"
            elif details.get("type") == "requires":
                message += f"Option '{details['option_name']}' requires '{details['required_option_name']}'"
            else:
                message += f"Option '{details['option_name']}' has incompatibilities"
            
            print(f"Compatibility error: {message}")
            raise HTTPException(status_code=400, detail=message)
        else:
            print("The selected options are not compatible (no specific details)")
            raise HTTPException(status_code=400, detail="The selected options are not compatible")
    
    # If we get here, the options are compatible
    print("Compatible options, calculating price...")
    
    total_price = product_service.calculate_price(db, selected_options)
    print(f"Total additional price: {total_price}")
    return {"total_price": total_price}

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
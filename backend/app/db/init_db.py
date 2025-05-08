from sqlalchemy.orm import Session
from app.models.product import Product, PartType, PartOption, OptionDependency, ConditionalPrice, DependencyType
from app.models.cart import Cart
from decimal import Decimal

def init_db(db: Session):
    """
    Inicializa la base de datos con algunos datos de ejemplo.
    """
    # Verificar si ya existe algún producto para no duplicar datos
    if db.query(Product).first():
        return
    
    # Crear producto de bicicleta mountain bike
    mountain_bike = Product(
        name="Mountain Bike Premium",
        category="mountain",
        is_active=True,
        featured=True,
        base_price=Decimal("599.00"),
        image_url="https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200"
    )
    
    # Bicicleta de carretera
    road_bike = Product(
        name="Bicicleta de Carretera Pro",
        category="road",
        is_active=True,
        featured=True,
        base_price=Decimal("699.00"),
        image_url="https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200"
    )
    
    # Bicicleta urbana
    urban_bike = Product(
        name="Bicicleta Urbana Deluxe",
        category="urban",
        is_active=True,
        featured=True,
        base_price=Decimal("499.00"),
        image_url="https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200"
    )
    
    # Bicicleta híbrida
    hybrid_bike = Product(
        name="Bicicleta Híbrida Todo Terreno",
        category="hybrid",
        is_active=True,
        featured=False,
        base_price=Decimal("549.00"),
        image_url="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200"
    )
    
    # Bicicleta eléctrica
    electric_bike = Product(
        name="E-Bike Urban Commuter",
        category="electric",
        is_active=True,
        featured=True,
        base_price=Decimal("1299.00"),
        image_url="https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200"
    )
    
    # Bicicleta BMX
    bmx_bike = Product(
        name="BMX Freestyle Pro",
        category="bmx",
        is_active=True,
        featured=False,
        base_price=Decimal("449.00"),
        image_url="https://images.unsplash.com/photo-1583729501158-e040bf6a4d1a?q=80&w=1200"
    )
    
    # Bicicleta de gravel
    gravel_bike = Product(
        name="Gravel Adventure Explorer",
        category="gravel",
        is_active=True,
        featured=True,
        base_price=Decimal("749.00"),
        image_url="https://images.unsplash.com/photo-1593764592116-bfb2a97c642a?q=80&w=1200"
    )
    
    # Añadir todos los productos a la base de datos
    db.add_all([mountain_bike, road_bike, urban_bike, hybrid_bike, electric_bike, bmx_bike, gravel_bike])
    db.flush()  # Para obtener el ID generado
    
    # Crear tipos de partes
    frame = PartType(name="Cuadro", product_id=mountain_bike.id)
    finish = PartType(name="Acabado", product_id=mountain_bike.id)
    wheels = PartType(name="Ruedas", product_id=mountain_bike.id)
    rim_color = PartType(name="Color de Aro", product_id=mountain_bike.id)
    
    db.add_all([frame, finish, wheels, rim_color])
    db.flush()
    
    # Opciones para el cuadro
    diamond_frame = PartOption(
        name="Cuadro Diamond",
        part_type_id=frame.id,
        base_price=Decimal("150.00"),
        in_stock=True
    )
    suspension_frame = PartOption(
        name="Cuadro Full-suspension",
        part_type_id=frame.id,
        base_price=Decimal("250.00"),
        in_stock=True
    )
    
    # Opciones para acabado
    matte_finish = PartOption(
        name="Mate",
        part_type_id=finish.id,
        base_price=Decimal("35.00"),
        in_stock=True
    )
    glossy_finish = PartOption(
        name="Brillante",
        part_type_id=finish.id,
        base_price=Decimal("30.00"),
        in_stock=True
    )
    
    # Opciones para ruedas
    mountain_wheels = PartOption(
        name="Ruedas Mountain",
        part_type_id=wheels.id,
        base_price=Decimal("100.00"),
        in_stock=True
    )
    fat_wheels = PartOption(
        name="Ruedas Fat Bike",
        part_type_id=wheels.id,
        base_price=Decimal("120.00"),
        in_stock=True
    )
    
    # Opciones para color de aro
    black_rim = PartOption(
        name="Aro Negro",
        part_type_id=rim_color.id,
        base_price=Decimal("25.00"),
        in_stock=True
    )
    red_rim = PartOption(
        name="Aro Rojo",
        part_type_id=rim_color.id,
        base_price=Decimal("35.00"),
        in_stock=True
    )
    
    db.add_all([
        diamond_frame, suspension_frame,
        matte_finish, glossy_finish,
        mountain_wheels, fat_wheels,
        black_rim, red_rim
    ])
    db.flush()
    
    # Crear dependencias entre opciones
    
    # Si se elige "Ruedas Fat Bike", no se puede elegir "Aro Rojo"
    fat_wheels_exclude_red = OptionDependency(
        option_id=fat_wheels.id,
        depends_on_option_id=red_rim.id,
        type=DependencyType.excludes
    )
    
    # Precios condicionales
    
    # "Mate" con "Cuadro Diamond" cuesta 35€
    matte_diamond_price = ConditionalPrice(
        option_id=matte_finish.id,
        condition_option_id=diamond_frame.id,
        conditional_price=Decimal("35.00")
    )
    
    # "Mate" con "Full-suspension" cuesta 50€
    matte_suspension_price = ConditionalPrice(
        option_id=matte_finish.id,
        condition_option_id=suspension_frame.id,
        conditional_price=Decimal("50.00")
    )
    
    db.add_all([
        fat_wheels_exclude_red,
        matte_diamond_price,
        matte_suspension_price
    ])
    
    db.commit()
    
    print("Base de datos inicializada con datos de ejemplo")

def create_initial_data(db: Session):
    try:
        init_db(db)
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
        db.rollback()
        raise 
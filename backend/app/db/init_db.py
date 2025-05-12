from sqlalchemy.orm import Session
from app.models.product import Product, PartType, PartOption, OptionDependency, ConditionalPrice, DependencyType
from app.models.cart import Cart, CartItem, CartItemOption
from decimal import Decimal

def init_db(db: Session):
    """
    Inicializa la base de datos con algunos datos de ejemplo.
    Primero borra todos los datos existentes y luego crea nuevos.
    """
    # Borrar todos los datos existentes en orden correcto para respetar claves foráneas
    try:
        # Primero eliminar CartItemOption
        db.query(CartItemOption).delete()
        # Luego eliminar CartItem
        db.query(CartItem).delete()
        # Luego eliminar Cart
        db.query(Cart).delete()
        # Eliminar relaciones entre opciones
        db.query(ConditionalPrice).delete()
        db.query(OptionDependency).delete()
        # Eliminar opciones y tipos
        db.query(PartOption).delete()
        db.query(PartType).delete()
        # Finalmente eliminar productos
        db.query(Product).delete()
        
        db.commit()
        print("Base de datos limpiada completamente")
    except Exception as e:
        db.rollback()
        print(f"Error al limpiar la base de datos: {e}")
        # Continuar con la creación de datos nuevos
    
    # Crear productos de bicicletas
    # 1. Mountain Bike
    mountain_bike = Product(
        name="Mountain Bike Premium",
        category="mountain",
        is_active=True,
        featured=True,
        base_price=Decimal("599.00"),
        image_url="https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=1200"
    )
    
    # 2. Bicicleta de carretera
    road_bike = Product(
        name="Bicicleta de Carretera Pro",
        category="road",
        is_active=True,
        featured=True,
        base_price=Decimal("699.00"),
        image_url="https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200"
    )
    
    # 3. Bicicleta urbana
    urban_bike = Product(
        name="Bicicleta Urbana Deluxe",
        category="urban",
        is_active=True,
        featured=True,
        base_price=Decimal("499.00"),
        image_url="https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?q=80&w=1200"
    )
    
    # 4. Bicicleta híbrida
    hybrid_bike = Product(
        name="Bicicleta Híbrida Todo Terreno",
        category="hybrid",
        is_active=True,
        featured=False,
        base_price=Decimal("549.00"),
        image_url="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200"
    )
    
    # 5. Bicicleta eléctrica
    electric_bike = Product(
        name="E-Bike Urban Commuter",
        category="electric",
        is_active=True,
        featured=True,
        base_price=Decimal("1299.00"),
        image_url="https://images.unsplash.com/photo-1571068316344-75bc76f77890?q=80&w=1200"
    )
    
    # 6. Bicicleta BMX
    bmx_bike = Product(
        name="BMX Freestyle Pro",
        category="bmx",
        is_active=True,
        featured=False,
        base_price=Decimal("449.00"),
        image_url="https://images.unsplash.com/photo-1575585269294-7d28dd912db8?q=80&w=1200"
    )
    
    # 7. Bicicleta de gravel
    gravel_bike = Product(
        name="Gravel Adventure Explorer",
        category="gravel",
        is_active=True,
        featured=True,
        base_price=Decimal("749.00"),
        image_url="https://images.unsplash.com/photo-1593764592116-bfb2a97c642a?q=80&w=1200"
    )
    
    # 8. Bicicleta para niños
    kids_bike = Product(
        name="Bicicleta Infantil Fun",
        category="kids",
        is_active=True,
        featured=False,
        base_price=Decimal("299.00"),
        image_url="https://images.unsplash.com/photo-1636208644638-38d38962235a?q=80&w=1200"
    )
    
    # 9. Bicicleta plegable
    folding_bike = Product(
        name="Bicicleta Plegable Commuter",
        category="folding",
        is_active=True,
        featured=False,
        base_price=Decimal("529.00"),
        image_url="https://images.unsplash.com/photo-1597921045416-11eb2f9d2a5b?q=80&w=1200"
    )
    
    # 10. Bicicleta fixie / single-speed
    fixie_bike = Product(
        name="Fixie Urban Style",
        category="fixie",
        is_active=True,
        featured=True,
        base_price=Decimal("389.00"),
        image_url="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=1200"
    )
    
    #--------------------------------------------------------------------------
    # PRODUCTOS DEPORTIVOS ADICIONALES (EXPANSIÓN DE NEGOCIO)
    #--------------------------------------------------------------------------
    
    # 11. Esquís alpinos
    alpine_ski = Product(
        name="Esquís Alpinos Freestyle",
        category="ski",
        is_active=True,
        featured=True,
        base_price=Decimal("499.00"),
        image_url="https://images.unsplash.com/photo-1565992441121-4367c2967103?q=80&w=1200"
    )
    
    # 12. Esquís de fondo
    cross_country_ski = Product(
        name="Esquís de Fondo Racing",
        category="ski",
        is_active=True,
        featured=False,
        base_price=Decimal("399.00"),
        image_url="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1200"
    )
    
    # 13. Tabla de surf
    surfboard = Product(
        name="Tabla de Surf Performance",
        category="surf",
        is_active=True,
        featured=True,
        base_price=Decimal("659.00"),
        image_url="https://images.unsplash.com/photo-1531722569936-825d3dd91b15?q=80&w=1200"
    )
    
    # 14. Tabla de bodyboard
    bodyboard = Product(
        name="Bodyboard Pro",
        category="surf",
        is_active=True,
        featured=False,
        base_price=Decimal("189.00"),
        image_url="https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200"
    )
    
    # 15. Patines en línea
    inline_skates = Product(
        name="Patines en Línea Urban",
        category="skates",
        is_active=True,
        featured=True,
        base_price=Decimal("249.00"),
        image_url="https://images.unsplash.com/photo-1578682505792-4f1da12d8183?q=80&w=1200"
    )
    
    # 16. Patines tradicionales (quad)
    quad_skates = Product(
        name="Patines Clásicos Retro",
        category="skates",
        is_active=True,
        featured=True,
        base_price=Decimal("199.00"),
        image_url="https://images.unsplash.com/photo-1604009306763-ebab3931a507?q=80&w=1200"
    )
    
    # 17. Tabla de paddle surf
    paddleboard = Product(
        name="Paddle Surf Performance",
        category="surf",
        is_active=True,
        featured=True,
        base_price=Decimal("899.00"),
        image_url="https://images.unsplash.com/photo-1526046881250-dbec3e134205?q=80&w=1200"
    )
    
    # 18. Tabla de snowboard
    snowboard = Product(
        name="Snowboard All Mountain",
        category="snow",
        is_active=True,
        featured=True,
        base_price=Decimal("549.00"),
        image_url="https://images.unsplash.com/photo-1622653953939-9a801340d252?q=80&w=1200"
    )
    
    # Añadir todos los productos a la base de datos
    db.add_all([
        mountain_bike, road_bike, urban_bike, hybrid_bike, electric_bike, 
        bmx_bike, gravel_bike, kids_bike, folding_bike, fixie_bike,
        alpine_ski, cross_country_ski, surfboard, bodyboard, 
        inline_skates, quad_skates, paddleboard, snowboard
    ])
    db.flush()  # Para obtener el ID generado
    
    # Configuración de productos deportivos adicionales con sus opciones personalizables
    
    #--------------------------------------------------------------------------
    # CONFIGURACIÓN DE ESQUÍS ALPINOS
    #--------------------------------------------------------------------------
    
    ski_size = PartType(name="Talla", product_id=alpine_ski.id)
    ski_binding = PartType(name="Fijaciones", product_id=alpine_ski.id)
    ski_level = PartType(name="Nivel", product_id=alpine_ski.id)
    
    db.add_all([ski_size, ski_binding, ski_level])
    db.flush()
    
    # Opciones para talla
    ski_size_150 = PartOption(
        name="150 cm",
        part_type_id=ski_size.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    ski_size_160 = PartOption(
        name="160 cm",
        part_type_id=ski_size.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    ski_size_170 = PartOption(
        name="170 cm",
        part_type_id=ski_size.id,
        base_price=Decimal("20.00"),
        in_stock=True
    )
    
    # Opciones para fijaciones
    ski_binding_basic = PartOption(
        name="Fijaciones Básicas",
        part_type_id=ski_binding.id,
        base_price=Decimal("79.00"),
        in_stock=True
    )
    ski_binding_advanced = PartOption(
        name="Fijaciones Avanzadas",
        part_type_id=ski_binding.id,
        base_price=Decimal("149.00"),
        in_stock=True
    )
    
    # Opciones para nivel
    ski_level_beginner = PartOption(
        name="Principiante",
        part_type_id=ski_level.id,
        base_price=Decimal("-50.00"),  # Descuento para principiantes
        in_stock=True
    )
    ski_level_intermediate = PartOption(
        name="Intermedio",
        part_type_id=ski_level.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    ski_level_expert = PartOption(
        name="Experto",
        part_type_id=ski_level.id,
        base_price=Decimal("100.00"),  # Premium para expertos
        in_stock=True
    )
    
    db.add_all([
        ski_size_150, ski_size_160, ski_size_170,
        ski_binding_basic, ski_binding_advanced,
        ski_level_beginner, ski_level_intermediate, ski_level_expert
    ])
    db.flush()
    
    # Dependencias para esquís
    
    # Nivel avanzado requiere fijaciones avanzadas
    ski_expert_req_advanced_binding = OptionDependency(
        option_id=ski_level_expert.id,
        depends_on_option_id=ski_binding_advanced.id,
        type=DependencyType.requires
    )
    
    db.add_all([ski_expert_req_advanced_binding])
    db.flush()
    
    #--------------------------------------------------------------------------
    # CONFIGURACIÓN DE TABLA DE SURF
    #--------------------------------------------------------------------------
    
    surf_size = PartType(name="Tamaño", product_id=surfboard.id)
    surf_fins = PartType(name="Quillas", product_id=surfboard.id)
    surf_construction = PartType(name="Construcción", product_id=surfboard.id)
    
    db.add_all([surf_size, surf_fins, surf_construction])
    db.flush()
    
    # Opciones para tamaño
    surf_size_small = PartOption(
        name="6'0\" - Shortboard",
        part_type_id=surf_size.id,
        base_price=Decimal("-50.00"),
        in_stock=True
    )
    surf_size_medium = PartOption(
        name="7'0\" - Mid-Length",
        part_type_id=surf_size.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    surf_size_large = PartOption(
        name="8'0\" - Longboard",
        part_type_id=surf_size.id,
        base_price=Decimal("100.00"),
        in_stock=True
    )
    
    # Opciones para quillas
    surf_fins_single = PartOption(
        name="Single Fin",
        part_type_id=surf_fins.id,
        base_price=Decimal("30.00"),
        in_stock=True
    )
    surf_fins_thruster = PartOption(
        name="Thruster (3 Quillas)",
        part_type_id=surf_fins.id,
        base_price=Decimal("60.00"),
        in_stock=True
    )
    surf_fins_quad = PartOption(
        name="Quad (4 Quillas)",
        part_type_id=surf_fins.id,
        base_price=Decimal("80.00"),
        in_stock=True
    )
    
    # Opciones para construcción
    surf_const_foam = PartOption(
        name="Foam - Principiantes",
        part_type_id=surf_construction.id,
        base_price=Decimal("-100.00"),
        in_stock=True
    )
    surf_const_epoxy = PartOption(
        name="Epoxy",
        part_type_id=surf_construction.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    surf_const_polyester = PartOption(
        name="Poliéster - Performance",
        part_type_id=surf_construction.id,
        base_price=Decimal("50.00"),
        in_stock=True
    )
    
    db.add_all([
        surf_size_small, surf_size_medium, surf_size_large,
        surf_fins_single, surf_fins_thruster, surf_fins_quad,
        surf_const_foam, surf_const_epoxy, surf_const_polyester
    ])
    db.flush()
    
    # Dependencias para tablas de surf
    
    # Quillas quad no disponibles para tablas pequeñas
    surf_small_exclude_quad = OptionDependency(
        option_id=surf_size_small.id,
        depends_on_option_id=surf_fins_quad.id,
        type=DependencyType.excludes
    )
    
    # Single fin típicamente para longboards
    surf_single_requires_large = OptionDependency(
        option_id=surf_fins_single.id,
        depends_on_option_id=surf_size_large.id,
        type=DependencyType.requires
    )
    
    db.add_all([surf_small_exclude_quad, surf_single_requires_large])
    db.flush()
    
    #--------------------------------------------------------------------------
    # CONFIGURACIÓN DE PATINES EN LÍNEA
    #--------------------------------------------------------------------------
    
    skate_size = PartType(name="Talla", product_id=inline_skates.id)
    skate_wheels = PartType(name="Ruedas", product_id=inline_skates.id)
    skate_bearings = PartType(name="Rodamientos", product_id=inline_skates.id)
    
    db.add_all([skate_size, skate_wheels, skate_bearings])
    db.flush()
    
    # Opciones para talla
    skate_size_38 = PartOption(
        name="38 EU",
        part_type_id=skate_size.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    skate_size_40 = PartOption(
        name="40 EU",
        part_type_id=skate_size.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    skate_size_42 = PartOption(
        name="42 EU",
        part_type_id=skate_size.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    skate_size_44 = PartOption(
        name="44 EU",
        part_type_id=skate_size.id,
        base_price=Decimal("10.00"),
        in_stock=False
    )
    
    # Opciones para ruedas
    skate_wheels_76mm = PartOption(
        name="76mm - Estándar",
        part_type_id=skate_wheels.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    skate_wheels_80mm = PartOption(
        name="80mm - Velocidad",
        part_type_id=skate_wheels.id,
        base_price=Decimal("25.00"),
        in_stock=True
    )
    skate_wheels_90mm = PartOption(
        name="90mm - Racing",
        part_type_id=skate_wheels.id,
        base_price=Decimal("50.00"),
        in_stock=True
    )
    
    # Opciones para rodamientos
    skate_bearings_abec5 = PartOption(
        name="ABEC 5 - Estándar",
        part_type_id=skate_bearings.id,
        base_price=Decimal("0.00"),
        in_stock=True
    )
    skate_bearings_abec7 = PartOption(
        name="ABEC 7 - Velocidad",
        part_type_id=skate_bearings.id,
        base_price=Decimal("30.00"),
        in_stock=True
    )
    skate_bearings_abec9 = PartOption(
        name="ABEC 9 - Pro Racing",
        part_type_id=skate_bearings.id,
        base_price=Decimal("60.00"),
        in_stock=True
    )
    
    db.add_all([
        skate_size_38, skate_size_40, skate_size_42, skate_size_44,
        skate_wheels_76mm, skate_wheels_80mm, skate_wheels_90mm,
        skate_bearings_abec5, skate_bearings_abec7, skate_bearings_abec9
    ])
    db.flush()
    
    # Dependencias para patines
    
    # Ruedas grandes (90mm) requieren rodamientos premium
    skate_90mm_req_abec7 = OptionDependency(
        option_id=skate_wheels_90mm.id,
        depends_on_option_id=skate_bearings_abec7.id,
        type=DependencyType.requires
    )
    
    db.add_all([skate_90mm_req_abec7])
    db.flush()
    
    # Precios condicionales
    
    # Descuento al elegir rodamientos premium y ruedas premium juntos
    skate_premium_bundle = ConditionalPrice(
        option_id=skate_bearings_abec9.id,
        condition_option_id=skate_wheels_90mm.id,
        conditional_price=Decimal("45.00")  # 15€ de descuento
    )
    
    db.add_all([skate_premium_bundle])
    db.flush()
    
    # A partir de aquí continúa la configuración original de las bicicletas
    #--------------------------------------------------------------------------
    # CONFIGURACIÓN DE MOUNTAIN BIKE COMO EJEMPLO PRINCIPAL
    #--------------------------------------------------------------------------
    
    mt_frame = PartType(name="Cuadro", product_id=mountain_bike.id)
    mt_fork = PartType(name="Horquilla", product_id=mountain_bike.id)
    mt_wheels = PartType(name="Ruedas", product_id=mountain_bike.id)
    mt_brakes = PartType(name="Frenos", product_id=mountain_bike.id)
    mt_drivetrain = PartType(name="Transmisión", product_id=mountain_bike.id)
    mt_seatpost = PartType(name="Tija de sillín", product_id=mountain_bike.id)
    mt_handlebar = PartType(name="Manillar", product_id=mountain_bike.id)
    
    db.add_all([mt_frame, mt_fork, mt_wheels, mt_brakes, mt_drivetrain, mt_seatpost, mt_handlebar])
    db.flush()
    
    # Opciones para el cuadro
    mt_carbon_frame = PartOption(
        name="Cuadro Carbono MTB",
        part_type_id=mt_frame.id,
        base_price=Decimal("899.00"),
        in_stock=True
    )
    mt_aluminum_frame = PartOption(
        name="Cuadro Aluminio MTB",
        part_type_id=mt_frame.id,
        base_price=Decimal("450.00"),
        in_stock=True
    )
    mt_steel_frame = PartOption(
        name="Cuadro Acero Premium MTB",
        part_type_id=mt_frame.id,
        base_price=Decimal("550.00"),
        in_stock=True
    )
    
    # Opciones para la horquilla
    mt_fox_fork = PartOption(
        name="Fox 36 Factory",
        part_type_id=mt_fork.id,
        base_price=Decimal("899.00"),
        in_stock=True
    )
    mt_rockshox_fork = PartOption(
        name="RockShox Lyrik Ultimate",
        part_type_id=mt_fork.id,
        base_price=Decimal("799.00"),
        in_stock=True
    )
    mt_entry_fork = PartOption(
        name="Suntour XCR Air",
        part_type_id=mt_fork.id,
        base_price=Decimal("299.00"),
        in_stock=False
    )
    
    # Opciones para ruedas
    mt_carbon_wheels = PartOption(
        name="Ruedas Carbono 29\"",
        part_type_id=mt_wheels.id,
        base_price=Decimal("1200.00"),
        in_stock=True
    )
    mt_aluminum_wheels = PartOption(
        name="Ruedas Aluminio 29\"",
        part_type_id=mt_wheels.id,
        base_price=Decimal("450.00"),
        in_stock=True
    )
    mt_fat_wheels = PartOption(
        name="Ruedas Fat Bike 26\"",
        part_type_id=mt_wheels.id,
        base_price=Decimal("380.00"),
        in_stock=True
    )
    
    # Opciones para frenos
    mt_shimano_brakes = PartOption(
        name="Frenos Shimano XT",
        part_type_id=mt_brakes.id,
        base_price=Decimal("420.00"),
        in_stock=True
    )
    mt_sram_brakes = PartOption(
        name="Frenos SRAM Code RSC",
        part_type_id=mt_brakes.id,
        base_price=Decimal("480.00"),
        in_stock=True
    )
    mt_tektro_brakes = PartOption(
        name="Frenos Tektro Orion",
        part_type_id=mt_brakes.id,
        base_price=Decimal("150.00"),
        in_stock=True
    )
    
    # Opciones para transmisión
    mt_shimano_drivetrain = PartOption(
        name="Shimano Deore XT 12v",
        part_type_id=mt_drivetrain.id,
        base_price=Decimal("580.00"),
        in_stock=True
    )
    mt_sram_drivetrain = PartOption(
        name="SRAM GX Eagle 12v",
        part_type_id=mt_drivetrain.id,
        base_price=Decimal("520.00"),
        in_stock=True
    )
    mt_basic_drivetrain = PartOption(
        name="Shimano Deore 11v",
        part_type_id=mt_drivetrain.id,
        base_price=Decimal("320.00"),
        in_stock=True
    )
    
    # Añadir las opciones de mountain bike a la BD
    db.add_all([
        mt_carbon_frame, mt_aluminum_frame, mt_steel_frame,
        mt_fox_fork, mt_rockshox_fork, mt_entry_fork,
        mt_carbon_wheels, mt_aluminum_wheels, mt_fat_wheels,
        mt_shimano_brakes, mt_sram_brakes, mt_tektro_brakes,
        mt_shimano_drivetrain, mt_sram_drivetrain, mt_basic_drivetrain
    ])
    db.flush()
    
    # Dependencias para Mountain Bike
    
    # Ruedas de carbono solo compatibles con cuadro de carbono por temas de rendimiento
    mt_carbon_wheels_req_carbon_frame = OptionDependency(
        option_id=mt_carbon_wheels.id,
        depends_on_option_id=mt_carbon_frame.id,
        type=DependencyType.requires
    )
    
    # Los Fat Bikes no son compatibles con horquillas de alto rendimiento
    mt_fat_wheels_exclude_fox = OptionDependency(
        option_id=mt_fat_wheels.id,
        depends_on_option_id=mt_fox_fork.id,
        type=DependencyType.excludes
    )
    
    # Para frenos premium se recomiendan transmisiones premium
    mt_sram_brakes_req_sram_drivetrain = OptionDependency(
        option_id=mt_sram_brakes.id,
        depends_on_option_id=mt_sram_drivetrain.id,
        type=DependencyType.requires
    )
    
    db.add_all([
        mt_carbon_wheels_req_carbon_frame,
        mt_fat_wheels_exclude_fox,
        mt_sram_brakes_req_sram_drivetrain
    ])
    db.flush()
    
    # Precios condicionales para Mountain Bike
    
    # Cuando eliges cuadro de carbono y horquilla Fox, hay un descuento en el conjunto
    mt_fox_carbon_price = ConditionalPrice(
        option_id=mt_fox_fork.id,
        condition_option_id=mt_carbon_frame.id,
        conditional_price=Decimal("799.00")  # 100€ de descuento
    )
    
    # Si eliges frenos Shimano con transmisión Shimano hay mejor integración y descuento
    mt_shimano_integration = ConditionalPrice(
        option_id=mt_shimano_brakes.id,
        condition_option_id=mt_shimano_drivetrain.id,
        conditional_price=Decimal("370.00")  # 50€ de descuento
    )
    
    db.add_all([
        mt_fox_carbon_price,
        mt_shimano_integration
    ])
    db.flush()
    
    #--------------------------------------------------------------------------
    # BICICLETA DE CARRETERA
    #--------------------------------------------------------------------------
    
    rd_frame = PartType(name="Cuadro", product_id=road_bike.id)
    rd_fork = PartType(name="Horquilla", product_id=road_bike.id)
    rd_wheels = PartType(name="Ruedas", product_id=road_bike.id)
    rd_groupset = PartType(name="Grupo", product_id=road_bike.id)
    rd_handlebar = PartType(name="Manillar", product_id=road_bike.id)
    rd_tires = PartType(name="Neumáticos", product_id=road_bike.id)
    
    db.add_all([rd_frame, rd_fork, rd_wheels, rd_groupset, rd_handlebar, rd_tires])
    db.flush()
    
    # Opciones para el cuadro
    rd_carbon_frame = PartOption(
        name="Cuadro Carbono Aero",
        part_type_id=rd_frame.id,
        base_price=Decimal("1599.00"),
        in_stock=True
    )
    rd_aluminum_frame = PartOption(
        name="Cuadro Aluminio Aero",
        part_type_id=rd_frame.id,
        base_price=Decimal("699.00"),
        in_stock=True
    )
    rd_endurance_frame = PartOption(
        name="Cuadro Carbono Endurance",
        part_type_id=rd_frame.id,
        base_price=Decimal("1399.00"),
        in_stock=True
    )
    
    # Opciones para la horquilla
    rd_carbon_fork = PartOption(
        name="Horquilla Carbono Aero",
        part_type_id=rd_fork.id,
        base_price=Decimal("499.00"),
        in_stock=True
    )
    rd_endurance_fork = PartOption(
        name="Horquilla Carbono Endurance",
        part_type_id=rd_fork.id,
        base_price=Decimal("399.00"),
        in_stock=True
    )
    
    # Opciones para ruedas
    rd_carbon_wheels = PartOption(
        name="Ruedas Carbono 50mm",
        part_type_id=rd_wheels.id,
        base_price=Decimal("1099.00"),
        in_stock=True
    )
    rd_aluminum_wheels = PartOption(
        name="Ruedas Aluminio 30mm",
        part_type_id=rd_wheels.id,
        base_price=Decimal("399.00"),
        in_stock=True
    )
    rd_gravel_wheels = PartOption(
        name="Ruedas Gravel 28mm",
        part_type_id=rd_wheels.id,
        base_price=Decimal("549.00"),
        in_stock=False
    )
    
    # Opciones para grupo
    rd_shimano_105 = PartOption(
        name="Shimano 105 R7000",
        part_type_id=rd_groupset.id,
        base_price=Decimal("699.00"),
        in_stock=True
    )
    rd_shimano_ultegra = PartOption(
        name="Shimano Ultegra R8000",
        part_type_id=rd_groupset.id,
        base_price=Decimal("1199.00"),
        in_stock=True
    )
    rd_sram_rival = PartOption(
        name="SRAM Rival eTap AXS",
        part_type_id=rd_groupset.id,
        base_price=Decimal("1399.00"),
        in_stock=True
    )
    
    # Opciones para manillar
    rd_drop_handlebar = PartOption(
        name="Manillar Drop Carbon",
        part_type_id=rd_handlebar.id,
        base_price=Decimal("249.00"),
        in_stock=True
    )
    rd_aero_handlebar = PartOption(
        name="Manillar Aero Carbon",
        part_type_id=rd_handlebar.id,
        base_price=Decimal("349.00"),
        in_stock=True
    )
    
    # Opciones para neumáticos
    rd_race_tires = PartOption(
        name="Neumáticos Continental GP5000",
        part_type_id=rd_tires.id,
        base_price=Decimal("120.00"),
        in_stock=True
    )
    rd_endurance_tires = PartOption(
        name="Neumáticos Schwalbe Durano",
        part_type_id=rd_tires.id,
        base_price=Decimal("80.00"),
        in_stock=True
    )
    rd_gravel_tires = PartOption(
        name="Neumáticos Panaracer GravelKing",
        part_type_id=rd_tires.id,
        base_price=Decimal("90.00"),
        in_stock=True
    )
    
    # Añadir opciones de carretera a la BD
    db.add_all([
        rd_carbon_frame, rd_aluminum_frame, rd_endurance_frame,
        rd_carbon_fork, rd_endurance_fork,
        rd_carbon_wheels, rd_aluminum_wheels, rd_gravel_wheels,
        rd_shimano_105, rd_shimano_ultegra, rd_sram_rival,
        rd_drop_handlebar, rd_aero_handlebar,
        rd_race_tires, rd_endurance_tires, rd_gravel_tires
    ])
    db.flush()
    
    # Dependencias para bicicleta de carretera
    
    # El cuadro Aero de carbono queda mejor con horquilla Aero
    rd_carbon_aero_req_aero_fork = OptionDependency(
        option_id=rd_carbon_frame.id,
        depends_on_option_id=rd_carbon_fork.id,
        type=DependencyType.requires
    )
    
    # El cuadro Endurance va mejor con horquilla Endurance
    rd_endurance_req_endurance_fork = OptionDependency(
        option_id=rd_endurance_frame.id,
        depends_on_option_id=rd_endurance_fork.id,
        type=DependencyType.requires
    )
    
    # Las ruedas de carbono de perfil alto quedan mejor con cuadro aerodinámico
    rd_carbon_wheels_req_aero_frame = OptionDependency(
        option_id=rd_carbon_wheels.id,
        depends_on_option_id=rd_carbon_frame.id,
        type=DependencyType.requires
    )
    
    # Manillar aero solo compatible con cuadro aero
    rd_aero_handlebar_req_aero_frame = OptionDependency(
        option_id=rd_aero_handlebar.id,
        depends_on_option_id=rd_carbon_frame.id,
        type=DependencyType.requires
    )
    
    # Neumáticos de gravel no compatibles con ruedas aero
    rd_gravel_tires_exclude_carbon_wheels = OptionDependency(
        option_id=rd_gravel_tires.id,
        depends_on_option_id=rd_carbon_wheels.id,
        type=DependencyType.excludes
    )
    
    db.add_all([
        rd_carbon_aero_req_aero_fork,
        rd_endurance_req_endurance_fork,
        rd_carbon_wheels_req_aero_frame,
        rd_aero_handlebar_req_aero_frame,
        rd_gravel_tires_exclude_carbon_wheels
    ])
    db.flush()
    
    # Precios condicionales para bicicleta de carretera
    
    # Descuento por elegir grupo Ultegra con cuadro de carbono (paquete premium)
    rd_ultegra_carbon_discount = ConditionalPrice(
        option_id=rd_shimano_ultegra.id,
        condition_option_id=rd_carbon_frame.id,
        conditional_price=Decimal("999.00")  # 200€ descuento
    )
    
    # Neumáticos GP5000 más baratos con ruedas de carbono (bundle popular)
    rd_gp5000_carbon_wheels_discount = ConditionalPrice(
        option_id=rd_race_tires.id,
        condition_option_id=rd_carbon_wheels.id,
        conditional_price=Decimal("90.00")  # 30€ descuento
    )
    
    db.add_all([
        rd_ultegra_carbon_discount,
        rd_gp5000_carbon_wheels_discount
    ])
    db.flush()
    
    #--------------------------------------------------------------------------
    # BICICLETA ELÉCTRICA
    #--------------------------------------------------------------------------
    
    eb_frame = PartType(name="Cuadro", product_id=electric_bike.id)
    eb_motor = PartType(name="Motor", product_id=electric_bike.id)
    eb_battery = PartType(name="Batería", product_id=electric_bike.id)
    eb_display = PartType(name="Display", product_id=electric_bike.id)
    eb_brakes = PartType(name="Frenos", product_id=electric_bike.id)
    eb_wheels = PartType(name="Ruedas", product_id=electric_bike.id)
    
    db.add_all([eb_frame, eb_motor, eb_battery, eb_display, eb_brakes, eb_wheels])
    db.flush()
    
    # Opciones para cuadro
    eb_urban_frame = PartOption(
        name="Cuadro Urbano Step-Through",
        part_type_id=eb_frame.id,
        base_price=Decimal("599.00"),
        in_stock=True
    )
    eb_trekking_frame = PartOption(
        name="Cuadro Trekking",
        part_type_id=eb_frame.id,
        base_price=Decimal("699.00"),
        in_stock=True
    )
    eb_mtb_frame = PartOption(
        name="Cuadro MTB Eléctrica",
        part_type_id=eb_frame.id,
        base_price=Decimal("799.00"),
        in_stock=True
    )
    
    # Opciones para motor
    eb_bosch_motor = PartOption(
        name="Motor Bosch Performance CX",
        part_type_id=eb_motor.id,
        base_price=Decimal("899.00"),
        in_stock=True
    )
    eb_shimano_motor = PartOption(
        name="Motor Shimano Steps E8000",
        part_type_id=eb_motor.id,
        base_price=Decimal("799.00"),
        in_stock=True
    )
    eb_brose_motor = PartOption(
        name="Motor Brose Drive S",
        part_type_id=eb_motor.id,
        base_price=Decimal("849.00"),
        in_stock=False
    )
    
    # Opciones para batería
    eb_large_battery = PartOption(
        name="Batería 750Wh",
        part_type_id=eb_battery.id,
        base_price=Decimal("799.00"),
        in_stock=True
    )
    eb_medium_battery = PartOption(
        name="Batería 625Wh",
        part_type_id=eb_battery.id,
        base_price=Decimal("599.00"),
        in_stock=True
    )
    eb_small_battery = PartOption(
        name="Batería 500Wh",
        part_type_id=eb_battery.id,
        base_price=Decimal("499.00"),
        in_stock=True
    )
    
    # Opciones para display
    eb_color_display = PartOption(
        name="Display LCD Color Bosch Kiox",
        part_type_id=eb_display.id,
        base_price=Decimal("299.00"),
        in_stock=True
    )
    eb_basic_display = PartOption(
        name="Display LCD Básico",
        part_type_id=eb_display.id,
        base_price=Decimal("149.00"),
        in_stock=True
    )
    eb_smartphone_hub = PartOption(
        name="Smartphone Hub",
        part_type_id=eb_display.id,
        base_price=Decimal("199.00"),
        in_stock=True
    )
    
    # Añadir opciones de e-bike a la BD
    db.add_all([
        eb_urban_frame, eb_trekking_frame, eb_mtb_frame,
        eb_bosch_motor, eb_shimano_motor, eb_brose_motor,
        eb_large_battery, eb_medium_battery, eb_small_battery,
        eb_color_display, eb_basic_display, eb_smartphone_hub
    ])
    db.flush()
    
    # Dependencias para e-bikes
    
    # Motor Bosch solo compatible con display Bosch
    eb_bosch_motor_req_bosch_display = OptionDependency(
        option_id=eb_bosch_motor.id,
        depends_on_option_id=eb_color_display.id,
        type=DependencyType.requires
    )
    
    # Batería grande no disponible para cuadro urbano step-through
    eb_large_battery_exclude_urban = OptionDependency(
        option_id=eb_large_battery.id,
        depends_on_option_id=eb_urban_frame.id,
        type=DependencyType.excludes
    )
    
    # Motor Shimano requiere display compatible
    eb_shimano_motor_exclude_color_display = OptionDependency(
        option_id=eb_shimano_motor.id,
        depends_on_option_id=eb_color_display.id,
        type=DependencyType.excludes
    )
    
    db.add_all([
        eb_bosch_motor_req_bosch_display,
        eb_large_battery_exclude_urban,
        eb_shimano_motor_exclude_color_display
    ])
    db.flush()
    
    # Precios condicionales para e-bikes
    
    # Descuento al elegir motor y batería Bosch de la misma capacidad
    eb_bosch_battery_bundle = ConditionalPrice(
        option_id=eb_large_battery.id,
        condition_option_id=eb_bosch_motor.id,
        conditional_price=Decimal("699.00")  # 100€ descuento
    )
    
    db.add_all([
        eb_bosch_battery_bundle
    ])
    
    db.commit()
    
    print("Base de datos inicializada con datos de ejemplo ampliados y realistas")

def create_initial_data(db: Session):
    try:
        init_db(db)
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
        db.rollback()
        raise 
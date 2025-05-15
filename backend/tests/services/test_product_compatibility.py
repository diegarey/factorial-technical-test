import pytest
from sqlalchemy.orm import Session
from decimal import Decimal
from app.models.product import Product, PartType, PartOption, OptionDependency, DependencyType
from app.services.product_service import validate_compatibility

@pytest.fixture
def sample_product(db: Session):
    """Crea un producto de muestra con todas sus partes y opciones"""
    product = Product(name="Bicicleta de Prueba")
    db.add(product)
    db.flush()
    
    # Crear tipos de partes
    cuadro = PartType(name="Cuadro", product_id=product.id)
    horquilla = PartType(name="Horquilla", product_id=product.id)
    ruedas = PartType(name="Ruedas", product_id=product.id)
    grupo = PartType(name="Grupo", product_id=product.id)
    frenos = PartType(name="Frenos", product_id=product.id)
    db.add_all([cuadro, horquilla, ruedas, grupo, frenos])
    db.flush()
    
    # Crear opciones para cada tipo
    cuadro_carbono_aero = PartOption(
        name="Cuadro Carbono Aero",
        part_type_id=cuadro.id,
        base_price=Decimal("1599.00"),
        in_stock=True
    )
    cuadro_carbono_endurance = PartOption(
        name="Cuadro Carbono Endurance",
        part_type_id=cuadro.id,
        base_price=Decimal("1399.00"),
        in_stock=True
    )
    cuadro_aluminio = PartOption(
        name="Cuadro Aluminio",
        part_type_id=cuadro.id,
        base_price=Decimal("899.00"),
        in_stock=True
    )
    
    horquilla_carbono_aero = PartOption(
        name="Horquilla Carbono Aero",
        part_type_id=horquilla.id,
        base_price=Decimal("499.00"),
        in_stock=True
    )
    horquilla_carbono_endurance = PartOption(
        name="Horquilla Carbono Endurance",
        part_type_id=horquilla.id,
        base_price=Decimal("399.00"),
        in_stock=True
    )
    horquilla_aluminio = PartOption(
        name="Horquilla Aluminio",
        part_type_id=horquilla.id,
        base_price=Decimal("299.00"),
        in_stock=True
    )
    
    ruedas_carbono = PartOption(
        name="Ruedas Carbono 50mm",
        part_type_id=ruedas.id,
        base_price=Decimal("1099.00"),
        in_stock=True
    )
    ruedas_aluminio = PartOption(
        name="Ruedas Aluminio 30mm",
        part_type_id=ruedas.id,
        base_price=Decimal("399.00"),
        in_stock=True
    )

    grupo_ultegra = PartOption(
        name="Shimano Ultegra",
        part_type_id=grupo.id,
        base_price=Decimal("999.00"),
        in_stock=True
    )
    grupo_105 = PartOption(
        name="Shimano 105",
        part_type_id=grupo.id,
        base_price=Decimal("599.00"),
        in_stock=True
    )

    frenos_disco = PartOption(
        name="Frenos de Disco",
        part_type_id=frenos.id,
        base_price=Decimal("299.00"),
        in_stock=True
    )
    frenos_caliper = PartOption(
        name="Frenos Caliper",
        part_type_id=frenos.id,
        base_price=Decimal("199.00"),
        in_stock=True
    )
    
    db.add_all([
        cuadro_carbono_aero, cuadro_carbono_endurance, cuadro_aluminio,
        horquilla_carbono_aero, horquilla_carbono_endurance, horquilla_aluminio,
        ruedas_carbono, ruedas_aluminio,
        grupo_ultegra, grupo_105,
        frenos_disco, frenos_caliper
    ])
    db.flush()
    
    # Crear dependencias
    dependencies = [
        # Cuadro Aero requiere Horquilla Aero
        OptionDependency(
            option_id=cuadro_carbono_aero.id,
            depends_on_option_id=horquilla_carbono_aero.id,
            type=DependencyType.requires
        ),
        # Cuadro Endurance requiere Horquilla Endurance
        OptionDependency(
            option_id=cuadro_carbono_endurance.id,
            depends_on_option_id=horquilla_carbono_endurance.id,
            type=DependencyType.requires
        ),
        # Ruedas Carbono requiere Cuadro Aero
        OptionDependency(
            option_id=ruedas_carbono.id,
            depends_on_option_id=cuadro_carbono_aero.id,
            type=DependencyType.requires
        ),
        # Grupo Ultegra requiere frenos de disco
        OptionDependency(
            option_id=grupo_ultegra.id,
            depends_on_option_id=frenos_disco.id,
            type=DependencyType.requires
        ),
        # Frenos caliper no compatibles con cuadro aero
        OptionDependency(
            option_id=frenos_caliper.id,
            depends_on_option_id=cuadro_carbono_aero.id,
            type=DependencyType.excludes
        )
    ]
    db.add_all(dependencies)
    db.commit()
    
    return {
        'product': product,
        'parts': {
            'cuadro': cuadro,
            'horquilla': horquilla,
            'ruedas': ruedas,
            'grupo': grupo,
            'frenos': frenos
        },
        'options': {
            'cuadro_carbono_aero': cuadro_carbono_aero,
            'cuadro_carbono_endurance': cuadro_carbono_endurance,
            'cuadro_aluminio': cuadro_aluminio,
            'horquilla_carbono_aero': horquilla_carbono_aero,
            'horquilla_carbono_endurance': horquilla_carbono_endurance,
            'horquilla_aluminio': horquilla_aluminio,
            'ruedas_carbono': ruedas_carbono,
            'ruedas_aluminio': ruedas_aluminio,
            'grupo_ultegra': grupo_ultegra,
            'grupo_105': grupo_105,
            'frenos_disco': frenos_disco,
            'frenos_caliper': frenos_caliper
        }
    }

def test_validate_no_selection(db: Session, sample_product):
    """Prueba la validación cuando no hay opciones seleccionadas"""
    result = validate_compatibility(db, sample_product['product'].id, [])
    
    # Verificar que todas las opciones están disponibles
    for component in result['product']['components']:
        for option in component['options']:
            assert option['is_compatible'] == True
            assert option['selected'] == False

def test_validate_cuadro_aero_selection(db: Session, sample_product):
    """Prueba la validación cuando se selecciona el Cuadro Carbono Aero"""
    result = validate_compatibility(
        db,
        sample_product['product'].id,
        [sample_product['options']['cuadro_carbono_aero'].id]
    )
    
    # Buscar componentes específicos en el resultado
    cuadro_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Cuadro')
    horquilla_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Horquilla')
    frenos_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Frenos')
    
    # Verificar Cuadro Carbono Aero - se marca como incompatible porque requiere Horquilla Aero
    cuadro_aero = next(o for o in cuadro_options if o['name'] == 'Cuadro Carbono Aero')
    assert cuadro_aero['selected'] == True
    assert cuadro_aero['is_compatible'] == False
    
    # Verificar que otros cuadros son incompatibles
    cuadro_endurance = next(o for o in cuadro_options if o['name'] == 'Cuadro Carbono Endurance')
    assert cuadro_endurance['selected'] == False
    assert cuadro_endurance['is_compatible'] == False
    
    # Verificar Horquilla Carbono Aero - compatible porque es requerida
    horquilla_aero = next(o for o in horquilla_options if o['name'] == 'Horquilla Carbono Aero')
    assert horquilla_aero['selected'] == False
    assert horquilla_aero['is_compatible'] == True
    
    # Verificar que Horquilla Endurance es incompatible
    horquilla_endurance = next(o for o in horquilla_options if o['name'] == 'Horquilla Carbono Endurance')
    assert horquilla_endurance['selected'] == False
    assert horquilla_endurance['is_compatible'] == False

    # Verificar que frenos caliper son incompatibles con cuadro aero
    frenos_caliper = next(o for o in frenos_options if o['name'] == 'Frenos Caliper')
    assert frenos_caliper['selected'] == False
    assert frenos_caliper['is_compatible'] == False

def test_validate_both_aero_selection(db: Session, sample_product):
    """Prueba la validación cuando se seleccionan tanto el Cuadro como la Horquilla Aero"""
    result = validate_compatibility(
        db,
        sample_product['product'].id,
        [
            sample_product['options']['cuadro_carbono_aero'].id,
            sample_product['options']['horquilla_carbono_aero'].id
        ]
    )
    
    # Buscar componentes específicos en el resultado
    cuadro_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Cuadro')
    horquilla_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Horquilla')
    
    # Ahora el cuadro aero debe ser compatible porque todas sus dependencias están satisfechas
    cuadro_aero = next(o for o in cuadro_options if o['name'] == 'Cuadro Carbono Aero')
    assert cuadro_aero['selected'] == True
    assert cuadro_aero['is_compatible'] == True
    
    # La horquilla aero también debe ser compatible
    horquilla_aero = next(o for o in horquilla_options if o['name'] == 'Horquilla Carbono Aero')
    assert horquilla_aero['selected'] == True
    assert horquilla_aero['is_compatible'] == True

def test_validate_complete_compatible_selection(db: Session, sample_product):
    """Prueba la validación con una selección completa y compatible"""
    result = validate_compatibility(
        db,
        sample_product['product'].id,
        [
            sample_product['options']['cuadro_carbono_aero'].id,
            sample_product['options']['horquilla_carbono_aero'].id,
            sample_product['options']['ruedas_carbono'].id,
            sample_product['options']['grupo_ultegra'].id,
            sample_product['options']['frenos_disco'].id
        ]
    )
    
    # Verificar que todas las opciones seleccionadas están marcadas correctamente
    for component in result['product']['components']:
        for option in component['options']:
            if option['name'] in [
                'Cuadro Carbono Aero',
                'Horquilla Carbono Aero',
                'Ruedas Carbono 50mm',
                'Shimano Ultegra',
                'Frenos de Disco'
            ]:
                assert option['selected'] == True
                assert option['is_compatible'] == True

def test_validate_incompatible_selection(db: Session, sample_product):
    """Prueba la validación con una selección incompatible"""
    result = validate_compatibility(
        db,
        sample_product['product'].id,
        [
            sample_product['options']['cuadro_carbono_aero'].id,
            sample_product['options']['horquilla_carbono_endurance'].id
        ]
    )
    
    # Verificar que se detecta la incompatibilidad
    horquilla_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Horquilla')
    horquilla_endurance = next(o for o in horquilla_options if o['name'] == 'Horquilla Carbono Endurance')
    assert horquilla_endurance['selected'] == True
    assert horquilla_endurance['is_compatible'] == False
    
    # El cuadro también debe ser incompatible porque requiere otra horquilla
    cuadro_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Cuadro')
    cuadro_aero = next(o for o in cuadro_options if o['name'] == 'Cuadro Carbono Aero')
    assert cuadro_aero['selected'] == True
    assert cuadro_aero['is_compatible'] == False

def test_validate_out_of_stock_option(db: Session, sample_product):
    """Prueba la validación cuando una opción está fuera de stock"""
    # Marcar una opción como fuera de stock
    ruedas_carbono = sample_product['options']['ruedas_carbono']
    ruedas_carbono.in_stock = False
    db.commit()
    
    result = validate_compatibility(db, sample_product['product'].id, [])
    
    # Verificar que la opción fuera de stock está marcada como incompatible
    ruedas_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Ruedas')
    ruedas_carbono_result = next(o for o in ruedas_options if o['name'] == 'Ruedas Carbono 50mm')
    assert ruedas_carbono_result['is_compatible'] == False
    assert ruedas_carbono_result['selected'] == False

def test_validate_multiple_dependencies(db: Session, sample_product):
    """Prueba la validación con múltiples dependencias encadenadas"""
    result = validate_compatibility(
        db,
        sample_product['product'].id,
        [
            sample_product['options']['grupo_ultegra'].id
        ]
    )
    
    # Verificar que el grupo Ultegra es incompatible porque requiere frenos de disco
    grupo_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Grupo')
    grupo_ultegra = next(o for o in grupo_options if o['name'] == 'Shimano Ultegra')
    assert grupo_ultegra['selected'] == True
    assert grupo_ultegra['is_compatible'] == False

    # Verificar que los frenos de disco son compatibles y necesarios
    frenos_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Frenos')
    frenos_disco = next(o for o in frenos_options if o['name'] == 'Frenos de Disco')
    assert frenos_disco['selected'] == False
    assert frenos_disco['is_compatible'] == True

def test_validate_exclusion_rules(db: Session, sample_product):
    """Prueba la validación de reglas de exclusión"""
    result = validate_compatibility(
        db,
        sample_product['product'].id,
        [
            sample_product['options']['cuadro_carbono_aero'].id,
            sample_product['options']['frenos_caliper'].id
        ]
    )
    
    # Verificar que los frenos caliper son incompatibles con el cuadro aero
    frenos_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Frenos')
    frenos_caliper = next(o for o in frenos_options if o['name'] == 'Frenos Caliper')
    assert frenos_caliper['selected'] == True
    assert frenos_caliper['is_compatible'] == False

def test_validate_mixed_dependencies(db: Session, sample_product):
    """Prueba la validación con una mezcla de dependencias requires y excludes"""
    result = validate_compatibility(
        db,
        sample_product['product'].id,
        [
            sample_product['options']['cuadro_carbono_aero'].id,
            sample_product['options']['horquilla_carbono_aero'].id,
            sample_product['options']['grupo_ultegra'].id
        ]
    )
    
    # El cuadro aero requiere horquilla aero, pero está seleccionada, así que es compatible
    cuadro_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Cuadro')
    cuadro_aero = next(o for o in cuadro_options if o['name'] == 'Cuadro Carbono Aero')
    assert cuadro_aero['selected'] == True
    assert cuadro_aero['is_compatible'] == True
    
    # El grupo Ultegra requiere frenos de disco, pero no están seleccionados, así que es incompatible
    grupo_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Grupo')
    grupo_ultegra = next(o for o in grupo_options if o['name'] == 'Shimano Ultegra')
    assert grupo_ultegra['selected'] == True
    assert grupo_ultegra['is_compatible'] == False
    
    # Verificar que los frenos de disco son compatibles y necesarios
    frenos_options = next(c['options'] for c in result['product']['components'] if c['name'] == 'Frenos')
    frenos_disco = next(o for o in frenos_options if o['name'] == 'Frenos de Disco')
    assert frenos_disco['selected'] == False
    assert frenos_disco['is_compatible'] == True
    
    # Verificar que los frenos caliper son incompatibles con el cuadro aero
    frenos_caliper = next(o for o in frenos_options if o['name'] == 'Frenos Caliper')
    assert frenos_caliper['selected'] == False
    assert frenos_caliper['is_compatible'] == False 
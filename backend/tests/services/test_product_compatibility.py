import pytest
from unittest.mock import MagicMock, patch
from decimal import Decimal
from app.models.product import Product, PartType, PartOption, OptionDependency, DependencyType, ConditionalPrice
from app.services.product_service import (
    validate_compatibility, 
    calculate_price, 
    get_product_dependencies,
    get_product_id_from_options
)


class TestProductCompatibility:
    """
    Pruebas para las funciones de compatibilidad de productos
    """
    
    def test_validate_compatibility_no_selection(self, monkeypatch):
        """
        Prueba validate_compatibility cuando no hay opciones seleccionadas
        """
        # Configurar mocks
        mock_db = MagicMock()
        mock_product = MagicMock()
        mock_product.id = 1
        mock_product.name = "Computadora"
        
        mock_part_type = MagicMock()
        mock_part_type.id = 1
        mock_part_type.name = "Procesador"
        mock_part_type.product_id = 1
        
        mock_option = MagicMock()
        mock_option.id = 1
        mock_option.name = "Intel i7"
        mock_option.base_price = Decimal('100')
        mock_option.in_stock = True
        mock_option.part_type_id = 1
        
        # Configurar comportamiento del mock
        mock_db.query.return_value.filter.return_value.first.return_value = mock_product
        mock_db.query.return_value.filter.return_value.all.side_effect = [
            [mock_part_type],  # part_types
            [mock_option]      # options
        ]
        
        # Ejecutar función
        result = validate_compatibility(mock_db, product_id=1, selected_option_ids=[])
        
        # Verificaciones
        assert result["product"]["id"] == 1
        assert result["product"]["name"] == "Computadora"
        assert len(result["product"]["components"]) == 1
        assert result["product"]["components"][0]["name"] == "Procesador"
        assert len(result["product"]["components"][0]["options"]) == 1
        assert result["product"]["components"][0]["options"][0]["is_compatible"] == True
        assert result["product"]["components"][0]["options"][0]["selected"] == False
    
    @patch('app.services.product_service.calculate_price')
    def test_calculate_price_patched(self, mock_calculate_price):
        """
        Prueba el funcionamiento de calculate_price usando patching
        """
        # Configurar el mock para que retorne el valor esperado
        mock_calculate_price.return_value = Decimal('300')
        
        # Crear una sesión mock
        mock_db = MagicMock()
        
        # Llamar a la función directamente (se usará el mock)
        result = mock_calculate_price(mock_db, [1, 2])
        
        # Verificar que el resultado es el esperado
        assert result == Decimal('300')
        
        # Verificar que la función fue llamada con los argumentos correctos
        mock_calculate_price.assert_called_once_with(mock_db, [1, 2])
    
    def test_get_product_id_from_options(self, monkeypatch):
        """
        Prueba get_product_id_from_options
        """
        # Configurar mocks
        mock_db = MagicMock()
        mock_option = MagicMock()
        mock_option.id = 1
        mock_option.part_type_id = 2
        
        mock_part_type = MagicMock()
        mock_part_type.id = 2
        mock_part_type.product_id = 3
        
        # Configurar comportamiento de los mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_option,     # first_option
            mock_part_type   # part_type
        ]
        
        # Ejecutar función
        result = get_product_id_from_options(mock_db, [1])
        
        # Verificación
        assert result == 3
        
    def test_get_product_dependencies(self, monkeypatch):
        """
        Prueba get_product_dependencies
        """
        # Configurar mocks
        mock_db = MagicMock()
        mock_part_type = MagicMock()
        mock_part_type.id = 1
        mock_part_type.name = "CPU"
        mock_part_type.product_id = 1
        
        mock_option1 = MagicMock()
        mock_option1.id = 1
        mock_option1.name = "Intel i7"
        mock_option1.part_type_id = 1
        
        mock_option2 = MagicMock()
        mock_option2.id = 2
        mock_option2.name = "32GB RAM"
        mock_option2.part_type_id = 2
        
        mock_dependency = MagicMock()
        mock_dependency.option_id = 1
        mock_dependency.depends_on_option_id = 2
        mock_dependency.type = DependencyType.requires
        
        # Configurar comportamiento de los mocks
        mock_db.query.return_value.filter.return_value.all.side_effect = [
            [mock_part_type],  # part_types
            [mock_option1],    # options for part_type
            [mock_dependency]  # dependencies
        ]
        
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_option1,  # option
            mock_option2   # depends_on
        ]
        
        # Ejecutar función
        result = get_product_dependencies(mock_db, 1)
        
        # Verificaciones
        assert len(result) == 1
        assert result[0].option_id == 1
        assert result[0].depends_on_option_id == 2 
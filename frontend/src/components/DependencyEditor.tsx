import React, { useState, useEffect } from 'react';
import { PartType, PartOption } from '@/types/product';

interface DependencyEditorProps {
  partTypes: PartType[];
  onSaveDependency: (dependency: {
    optionId: number;
    dependsOnOptionId: number;
    type: 'requires' | 'excludes';
  }) => void;
  onRemoveDependency: (dependencyId: number) => void;
  currentDependencies: Array<{
    id: number;
    optionId: number;
    dependsOnOptionId: number;
    type: 'requires' | 'excludes';
  }>;
}

const DependencyEditor: React.FC<DependencyEditorProps> = ({
  partTypes,
  onSaveDependency,
  onRemoveDependency,
  currentDependencies
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedDependsOn, setSelectedDependsOn] = useState<number | null>(null);
  const [dependencyType, setDependencyType] = useState<'requires' | 'excludes'>('requires');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Función auxiliar para obtener el nombre completo de una opción (Tipo de parte + Opción)
  const getOptionFullName = (optionId: number) => {
    for (const partType of partTypes) {
      const option = partType.options.find(opt => opt.id === optionId);
      if (option) {
        return `${partType.name} - ${option.name}`;
      }
    }
    return 'Opción no encontrada';
  };

  const handleAddDependency = () => {
    if (selectedOption && selectedDependsOn) {
      onSaveDependency({
        optionId: selectedOption,
        dependsOnOptionId: selectedDependsOn,
        type: dependencyType
      });
      setIsAddingNew(false);
      setSelectedOption(null);
      setSelectedDependsOn(null);
      setDependencyType('requires');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Dependencias entre componentes</h3>
        <button
          onClick={() => setIsAddingNew(true)}
          className="text-primary hover:text-primary-dark flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Añadir dependencia
        </button>
      </div>

      {/* Lista de dependencias actuales */}
      <div className="space-y-3 mb-6">
        {currentDependencies.map((dep) => (
          <div key={dep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">{getOptionFullName(dep.optionId)}</span>
                <span className="mx-2 text-gray-400">
                  {dep.type === 'requires' ? 'requiere' : 'excluye'}
                </span>
                <span className="font-medium">{getOptionFullName(dep.dependsOnOptionId)}</span>
              </p>
            </div>
            <button
              onClick={() => onRemoveDependency(dep.id)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Formulario para añadir nueva dependencia */}
      {isAddingNew && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-4">Nueva dependencia</h4>
          
          <div className="space-y-4">
            {/* Selección de primera opción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opción principal
              </label>
              <select
                value={selectedOption || ''}
                onChange={(e) => setSelectedOption(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecciona una opción</option>
                {partTypes.map(partType => (
                  <optgroup key={partType.id} label={partType.name}>
                    {partType.options.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Tipo de dependencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de dependencia
              </label>
              <select
                value={dependencyType}
                onChange={(e) => setDependencyType(e.target.value as 'requires' | 'excludes')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="requires">Requiere</option>
                <option value="excludes">Excluye</option>
              </select>
            </div>

            {/* Selección de segunda opción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opción dependiente
              </label>
              <select
                value={selectedDependsOn || ''}
                onChange={(e) => setSelectedDependsOn(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecciona una opción</option>
                {partTypes.map(partType => (
                  <optgroup key={partType.id} label={partType.name}>
                    {partType.options.map(option => (
                      <option 
                        key={option.id} 
                        value={option.id}
                        disabled={option.id === selectedOption}
                      >
                        {option.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDependency}
                disabled={!selectedOption || !selectedDependsOn}
                className={`px-4 py-2 text-sm text-white rounded-md ${
                  selectedOption && selectedDependsOn
                    ? 'bg-primary hover:bg-primary-dark'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Guardar dependencia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DependencyEditor; 
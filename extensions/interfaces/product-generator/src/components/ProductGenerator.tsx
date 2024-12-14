import React, { useState, useEffect } from 'react';
import { Plus, Upload, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import AddFarmModal from './AddFarmModal';
import ProductList from './ProductList';

// Definice typů pro TypeScript
type Farm = {
  id: string;
  name: string;
  farm_id: string;
  import_file?: string;
  created_at: Date;
  updated_at: Date;
};

interface ProductGeneratorProps {
  // Directus specific props
  value?: string;
  onChange?: (value: string) => void;
  width: string;
  height: string;
}

const ProductGenerator: React.FC<ProductGeneratorProps> = ({ value, onChange, width, height }) => {
  // Stavové proměnné
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);

  // Načtení farem při prvním renderu
  useEffect(() => {
    fetchFarms();
  }, []);

  // Načtení seznamu farem
  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ext/product-generator/farms');
      
      if (!response.ok) {
        throw new Error('Nepodařilo se načíst farmy');
      }
      
      const data = await response.json();
      setFarms(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala neočekávaná chyba');
    } finally {
      setLoading(false);
    }
  };

  // Handler pro přidání nové farmy
  const handleAddFarm = async (formData: FormData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/ext/product-generator/farms', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Nepodařilo se vytvořit farmu');
      }
      
      await fetchFarms();
      setShowAddFarmModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala neočekávaná chyba');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Farmy</h2>
          <button
            onClick={() => setShowAddFarmModal(true)}
            className="p-2 text-blue-600 hover:text-blue-800"
            title="Přidat farmu"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Seznam farem */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {farms.map((farm) => (
              <div
                key={farm.id}
                onClick={() => setSelectedFarm(farm)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedFarm?.id === farm.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{farm.name}</div>
                <div className="text-sm text-gray-500">ID: {farm.farm_id}</div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Hlavní obsah */}
      <div className="flex-1 p-6">
        {selectedFarm ? (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedFarm.name}
            </h1>
            <ProductList farmId={selectedFarm.id} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Upload size={48} className="mb-4" />
            <p>Vyberte farmu ze seznamu nebo vytvořte novou</p>
          </div>
        )}
      </div>

      {/* Modální okno pro přidání farmy */}
      <AddFarmModal 
        isOpen={showAddFarmModal}
        onClose={() => setShowAddFarmModal(false)}
        onSubmit={handleAddFarm}
      />
    </div>
  );
};

export default ProductGenerator;

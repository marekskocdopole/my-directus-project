import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

type HistoryEntry = {
  id: string;
  timestamp: Date;
  type: 'description' | 'image' | 'save';
  shortDescription?: string;
  longDescription?: string;
  selectedImageUrl?: string;
  createdBy: string;
};

interface ProductHistoryProps {
  productId: string;
  onRestore: (entry: HistoryEntry) => Promise<void>;
}

const ProductHistory = ({ productId, onRestore }: ProductHistoryProps) => {
  const [history, setHistory] = React.useState<HistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchHistory();
  }, [productId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ext/product-generator/products/${productId}/history`);
      if (!response.ok) throw new Error('Nepodařilo se načíst historii');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError('Nepodařilo se načíst historii');
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'description':
        return 'Změna popisků';
      case 'image':
        return 'Změna obrázku';
      case 'save':
        return 'Uložení změn';
      default:
        return 'Neznámá akce';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Historie změn
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-gray-500">Načítám historii...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">{getActionText(entry.type)}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(entry.timestamp), 'dd. MMMM yyyy HH:mm', { locale: cs })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {entry.createdBy}
                  </div>
                  {entry.shortDescription && (
                    <div className="mt-2 text-sm">
                      <div className="font-medium">Krátký popis:</div>
                      <div className="text-gray-600">{entry.shortDescription}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onRestore(entry)}
                  className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Obnovit tuto verzi"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductHistory;

import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText, Image, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import ProductDetail from './ProductDetail';

type Product = {
  id: string;
  name: string;
  shop_sku: string;
  generated_short_description: string;
  generated_long_description: string;
  ingredients: string;
  selected_image_url: string;
  status: 'draft' | 'in_progress' | 'completed';
};

interface ProductListProps {
  farmId: string;
}

const ProductList = ({ farmId }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingProduct, setGeneratingProduct] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (farmId) {
      fetchProducts();
    }
  }, [farmId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ext/product-generator/farms/${farmId}/products`);
      if (!response.ok) throw new Error('Nepodařilo se načíst produkty');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError('Nepodařilo se načíst produkty');
    } finally {
      setLoading(false);
    }
  };

  const generateDescriptions = async (productId: string) => {
    try {
      setGeneratingProduct(productId);
      const response = await fetch(`/api/ext/product-generator/products/${productId}/generate-descriptions`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Nepodařilo se vygenerovat popisky');
      
      await fetchProducts();
    } catch (err) {
      setError('Nepodařilo se vygenerovat popisky');
    } finally {
      setGeneratingProduct(null);
    }
  };

  const generateImages = async (productId: string) => {
    try {
      setGeneratingProduct(productId);
      const response = await fetch(`/api/ext/product-generator/products/${productId}/generate-images`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Nepodařilo se vygenerovat obrázky');
      
      await fetchProducts();
    } catch (err) {
      setError('Nepodařilo se vygenerovat obrázky');
    } finally {
      setGeneratingProduct(null);
    }
  };

  const getStatusIcon = (status: Product['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produkt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr 
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className="cursor-pointer hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{product.shop_sku}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(product.status)}
                    <span className="ml-2 text-sm text-gray-500">
                      {product.status === 'completed' ? 'Dokončeno' : 
                       product.status === 'in_progress' ? 'Zpracovává se' : 'Čeká na zpracování'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateDescriptions(product.id);
                    }}
                    disabled={generatingProduct === product.id}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 mr-2 disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Popisky
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateImages(product.id);
                    }}
                    disabled={generatingProduct === product.id}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50"
                  >
                    <Image className="w-4 h-4 mr-1" />
                    Obrázky
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProductId && (
        <ProductDetail
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
  );
};

export default ProductList;

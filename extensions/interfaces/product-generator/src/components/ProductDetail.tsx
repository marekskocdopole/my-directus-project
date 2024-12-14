import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import ProductHistory from './ProductHistory';

type Product = {
  id: string;
  name: string;
  shop_sku: string;
  generated_short_description: string;
  generated_long_description: string;
  ingredients: string;
  selected_image_url: string;
  image_generation_attempts: {
    id: string;
    urls: string[];
    selected: boolean;
    created_at: Date;
  }[];
  status: 'draft' | 'in_progress' | 'completed';
};

interface ProductDetailProps {
  productId: string;
  onClose: () => void;
}

const ProductDetail = ({ productId, onClose }: ProductDetailProps) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingDescriptions, setGeneratingDescriptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validační funkce
  const validateDescriptions = (): string[] => {
    const errors: string[] = [];
    
    if (!shortDescription.trim()) {
      errors.push('Krátký popis je povinný');
    } else if (shortDescription.length > 150) {
      errors.push('Krátký popis nesmí být delší než 150 znaků');
    }

    if (!longDescription.trim()) {
      errors.push('Dlouhý popis je povinný');
    } else if (longDescription.length < 100) {
      errors.push('Dlouhý popis musí mít alespoň 100 znaků');
    }

    return errors;
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ext/product-generator/products/${productId}`);
      if (!response.ok) throw new Error('Nepodařilo se načíst produkt');
      const data = await response.json();
      setProduct(data);
      setShortDescription(data.generated_short_description);
      setLongDescription(data.generated_long_description);
      setSelectedImageUrl(data.selected_image_url);
    } catch (err) {
      setError('Nepodařilo se načíst produkt');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const errors = validateDescriptions();
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      setSaving(true);
      const response = await fetch(`/api/ext/product-generator/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generated_short_description: shortDescription,
          generated_long_description: longDescription,
          selected_image_url: selectedImageUrl,
          status: 'completed',
        }),
      });

      if (!response.ok) throw new Error('Nepodařilo se uložit změny');
      await fetchProduct();
      setValidationErrors([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit změny');
    } finally {
      setSaving(false);
    }
  };

  const handleShortDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setShortDescription(text);
    if (text.length > 150) {
      setValidationErrors(['Krátký popis nesmí být delší než 150 znaků']);
    } else {
      setValidationErrors([]);
    }
  };

  const generateDescriptions = async () => {
    try {
      setGeneratingDescriptions(true);
      const response = await fetch(`/api/ext/product-generator/products/${productId}/generate-descriptions`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Nepodařilo se vygenerovat popisky');
      
      await fetchProduct();
    } catch (err) {
      setError('Nepodařilo se vygenerovat popisky');
    } finally {
      setGeneratingDescriptions(false);
    }
  };

  const generateImages = async () => {
    try {
      setGeneratingImages(true);
      const response = await fetch(`/api/ext/product-generator/products/${productId}/generate-images`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Nepodařilo se vygenerovat obrázky');
      
      await fetchProduct();
    } catch (err) {
      setError('Nepodařilo se vygenerovat obrázky');
    } finally {
      setGeneratingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Produkt nebyl nalezen</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Hlavička */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {product.name}
            <span className="ml-2 text-sm text-gray-500">({product.shop_sku})</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Obsah */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Popisky */}
          <Card>
            <CardHeader>
              <CardTitle>Popisky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Krátký popis
                  <span className="text-sm text-gray-500 ml-2">
                    ({shortDescription.length}/150 znaků)
                  </span>
                </label>
                <textarea
                  value={shortDescription}
                  onChange={handleShortDescriptionChange}
                  className={`w-full p-2 border rounded-md ${
                    shortDescription.length > 150 ? 'border-red-500' : ''
                  }`}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dlouhý popis
                  <span className="text-sm text-gray-500 ml-2">
                    (Minimálně 100 znaků)
                  </span>
                </label>
                <textarea
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  className={`w-full p-2 border rounded-md ${
                    longDescription.length < 100 ? 'border-red-500' : ''
                  }`}
                  rows={6}
                />
              </div>
              <button
                onClick={generateDescriptions}
                disabled={generatingDescriptions}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
              >
                {generatingDescriptions ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {generatingDescriptions ? 'Generuji...' : 'Vygenerovat nové popisky'}
              </button>
            </CardContent>
          </Card>

          {/* Obrázky */}
          <Card>
            <CardHeader>
              <CardTitle>Obrázky</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.image_generation_attempts.flatMap(attempt => 
                  attempt.urls.map((url, index) => (
                    <div
                      key={`${attempt.id}-${index}`}
                      className={`relative aspect-square border rounded-lg cursor-pointer overflow-hidden ${
                        url === selectedImageUrl ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedImageUrl(url)}
                    >
                      <img
                        src={url}
                        alt={`Náhled ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {url === selectedImageUrl && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                          <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                            Vybráno
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <button
                  onClick={generateImages}
                  disabled={generatingImages}
                  className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {generatingImages ? (
                    <>
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      <span className="mt-2 text-sm text-gray-500">
                        Generuji...
                      </span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-500">
                        Vygenerovat další
                      </span>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Historie změn */}
          <ProductHistory 
            productId={productId}
            onRestore={async (entry) => {
              try {
                setShortDescription(entry.shortDescription || '');
                setLongDescription(entry.longDescription || '');
                if (entry.selectedImageUrl) {
                  setSelectedImageUrl(entry.selectedImageUrl);
                }
              } catch (err) {
                setError('Nepodařilo se obnovit předchozí verzi');
              }
            }}
          />
        </div>

        {/* Patička */}
        <div className="p-4 border-t flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving || validationErrors.length > 0}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

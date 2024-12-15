// src/components/AddFarmModal.tsx
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../components/ui/alert-dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Upload, Loader2 } from 'lucide-react';

interface AddFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

const AddFarmModal: React.FC<AddFarmModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && !selectedFile.name.endsWith('.csv')) {
      setError('Prosím vyberte CSV soubor');
      return;
    }
    setFile(selectedFile || null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Validation
      const name = formData.get('name') as string;
      const farmId = formData.get('farmId') as string;

      if (!name || !farmId || !file) {
        throw new Error('Vyplňte prosím všechna pole a nahrajte CSV soubor');
      }

      formData.set('file', file);

      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala neočekávaná chyba');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Přidat novou farmu</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Název farmy
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Zadejte název farmy"
            />
          </div>

          <div>
            <label htmlFor="farmId" className="block text-sm font-medium text-gray-700">
              ID farmy
            </label>
            <input
              type="text"
              name="farmId"
              id="farmId"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Zadejte ID farmy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              CSV soubor s produkty
            </label>
            <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-4 relative">
              <div className="text-center">
                {file ? (
                  <div className="text-sm text-gray-600">{file.name}</div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2 text-sm text-gray-600">
                      Klikněte pro výběr nebo přetáhněte CSV soubor
                    </div>
                  </>
                )}
                <input
                  type="file"
                  name="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Vytvořit farmu
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddFarmModal;
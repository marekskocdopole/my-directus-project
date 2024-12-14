import React from 'react';

export interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ 
  open,
  onOpenChange,
  children 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      {children}
    </div>
  );
};

export const AlertDialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children,
  className = ''
}) => (
  <div className={`bg-white rounded-lg max-w-lg w-full p-6 ${className}`}>
    {children}
  </div>
);

export const AlertDialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const AlertDialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg font-medium">{children}</h2>
);

export const AlertDialogFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-4 flex justify-end space-x-2">{children}</div>
);

export const AlertDialogAction: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ 
  children,
  onClick 
}) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    {children}
  </button>
);

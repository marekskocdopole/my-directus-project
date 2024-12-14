import React from 'react';

export interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  variant = 'default',
  children,
  className = ''
}) => {
  const baseClass = 'p-4 rounded-lg border';
  const variantClass = variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200';
  
  return (
    <div className={`${baseClass} ${variantClass} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm">{children}</div>
);

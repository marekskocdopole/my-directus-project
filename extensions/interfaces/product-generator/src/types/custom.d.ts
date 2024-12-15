// src/types/custom.d.ts
declare module '../components/ui/alert-dialog' {
    import React from 'react';
    export const AlertDialog: React.FC<any>;
    export const AlertDialogContent: React.FC<any>;
    export const AlertDialogFooter: React.FC<any>;
    export const AlertDialogHeader: React.FC<any>;
    export const AlertDialogTitle: React.FC<any>;
  }
  
  declare module '../components/ui/alert' {
    import React from 'react';
    export const Alert: React.FC<any>;
    export const AlertDescription: React.FC<any>;
  }
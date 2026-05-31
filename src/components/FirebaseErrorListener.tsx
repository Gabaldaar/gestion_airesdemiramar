'use client';

import { useEffect, useCallback } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from './ui/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  const handlePermissionError = useCallback((error: any) => {
    console.error(error.message, error.context);
    toast({
      variant: 'destructive',
      title: 'Error de Permisos',
      description: 'No tienes permisos suficientes para realizar esta operación o los datos no cumplen con las reglas de validación.',
    });
  }, [toast]);

  useEffect(() => {
    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [handlePermissionError]);

  return null;
}

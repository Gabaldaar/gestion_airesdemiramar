
'use client'

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Waves, AlertCircle } from 'lucide-react';

import { loginAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SubmitButton() {
    const { pending } = useFormStatus()
   
    return (
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Ingresando...' : 'Ingresar'}
      </Button>
    )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Waves className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Aires de Miramar</h1>
            <p className="text-muted-foreground">Panel de Administración</p>
        </div>
        
        <form action={formAction} className="space-y-4">
            <div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Contraseña"
                required
              />
            </div>

          {state?.error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de Acceso</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

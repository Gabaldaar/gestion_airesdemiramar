
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Waves, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { loginAction } from "@/lib/actions";

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Ingresando...' : <> <LogIn className="mr-2" /> Ingresar </>}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-primary">Aires de Miramar</h1>
          </div>
          <CardTitle>Acceso de Administrador</CardTitle>
          <CardDescription>
            Ingresa la contraseña para gestionar tus propiedades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                name="password"
                required
              />
            </div>
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de Autenticación</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <LoginButton />
          </form>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-center w-full text-muted-foreground">
                Acceso restringido solo para personal autorizado.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

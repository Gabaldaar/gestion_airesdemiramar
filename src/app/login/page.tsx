
"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { setAuthCookie } from "@/lib/auth";

export default function LoginPage() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const result = await setAuthCookie(password);
        if (result.success) {
            // Force a full page reload to ensure the new cookie state is recognized by the middleware
            window.location.href = "/";
        } else {
            toast({
                title: "Error de Autenticación",
                description: "La contraseña es incorrecta.",
                variant: "destructive",
            });
        }
    } catch (error) {
        toast({
            title: "Error",
            description: "Ocurrió un problema al intentar iniciar sesión.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
             <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Ingresando...' : <> <LogIn className="mr-2" /> Ingresar </>}
            </Button>
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

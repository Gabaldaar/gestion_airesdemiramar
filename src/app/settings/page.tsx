
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>
                        Actualiza la información de tu perfil.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name">Nombre</label>
                        <Input id="name" defaultValue="Admin" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email">Email</label>
                        <Input id="email" type="email" defaultValue="admin@example.com" />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Guardar</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Preferencias</CardTitle>
                    <CardDescription>
                        Configura las preferencias de la aplicación.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Más opciones de configuración aquí */}
                    <p>Opciones de configuración de notificaciones, tema, etc.</p>
                </CardContent>
                 <CardFooter className="border-t px-6 py-4">
                    <Button>Guardar</Button>
                </CardFooter>
            </Card>
        </div>
    )
}


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEmailTemplates } from "@/lib/data";
import EmailTemplateManager from "@/components/email-template-manager";

export default async function TemplatesPage() {
  const emailTemplates = await getEmailTemplates();

  return (
    <div className="space-y-4">
        <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Plantillas de Email</h2>
            <p className="text-muted-foreground">
                Crea y gestiona las plantillas para enviar emails a tus inquilinos.
            </p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Gestor de Plantillas</CardTitle>
                <CardDescription>
                    Aquí puedes añadir, editar y eliminar las plantillas de correo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <EmailTemplateManager initialTemplates={emailTemplates} />
            </CardContent>
        </Card>
    </div>
  );
}

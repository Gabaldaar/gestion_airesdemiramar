
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEmailTemplates, EmailTemplate } from "@/lib/data";
import EmailTemplateManager from "@/components/email-template-manager";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";

export default function TemplatesPage() {
    const { user } = useAuth();
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            getEmailTemplates().then(data => {
                setEmailTemplates(data);
                setLoading(false);
            });
        }
    }, [user]);

    if (!user || loading) {
        return <p>Cargando plantillas...</p>
    }

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

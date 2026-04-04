// This is a placeholder file for the new Liquidations page.
// The full implementation will be provided in subsequent steps.

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function LiquidationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Briefcase className="h-10 w-10 text-primary" />
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Liquidaciones</h2>
            <p className="text-muted-foreground">Gestiona los pagos a tus colaboradores.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>En Construcción</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Esta sección está en desarrollo. ¡Vuelve pronto!</p>
        </CardContent>
      </Card>
    </div>
  );
}

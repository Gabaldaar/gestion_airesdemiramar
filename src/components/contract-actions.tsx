
'use client';

import { Button } from "@/components/ui/button";

export default function ContractActions() {
    return (
        <div className="print:hidden">
            <Button onClick={() => window.print()}>Imprimir / Guardar como PDF</Button>
        </div>
    );
}

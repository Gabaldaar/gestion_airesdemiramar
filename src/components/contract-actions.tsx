'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Mail, Printer, FileDown } from 'lucide-react';

interface ContractActionsProps {
    onEmailOpen: () => void;
}

export default function ContractActions({ onEmailOpen }: ContractActionsProps) {
    const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

    const handleRedactEmail = () => {
        onEmailOpen();
        setIsSendDialogOpen(false);
    }
    
    return (
        <div className="print:hidden flex items-center gap-2">
            <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir / Guardar
            </Button>
            
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary">
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar por Email
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enviar Contrato por Email</DialogTitle>
                        <DialogDescription>
                            Sigue estos dos pasos para guardar el contrato y enviarlo por email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex flex-col items-center gap-2 border p-4 rounded-lg">
                            <div className="flex items-center gap-2 font-semibold">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">1</span>
                                <span>Paso 1: Guardar el Contrato</span>
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Primero, guarda el contrato como archivo PDF en tu computadora.
                            </p>
                             <Button onClick={() => window.print()}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Guardar como PDF
                            </Button>
                        </div>

                         <div className="flex flex-col items-center gap-2 border p-4 rounded-lg">
                             <div className="flex items-center gap-2 font-semibold">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">2</span>
                                <span>Paso 2: Redactar el Email</span>
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Luego, redacta el email. No olvides adjuntar el PDF que acabas de guardar.
                            </p>
                            <Button onClick={handleRedactEmail}>
                                <Mail className="mr-2 h-4 w-4" />
                                Redactar Email
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

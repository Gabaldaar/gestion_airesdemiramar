

'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { updateProperty } from '@/lib/actions';
import { Property } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { NotebookPen, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Notas'
            )}
        </Button>
    )
}

export function PropertyNotesForm({ property }: { property: Property }) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const formId = `property-notes-form-${property.id}`;
  const [isOpen, setIsOpen] = useState(false);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProperty(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <NotebookPen className="mr-2 h-4 w-4" />
          Notas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notas de la Propiedad</DialogTitle>
          <DialogDescription>
            Añade o edita las notas. Los cambios se guardarán al presionar el botón de Guardar.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          {/* --- Hidden fields to preserve all property data --- */}
          <input type="hidden" name="id" value={property.id} />
          <input type="hidden" name="name" defaultValue={property.name} />
          <input type="hidden" name="address" defaultValue={property.address} />
          <input type="hidden" name="imageUrl" defaultValue={property.imageUrl || ''} />
          <input type="hidden" name="propertyUrl" defaultValue={property.propertyUrl || ''} />
          <input type="hidden" name="priceSheetName" defaultValue={property.priceSheetName || ''} />
          <input type="hidden" name="contractTemplate" defaultValue={property.contractTemplate || ''} />
          <input type="hidden" name="contractSignatureUrl" defaultValue={property.contractSignatureUrl || ''} />
          <input type="hidden" name="customField1Label" defaultValue={property.customField1Label || ''} />
          <input type="hidden" name="customField1Value" defaultValue={property.customField1Value || ''} />
          <input type="hidden" name="customField2Label" defaultValue={property.customField2Label || ''} />
          <input type="hidden" name="customField2Value" defaultValue={property.customField2Value || ''} />
          <input type="hidden" name="customField3Label" defaultValue={property.customField3Label || ''} />
          <input type="hidden" name="customField3Value" defaultValue={property.customField3Value || ''} />
          <input type="hidden" name="customField4Label" defaultValue={property.customField4Label || ''} />
          <input type="hidden" name="customField4Value" defaultValue={property.customField4Value || ''} />
          <input type="hidden" name="customField5Label" defaultValue={property.customField5Label || ''} />
          <input type="hidden" name="customField5Value" defaultValue={property.customField5Value || ''} />
          <input type="hidden" name="customField6Label" defaultValue={property.customField6Label || ''} />
          <input type="hidden" name="customField6Value" defaultValue={property.customField6Value || ''} />
          {property.visitRates && Object.entries(property.visitRates).map(([providerId, rate]) => (
            <input key={providerId} type="hidden" name={`visitRate_${providerId}`} defaultValue={rate} />
          ))}
          {/* --- End of hidden fields --- */}
          
          <Textarea
            name="notes"
            defaultValue={property.notes}
            className="min-h-[200px]"
            placeholder="Escribe tus notas aquí..."
          />
           <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <SubmitButton />
          </DialogFooter>
           {state.message && !state.success && (
              <p className="text-red-500 text-sm mt-2">{state.message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addTenant } from '@/lib/actions';
import { PlusCircle, Loader2, Star, CheckCircle2, User } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Origin } from '@/lib/data';
import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/i18n/useTranslation';
import { useToast } from './ui/use-toast';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="font-bold uppercase tracking-widest h-11 px-8 shadow-lg">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('tenants.add_dialog.submit')
            )}
        </Button>
    )
}

export function TenantAddForm({ children, onTenantAdded }: { children?: React.ReactNode, onTenantAdded?: () => void }) {
  const { appUser, orgId } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [rating, setRating] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await addTenant(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      toast({
          title: t('common.success'),
          description: "Inquilino guardado correctamente.",
      });
      setIsOpen(false);
      setRating(0);
      formRef.current?.reset();
      if (onTenantAdded) onTenantAdded();
    } else if (state.message && !state.success) {
        toast({
            title: t('common.error'),
            description: state.message,
            variant: "destructive",
        });
    }
  }, [state, onTenantAdded, toast, t]);

  const fetchOrigins = useCallback(async () => {
    if (!orgId) return;
    try {
        const q = query(collection(db, 'origins'), where('orgId', '==', orgId));
        let snap = await getDocs(q);
        setOrigins(snap.docs.map(d => ({ id: d.id, ...d.data() } as Origin)).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })));
    } catch (e) {
        console.error("Error fetching origins:", e);
    }
  }, [orgId]);

  useEffect(() => {
    if (isOpen) {
      fetchOrigins();
    }
  }, [isOpen, fetchOrigins]);
  
  const getStarColorClass = (currentRating: number) => {
    if (currentRating === 1) return "text-red-500 fill-red-500";
    if (currentRating === 2) return "text-orange-400 fill-orange-400";
    return "text-yellow-400 fill-yellow-400";
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('tenants.new_tenant')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-primary flex items-center gap-2">
              <User className="h-6 w-6" />
              {t('tenants.add_dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('tenants.add_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <input type="hidden" name="rating" value={rating} />
            <input type="hidden" name="orgId" value={orgId || ''} />
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 shadow-inner">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    {t('tenants.copy_format.name')}
                    </Label>
                    <Input id="name" name="name" className="col-span-3 h-11 bg-background shadow-sm" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dni" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    {t('tenants.card.dni')}
                    </Label>
                    <Input id="dni" name="dni" className="col-span-3 h-11 bg-background shadow-sm" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    {t('tenants.card.email')}
                    </Label>
                    <Input id="email" name="email" type="email" className="col-span-3 h-11 bg-background shadow-sm" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    {t('tenants.card.phone')}
                    </Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <Select name="countryCode" defaultValue="+54">
                            <SelectTrigger className="w-[100px] h-11 bg-background">
                                <SelectValue placeholder="+54" />
                            </SelectTrigger>
                            <SelectContent>
                                {countries.map(country => (
                                    <SelectItem key={country.code} value={country.dial_code}>
                                        {country.dial_code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input id="phone" name="phone" className="flex-grow h-11 bg-background shadow-sm" />
                    </div>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    {t('tenants.card.address')}
                    </Label>
                    <Input id="address" name="address" className="col-span-3 h-11 bg-background shadow-sm" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="city" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    {t('tenants.card.city')}
                    </Label>
                    <Input id="city" name="city" className="col-span-3 h-11 bg-background shadow-sm" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="originId" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                        {t('tenants.filters.origin')}
                    </Label>
                    <Select name="originId">
                        <SelectTrigger className="col-span-3 h-11 bg-background shadow-sm">
                            <SelectValue placeholder={t('common.select_origin')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">{t('common.none')}</SelectItem>
                            {origins.map(origin => (
                                <SelectItem key={origin.id} value={origin.id}>{origin.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rating" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                        {t('tenants.card.rating')}
                    </Label>
                    <div className="col-span-3 flex items-center gap-1.5 p-2 bg-background/50 rounded-lg border w-fit">
                        {[...Array(5)].map((_, index) => {
                            const ratingValue = index + 1;
                            return (
                            <Star
                                key={ratingValue}
                                className={cn(
                                "h-6 w-6 cursor-pointer transition-all hover:scale-125",
                                ratingValue <= rating
                                    ? getStarColorClass(rating)
                                    : "text-gray-300"
                                )}
                                onClick={() => setRating(ratingValue === rating ? 0 : ratingValue)}
                            />
                            );
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                        {t('tenants.card.notes')}
                    </Label>
                    <Textarea id="notes" name="notes" className="col-span-3 bg-background shadow-inner min-h-[100px]" />
                </div>
            </div>
            
            <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                <Button type="button" variant="outline" className="h-11 font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsOpen(false)}>{t('common.cancel')}</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

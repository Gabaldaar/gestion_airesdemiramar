'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { addProvider } from '@/lib/actions';
import { PlusCircle, Loader2, Banknote, Wrench } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProviderCategory, ProviderManagementType, UserRole } from '@/lib/data';
import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="font-bold uppercase text-[10px] tracking-widest h-11 px-8 shadow-lg">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('providers.add_dialog.submit')
            )}
        </Button>
    )
}

export function ProviderAddForm({ categories, onProviderAdded, allowedRoles }: { categories: ProviderCategory[], onProviderAdded: () => void, allowedRoles?: UserRole[] }) {
  const { t } = useTranslation();
  const { orgId, appUser } = useAuth();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [managementType, setManagementType] = useState<ProviderManagementType>('tasks');
  const [role, setRole] = useState<UserRole>(allowedRoles && allowedRoles.length === 1 ? allowedRoles[0] : 'staff');
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const isPersonalFlavor = appUser?.appFlavor === 'personal';

  const formAction = (formData: FormData) => {
    formData.append('orgId', orgId || 'global');
    formData.append('appFlavor', appUser?.appFlavor || 'commercial');
    if (allowedRoles && allowedRoles.length === 1) {
        formData.append('role', allowedRoles[0]);
    }
    
    startTransition(async () => {
        const result = await addProvider(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.message) {
        toast({
            title: state.success ? t('common.success') : t('common.error'),
            description: state.message,
            variant: state.success ? "default" : "destructive",
        })
    }
    if (state.success) {
      setIsOpen(false);
      setManagementType('tasks');
      setRole(allowedRoles && allowedRoles.length === 1 ? allowedRoles[0] : 'staff');
      formRef.current?.reset();
      onProviderAdded();
    }
  }, [state, onProviderAdded, toast, t, allowedRoles]);
  
  const showRoleSelection = !allowedRoles || allowedRoles.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('providers.new_provider')}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-xl p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 bg-background border-b shrink-0">
          <DialogTitle>{t('providers.add_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('providers.add_dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.name')}</Label>
                        <Input id="name" name="name" required className="h-11 bg-background shadow-sm" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.email')}</Label>
                        <Input id="email" name="email" type="email" className="h-11 bg-background shadow-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.initial_status')}</Label>
                        <RadioGroup name="status" defaultValue="pending" className="flex items-center gap-4 mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pending" id="r-add-pending" />
                                <Label htmlFor="r-add-pending" className="font-semibold text-xs">{t('providers.status.pending')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="active" id="r-add-active" />
                                <Label htmlFor="r-add-active" className="font-semibold text-xs">{t('providers.status.active')}</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {showRoleSelection && (
                        <div className="space-y-2">
                            <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.role')}</Label>
                            <RadioGroup name="role" value={role} onValueChange={(v) => setRole(v as UserRole)} className="flex items-center gap-4 mt-2">
                                {allowedRoles ? allowedRoles.map(r => (
                                    <div key={r} className="flex items-center space-x-2">
                                        <RadioGroupItem value={r} id={`r-add-${r}`} />
                                        <Label htmlFor={`r-add-${r}`} className="font-semibold text-xs">{t(`providers.roles.${r}`)}</Label>
                                    </div>
                                )) : (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="staff" id="r-add-staff" />
                                            <Label htmlFor="r-add-staff" className="font-semibold text-xs">{t('providers.roles.staff')}</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="socio" id="r-add-socio" />
                                            <Label htmlFor="r-add-socio" className="font-semibold text-xs">{t('providers.roles.socio')}</Label>
                                        </div>
                                    </>
                                )}
                            </RadioGroup>
                        </div>
                    )}
                </div>

                {role === 'provider' && isPersonalFlavor && (
                    <div className="p-4 bg-background rounded-2xl border-2 border-dashed space-y-4 shadow-sm">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-primary font-bold text-xs uppercase"><Wrench className="h-4 w-4" /> {t('providers.add_dialog.management_method')}</Label>
                            <RadioGroup name="managementType" value={managementType} onValueChange={(v) => setManagementType(v as ProviderManagementType)} className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="tasks" id="r-mgmt-tasks" />
                                    <Label htmlFor="r-mgmt-tasks" className="text-xs">{t('providers.management.tasks')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="liquidations" id="r-mgmt-liq" />
                                    <Label htmlFor="r-mgmt-liq" className="text-xs">{t('providers.management.liquidations')}</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        {managementType === 'liquidations' && (
                            <div className="pt-4 space-y-4 border-t border-muted">
                                <Label className="flex items-center gap-2 text-primary font-bold text-xs uppercase"><Banknote className="h-4 w-4" /> {t('providers.billing.label')}</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="billingType" className="text-[10px] uppercase font-bold text-muted-foreground">{t('providers.billing.type')}</Label>
                                        <Select name="billingType" defaultValue="hourly">
                                            <SelectTrigger className="h-10 bg-muted/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hourly">{t('providers.billing.hourly')}</SelectItem>
                                                <SelectItem value="per_visit">{t('providers.billing.visit')}</SelectItem>
                                                <SelectItem value="hourly_or_visit">{t('providers.billing.hourly_or_visit')}</SelectItem>
                                                <SelectItem value="other">{t('providers.billing.other')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rateCurrency" className="text-[10px] uppercase font-bold text-muted-foreground">{t('providers.billing.currency')}</Label>
                                        <Select name="rateCurrency" defaultValue="ARS">
                                            <SelectTrigger className="h-10 bg-muted/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ARS">ARS</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="hourlyRate" className="text-[10px] uppercase font-bold text-muted-foreground">{t('providers.billing.rate_hour')}</Label>
                                        <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" className="h-10 bg-muted/20 font-bold" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 pt-2 border-t border-muted">
                            <Label htmlFor="adminNote" className="text-[10px] uppercase font-bold text-muted-foreground">{t('providers.add_dialog.notes_public')}</Label>
                            <Textarea id="adminNote" name="adminNote" placeholder="..." className="bg-muted/10" />
                        </div>
                    </div>
                )}

                <div className="border-t pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {role === 'provider' && (
                        <div className="space-y-2">
                            <Label htmlFor="categoryId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.filters.category')}</Label>
                            <Select name="categoryId">
                                <SelectTrigger className="bg-background h-11 shadow-sm"><SelectValue placeholder={t('providers.filters.category')} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t('common.none')}</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.card.phone')}</Label>
                         <div className="flex items-center gap-2">
                            <Select name="countryCode" defaultValue="+54">
                                <SelectTrigger className="w-[100px] shrink-0 h-11 bg-background shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {countries.map(country => (
                                        <SelectItem key={country.code} value={country.dial_code}>{country.dial_code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input id="phone" name="phone" className="flex-grow h-11 bg-background shadow-sm" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.notes_private')}</Label>
                    <Textarea id="notes" name="notes" placeholder="Notas de administración..." className="min-h-[100px] bg-background shadow-inner" />
                </div>
            </div>
            <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="font-bold uppercase text-[10px] tracking-widest h-11">{t('common.cancel')}</Button>
                </DialogClose>
                <SubmitButton />
            </DialogFooter>
        </form>
         {state.message && !state.success && (
            <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
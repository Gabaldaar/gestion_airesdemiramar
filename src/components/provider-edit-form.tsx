'use client';

import { useEffect, useRef, useState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProvider } from '@/lib/actions';
import { Provider, ProviderCategory, ProviderManagementType, UserRole, ProviderBillingType } from '@/lib/data';
import { Loader2, ShieldCheck, Banknote, Wrench } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { useToast } from './ui/use-toast';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';

// Usamos UID en lugar de email literal para el build de Netlify
const MASTER_ADMIN_UID = 'ymBtFDZUWKR7VCxWNTHWflXc5mx1';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending || disabled}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('common.save')
            )}
        </Button>
    )
}

interface ProviderEditFormProps {
    provider: Provider;
    categories: ProviderCategory[];
    onProviderUpdated: () => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    allowedRoles?: UserRole[];
}

export function ProviderEditForm({ provider, categories, onProviderUpdated, isOpen, onOpenChange, allowedRoles }: ProviderEditFormProps) {
  const { t } = useTranslation();
  const { appUser, user } = useAuth();
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<UserRole>(provider.role || 'staff');
  const [managementType, setManagementType] = useState<ProviderManagementType>(provider.managementType || 'tasks');
  const [billingType, setBillingType] = useState<ProviderBillingType>(provider.billingType || 'hourly');
  const { toast } = useToast();

  const isMasterAdminId = provider.id === MASTER_ADMIN_UID;
  const isWorkspaceOwner = provider.id === provider.orgId;
  const isExternalProvider = provider.role === 'provider';
  
  const amIMasterAdmin = useMemo(() => {
    return user?.uid === MASTER_ADMIN_UID;
  }, [user]);

  const isPersonalFlavor = appUser?.appFlavor === 'personal' || amIMasterAdmin;

  // REGLA DE PROTECCIÓN: Solo bloqueamos el email si es un rol administrativo (staff, socio, admin)
  // que además coincide con el dueño o el admin maestro.
  const isSystemRole = role === 'admin' || role === 'socio' || role === 'staff';
  const isProtectedUser = isWorkspaceOwner || isMasterAdminId;
  const isEmailReadOnly = isProtectedUser && isSystemRole;

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateProvider(initialState, formData);
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
      onOpenChange(false);
      onProviderUpdated();
    }
  }, [state, onProviderUpdated, onOpenChange, toast, t]);

  useEffect(() => {
    if (isOpen) {
      setRole(provider.role || 'staff');
      setManagementType(provider.managementType || 'tasks');
      setBillingType(provider.billingType || 'hourly');
    }
  }, [isOpen, provider]);

  const showRoleSelection = (!allowedRoles || allowedRoles.length > 1) && !isProtectedUser;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-xl p-0 overflow-hidden rounded-3xl flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
          <DialogHeader className="p-6 bg-background border-b shrink-0">
          <DialogTitle>{t('providers.edit_dialog.title')}</DialogTitle>
          <DialogDescription>
              {t('providers.edit_dialog.description')}
          </DialogDescription>
          </DialogHeader>
          
          <form action={formAction} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
              <input type="hidden" name="id" value={provider.id} />
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 shadow-inner border-y border-muted-foreground/10">
                  {isProtectedUser && (
                      <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                          <ShieldCheck className="h-4 w-4" />
                          Perfil Administrativo Protegido
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.name')}</Label>
                            <Input id="name" name="name" defaultValue={provider.name} required className="h-11 bg-background shadow-sm" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="email" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.email')}</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                defaultValue={provider.email} 
                                readOnly={isEmailReadOnly}
                                className={cn("h-11 bg-background shadow-sm", isEmailReadOnly && "bg-muted/50 cursor-not-allowed border-dashed opacity-80")}
                            />
                        </div>
                    </div>

                    {!isProtectedUser && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.initial_status')}</Label>
                                <RadioGroup name="status" defaultValue={provider.status || 'pending'} className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="pending" id="r-edit-pending" />
                                        <Label htmlFor="r-edit-pending" className="font-semibold text-xs">{t('providers.status.pending')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="active" id="r-edit-active" />
                                        <Label htmlFor="r-edit-active" className="font-semibold text-xs">{t('providers.status.active')}</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            {showRoleSelection && (
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.add_dialog.role')}</Label>
                                    <RadioGroup name="role" value={role} onValueChange={(v) => setRole(v as UserRole)} className="flex items-center gap-4 mt-2">
                                        {allowedRoles ? allowedRoles.map(r => (
                                            <div key={r} className="flex items-center space-x-2">
                                                <RadioGroupItem value={r} id={`r-edit-${r}`} />
                                                <Label htmlFor={`r-edit-${r}`} className="font-semibold text-xs">{t(`providers.roles.${r}`)}</Label>
                                            </div>
                                        )) : (
                                            <>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="staff" id="r-edit-staff" />
                                                    <Label htmlFor="r-edit-staff" className="font-semibold text-xs">{t('providers.roles.staff')}</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="socio" id="r-edit-socio" />
                                                    <Label htmlFor="r-edit-socio" className="font-semibold text-xs">{t('providers.roles.socio')}</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="owner" id="r-edit-owner" />
                                                    <Label htmlFor="r-edit-owner" className="font-semibold text-xs">{t('providers.roles.owner')}</Label>
                                                </div>
                                            </>
                                        )}
                                    </RadioGroup>
                                </div>
                            )}
                        </div>
                    )}

                    {isExternalProvider && isPersonalFlavor && (
                        <div className="p-4 bg-background rounded-2xl border-2 border-dashed space-y-4 shadow-sm">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-primary font-bold text-xs uppercase"><Wrench className="h-4 w-4" /> {t('providers.add_dialog.management_method')}</Label>
                                <RadioGroup name="managementType" value={managementType} onValueChange={(v) => setManagementType(v as ProviderManagementType)} className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="tasks" id="r-edit-mgmt-tasks" />
                                        <Label htmlFor="r-edit-mgmt-tasks" className="text-xs">{t('providers.management.tasks')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="liquidations" id="r-edit-mgmt-liq" />
                                        <Label htmlFor="r-edit-mgmt-liq" className="text-xs">{t('providers.management.liquidations')}</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {managementType === 'liquidations' && (
                                <div className="pt-4 space-y-4 border-t border-muted">
                                    <Label className="flex items-center gap-2 text-primary font-bold text-xs uppercase"><Banknote className="h-4 w-4" /> {t('providers.billing.label')}</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="billingType" className="text-[10px] uppercase font-bold text-muted-foreground">{t('providers.billing.type')}</Label>
                                            <Select name="billingType" value={billingType || 'hourly'} onValueChange={(v) => setBillingType(v as ProviderBillingType)}>
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
                                            <Select name="rateCurrency" defaultValue={provider.rateCurrency || "ARS"}>
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
                                            <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" defaultValue={provider.hourlyRate || ''} className="h-10 bg-muted/20 font-bold" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 pt-2 border-t border-muted">
                                <Label htmlFor="adminNote" className="text-[10px] uppercase font-bold text-muted-foreground">{t('providers.add_dialog.notes_public')}</Label>
                                <Textarea id="adminNote" name="adminNote" defaultValue={provider.adminNote || ''} placeholder="..." className="bg-muted/10" />
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(isExternalProvider || role === 'owner') && (
                            <div className="space-y-2">
                                <Label htmlFor="categoryId" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('providers.filters.category')}</Label>
                                <Select name="categoryId" defaultValue={provider.categoryId || 'none'}>
                                    <SelectTrigger className="h-11 bg-background shadow-sm"><SelectValue/></SelectTrigger>
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
                                <Select name="countryCode" defaultValue={provider.countryCode || "+54"}>
                                    <SelectTrigger className="w-[100px] shrink-0 h-11 bg-background shadow-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {countries.map(country => (
                                            <SelectItem key={country.code} value={country.dial_code}>{country.dial_code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input id="phone" name="phone" defaultValue={provider.phone || ''} className="flex-grow h-11 bg-background shadow-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('tenants.card.notes')}</Label>
                        <Textarea id="notes" name="notes" defaultValue={provider.notes || ''} className="min-h-[100px] bg-background shadow-inner" />
                    </div>
              </div>
              <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="font-bold uppercase text-[10px] tracking-widest h-11 bg-background">{t('common.cancel')}</Button>
                  </DialogClose>
                  <SubmitButton />
              </DialogFooter>
          </form>
      </DialogContent>
    </Dialog>
  );
}
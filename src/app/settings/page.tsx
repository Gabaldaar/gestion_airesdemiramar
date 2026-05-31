'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Property, 
    ExpenseCategory, 
    EmailSettings, 
    Origin, 
    AlertSettings, 
    TaskCategory, 
    ProviderCategory, 
    TaskScope, 
    Provider, 
    AdjustmentCategory, 
    CurrencySettings, 
    EmailTemplate, 
    BrandingSettings, 
    getEmailSettings, 
    getAlertSettings, 
    getCurrencySettings, 
    getBrandingSettings, 
    getProperties, 
    getExpenseCategories, 
    getTaskCategories, 
    getProviderCategories, 
    getOrigins, 
    getTaskScopes, 
    getProviders, 
    getAdjustmentCategories, 
    getEmailTemplates 
} from "@/lib/data";
import ExpenseCategoryManager from "@/components/expense-category-manager";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import OriginManager from "@/components/origin-manager";
import TaskCategoryManager from "@/components/task-category-manager";
import ProviderCategoryManager from "@/components/provider-category-manager";
import TaskScopeManager from "@/components/task-scope-manager";
import AdjustmentCategoryManager from "@/components/adjustment-category-manager";
import EmailTemplateManager from "@/components/email-template-manager";
import { BrandingManager } from "@/components/branding-manager";
import { AlertSettingsManager } from "@/components/alert-settings-manager";
import CurrencyManager from "@/components/currency-manager";
import { currencies as allCurrencies } from "@/lib/currencies";
import { Loader2, Database } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { OwnerAddForm } from "@/components/owner-add-form";
import ProvidersList from "@/components/providers-list";
import { ProviderEditForm } from "@/components/provider-edit-form";
import { ProviderAddForm } from "@/components/provider-add-form";
import { DataManager } from "@/components/data-manager";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface SettingsData {
    properties: Property[];
    expenseCategories: ExpenseCategory[];
    taskCategories: TaskCategory[];
    taskScopes: TaskScope[];
    providerCategories: ProviderCategory[];
    adjustmentCategories: AdjustmentCategory[];
    emailSettings: EmailSettings | null;
    emailTemplates: EmailTemplate[];
    alertSettings: AlertSettings | null;
    currencySettings: CurrencySettings | null;
    brandingSettings: BrandingSettings | null;
    origins: Origin[];
    providers: Provider[];
}

function SettingsPageContent() {
    const { user, appUser, orgId } = useAuth();
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const activeTab = searchParams.get('tab') || 'marca';
    
    const [data, setData] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<Provider | null>(null);

    const isPersonalFlavor = appUser?.appFlavor === 'personal';
    
    const canManageData = useMemo(() => {
        if (!appUser || !orgId) return false;
        return appUser.id === orgId || orgId === 'global';
    }, [appUser, orgId]);

    const fetchData = useCallback(async () => {
        if (!user || !orgId) return;
        setLoading(true);
        try {
            const [
                properties, expenseCategories, taskCategories, providerCategories,
                emailSettings, alertSettings, origins, taskScopes, providers,
                adjustmentCategories, currencySettings, emailTemplates, brandingSettings
            ] = await Promise.all([
                getProperties(orgId),
                getExpenseCategories(orgId),
                getTaskCategories(orgId),
                getProviderCategories(orgId),
                getEmailSettings(orgId),
                getAlertSettings(orgId),
                getOrigins(orgId),
                getTaskScopes(orgId),
                getProviders(orgId),
                getAdjustmentCategories(orgId),
                getCurrencySettings(orgId),
                getEmailTemplates(orgId),
                getBrandingSettings(orgId)
            ]);

            const sortByName = (a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });

            setData({
                properties: properties.sort(sortByName),
                expenseCategories: expenseCategories.sort(sortByName),
                taskCategories: taskCategories.sort(sortByName),
                providerCategories: providerCategories.sort(sortByName),
                emailSettings, alertSettings,
                origins: origins.sort(sortByName),
                taskScopes: taskScopes.sort(sortByName),
                providers: providers.sort(sortByName),
                adjustmentCategories: adjustmentCategories.sort(sortByName),
                currencySettings, brandingSettings,
                emailTemplates: emailTemplates.sort(sortByName),
            });
        } catch (err) {
            console.error("Error fetching settings:", err);
        } finally {
            setLoading(false);
        }
    }, [user, orgId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const teamMembers = useMemo(() => data?.providers.filter(p => p.role !== 'owner' && p.role !== 'provider') || [], [data]);
    const owners = useMemo(() => data?.providers.filter(p => p.role === 'owner') || [], [data]);

    if (loading || !data) return <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">{t('settings.title')}</h2>
                    <p className="text-muted-foreground">{t('navigation.settings')}</p>
                </div>
                <TabsList className="grid h-auto w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger id="tab-branding" value="marca">{t('settings.tabs.branding')}</TabsTrigger>
                    <TabsTrigger id="tab-team" value="team">{t('settings.tabs.team')}</TabsTrigger>
                    <TabsTrigger id="tab-owners" value="owners">{t('navigation.owners')}</TabsTrigger>
                    <TabsTrigger value="origins">{t('settings.tabs.origins')}</TabsTrigger>
                    <TabsTrigger value="expense-categories">{t('settings.tabs.expense_categories')}</TabsTrigger>
                    <TabsTrigger value="task-categories">{t('settings.tabs.task_categories')}</TabsTrigger>
                    {isPersonalFlavor && (
                        <>
                            <TabsTrigger value="provider-categories">{t('settings.tabs.provider_categories')}</TabsTrigger>
                            <TabsTrigger value="adjustment-categories">{t('settings.tabs.adjustment_categories')}</TabsTrigger>
                            <TabsTrigger value="task-scopes">{t('settings.tabs.task_scopes')}</TabsTrigger>
                        </>
                    )}
                    <TabsTrigger value="currencies">{t('settings.tabs.currencies')}</TabsTrigger>
                    <TabsTrigger id="tab-templates" value="templates">{t('settings.tabs.templates')}</TabsTrigger>
                    <TabsTrigger value="alerts">{t('settings.tabs.alerts')}</TabsTrigger>
                    {canManageData && <TabsTrigger value="data">{t('settings.tabs.data')}</TabsTrigger>}
                </TabsList>
            </div>

            <TabsContent value="marca">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.branding.title')}</CardTitle>
                        <CardDescription>{t('settings.tabs_desc.branding')}</CardDescription>
                    </CardHeader>
                    <CardContent><BrandingManager initialSettings={data.brandingSettings} onSettingsChanged={fetchData} isPersonalFlavor={isPersonalFlavor} /></CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="team">
                <Card>
                    <CardHeader className="flex justify-between flex-row items-center">
                        <div>
                            <CardTitle>{t('settings.team.title')}</CardTitle>
                            <CardDescription>{t('settings.tabs_desc.team')}</CardDescription>
                        </div>
                        <ProviderAddForm categories={data.providerCategories} onProviderAdded={fetchData} allowedRoles={['staff', 'socio']} />
                    </CardHeader>
                    <CardContent>
                        <ProvidersList 
                            providers={teamMembers} 
                            categories={data.providerCategories} 
                            onDataChanged={fetchData} 
                            onEditProvider={setEditingUser} 
                            forceCardView 
                            customEmptyTitle={t('providers.no_team')}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="owners">
                <Card>
                    <CardHeader className="flex justify-between flex-row items-center">
                        <div>
                            <CardTitle>{t('settings.owners.title')}</CardTitle>
                            <CardDescription>{t('settings.tabs_desc.owners')}</CardDescription>
                        </div>
                        <OwnerAddForm onOwnerAdded={fetchData} />
                    </CardHeader>
                    <CardContent>
                        <ProvidersList 
                            providers={owners} 
                            categories={[]} 
                            onDataChanged={fetchData} 
                            onEditProvider={setEditingUser} 
                            forceCardView 
                            customEmptyTitle={t('providers.no_owners')}
                            customEmptyDesc={t('common.empty_states.owners_desc')}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="origins">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.origins.title')}</CardTitle>
                        <CardDescription>{t('settings.tabs_desc.origins')}</CardDescription>
                    </CardHeader>
                    <CardContent><OriginManager initialOrigins={data.origins} onOriginsChanged={fetchData} /></CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="expense-categories">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.categories.expenses_title')}</CardTitle>
                        <CardDescription>{t('settings.tabs_desc.expense_categories')}</CardDescription>
                    </CardHeader>
                    <CardContent><ExpenseCategoryManager initialCategories={data.expenseCategories} onCategoriesChanged={fetchData} /></CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="task-categories">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.categories.tasks_title')}</CardTitle>
                        <CardDescription>{t('settings.tabs_desc.task_categories')}</CardDescription>
                    </CardHeader>
                    <CardContent><TaskCategoryManager initialCategories={data.taskCategories} onCategoriesChanged={fetchData} /></CardContent>
                </Card>
            </TabsContent>
            
            {isPersonalFlavor && (
                <>
                    <TabsContent value="provider-categories">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.categories.providers_title')}</CardTitle>
                                <CardDescription>{t('settings.tabs_desc.provider_categories')}</CardDescription>
                            </CardHeader>
                            <CardContent><ProviderCategoryManager initialCategories={data.providerCategories} onCategoriesChanged={fetchData} /></CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="adjustment-categories">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.categories.adjustments_title')}</CardTitle>
                                <CardDescription>{t('settings.tabs_desc.adjustment_categories')}</CardDescription>
                            </CardHeader>
                            <CardContent><AdjustmentCategoryManager initialCategories={data.adjustmentCategories} onCategoriesChanged={fetchData} /></CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="task-scopes">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('settings.scopes.title')}</CardTitle>
                                <CardDescription>{t('settings.tabs_desc.task_scopes')}</CardDescription>
                            </CardHeader>
                            <CardContent><TaskScopeManager initialScopes={data.taskScopes} onScopesChanged={fetchData} /></CardContent>
                        </Card>
                    </TabsContent>
                </>
            )}

            <TabsContent value="currencies">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.currencies.title')}</CardTitle>
                        <CardDescription>{t('settings.tabs_desc.currencies')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CurrencyManager initialSettings={data.currencySettings} allCurrencies={allCurrencies} onSettingsChanged={fetchData} />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="templates">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.templates.title')}</CardTitle>
                        <CardDescription>{t('settings.tabs_desc.templates')}</CardDescription>
                    </CardHeader>
                    <CardContent><EmailTemplateManager initialTemplates={data.emailTemplates} onTemplatesChanged={fetchData} /></CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="alerts">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.alerts.title')}</CardTitle>
                        <CardDescription>{t('settings.tabs_desc.alerts')}</CardDescription>
                    </CardHeader>
                    <CardContent><AlertSettingsManager initialSettings={data.alertSettings} isPersonalFlavor={isPersonalFlavor} /></CardContent>
                </Card>
            </TabsContent>

            {canManageData && (
                <TabsContent value="data">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                {t('settings.data.title')}
                            </CardTitle>
                            <CardDescription>{t('settings.tabs_desc.data')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataManager onDataChanged={fetchData} />
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            {editingUser && (
                <ProviderEditForm 
                    provider={editingUser} categories={data.providerCategories} 
                    onProviderUpdated={fetchData} isOpen={!!editingUser} 
                    onOpenChange={(open) => !open && setEditingUser(null)} 
                    allowedRoles={editingUser.role === 'provider' ? ['provider'] : (editingUser.role === 'owner' ? ['owner'] : ['staff', 'socio'])}
                />
            )}
        </Tabs>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <SettingsPageContent />
        </Suspense>
    );
}
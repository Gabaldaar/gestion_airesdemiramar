
import { db } from './firebase';
import { 
    collection, 
    getDocs, 
    getDoc, 
    doc, 
    query, 
    where, 
    QueryConstraint
} from 'firebase/firestore';
import { parseAssignment } from './utils';

// --- INTERFACES ---
export interface PriceRange { desde: string; hasta: string; precio: number; }
export interface MinStay { desde: string; hasta: string; minimo: number; }
export interface Discount { noches: number; porcentaje: number; }
export interface PriceConfig {
    base: number;
    minimoNoches?: number;
    rangos?: PriceRange[];
    minimos?: MinStay[];
    descuentos?: Discount[];
}

export type UserRole = 'admin' | 'socio' | 'staff' | 'provider' | 'owner';
export type UserStatus = 'active' | 'pending';
export type ProviderManagementType = 'tasks' | 'liquidations';
export type ProviderBillingType = 'hourly' | 'per_visit' | 'hourly_or_visit' | 'monthly' | 'other' | null;

export interface Provider {
  id: string;
  orgId: string;
  name: string;
  categoryId?: string | null;
  email: string;
  phone?: string | null;
  countryCode?: string | null;
  address?: string | null;
  notes?: string | null;
  adminNote?: string | null;
  rating?: number | null;
  userId?: string | null;
  managementType: ProviderManagementType;
  billingType: ProviderBillingType;
  rateCurrency: 'ARS' | 'USD' | null;
  hourlyRate: number | null;
  perVisitRate: number | null;
  monthlyRate: number | null;
  role: UserRole;
  status: UserStatus;
  appFlavor: 'personal' | 'commercial';
}

export interface ProviderCategory { id: string; orgId: string; name: string; }
export interface Tenant { id: string; orgId: string; name: string; dni?: string; email?: string; phone?: string; countryCode?: string; address?: string; city?: string; country?: string; notes?: string; originId?: string | null; rating?: number; }
export interface Property { 
    id: string; 
    orgId: string;
    name: string; 
    address: string; 
    imageUrl?: string; 
    propertyUrl?: string; 
    priceSheetName?: string; 
    notes?: string; 
    ownerNotes?: string; 
    contractTemplate?: string; 
    contractSignatureUrl?: string;
    ownerName?: string;
    ownerDni?: string;
    ownerAddress?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    managementCommission?: number; 
    customField1Label?: string; 
    customField1Value?: string; 
    customField2Label?: string; 
    customField2Value?: string; 
    customField3Label?: string; 
    customField3Value?: string; 
    customField4Label?: string; 
    customField4Value?: string; 
    customField5Label?: string; 
    customField5Value?: string; 
    customField6Label?: string; 
    customField6Value?: string; 
    visitRates?: { [providerId: string]: number }; 
}

export type BookingStatus = 'active' | 'pending' | 'cancelled' | 'closed';
export type ContractStatus = 'not_sent' | 'sent' | 'signed' | 'not_required';
export type GuaranteeStatus = 'not_solicited' | 'solicited' | 'received' | 'returned' | 'not_applicable';
export type ContratoStatus = 'draft' | 'active' | 'ended' | 'cancelled';

export interface Booking { id: string; orgId: string; propertyId: string; tenantId: string; startDate: string; endDate: string; amount: number; currency: 'ARS' | 'USD'; balance: number; notes?: string; contractStatus?: ContractStatus; originId?: string | null; guaranteeStatus?: GuaranteeStatus; guaranteeAmount?: number; guaranteeCurrency?: 'ARS' | 'USD'; guaranteeReceivedDate?: string | null; guaranteeReturnedDate?: string | null; tenantSignatureUrl?: string; status?: BookingStatus; }
export interface BookingWithDetails extends Booking { property: Property; tenant: Tenant; }

export interface Payment { id: string; orgId: string; bookingId?: string | null; contratoId?: string | null; propertyId?: string | null; periodoPagoId?: string | null; date: string; amount: number; currency: string; description?: string; exchangeRate?: number | null; originalArsAmount?: number | null; receivedAmount?: number | null; receivedCurrency?: string | null; ownerLiquidationId?: string | null; }
export interface PaymentWithDetails extends Payment { propertyId?: string; propertyName?: string; tenantName?: string; amountUSD: number; amountARS: number; sourceCurrency?: string; realReceivedAmount: number; realReceivedCurrency: string; }
export interface TaskAssignment { type: 'property' | 'scope'; id: string; }
export interface Expense { id: string; orgId: string; assignment: TaskAssignment; date: string; amount: number; currency: 'ARS' | 'USD'; originalUsdAmount?: number; exchangeRate?: number; description?: string; categoryId?: string | null; providerId?: string | null; taskId?: string | null; liquidationId?: string | null; manualAdjustmentId?: string | null; workLogId?: string | null; ownerLiquidationId?: string | null; }
export interface ExpenseWithDetails extends Expense { assignmentName?: string; assignmentColor?: string; categoryName?: string; providerName?: string; type: string; amountUSD: number; amountARS: number; }
export interface Origin { id: string; orgId: string; name: string; color: string; }
export interface EmailSettings { orgId: string; replyToEmail?: string; }
export interface AlertSettings { orgId: string; checkInDays: number; checkOutDays: number; }
export interface CurrencySettings { orgId: string; baseCurrency: string; favoriteCurrencies: string[]; }
export interface BrandingSettings { orgId: string; appName?: string; appSlogan?: string; logoMainUrl?: string; logoDocUrl?: string; }
export interface ExpenseCategory { id: string; orgId: string; name: string; }
export interface TaskCategory { id: string; orgId: string; name: string; }
export interface TaskScope { id: string; orgId: string; name: string; color: string; }
export interface AdjustmentCategory { id: string; orgId: string; name: string; type: 'addition' | 'deduction'; }
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export interface Task { id: string; orgId: string; assignment: TaskAssignment; description: string; status: TaskStatus; priority: TaskPriority; dueDate?: string | null; notes?: string; categoryId?: string | null; providerId?: string | null; estimatedCost?: number; actualCost?: number; costCurrency?: 'ARS' | 'USD' | null; }
export interface TaskWithDetails extends Task { assignmentName?: string; categoryName?: string; providerName?: string; }
export interface EmailTemplate { id: string; orgId: string; name: string; subject: string; body: string; }
export interface DateBlock { id: string; orgId: string; propertyId: string; startDate: string; endDate: string; reason?: string; }
export interface WorkLog { id: string; orgId: string; providerId: string; assignment: TaskAssignment; date: string; activityType: 'hourly' | 'per_visit' | 'monthly'; quantity: number; description: string; rateApplied: number; costCurrency: 'ARS' | 'USD'; calculatedCost: number; status: 'pending_liquidation' | 'liquidated'; liquidationId?: string | null; }
export interface WorkLogWithDetails extends WorkLog { assignmentName?: string; }
export interface ManualAdjustment { id: string; orgId: string; providerId: string; assignment: TaskAssignment; date: string; amount: number; currency: 'ARS' | 'USD'; categoryId: string; notes?: string; status: 'pending_liquidation' | 'liquidated'; liquidationId?: string | null; }
export interface ManualAdjustmentWithDetails extends ManualAdjustment { categoryName?: string; assignmentName?: string; }
export interface Liquidation { id: string; orgId: string; providerId: string; dateGenerated: string; totalAmount: number; currency: 'ARS' | 'USD'; status: 'pending_payment' | 'partially_paid' | 'paid'; amountPaid: number; balance: number; previousBalance?: number; }
export interface LiquidationWithProvider extends Liquidation { providerName: string; }
export interface Contrato { id: string; orgId: string; propertyId: string; tenantId: string; fechaInicio: string; fechaFin: string; montoInicial: number; moneda: string; frequencyPago: 'mensual'; diaVencimiento: number; frecuenciaAjuste: number; montoGarantia?: number; monedaGarantia?: string; guaranteeStatus: GuaranteeStatus; guaranteeReceivedDate?: string | null; guaranteeReturnedDate?: string | null; notes?: string | null; contractStatus?: ContractStatus; tenantSignatureUrl?: string; status: ContratoStatus; }
export interface ContratoWithDetails extends Contrato { tenantName: string; property?: Property; tenant?: Tenant; }
export interface PeriodoPago { id: string; orgId: string; contratoId: string; propertyId: string; fechaDesde: string; fechaHasta: string; fechaVencimiento: string; montoOriginal: number; montoAjustado: number; montoPagado: number; indiceAplicado: string | null; estado: 'pagado' | 'pendiente' | 'vencido' | 'pago_parcial' | 'pendiente_ajuste'; }

export interface OwnerLiquidation {
    id: string;
    orgId: string;
    propertyId: string;
    dateGenerated: string;
    periodFrom: string;
    periodTo: string;
    totalIncome: number;
    totalExpenses: number;
    commissionPercentage: number;
    commissionAmount: number;
    netToOwner: number;
    currency: 'ARS' | 'USD';
    status: 'pending' | 'paid';
    notes?: string;
}

// --- TELEMETRY ---
export interface OrganizationStats {
    orgId: string;
    ownerName: string;
    ownerEmail: string;
    propertiesCount: number;
    tenantsCount: number;
    bookingsCount: number;
    contratosCount: number;
    teamCount: number;
    lastActivity: string;
}

// --- REPORT TYPES ---
export interface FinancialSummary {
    propertyId: string;
    propertyName: string;
    totalIncome: number;
    totalPayments: number;
    balance: number;
    totalExpenses: number;
    netResult: number;
}

export interface FinancialSummaryByCurrency {
    ars: FinancialSummary[];
    usd: FinancialSummary[];
    [key: string]: FinancialSummary[];
}

export interface TenantsByOriginSummary {
    name: string;
    count: number;
    percentage: number;
    fill: string;
}

export interface ExpensesByCategorySummary {
    name: string;
    totalAmountUSD: number;
    percentage: number;
    fill: string;
}

export interface ExpensesByPropertySummary {
    name: string;
    totalAmountUSD: number;
    percentage: number;
    fill: string;
}

export interface BookingsByOriginSummary {
    name: string;
    count: number;
    percentage: number;
    fill: string;
}

export interface BookingStatusSummary {
    name: string;
    count: number;
    fill: string;
}

// --- GETTERS ---

/**
 * Función central de obtención de datos con aislamiento de seguridad estricto.
 * Soporta búsqueda en nombres de colección alternativos para compatibilidad.
 */
async function getDataFromCollection<T>(collectionName: string, orgId: string | null, alternativeName?: string): Promise<T[]> {
    if (!orgId) return [];
    
    const tryQuery = async (name: string) => {
        const colRef = collection(db, name);
        const q = query(colRef, where('orgId', '==', orgId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)) as T[];
    };

    try {
        const results = await tryQuery(collectionName);
        if (results.length > 0) return results;
        if (alternativeName) return await tryQuery(alternativeName);
        return [];
    } catch (e: any) { 
        console.error(`[DATA ERROR] ${collectionName}:`, e.message);
        return [];
    }
}

export async function getProperties(orgId: string) { return getDataFromCollection<Property>('properties', orgId); }
export async function getTenants(orgId: string) { return getDataFromCollection<Tenant>('tenants', orgId); }
export async function getBookings(orgId: string) { return getDataFromCollection<Booking>('bookings', orgId); }
export async function getOrigins(orgId: string) { return getDataFromCollection<Origin>('origins', orgId); }
export async function getProviders(orgId: string) { return getDataFromCollection<Provider>('providers', orgId); }
export async function getDateBlocks(orgId: string) { return getDataFromCollection<DateBlock>('date_blocks', orgId, 'dateBlocks'); }
export async function getExpenseCategories(orgId: string) { return getDataFromCollection<ExpenseCategory>('expense_categories', orgId, 'expenseCategories'); }
export async function getTaskCategories(orgId: string) { return getDataFromCollection<TaskCategory>('task_categories', orgId, 'taskCategories'); }
export async function getTaskScopes(orgId: string) { return getDataFromCollection<TaskScope>('task_scopes', orgId, 'taskScopes'); }
export async function getAdjustmentCategories(orgId: string) { return getDataFromCollection<AdjustmentCategory>('adjustment_categories', orgId, 'adjustmentCategories'); }
export async function getEmailTemplates(orgId: string) { return getDataFromCollection<EmailTemplate>('email_templates', orgId, 'emailTemplates'); }
export async function getProviderCategories(orgId: string) { return getDataFromCollection<ProviderCategory>('provider_categories', orgId, 'providerCategories'); }
export async function getTasks(orgId: string) { return getDataFromCollection<Task>('tasks', orgId); }
export async function getPayments(orgId: string) { return getDataFromCollection<Payment>('payments', orgId); }
export async function getExpenses(orgId: string) { return getDataFromCollection<Expense>('expenses', orgId); }
export async function getContratos(orgId: string) { return getDataFromCollection<Contrato>('contratos', orgId); }
export async function getPeriodosPago(orgId: string) { return getDataFromCollection<PeriodoPago>('periodosPago', orgId); }

export async function getPropertyById(id: string) { 
    try {
        const snap = await getDoc(doc(db, 'properties', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Property : null;
    } catch (e) { return null; }
}
export async function getTenantById(id: string) { 
    try {
        const snap = await getDoc(doc(db, 'tenants', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Tenant : null;
    } catch (e) { null; }
}

export async function getBookingWithDetails(id: string): Promise<BookingWithDetails | null> {
    const booking = await getBookingById(id);
    if (!booking) return null;
    const [property, tenant] = await Promise.all([getPropertyById(booking.propertyId), getTenantById(booking.tenantId)]);
    return {
        ...booking,
        property: property || { id: booking.propertyId, name: 'Desconocida', address: 'N/A' } as Property,
        tenant: tenant || { id: booking.tenantId, name: 'Inquilino no encontrado' } as Tenant
    };
}

export async function getBookingById(id: string) { 
    try {
        const snap = await getDoc(doc(db, 'bookings', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } as Booking : null;
    } catch (e) { return null; }
}

export async function getPeriodosPagoByContratoId(contratoId: string, orgId: string) {
    const all = await getPeriodosPago(orgId);
    return all.filter(p => p.contratoId === contratoId);
}

export async function getLiquidations(orgId: string) {
    const [liquidations, providers] = await Promise.all([getDataFromCollection<Liquidation>('liquidations', orgId), getProviders(orgId)]);
    const providersMap = new Map(providers.map(p => [p.id, p]));
    return liquidations.map(l => ({ ...l, providerName: providersMap.get(l.providerId)?.name || 'Proveedor Desconocido' } as LiquidationWithProvider));
}

export async function getOwnerLiquidationsByPropertyId(propertyId: string, orgId: string) {
    const all = await getDataFromCollection<OwnerLiquidation>('owner_liquidations', orgId);
    return all.filter(o => o.propertyId === propertyId);
}

export async function getContratosByPropertyId(propertyId: string, orgId: string) {
    const [contratos, tenants] = await Promise.all([
        getContratos(orgId),
        getTenants(orgId)
    ]);
    const tenantsMap = new Map(tenants.map(t => [t.id, t]));
    
    const unique = new Map<string, ContratoWithDetails>();
    
    contratos
        .filter(c => c.propertyId === propertyId)
        .forEach(c => {
            const fIn = String(c.fechaInicio).split('T')[0].trim();
            const fingerprint = `${c.propertyId}_${c.tenantId}_${fIn}`.toLowerCase();
            if (!unique.has(fingerprint)) {
                unique.set(fingerprint, { ...c, tenantName: tenantsMap.get(c.tenantId)?.name || 'Inquilino Desconocido' } as ContratoWithDetails);
            }
        });
        
    return Array.from(unique.values());
}

export async function getTasksByPropertyId(id: string, orgId: string) {
    const [tasks, categories, providers] = await Promise.all([
        getTasks(orgId),
        getTaskCategories(orgId),
        getProviders(orgId)
    ]);
    const catsMap = new Map(categories.map(c => [c.id, c.name]));
    const provsMap = new Map(providers.map(p => [p.id, p.name]));
    return tasks
        .filter(t => t.assignment?.id === id)
        .map(t => ({ ...t, categoryName: t.categoryId ? catsMap.get(t.categoryId) : undefined, providerName: t.providerId ? provsMap.get(t.providerId) : undefined } as TaskWithDetails));
}

export async function getPaymentsByBookingId(bookingId: string, orgId: string) {
    const all = await getDataFromCollection<Payment>('payments', orgId);
    return all.filter(p => p.bookingId === bookingId);
}

export async function getPendingWorkLogs(providerId: string, orgId: string) {
    const [logs, properties, scopes] = await Promise.all([
        getDataFromCollection<WorkLog>('workLogs', orgId),
        getProperties(orgId),
        getTaskScopes(orgId)
    ]);
    const propsMap = new Map(properties.map(p => [p.id, p.name]));
    const scopesMap = new Map(scopes.map(s => [s.id, s.name]));
    return logs
        .filter(l => l.providerId === providerId && l.status === 'pending_liquidation')
        .map(l => {
            const parsed = parseAssignment(l.assignment);
            return { 
                ...l, 
                assignmentName: parsed.type === 'property' ? propsMap.get(parsed.id) : scopesMap.get(parsed.id) 
            } as WorkLogWithDetails;
        });
}

export async function getPendingManualAdjustments(providerId: string, orgId: string) {
    const [adjs, categories, properties, scopes] = await Promise.all([
        getDataFromCollection<ManualAdjustment>('manualAdjustments', orgId),
        getAdjustmentCategories(orgId),
        getProperties(orgId),
        getTaskScopes(orgId)
    ]);
    const catsMap = new Map(categories.map(c => [c.id, c.name]));
    const propsMap = new Map(properties.map(p => [p.id, p.name]));
    const scopesMap = new Map(scopes.map(s => [s.id, s.name]));
    return adjs
        .filter(a => a.providerId === providerId && a.status === 'pending_liquidation')
        .map(a => {
            const parsed = parseAssignment(a.assignment);
            return { 
                ...a, 
                categoryName: catsMap.get(a.categoryId), 
                assignmentName: parsed.type === 'property' ? propsMap.get(parsed.id) : scopesMap.get(parsed.id) 
            } as ManualAdjustmentWithDetails;
        });
}

export async function getTasksByProviderId(id: string, orgId: string) {
    const [tasks, properties] = await Promise.all([getTasks(orgId), getProperties(orgId)]);
    const propsMap = new Map(properties.map(p => [p.id, p.name]));
    return tasks
        .filter(t => t.providerId === id)
        .map(t => {
            const parsed = parseAssignment(t.assignment);
            return { 
                ...t, 
                assignmentName: parsed.type === 'property' ? propsMap.get(parsed.id) : 'Ámbito' 
            } as TaskWithDetails;
        });
}

export async function getPropertyExpensesByProviderId(id: string, orgId: string) {
    const all = await getDataFromCollection<Expense>('expenses', orgId);
    return all.filter(e => e.providerId === id);
}

export async function getWorkLogsByLiquidationId(liquidationId: string, orgId: string) {
    const [logs, properties, scopes] = await Promise.all([
        getDataFromCollection<WorkLog>('workLogs', orgId),
        getProperties(orgId),
        getTaskScopes(orgId)
    ]);
    const propsMap = new Map(properties.map(p => [p.id, p.name]));
    const scopesMap = new Map(scopes.map(s => [s.id, s.name]));
    return logs
        .filter(l => l.liquidationId === liquidationId)
        .map(l => {
            const parsed = parseAssignment(l.assignment);
            return { 
                ...l, 
                assignmentName: parsed.type === 'property' ? propsMap.get(parsed.id) : scopesMap.get(parsed.id) 
            } as WorkLogWithDetails;
        });
}

export async function getManualAdjustmentsByLiquidationId(liquidationId: string, orgId: string) {
    const [adjs, categories, properties, scopes] = await Promise.all([
        getDataFromCollection<ManualAdjustment>('manualAdjustments', orgId),
        getAdjustmentCategories(orgId),
        getProperties(orgId),
        getTaskScopes(orgId)
    ]);
    const catsMap = new Map(categories.map(c => [c.id, c.name]));
    const propsMap = new Map(properties.map(p => [p.id, p.name]));
    const scopesMap = new Map(scopes.map(s => [s.id, s.name]));
    return adjs
        .filter(a => a.liquidationId === liquidationId)
        .map(a => {
            const parsed = parseAssignment(a.assignment);
            return { 
                ...a, 
                categoryName: catsMap.get(a.categoryId), 
                assignmentName: parsed.type === 'property' ? propsMap.get(parsed.id) : scopesMap.get(parsed.id) 
            } as ManualAdjustmentWithDetails;
        });
}

export async function getEmailSettings(orgId: string) { 
    try {
        const snap = await getDoc(doc(db, 'settings', `email_${orgId}`));
        return snap.exists() ? snap.data() as EmailSettings : null;
    } catch (e) { return null; }
}
export async function getAlertSettings(orgId: string) { 
    try {
        const snap = await getDoc(doc(db, 'settings', `alerts_${orgId}`));
        return snap.exists() ? snap.data() as AlertSettings : null;
    } catch (e) { return null; }
}
export async function getCurrencySettings(orgId: string) { 
    try {
        const snap = await getDoc(doc(db, 'settings', `currencies_${orgId}`));
        return snap.exists() ? snap.data() as CurrencySettings : null;
    } catch (e) { return null; }
}
export async function getBrandingSettings(orgId: string) {
    try {
        const snap = await getDoc(doc(db, 'settings', `branding_${orgId}`));
        return snap.exists() ? snap.data() as BrandingSettings : null;
    } catch (e) { return null; }
}

export async function getBookingsByPropertyId(propertyId: string, orgId?: string) {
    const all = await getBookings(orgId || 'global');
    return all.filter(b => b.propertyId === propertyId);
}

export async function getDateBlocksByPropertyId(propertyId: string, orgId?: string) {
    const all = await getDateBlocks(orgId || 'global');
    return all.filter(b => b.propertyId === propertyId);
}

export async function getPropertiesByOwnerEmail(email: string) {
    if (!email) return [];
    const normalizedEmail = email.toLowerCase().trim();
    try {
        const q = query(collection(db, 'properties'), where('ownerEmail', '==', normalizedEmail));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
    } catch (e) {
        console.error("Error fetching properties by owner email:", e);
        return [];
    }
}

export async function getAllOrganizationsStats(): Promise<OrganizationStats[]> {
    try {
        const [statsSnap, providersSnap] = await Promise.all([
            getDocs(collection(db, 'system_stats')),
            getDocs(collection(db, 'providers'))
        ]);
        
        const providers = providersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Provider));
        
        return statsSnap.docs.map(doc => {
            const data = doc.data();
            const orgOwner = providers.find(p => p.id === doc.id);
            return {
                orgId: doc.id,
                ownerName: orgOwner?.name || 'Desconocido',
                ownerEmail: orgOwner?.email || '-',
                propertiesCount: data.propertiesCount || 0,
                tenantsCount: data.tenantsCount || 0,
                bookingsCount: data.bookingsCount || 0,
                contratosCount: data.contratosCount || 0,
                teamCount: data.teamCount || 0,
                lastActivity: data.lastActivity || '-'
            } as OrganizationStats;
        });
    } catch (e) {
        console.error("Error fetching system stats:", e);
        return [];
    }
}

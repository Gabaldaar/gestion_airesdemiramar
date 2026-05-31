
import { 
    Booking, 
    ExpenseWithDetails, 
    Property, 
    Tenant,
    Origin,
    BookingStatus,
    ExpenseCategory,
    FinancialSummary,
    FinancialSummaryByCurrency, 
    TenantsByOriginSummary, 
    ExpensesByCategorySummary, 
    ExpensesByPropertySummary, 
    BookingsByOriginSummary, 
    BookingStatusSummary,
    PaymentWithDetails,
    Contrato,
    PeriodoPago
} from './data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseDateSafely } from './utils';

const originColors = ['#4A90E2', '#50E3C2', '#F5A623', '#F8E71C', '#BD10E0', '#B8E986', '#7B68EE', '#417505'];

export function calculateFinancialSummaryByProperty(
    properties: Property[],
    allBookings: Booking[],
    allExpenses: ExpenseWithDetails[],
    allPayments: PaymentWithDetails[],
    allContratos: Contrato[],
    allPeriodos: PeriodoPago[],
    { startDate, endDate }: { startDate?: string; endDate?: string }
): FinancialSummaryByCurrency {
    const summariesByCurrency: FinancialSummaryByCurrency = { ars: [], usd: [] };

    const fromDateLimit = startDate ? parseDateSafely(startDate) : null;
    const toDateLimit = endDate ? parseDateSafely(endDate) : null;

    const dateFilter = (dateStr: string) => {
        const itemDate = parseDateSafely(dateStr);
        if (!itemDate) return false;
        if (fromDateLimit && itemDate < fromDateLimit) return false;
        if (toDateLimit && itemDate > toDateLimit) return false;
        return true;
    };
    
    properties.forEach(property => {
        const propertyBookings = allBookings.filter(b => b.propertyId === property.id && b.status !== 'cancelled');
        const propertyPeriodos = allPeriodos.filter(p => p.propertyId === property.id);
        const propertyExpenses = allExpenses.filter(e => e.assignment?.type === 'property' && e.assignment?.id === property.id && dateFilter(e.date));
        const propertyPayments = allPayments.filter(p => p.propertyId === property.id && dateFilter(p.date));

        const reportCurrencies: ('ARS' | 'USD')[] = ['ARS', 'USD'];

        for (const targetCurrency of reportCurrencies) {
            const currencyKey = targetCurrency.toLowerCase();
            const targetCurrencyUpper = targetCurrency.toUpperCase();
            
            // Ingresos pactados en esta moneda
            const incomeBookings = propertyBookings
                .filter(b => (b.currency || 'USD').toUpperCase() === targetCurrencyUpper && dateFilter(b.startDate))
                .reduce((sum, b) => sum + (b.amount || 0), 0);
            
            const incomeContratos = propertyPeriodos
                .filter(p => {
                    const contrato = allContratos.find(c => c.id === p.contratoId);
                    const belongsToTarget = (contrato?.moneda || 'ARS').toUpperCase() === targetCurrencyUpper;
                    return belongsToTarget && dateFilter(p.fechaDesde);
                })
                .reduce((sum, p) => sum + (p.montoAjustado || 0), 0);

            const totalIncome = incomeBookings + incomeContratos;
            
            // Cobros efectivos en esta moneda (o convertidos a ella en Personal)
            const totalPayments = propertyPayments
                .filter(p => (p.currency || 'USD').toUpperCase() === targetCurrencyUpper)
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            const balance = totalIncome - totalPayments;

            // Gastos imputados a esta moneda
            const totalExpenses = propertyExpenses
                .filter(e => {
                    const eCur = (e.originalUsdAmount ? 'USD' : (e.currency || 'ARS')).toUpperCase();
                    return eCur === targetCurrencyUpper;
                })
                .reduce((sum, e) => {
                    return sum + (targetCurrencyUpper === 'USD' ? (e.originalUsdAmount || 0) : (e.amount || 0));
                }, 0);

            const netResult = totalPayments - totalExpenses;

            const summary: FinancialSummary = {
                propertyId: property.id,
                propertyName: property.name,
                totalIncome,
                totalPayments,
                balance,
                totalExpenses,
                netResult,
            };
            
            if (!summariesByCurrency[currencyKey]) {
                summariesByCurrency[currencyKey] = [];
            }
            summariesByCurrency[currencyKey].push(summary);
        }
    });

    return summariesByCurrency;
}

export interface MonthlyTrendData {
    month: string;
    monthFull: string;
    income: number;
    expenses: number;
    net: number;
}

export function calculateMonthlyNetIncomeTrends(
    propertyId: string,
    allPayments: PaymentWithDetails[],
    allExpenses: ExpenseWithDetails[],
    currency: string
): MonthlyTrendData[] {
    const monthlyData: Record<string, { income: number, expenses: number }> = {};
    const targetCurrency = currency.toUpperCase();

    // Procesar cobros
    allPayments
        .filter(p => p.propertyId === propertyId && (p.currency || 'USD').toUpperCase() === targetCurrency)
        .forEach(p => {
            const date = parseDateSafely(p.date);
            if (!date) return;
            const key = format(date, 'yyyy-MM');
            if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0 };
            monthlyData[key].income += p.amount || 0;
        });

    // Procesar gastos
    allExpenses
        .filter(e => 
            e.assignment?.type === 'property' && 
            e.assignment?.id === propertyId &&
            (e.originalUsdAmount ? 'USD' : (e.currency || 'ARS')).toUpperCase() === targetCurrency
        )
        .forEach(e => {
            const date = parseDateSafely(e.date);
            if (!date) return;
            const key = format(date, 'yyyy-MM');
            if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0 };
            const amount = targetCurrency === 'USD' ? (e.originalUsdAmount || 0) : (e.amount || 0);
            monthlyData[key].expenses += amount;
        });

    const sortedKeys = Object.keys(monthlyData).sort();
    if (sortedKeys.length === 0) return [];

    return sortedKeys.map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const { income, expenses } = monthlyData[key];
        return {
            month: format(date, 'MMM yy', { locale: es }),
            monthFull: format(date, 'MMMM yyyy', { locale: es }),
            income: Math.round(income),
            expenses: Math.round(expenses),
            net: Math.round(income - expenses)
        };
    });
}

export function calculateTenantsByOriginSummary(
    tenants: Tenant[],
    origins: Origin[]
): TenantsByOriginSummary[] {
    const totalTenants = tenants.length;
    if (totalTenants === 0) return [];

    const originMap = new Map(origins.map(o => [o.id, o]));
    const counts: { [key: string]: { name: string, count: number, color: string } } = {};

    tenants.forEach(tenant => {
        const originId = tenant.originId || 'unknown';
        if (!counts[originId]) {
            const origin = originMap.get(originId);
            counts[originId] = {
                name: origin ? origin.name : 'Desconocido',
                count: 0,
                color: origin ? origin.color : '#808080'
            };
        }
        counts[originId].count++;
    });

    return Object.values(counts).map(item => ({
        ...item,
        fill: item.color,
        percentage: (item.count / totalTenants) * 100
    })).sort((a,b) => b.count - a.count);
}

export function calculateExpensesByCategorySummary(
    allExpenses: ExpenseWithDetails[],
    categories: ExpenseCategory[],
    { startDate, endDate }: { startDate?: string; endDate?: string }
): ExpensesByCategorySummary[] {
    const fromDateLimit = startDate ? parseDateSafely(startDate) : null;
    const toDateLimit = endDate ? parseDateSafely(endDate) : null;

    const dateFilter = (dateStr: string) => {
        const itemDate = parseDateSafely(dateStr);
        if (!itemDate) return false;
        if (fromDateLimit && itemDate < fromDateLimit) return false;
        if (toDateLimit && itemDate > toDateLimit) return false;
        return true;
    };
    
    const filteredExpenses = allExpenses.filter(e => dateFilter(e.date));
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amountUSD, 0);
    if (totalExpense === 0) return [];

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const counts: { [key: string]: { name: string, totalAmountUSD: number } } = {};

    filteredExpenses.forEach(expense => {
        const categoryId = expense.categoryId || 'unknown';
        if (!counts[categoryId]) {
            counts[categoryId] = {
                name: categoryMap.get(categoryId) || 'Sin Categoría',
                totalAmountUSD: 0
            };
        }
        counts[categoryId].totalAmountUSD += expense.amountUSD;
    });

    return Object.values(counts)
        .map((item, index) => ({
            ...item,
            percentage: (item.totalAmountUSD / totalExpense) * 100,
            fill: originColors[index % originColors.length]
        }))
        .sort((a, b) => b.totalAmountUSD - a.totalAmountUSD);
}

export function calculateExpensesByPropertySummary(
    allExpenses: ExpenseWithDetails[],
    properties: Property[],
    { startDate, endDate }: { startDate?: string; endDate?: string }
): ExpensesByPropertySummary[] {
    const fromDateLimit = startDate ? parseDateSafely(startDate) : null;
    const toDateLimit = endDate ? parseDateSafely(endDate) : null;

    const dateFilter = (dateStr: string) => {
        const itemDate = parseDateSafely(dateStr);
        if (!itemDate) return false;
        if (fromDateLimit && itemDate < fromDateLimit) return false;
        if (toDateLimit && itemDate > toDateLimit) return false;
        return true;
    };
    
    const filteredExpenses = allExpenses.filter(e => dateFilter(e.date) && e.assignment?.type === 'property');
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amountUSD, 0);
    if (totalExpense === 0) return [];

    const propertyMap = new Map(properties.map(p => [p.id, p.name]));
    const counts: { [key: string]: { name: string, totalAmountUSD: number } } = {};

    filteredExpenses.forEach(expense => {
        const propertyId = expense.assignment?.id || 'unknown';
        if (!counts[propertyId]) {
            counts[propertyId] = {
                name: propertyMap.get(propertyId) || 'Propiedad Desconocida',
                totalAmountUSD: 0
            };
        }
        counts[propertyId].totalAmountUSD += expense.amountUSD;
    });

    return Object.values(counts)
        .map((item, index) => ({
            ...item,
            percentage: (item.totalAmountUSD / totalExpense) * 100,
            fill: originColors[index % originColors.length]
        }))
        .sort((a, b) => b.totalAmountUSD - a.totalAmountUSD);
}

export function calculateBookingsByOriginSummary(
    bookings: Booking[],
    origins: Origin[]
): BookingsByOriginSummary[] {
    const totalBookings = bookings.length;
    if (totalBookings === 0) return [];

    const originMap = new Map(origins.map(o => [o.id, o]));
    const counts: { [key: string]: { name: string, count: number, color: string } } = {};

    bookings.forEach(booking => {
        const originId = booking.originId || 'unknown';
        if (!counts[originId]) {
            const origin = originMap.get(originId);
            counts[originId] = {
                name: origin ? origin.name : 'Desconocido',
                count: 0,
                color: origin ? origin.color : '#808080'
            };
        }
        counts[originId].count++;
    });

    return Object.values(counts).map(item => ({
        ...item,
        fill: item.color,
        percentage: (item.count / totalBookings) * 100
    })).sort((a,b) => b.count - a.count);
}

export function calculateBookingStatusSummary(
    bookings: Booking[]
): BookingStatusSummary[] {
    if (bookings.length === 0) return [];

    const statusCounts: { [key in BookingStatus]: { name: string, count: number, fill: string } } = {
        active: { name: 'Activas', count: 0, fill: '#22C55E' }, 
        pending: { name: 'Pendientes', count: 0, fill: '#F59E0B' }, 
        cancelled: { name: 'Canceladas', count: 0, fill: '#EF4444' }, 
        closed: { name: 'Cumplidas', count: 0, fill: '#71717a' },
    };

    bookings.forEach(booking => {
        const status = booking.status || 'active';
        if (statusCounts[status]) {
            statusCounts[status].count++;
        }
    });

    return Object.values(statusCounts).filter(item => item.count > 0);
}

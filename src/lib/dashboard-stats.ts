
'use server';

import { getDb } from './firebase/admin';
import { unstable_noStore as noStore } from 'next/cache';
import { startOfToday, addDays, differenceInDays } from 'date-fns';

export async function getPendingLiquidationsCount(orgId?: string): Promise<number> {
    noStore();
    const db = getDb();
    if (!db || !orgId) return 0;
    
    try {
        let q = db.collection('liquidations').where('orgId', '==', orgId).where('status', 'in', ['pending_payment', 'partially_paid']);
        const snapshot = await q.get();
        return snapshot.size;
    } catch (error) {
        console.error("Error fetching pending liquidations count:", (error as Error).message);
        return 0;
    }
}

export async function getUnliquidatedItemsCount(orgId?: string): Promise<number> {
    noStore();
    const db = getDb();
    if (!db || !orgId) return 0;
    
    try {
        const workLogsQuery = db.collection('workLogs').where('orgId', '==', orgId).where('status', '==', 'pending_liquidation');
        const adjustmentsQuery = db.collection('manualAdjustments').where('orgId', '==', orgId).where('status', '==', 'pending_liquidation');
        
        const [workLogsSnap, adjustmentsSnap] = await Promise.all([
            workLogsQuery.get(),
            adjustmentsQuery.get(),
        ]);
        
        return workLogsSnap.size + adjustmentsSnap.size;
    } catch (error) {
        console.error("Error fetching unliquidated items count:", (error as Error).message);
        return 0;
    }
}

export async function getPendingBookingsCount(orgId?: string): Promise<number> {
    noStore();
    const db = getDb();
    if (!db || !orgId) return 0;
    
    try {
        const q = db.collection('bookings').where('orgId', '==', orgId).where('status', '==', 'pending');
        const snapshot = await q.get();
        return snapshot.size;
    } catch (error) {
        console.error("Error fetching pending bookings count:", (error as Error).message);
        return 0;
    }
}

/**
 * Cuenta cuántas reservas tienen eventos próximos (Check-in o Check-out)
 * basándose en la configuración de alertas del usuario.
 */
export async function getUpcomingAlertsCount(orgId?: string): Promise<number> {
    noStore();
    const db = getDb();
    if (!db || !orgId) return 0;

    try {
        const today = startOfToday();
        
        // Obtener configuración
        const settingsSnap = await db.collection('settings').doc(`alerts_${orgId}`).get();
        const settings = settingsSnap.data();
        const checkInDays = settings?.checkInDays ?? 7;
        const checkOutDays = settings?.checkOutDays ?? 3;

        // Obtener reservas activas
        const bookingsSnap = await db.collection('bookings')
            .where('orgId', '==', orgId)
            .where('status', 'in', ['active', 'pending'])
            .get();

        let count = 0;
        bookingsSnap.docs.forEach(doc => {
            const b = doc.data();
            const start = b.startDate ? new Date(b.startDate) : null;
            const end = b.endDate ? new Date(b.endDate) : null;

            if (start && !isNaN(start.getTime())) {
                const diffIn = differenceInDays(start, today);
                if (diffIn >= 0 && diffIn <= checkInDays) count++;
            }

            if (end && !isNaN(end.getTime())) {
                const diffOut = differenceInDays(end, today);
                if (diffOut >= 0 && diffOut <= checkOutDays) count++;
            }
        });

        return count;
    } catch (error) {
        console.error("Error fetching alerts count:", error);
        return 0;
    }
}



export interface Property {
  id: number;
  name: string;
  address: string;
  googleCalendarId: string;
  imageUrl: string;
}

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
}

export interface Booking {
  id: number;
  propertyId: number;
  propertyName?: string;
  tenantId: number;
  tenantName: string;
  tenantContact: string;
  checkIn: string;
  checkOut: string;
  amountUSD: number;
  amountARS: number;
  conversionRate: number;
  payments: Payment[];
  rentalExpenses: RentalExpense[];
}

export interface Payment {
  id: number;
  date: string;
  amount: number;
  currency: 'USD' | 'ARS';
  conversionRate: number;
}

export interface RentalExpense {
  id: number;
  description: string;
  amount: number;
  currency: 'USD' | 'ARS';
}

export interface PropertyExpense {
  id: number;
  propertyId: number;
  date: string;
  description: string;
  amount: number;
}

export interface Pricing {
  propertyId: number;
  defaultNightlyRate: number;
  seasonalRates: {
    from: string;
    to: string;
    rate: number;
  }[];
  promotions: {
    minNights: number;
    discountPercent: number;
  }[];
}

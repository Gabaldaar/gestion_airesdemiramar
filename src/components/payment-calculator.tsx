
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Copy, Calculator, FileText } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { BookingWithDetails } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PaymentPreloadData } from './payment-add-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


interface PaymentCalculatorProps {
    booking?: BookingWithDetails;
    onRegisterPayment?: (data: PaymentPreloadData) => void;
}

type CalcMode = 'by_percentage' | 'by_amount';
type BaseAmountType = 'total' | 'balance';

export default function PaymentCalculator({ booking, onRegisterPayment }: PaymentCalculatorProps) {
    const [calcMode, setCalcMode] = useState<CalcMode>('by_percentage');
    
    // State for 'by_percentage' mode
    const [baseAmountType, setBaseAmountType] = useState<BaseAmountType>('total');
    const [percentage, setPercentage] = useState(booking ? 30 : 50);
    const [baseAmount, setBaseAmount] = useState(booking?.amount || 0);
    const [baseCurrency, setBaseCurrency] = useState<'USD' | 'ARS'>(booking?.currency || 'USD');
    const [resultUSD, setResultUSD] = useState(0);
    const [resultARS, setResultARS] = useState(0);

    // State for 'by_amount' mode
    const [paidAmount, setPaidAmount] = useState<number | ''>('');
    const [paidCurrency, setPaidCurrency] = useState<'USD' | 'ARS'>('USD');
    const [resultPercentage, setResultPercentage] = useState(0);

    const [dollarRate, setDollarRate] = useState<number | ''>('');
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    
    const { toast } = useToast();

    const fetchRate = async () => {
        setIsFetchingRate(true);
        try {
            const response = await fetch('/api/dollar-rate');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setDollarRate(data.venta);
        } catch (error) {
            console.error("Failed to fetch dollar rate:", error);
            toast({
                title: 'Error',
                description: 'No se pudo obtener el valor del dólar.',
                variant: 'destructive',
            });
        } finally {
            setIsFetchingRate(false);
        }
    };
    
    useEffect(() => {
        if (!dollarRate) {
           fetchRate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (booking) {
            const newBaseAmount = baseAmountType === 'balance' ? booking.balance : booking.amount;
            setBaseAmount(newBaseAmount);
            setBaseCurrency(booking.currency);
            setPercentage(30);
        }
    }, [booking, baseAmountType]);


    // Calculation for 'by_percentage' mode
    useEffect(() => {
        if (calcMode !== 'by_percentage') return;
        
        const calculate = () => {
            if (!baseAmount || !percentage || !dollarRate) {
                setResultUSD(0);
                setResultARS(0);
                return;
            }

            const percentageAsDecimal = percentage / 100;
            let baseAmountInUSD: number;

            if (baseCurrency === 'ARS') {
                baseAmountInUSD = baseAmount / dollarRate;
            } else {
                baseAmountInUSD = baseAmount;
            }

            const partialUSD = baseAmountInUSD * percentageAsDecimal;
            const partialARS = partialUSD * dollarRate;

            setResultUSD(partialUSD);
            setResultARS(partialARS);
        };

        calculate();
    }, [baseAmount, baseCurrency, percentage, dollarRate, calcMode]);
    
    // Calculation for 'by_amount' mode
    useEffect(() => {
        if (calcMode !== 'by_amount' || !booking) return;

        const calculate = () => {
            if (!paidAmount || !dollarRate || !booking) {
                setResultPercentage(0);
                return;
            }
            
            const bookingAmountInUSD = booking.currency === 'ARS' ? booking.amount / dollarRate : booking.amount;
            if (bookingAmountInUSD === 0) {
                 setResultPercentage(0);
                 return;
            }

            const paidAmountInUSD = paidCurrency === 'ARS' ? paidAmount / dollarRate : paidAmount;

            const percentageOfTotal = (paidAmountInUSD / bookingAmountInUSD) * 100;
            setResultPercentage(percentageOfTotal);
        }
        calculate();

    }, [paidAmount, paidCurrency, dollarRate, booking, calcMode])

    const handleCopy = (value: number, curr: 'USD' | 'ARS') => {
        navigator.clipboard.writeText(value.toFixed(2));
        toast({
            title: 'Copiado',
            description: `Monto en ${curr} copiado al portapapeles.`,
        });
    };
    
    const handleRegister = (currency: 'USD' | 'ARS') => {
        if (onRegisterPayment && dollarRate) {
            const data: PaymentPreloadData = {
                currency,
                amount: currency === 'USD' ? resultUSD : resultARS,
                exchangeRate: dollarRate || undefined
            };
            onRegisterPayment(data);
        }
    }

    const formatCurrency = (value: number, curr: 'USD' | 'ARS') => {
        const options: Intl.NumberFormatOptions = {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        };
        return new Intl.NumberFormat('es-AR', options).format(value);
    }
    
    const isBookingContext = !!booking;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Calculadora de Pagos
                </CardTitle>
                <CardDescription>
                    {isBookingContext ? "Calcula un pago para esta reserva." : "Calcula un pago en base a un porcentaje."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Tabs value={calcMode} onValueChange={(val) => setCalcMode(val as CalcMode)} className="w-full">
                    {isBookingContext && (
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="by_percentage">Calcular por %</TabsTrigger>
                            <TabsTrigger value="by_amount">Calcular por Monto</TabsTrigger>
                        </TabsList>
                    )}
                    <TabsContent value="by_percentage">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-4">
                             {isBookingContext && (
                                <div className="md:col-span-2">
                                    <Label>Base para el Cálculo</Label>
                                    <RadioGroup defaultValue="total" value={baseAmountType} onValueChange={(val) => setBaseAmountType(val as BaseAmountType)} className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="total" id="r-total" />
                                            <Label htmlFor="r-total">Monto Total ({formatCurrency(booking.amount, booking.currency)})</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="balance" id="r-balance" />
                                            <Label htmlFor="r-balance">Saldo ({formatCurrency(booking.balance, booking.currency)})</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            )}
                            <div className="grid gap-1.5">
                                <Label htmlFor="calc-amount">Monto de la Reserva</Label>
                                <Input id="calc-amount" type="number" value={baseAmount} onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)} disabled={isBookingContext} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="calc-currency">Moneda</Label>
                                <Select value={baseCurrency} onValueChange={(val) => setBaseCurrency(val as 'USD' | 'ARS')} disabled={isBookingContext}>
                                    <SelectTrigger id="calc-currency">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="ARS">ARS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="calc-percentage">Porcentaje a Abonar (%)</Label>
                                <Input id="calc-percentage" type="number" value={percentage} onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="calc-dollar">Valor del Dólar</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="calc-dollar" type="number" value={dollarRate} onChange={(e) => setDollarRate(parseFloat(e.target.value) || '')} placeholder="Ej: 900.50"/>
                                    <Button type="button" variant="outline" size="icon" onClick={fetchRate} disabled={isFetchingRate}>
                                        {isFetchingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                         <div className="border-t pt-6 space-y-4 mt-6">
                            <h4 className="text-lg font-semibold text-center">Resultados del Cálculo por Porcentaje</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4 space-y-2 flex flex-col">
                                    <Label className="text-muted-foreground">Monto a Pagar (USD)</Label>
                                    <p className="text-2xl font-bold flex-grow">{formatCurrency(resultUSD, 'USD')}</p>
                                    <div className='flex gap-2 self-end'>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="icon" onClick={() => handleCopy(resultUSD, 'USD')}><Copy className="h-4 w-4" /></Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Copiar Monto en USD</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        {onRegisterPayment && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="default" size="icon" onClick={() => handleRegister('USD')}><FileText className="h-4 w-4" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Registrar Pago en USD</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4 space-y-2 flex flex-col">
                                    <Label className="text-muted-foreground">Monto a Pagar (ARS)</Label>
                                    <p className="text-2xl font-bold flex-grow">{formatCurrency(resultARS, 'ARS')}</p>
                                    <div className='flex gap-2 self-end'>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="outline" size="icon" onClick={() => handleCopy(resultARS, 'ARS')}><Copy className="h-4 w-4" /></Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Copiar Monto en ARS</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                         {onRegisterPayment && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="default" size="icon" onClick={() => handleRegister('ARS')}><FileText className="h-4 w-4" /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Registrar Pago en ARS</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                    {isBookingContext && (
                         <TabsContent value="by_amount">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="calc-paid-amount">Monto Recibido</Label>
                                    <Input id="calc-paid-amount" type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || '')} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="calc-paid-currency">Moneda del Pago</Label>
                                    <Select value={paidCurrency} onValueChange={(val) => setPaidCurrency(val as 'USD' | 'ARS')}>
                                        <SelectTrigger id="calc-paid-currency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="ARS">ARS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                             <div className="border-t pt-6 space-y-4 mt-6">
                                <h4 className="text-lg font-semibold text-center">Resultados del Cálculo por Monto</h4>
                                 <div className="border rounded-lg p-4 space-y-2 text-center">
                                    <Label className="text-muted-foreground">Porcentaje de la Reserva</Label>
                                    <p className="text-3xl font-bold text-primary">{resultPercentage > 0 ? resultPercentage.toFixed(2) : '0.00'}%</p>
                                 </div>
                             </div>
                         </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
}

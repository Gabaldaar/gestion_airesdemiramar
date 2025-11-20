
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Copy, Calculator } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface PaymentCalculatorProps {
    initialAmount?: number;
    initialCurrency?: 'USD' | 'ARS';
}

export default function PaymentCalculator({ initialAmount, initialCurrency }: PaymentCalculatorProps) {
    const [amount, setAmount] = useState(initialAmount || 0);
    const [currency, setCurrency] = useState<'USD' | 'ARS'>(initialCurrency || 'USD');
    const [percentage, setPercentage] = useState(50);
    const [dollarRate, setDollarRate] = useState<number | ''>('');
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    
    const [resultUSD, setResultUSD] = useState(0);
    const [resultARS, setResultARS] = useState(0);
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
    
    // Fetch rate on initial load if not pre-filled
    useEffect(() => {
        if (!dollarRate) {
           fetchRate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Set initial values when props change
    useEffect(() => {
        setAmount(initialAmount || 0);
        setCurrency(initialCurrency || 'USD');
    }, [initialAmount, initialCurrency]);

    useEffect(() => {
        const calculate = () => {
            if (!amount || !percentage || !dollarRate) {
                setResultUSD(0);
                setResultARS(0);
                return;
            }

            const percentageAsDecimal = percentage / 100;
            let baseAmountInUSD: number;

            if (currency === 'ARS') {
                baseAmountInUSD = amount / dollarRate;
            } else {
                baseAmountInUSD = amount;
            }

            const partialUSD = baseAmountInUSD * percentageAsDecimal;
            const partialARS = partialUSD * dollarRate;

            setResultUSD(partialUSD);
            setResultARS(partialARS);
        };

        calculate();
    }, [amount, currency, percentage, dollarRate]);

    const handleCopy = (value: number, curr: 'USD' | 'ARS') => {
        navigator.clipboard.writeText(value.toFixed(2));
        toast({
            title: 'Copiado',
            description: `Monto en ${curr} copiado al portapapeles.`,
        });
    };
    
    const formatCurrency = (value: number, curr: 'USD' | 'ARS') => {
        const options: Intl.NumberFormatOptions = {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        };
        return new Intl.NumberFormat('es-AR', options).format(value);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Calculadora de Pagos
                </CardTitle>
                <CardDescription>
                    Calcula cuánto debe abonar un inquilino en base a un porcentaje.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="grid gap-1.5">
                        <Label htmlFor="calc-amount">Monto de la Reserva</Label>
                        <Input id="calc-amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="calc-currency">Moneda</Label>
                         <Select value={currency} onValueChange={(val) => setCurrency(val as 'USD' | 'ARS')}>
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

                <div className="border-t pt-6 space-y-4">
                    <h4 className="text-lg font-semibold text-center">Resultados</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 space-y-2">
                            <Label className="text-muted-foreground">Monto a Pagar (USD)</Label>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-2xl font-bold">{formatCurrency(resultUSD, 'USD')}</p>
                                <Button variant="outline" size="icon" onClick={() => handleCopy(resultUSD, 'USD')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="border rounded-lg p-4 space-y-2">
                            <Label className="text-muted-foreground">Monto a Pagar (ARS)</Label>
                             <div className="flex items-center justify-between gap-2">
                                <p className="text-2xl font-bold">{formatCurrency(resultARS, 'ARS')}</p>
                                <Button variant="outline" size="icon" onClick={() => handleCopy(resultARS, 'ARS')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}

    
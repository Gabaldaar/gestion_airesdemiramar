
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const currencies: Currency[] = [
    { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'UYU', name: 'Peso Uruguayo', symbol: '$U' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
    { code: 'CLP', name: 'Peso Chileno', symbol: 'CLP$' },
    { code: 'COP', name: 'Peso Colombiano', symbol: 'COP$' },
    { code: 'MXN', name: 'Peso Mexicano', symbol: 'MX$' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
    { code: 'PYG', name: 'Guaraní Paraguayo', symbol: '₲' },
    { code: 'BOB', name: 'Boliviano', symbol: 'Bs.' },
    { code: 'GBP', name: 'Libra Esterlina', symbol: '£' },
    { code: 'JPY', name: 'Yen Japonés', symbol: '¥' },
    { code: 'CAD', name: 'Dólar Canadiense', symbol: 'CA$' },
    { code: 'AUD', name: 'Dólar Australiano', symbol: 'AU$' },
    { code: 'CHF', name: 'Franco Suizo', symbol: 'CHF' },
];

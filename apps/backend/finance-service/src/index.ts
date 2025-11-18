export interface FinanceDescriptor {
  name: string;
  domain: 'finance';
  ready: boolean;
  notes: string;
}

export function describeFinanceService(): FinanceDescriptor {
  return {
    name: 'finance-service',
    domain: 'finance',
    ready: false,
    notes: 'Will own ledgers, payment links and revenue tracking in upcoming tasks.'
  };
}

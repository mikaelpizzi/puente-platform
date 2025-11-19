export interface P2PProvider {
  name: string;
  getExchangeRate(currency: string): Promise<number>;
  createSellOrder(
    amount: number,
    currency: string,
  ): Promise<{ orderId: string; paymentDetails: any }>;
  checkOrderStatus(orderId: string): Promise<'PENDING' | 'COMPLETED' | 'FAILED'>;
}

export abstract class AbstractP2PAdapter implements P2PProvider {
  abstract name: string;
  abstract getExchangeRate(currency: string): Promise<number>;
  abstract createSellOrder(
    amount: number,
    currency: string,
  ): Promise<{ orderId: string; paymentDetails: any }>;
  abstract checkOrderStatus(orderId: string): Promise<'PENDING' | 'COMPLETED' | 'FAILED'>;
}

export type PaymentMethod = 'Cash' | 'Bank' | 'Card';

export interface Payment {
  id: string;
  receiptNo: string;
  paymentDate: string; // ISO date (yyyy-mm-dd)
  invoiceId: string;
  invoiceNo: string;
  amount: number;
  method: PaymentMethod;
}


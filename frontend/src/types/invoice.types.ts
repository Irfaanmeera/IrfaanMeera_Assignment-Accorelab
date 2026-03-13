export interface Customer {
  id: string;
  name: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  invoiceDate: string; // ISO date (yyyy-mm-dd)
  amount: number;
  paidAmount: number;
  balance: number;
}


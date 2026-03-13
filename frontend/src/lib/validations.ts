import { z } from 'zod/v3';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const addInvoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').trim(),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

export const addPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Please select an invoice'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['Cash', 'Bank', 'Card'], { required_error: 'Payment method is required' }),
});

export const editInvoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').trim(),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

export const addCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').trim(),
});

export const editCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').trim(),
});

export const editPaymentSchema = z.object({
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['Cash', 'Bank', 'Card'], { required_error: 'Payment method is required' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type AddInvoiceFormData = z.infer<typeof addInvoiceSchema>;
export type AddPaymentFormData = z.infer<typeof addPaymentSchema>;
export type EditInvoiceFormData = z.infer<typeof editInvoiceSchema>;
export type EditPaymentFormData = z.infer<typeof editPaymentSchema>;

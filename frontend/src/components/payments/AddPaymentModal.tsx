import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import { createPayment } from '@/features/payments/paymentsSlice';
import type { PaymentMethod } from '@/types/payment.types';
import { addPaymentSchema } from '@/lib/validations';
import { InvoiceSearchCombobox } from './InvoiceSearchCombobox';

const methods: PaymentMethod[] = ['Cash', 'Bank', 'Card'];

export default function AddPaymentModal() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const [invoiceId, setInvoiceId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('0');
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [errors, setErrors] = useState<{
    invoiceId?: string;
    paymentDate?: string;
    amount?: string;
    method?: string;
  }>({});


  function handleSave() {
    setErrors({});
    const parsedAmount = Number(amount);
    const result = addPaymentSchema.safeParse({
      invoiceId,
      paymentDate,
      amount: parsedAmount,
      method,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((e: { path: (string | number)[]; message: string }) => {
        const path = e.path[0] as string;
        if (path && !fieldErrors[path]) fieldErrors[path] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    dispatch(createPayment(result.data));
    setInvoiceId('');
    setAmount('0');
    setMethod('Cash');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setErrors({});
          setInvoiceId('');
          setAmount('0');
          setMethod('Cash');
          setPaymentDate(new Date().toISOString().slice(0, 10));
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#1F7DC2' }}>Add payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Invoice</div>
            <InvoiceSearchCombobox
              key={open ? 'open' : 'closed'}
              value={invoiceId}
              onChange={(id) => {
                setInvoiceId(id);
                if (errors.invoiceId) setErrors((p) => ({ ...p, invoiceId: undefined }));
              }}
              placeholder="Search by invoice no or customer..."
              error={!!errors.invoiceId}
            />
            {errors.invoiceId && <div className="mt-1 text-sm text-red-600">{errors.invoiceId}</div>}
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Payment date</div>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => {
                setPaymentDate(e.target.value);
                if (errors.paymentDate) setErrors((p) => ({ ...p, paymentDate: undefined }));
              }}
              className={errors.paymentDate ? 'border-red-500' : ''}
            />
            {errors.paymentDate && <div className="mt-1 text-sm text-red-600">{errors.paymentDate}</div>}
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Amount</div>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
              }}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && <div className="mt-1 text-sm text-red-600">{errors.amount}</div>}
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Method</div>
            <Select
              value={method}
              onValueChange={(v) => {
                setMethod(v as PaymentMethod);
                if (errors.method) setErrors((p) => ({ ...p, method: undefined }));
              }}
            >
              <SelectTrigger className={errors.method ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.method && <div className="mt-1 text-sm text-red-600">{errors.method}</div>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


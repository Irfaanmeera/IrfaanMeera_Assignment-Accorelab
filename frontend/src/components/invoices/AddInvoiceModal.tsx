import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import { createInvoice } from '@/features/invoices/invoicesSlice';
import { addInvoiceSchema } from '@/lib/validations';
import { CustomerSearchCombobox } from '@/components/customers/CustomerSearchCombobox';

export default function AddInvoiceModal() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const [customerName, setCustomerName] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>('0');
  const [errors, setErrors] = useState<{ customerName?: string; invoiceDate?: string; amount?: string }>({});

  function handleSave() {
    setErrors({});
    const parsedAmount = Number(amount);
    const result = addInvoiceSchema.safeParse({
      customerName: customerName.trim(),
      invoiceDate,
      amount: parsedAmount,
    });
    if (!result.success) {
      const fieldErrors: { customerName?: string; invoiceDate?: string; amount?: string } = {};
      result.error.issues.forEach((e: { path: (string | number)[]; message: string }) => {
        const path = e.path[0] as 'customerName' | 'invoiceDate' | 'amount';
        if (path && !fieldErrors[path]) fieldErrors[path] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    dispatch(createInvoice(result.data));
    setCustomerName('');
    setAmount('0');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setErrors({});
      }}
    >
      <DialogTrigger asChild>
        <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#1F7DC2' }}>Add invoice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Customer</div>
            <CustomerSearchCombobox
              value={customerName}
              onChange={(name) => {
                setCustomerName(name);
                if (errors.customerName) setErrors((p) => ({ ...p, customerName: undefined }));
              }}
              placeholder="Search or type customer..."
              error={!!errors.customerName}
            />
            {errors.customerName && <div className="mt-1 text-sm text-red-600">{errors.customerName}</div>}
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Invoice date</div>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => {
                setInvoiceDate(e.target.value);
                if (errors.invoiceDate) setErrors((p) => ({ ...p, invoiceDate: undefined }));
              }}
              className={errors.invoiceDate ? 'border-red-500' : ''}
            />
            {errors.invoiceDate && <div className="mt-1 text-sm text-red-600">{errors.invoiceDate}</div>}
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Amount</div>
            <Input
              inputMode="decimal"
              value={amount}
              onFocus={() => {
                if (amount === '0') setAmount('');
              }}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
              }}
              placeholder="0"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && <div className="mt-1 text-sm text-red-600">{errors.amount}</div>}
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


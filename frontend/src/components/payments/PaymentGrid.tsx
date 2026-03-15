import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import { deletePaymentRemote, fetchPayments, updatePaymentRemote } from '@/features/payments/paymentsSlice';
import { editPaymentSchema } from '@/lib/validations';
import type { PaymentMethod } from '@/types/payment.types';
import AddPaymentModal from './AddPaymentModal';
import { Skeleton } from '@/components/ui/skeleton';

const methods: PaymentMethod[] = ['Cash', 'Bank', 'Card'];

type SortKey = 'receiptNo' | 'paymentDate' | 'amount' | 'method' | 'createdAt' | 'invoiceNo';

function formatPaymentDate(value: string): string {
  if (!value) return '';
  const d = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date(value).toISOString().slice(0, 10);
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'receiptNo', label: 'Receipt No' },
  { value: 'paymentDate', label: 'Payment Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'method', label: 'Method' },
  { value: 'invoiceNo', label: 'Invoice No' },
];



export default function PaymentGrid() {
  const { payments, total, status } = useSelector((s: RootState) => s.payments);
  const dispatch = useDispatch<AppDispatch>();
  const gridPageSize = 5;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [pageState, setPageState] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ paymentDate?: string; amount?: string; method?: PaymentMethod }>({});
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (searchInput === '') {
      const t = setTimeout(() => {
        setSearch('');
        setPageState(1);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPageState(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    dispatch(
      fetchPayments({
        page: pageState,
        pageSize: gridPageSize,
        search: search || undefined,
        sortBy,
        order,
      })
    );
  }, [dispatch, pageState, search, sortBy, order]);

  const totalPages = Math.max(1, Math.ceil(total / gridPageSize));

  function handleSortChange(key: SortKey) {
    setSortBy(key);
    setPageState(1);
  }

  function handleOrderChange() {
    setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    setPageState(1);
  }

  function clearEdit() {
    setEditingId(null);
    setDraft({});
    setEditError(null);
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Payments</h2>
         
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search receipt, invoice, customer... (debounced)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 w-48 border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortKey)}>
            <SelectTrigger className="h-8 w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleOrderChange}>
            {order === 'asc' ? '↑ Asc' : '↓ Desc'}
          </Button>
          <AddPaymentModal />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Invoice No</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === 'loading' ? (
              Array.from({ length: gridPageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : (
            <>
            {payments.map((payment) => {
              const isEditing = editingId === payment.id;
              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.receiptNo}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={draft.paymentDate ?? formatPaymentDate(payment.paymentDate)}
                        onChange={(e) => setDraft((d) => ({ ...d, paymentDate: e.target.value }))}
                      />
                    ) : (
                      formatPaymentDate(payment.paymentDate)
                    )}
                  </TableCell>
                  <TableCell>{payment.invoiceNo}</TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        inputMode="decimal"
                        value={draft.amount ?? String(payment.amount)}
                        onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                      />
                    ) : (
                      Number(payment.amount).toFixed(2)
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select value={draft.method ?? payment.method} onValueChange={(v) => setDraft((d) => ({ ...d, method: v as PaymentMethod }))}>
                        <SelectTrigger>
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
                    ) : (
                      payment.method
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        {editError && <div className="text-xs text-red-600">{editError}</div>}
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={clearEdit}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditError(null);
                              const paymentDate = draft.paymentDate ?? formatPaymentDate(payment.paymentDate);
                              const amount = draft.amount ? Number(draft.amount) : payment.amount;
                              const method = draft.method ?? payment.method;
                              const result = editPaymentSchema.safeParse({ paymentDate, amount, method });
                              if (!result.success) {
                                setEditError(result.error.issues[0]?.message ?? 'Invalid input');
                                return;
                              }
                              dispatch(
                                updatePaymentRemote({
                                  id: payment.id,
                                  patch: result.data,
                                })
                              );
                              clearEdit();
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label="Edit payment"
                          onClick={() => {
                            setEditingId(payment.id);
                            setDraft({});
                            setEditError(null);
                          }}
                          className="rounded p-1.5 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" style={{ color: '#1F7DC2' }} />
                        </button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              aria-label="Delete payment"
                              className="rounded p-1.5 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete payment</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete payment{' '}
                                <span className="font-semibold">{payment.receiptNo}</span>? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 flex justify-end gap-2">
                              <DialogTrigger asChild>
                                <Button type="button" variant="secondary">
                                  Cancel
                                </Button>
                              </DialogTrigger>
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={() => {
                                    dispatch(deletePaymentRemote(payment.id));
                                  }}
                                >
                                  Confirm delete
                                </Button>
                              </DialogTrigger>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                  No payments yet.
                </TableCell>
              </TableRow>
            )}
            </>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {status === 'loading' ? 'Loading...' : `Page ${pageState} of ${totalPages} (${total} total)`}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={pageState <= 1 || status === 'loading'} onClick={() => setPageState((p) => p - 1)}>
            Prev
          </Button>
          <Button size="sm" variant="secondary" disabled={pageState >= totalPages || status === 'loading'} onClick={() => setPageState((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}


import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/app/store';
import type { RootState } from '@/app/store';
import { deleteInvoiceRemote, fetchInvoices, updateInvoiceRemote } from '@/features/invoices/invoicesSlice';
import { editInvoiceSchema } from '@/lib/validations';
import AddInvoiceModal from './AddInvoiceModal';
import { CustomerSearchCombobox } from '@/components/customers/CustomerSearchCombobox';
import { Skeleton } from '@/components/ui/skeleton';

type SortKey = 'invoiceNo' | 'customerName' | 'invoiceDate' | 'amount' | 'paidAmount' | 'balance' | 'createdAt';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'invoiceNo', label: 'Invoice No' },
  { value: 'customerName', label: 'Customer' },
  { value: 'invoiceDate', label: 'Invoice Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'paidAmount', label: 'Paid' },
  { value: 'balance', label: 'Balance' },
];


export default function InvoiceGrid() {
  const { invoices, total, status } = useSelector((s: RootState) => s.invoices);
  const dispatch = useDispatch<AppDispatch>();

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [pageState, setPageState] = useState(1);
  const gridPageSize = 5;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ customerName?: string; invoiceDate?: string; amount?: string }>({});
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (searchInput === '') {
      const timer = setTimeout(() => {
        setSearch('');
        setPageState(1);
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPageState(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    dispatch(
      fetchInvoices({
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

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Invoices</h2>
          
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customer or invoice... (debounced)"
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
          <AddInvoiceModal />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === 'loading' ? (
              Array.from({ length: gridPageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-14" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-14" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-16" /></TableCell>
                </TableRow>
              ))
            ) : (
            <>
            {invoices.map((invoice) => {
              const isEditing = editingId === invoice.id;
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <CustomerSearchCombobox
                        value={draft.customerName ?? invoice.customerName}
                        onChange={(name) => setDraft((d) => ({ ...d, customerName: name }))}
                        placeholder="Search or add customer..."
                      />
                    ) : (
                      invoice.customerName
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={draft.invoiceDate ?? invoice.invoiceDate}
                        onChange={(e) => setDraft((d) => ({ ...d, invoiceDate: e.target.value }))}
                      />
                    ) : (
                      invoice.invoiceDate
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        inputMode="decimal"
                        value={draft.amount ?? String(invoice.amount)}
                        onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                      />
                    ) : (
                      invoice.amount.toFixed(2)
                    )}
                  </TableCell>
                  <TableCell className="text-right">{invoice.paidAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{invoice.balance.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex flex-col items-end gap-1">
                        {editError && <div className="text-xs text-red-600">{editError}</div>}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingId(null);
                              setDraft({});
                              setEditError(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditError(null);
                              const customerName = draft.customerName ?? invoice.customerName;
                              const invoiceDate = draft.invoiceDate ?? invoice.invoiceDate;
                              const amount = draft.amount ? Number(draft.amount) : invoice.amount;
                              const result = editInvoiceSchema.safeParse({ customerName, invoiceDate, amount });
                              if (!result.success) {
                                setEditError(result.error.issues[0]?.message ?? 'Invalid input');
                                return;
                              }
                              dispatch(
                                updateInvoiceRemote({
                                  id: invoice.id,
                                  patch: { customerName: result.data.customerName, invoiceDate: result.data.invoiceDate, amount: result.data.amount },
                                })
                              );
                              setEditingId(null);
                              setDraft({});
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
                          aria-label="Edit invoice"
                          onClick={() => {
                            setEditingId(invoice.id);
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
                              aria-label="Delete invoice"
                              className="rounded p-1.5 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete invoice</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete invoice{' '}
                                <span className="font-semibold">{invoice.invoiceNo}</span>? This action cannot be undone.
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
                                    dispatch(deleteInvoiceRemote(invoice.id));
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
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No invoices yet.
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


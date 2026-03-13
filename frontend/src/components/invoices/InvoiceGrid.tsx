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
  const paged = invoices;

  function applySearch() {
    setSearch(searchInput);
    setPageState(1);
  }

  function handleSortChange(key: SortKey) {
    setSortBy(key);
    setPageState(1);
  }

  function handleOrderChange() {
    setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    setPageState(1);
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">Invoices</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border px-2 py-1">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search customer or invoice no..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              className="h-8 w-48 border-0 focus-visible:ring-0"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={applySearch}>
            Search
          </Button>
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
            {paged.map((inv) => {
              const isEditing = editingId === inv.id;
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <CustomerSearchCombobox
                        value={draft.customerName ?? inv.customerName}
                        onChange={(name) => setDraft((d) => ({ ...d, customerName: name }))}
                        placeholder="Search or add customer..."
                      />
                    ) : (
                      inv.customerName
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={draft.invoiceDate ?? inv.invoiceDate}
                        onChange={(e) => setDraft((d) => ({ ...d, invoiceDate: e.target.value }))}
                      />
                    ) : (
                      inv.invoiceDate
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        inputMode="decimal"
                        value={draft.amount ?? String(inv.amount)}
                        onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                      />
                    ) : (
                      inv.amount.toFixed(2)
                    )}
                  </TableCell>
                  <TableCell className="text-right">{inv.paidAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{inv.balance.toFixed(2)}</TableCell>
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
                              const customerName = draft.customerName ?? inv.customerName;
                              const invoiceDate = draft.invoiceDate ?? inv.invoiceDate;
                              const amount = draft.amount ? Number(draft.amount) : inv.amount;
                              const result = editInvoiceSchema.safeParse({ customerName, invoiceDate, amount });
                              if (!result.success) {
                                setEditError(result.error.issues[0]?.message ?? 'Invalid input');
                                return;
                              }
                              dispatch(
                                updateInvoiceRemote({
                                  id: inv.id,
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
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Edit invoice"
                          onClick={() => {
                            setEditingId(inv.id);
                            setDraft({});
                            setEditError(null);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive" aria-label="Delete invoice">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete invoice</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete invoice{' '}
                                <span className="font-semibold">{inv.invoiceNo}</span>? This action cannot be undone.
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
                                    dispatch(deleteInvoiceRemote(inv.id));
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
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No invoices yet.
                </TableCell>
              </TableRow>
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


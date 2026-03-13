import { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';
import { deletePaymentRemote, fetchPayments, updatePaymentRemote } from '@/features/payments/paymentsSlice';
import { editPaymentSchema } from '@/lib/validations';
import type { Payment, PaymentMethod } from '@/types/payment.types';
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

  const clearEdit = () => {
    setEditingId(null);
    setDraft({});
    setEditError(null);
  };

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      { accessorKey: 'receiptNo', header: 'Receipt No' },
      {
        accessorKey: 'paymentDate',
        header: 'Payment Date',
        cell: ({ row }) => {
          const p = row.original;
          const isEditing = editingId === p.id;
          if (!isEditing) return formatPaymentDate(p.paymentDate);
          return (
            <Input
              type="date"
              value={draft.paymentDate ?? formatPaymentDate(p.paymentDate)}
              onChange={(e) => setDraft((d) => ({ ...d, paymentDate: e.target.value }))}
            />
          );
        },
      },
      { accessorKey: 'invoiceNo', header: 'Invoice No' },
      {
        accessorKey: 'amount',
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
          const p = row.original;
          const isEditing = editingId === p.id;
          if (!isEditing) return <div className="text-right">{Number(p.amount).toFixed(2)}</div>;
          return (
            <Input
              inputMode="decimal"
              value={draft.amount ?? String(p.amount)}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
            />
          );
        },
      },
      {
        accessorKey: 'method',
        header: 'Method',
        cell: ({ row }) => {
          const p = row.original;
          const isEditing = editingId === p.id;
          if (!isEditing) return p.method;
          return (
            <Select value={draft.method ?? p.method} onValueChange={(v) => setDraft((d) => ({ ...d, method: v as PaymentMethod }))}>
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
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const p = row.original;
          const isEditing = editingId === p.id;
          return (
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
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
                          const paymentDate = draft.paymentDate ?? formatPaymentDate(p.paymentDate);
                          const amount = draft.amount ? Number(draft.amount) : p.amount;
                          const method = draft.method ?? p.method;
                          const result = editPaymentSchema.safeParse({ paymentDate, amount, method });
                          if (!result.success) {
                            setEditError(result.error.issues[0]?.message ?? 'Invalid input');
                            return;
                          }
                          dispatch(
                            updatePaymentRemote({
                              id: p.id,
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
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="Edit payment"
                    onClick={() => {
                      setEditingId(p.id);
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
                          <span className="font-semibold">{p.receiptNo}</span>? This action cannot be undone.
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
                              dispatch(deletePaymentRemote(p.id));
                            }}
                          >
                            Confirm delete
                          </Button>
                        </DialogTrigger>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [dispatch, draft.amount, draft.method, draft.paymentDate, editingId, editError, clearEdit]
  );

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
              placeholder="Search receipt, invoice, customer..."
              value={searchInput}
              onChange={(e) => {
                const v = e.target.value;
                setSearchInput(v);
                if (v === '' && search) {
                  setSearch('');
                  setPageState(1);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              className="h-8 w-48 border-0 bg-transparent focus-visible:ring-0"
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
          <AddPaymentModal />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-600">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="h-10 px-2 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {status === 'loading' ? (
              Array.from({ length: gridPageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-slate-200">
                  <td className="p-2"><Skeleton className="h-5 w-28" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-24" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-36" /></td>
                  <td className="p-2 text-right"><Skeleton className="ml-auto h-5 w-16" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-14" /></td>
                  <td className="p-2 text-right"><Skeleton className="ml-auto h-5 w-16" /></td>
                </tr>
              ))
            ) : (
            <>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-slate-500">
                  No payments yet.
                </td>
              </tr>
            )}
            </>
            )}
          </tbody>
        </table>
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


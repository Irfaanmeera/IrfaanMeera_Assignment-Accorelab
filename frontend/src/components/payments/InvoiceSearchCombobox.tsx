import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchInvoicesRequest } from '@/api/invoiceApi';
import type { Invoice } from '@/types/invoice.types';

interface InvoiceSearchComboboxProps {
  value: string;
  onChange: (invoiceId: string, invoice?: Invoice) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

const DEBOUNCE_MS = 500;

export function InvoiceSearchCombobox({ value, onChange, placeholder, error, disabled }: InvoiceSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);

  const fetchInitial = useCallback(() => {
    setLoading(true);
    fetchInvoicesRequest({ page: 1, pageSize: 20 })
      .then((res) => setResults(res.items))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      if (open) void Promise.resolve().then(fetchInitial);
      return;
    }
    const q = query.trim();
    const id = ++searchIdRef.current;
    searchTimeoutRef.current = window.setTimeout(() => {
      setLoading(true);
      fetchInvoicesRequest({ search: q, page: 1, pageSize: 20 })
        .then((res) => {
          if (id === searchIdRef.current) setResults(res.items);
        })
        .catch(() => {
          if (id === searchIdRef.current) setResults([]);
        })
        .finally(() => {
          if (id === searchIdRef.current) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [query, open, fetchInitial]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasQuery = !!query.trim();
  const displayValue = selectedInvoice ? `${selectedInvoice.invoiceNo} · ${selectedInvoice.customerName}` : query;
  const displayResults = results;

  const handleSelect = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setQuery('');
    setResults([]);
    setOpen(false);
    onChange(inv.id, inv);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setOpen(true);
    if (!query.trim() && !selectedInvoice) fetchInitial();
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setSelectedInvoice(null);
    setOpen(true);
    if (!value) onChange('');
  };

  const handleClear = () => {
    setSelectedInvoice(null);
    setQuery('');
    setResults([]);
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white has-focus:ring-2 has-focus:ring-slate-400 has-focus:ring-offset-0">
        <Search className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        <Input
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder ?? 'Search by invoice no or customer...'}
          disabled={disabled}
          className={`flex-1 border-0 focus-visible:ring-0 ${error ? 'border-red-500!' : ''}`}
        />
        {selectedInvoice && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-2 rounded px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading ? (
            <div className="py-4 text-center text-sm text-slate-500">Loading...</div>
          ) : displayResults.length === 0 ? (
            <div className="py-4 text-center text-sm text-slate-500">
              {hasQuery ? 'No matching invoices' : 'Type to search'}
            </div>
          ) : (
            displayResults.map((inv) => (
              <button
                key={inv.id}
                type="button"
                className="flex w-full cursor-pointer flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-slate-100"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(inv);
                }}
              >
                <span className="font-medium text-slate-900">{inv.invoiceNo}</span>
                <span className="text-xs text-slate-500">{inv.customerName} · Balance: {inv.balance.toFixed(2)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

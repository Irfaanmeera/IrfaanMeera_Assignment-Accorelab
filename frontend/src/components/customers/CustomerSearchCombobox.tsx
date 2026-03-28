import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchCustomerNamesRequest } from '@/api/customerApi';

interface CustomerSearchComboboxProps {
  value: string;
  onChange: (customerName: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}

const DEBOUNCE_MS = 400;

export function CustomerSearchCombobox({
  value,
  onChange,
  placeholder = 'Search customer...',
  error,
  disabled,
}: CustomerSearchComboboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);

  const fetchNames = useCallback((search?: string) => {
    setLoading(true);
    fetchCustomerNamesRequest({ search: search?.trim() || undefined, limit: 20 })
      .then((names) => setResults(names))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const fetchInitial = useCallback(() => {
    fetchNames();
  }, [fetchNames]);

  useEffect(() => {
    if (!query.trim()) {
      if (open) void Promise.resolve().then(fetchInitial);
      return;
    }
    const q = query.trim();
    const id = ++searchIdRef.current;
    searchTimeoutRef.current = window.setTimeout(() => {
      setLoading(true);
      fetchCustomerNamesRequest({ search: q, limit: 20 })
        .then((names) => {
          if (id === searchIdRef.current) setResults(names);
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
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value;

  const handleSelect = (name: string) => {
    setQuery(name);
    setOpen(false);
    onChange(name);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setOpen(true);
    if (!value.trim()) fetchInitial();
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setQuery(next);
    onChange(next);
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white">
        <Search className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
        <Input
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 border-0 focus-visible:ring-0 ${error ? 'border-red-500!' : ''}`}
        />
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-100 mt-1 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading ? (
            <div className="py-4 text-center text-sm text-slate-500">Loading...</div>
          ) : (
            <>
              {results.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="flex w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(name);
                  }}
                >
                  {name}
                </button>
              ))}
              {!results.length && (
                <div className="px-3 py-3 text-sm text-slate-500">No matching customers</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

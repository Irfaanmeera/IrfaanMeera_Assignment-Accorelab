import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchCustomerNamesRequest } from '@/api/customerApi';
import { addCustomerSchema } from '@/lib/validations';

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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
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
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value || query;
  const hasQuery = !!query.trim();

  const handleSelect = (name: string) => {
    setQuery('');
    setOpen(false);
    onChange(name);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setOpen(true);
    if (!query.trim()) fetchInitial();
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 150);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (value) onChange('');
  };

  const handleAddNew = () => {
    setAddModalOpen(true);
    setAddName('');
    setAddError(null);
  };

  const handleAddSave = () => {
    setAddError(null);
    const result = addCustomerSchema.safeParse({ name: addName.trim() });
    if (!result.success) {
      setAddError(result.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    onChange(result.data.name);
    setAddModalOpen(false);
    setQuery('');
    setOpen(false);
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-700"
          onClick={handleAddNew}
          aria-label="Add new customer"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {loading ? (
            <div className="py-4 text-center text-sm text-slate-500">Loading...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4">
              <div className="text-center text-sm text-slate-500">
                {hasQuery ? 'No matching customers' : 'Type to search or add new'}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={handleAddNew}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add new customer
              </Button>
            </div>
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
              <div className="border-t border-slate-100 px-2 py-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-start text-slate-600"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAddNew();
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add new customer
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">Customer name</div>
              <Input
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value);
                  setAddError(null);
                }}
                placeholder="Enter customer name"
                className={addError ? 'border-red-500' : ''}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSave()}
              />
              {addError && <div className="mt-1 text-sm text-red-600">{addError}</div>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

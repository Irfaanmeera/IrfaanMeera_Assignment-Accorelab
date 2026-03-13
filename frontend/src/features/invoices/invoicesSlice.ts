import { createAsyncThunk, createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import type { Invoice } from '@/types/invoice.types';
import { toApiError } from '@/api/error';
import { createInvoiceRequest, deleteInvoiceRequest, fetchInvoicesRequest, updateInvoiceRequest } from '@/api/invoiceApi';

export interface InvoicesState {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: InvoicesState = {
  invoices: [],
  total: 0,
  page: 1,
  pageSize: 10,
  status: 'idle',
};

export interface FetchInvoicesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  order?: string;
}

export const fetchInvoices = createAsyncThunk(
  'invoices/fetch',
  async (params: FetchInvoicesParams | void, { rejectWithValue }) => {
    try {
      return await fetchInvoicesRequest(params ?? {});
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (payload: { customerName: string; invoiceDate: string; amount: number }, { rejectWithValue }) => {
    try {
      return await createInvoiceRequest(payload);
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  }
);

export const updateInvoiceRemote = createAsyncThunk(
  'invoices/update',
  async (payload: { id: string; patch: { customerName?: string; invoiceDate?: string; amount?: number } }, { rejectWithValue }) => {
    try {
      return await updateInvoiceRequest(payload.id, payload.patch);
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  }
);

export const deleteInvoiceRemote = createAsyncThunk('invoices/delete', async (id: string, { rejectWithValue }) => {
  try {
    return await deleteInvoiceRequest(id);
  } catch (e) {
    return rejectWithValue(toApiError(e));
  }
});

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
  
    applyPaymentToInvoice: (state, action: PayloadAction<{ invoiceId: string; amount: number }>) => {
      const inv = state.invoices.find((i) => i.id === action.payload.invoiceId);
      if (!inv) return;
      inv.paidAmount = Number(inv.paidAmount) + Number(action.payload.amount);
      inv.balance = Number(inv.amount) - Number(inv.paidAmount);
    },
    upsertInvoice: (state, action: PayloadAction<Invoice>) => {
      const idx = state.invoices.findIndex((x) => x.id === action.payload.id);
      if (idx >= 0) state.invoices[idx] = action.payload;
      else state.invoices.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = 'idle';
        state.invoices = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.invoices.unshift(action.payload);
      })
      .addCase(updateInvoiceRemote.fulfilled, (state, action) => {
        const idx = state.invoices.findIndex((i) => i.id === action.payload.id);
        if (idx >= 0) state.invoices[idx] = action.payload;
      })
      .addCase(deleteInvoiceRemote.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter((i) => i.id !== action.payload);
      })
      .addCase(fetchInvoices.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addMatcher(
        isAnyOf(fetchInvoices.rejected, createInvoice.rejected, updateInvoiceRemote.rejected, deleteInvoiceRemote.rejected),
        (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as { message?: string } | undefined)?.message || action.error.message;
      }
      );
  },
});

export const { applyPaymentToInvoice, upsertInvoice } = invoicesSlice.actions;
export default invoicesSlice.reducer;


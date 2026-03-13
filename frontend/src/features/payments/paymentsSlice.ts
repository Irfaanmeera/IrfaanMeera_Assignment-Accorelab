import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { Payment, PaymentMethod } from '@/types/payment.types';
import { toApiError } from '@/api/error';
import { upsertInvoice } from '@/features/invoices/invoicesSlice';
import { createPaymentRequest, deletePaymentRequest, fetchPaymentsRequest, updatePaymentRequest } from '@/api/paymentApi';

export interface PaymentsState {
  payments: Payment[];
  total: number;
  page: number;
  pageSize: number;
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: PaymentsState = {
  payments: [],
  total: 0,
  page: 1,
  pageSize: 10,
  status: 'idle',
};

export interface FetchPaymentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  order?: string;
}

export const fetchPayments = createAsyncThunk(
  'payments/fetch',
  async (params: FetchPaymentsParams | void, { rejectWithValue }) => {
    try {
      return await fetchPaymentsRequest(params ?? {});
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  }
);

export const createPayment = createAsyncThunk(
  'payments/create',
  async (payload: { paymentDate: string; invoiceId: string; amount: number; method: PaymentMethod }, { dispatch, rejectWithValue }) => {
    try {
      const { payment, invoice } = await createPaymentRequest(payload);
      dispatch(upsertInvoice(invoice));
      return payment;
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  }
);

export const updatePaymentRemote = createAsyncThunk(
  'payments/update',
  async (payload: { id: string; patch: { paymentDate?: string; amount?: number; method?: PaymentMethod } }, { rejectWithValue }) => {
    try {
      return await updatePaymentRequest(payload.id, payload.patch);
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  }
);

export const deletePaymentRemote = createAsyncThunk('payments/delete', async (id: string, { rejectWithValue }) => {
  try {
    return await deletePaymentRequest(id);
  } catch (e) {
    return rejectWithValue(toApiError(e));
  }
});

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    // no local-only update/delete; use thunks for persistence
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.status = 'idle';
        state.payments = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
      state.payments.unshift(action.payload);
    })
      .addCase(updatePaymentRemote.fulfilled, (state, action) => {
        const idx = state.payments.findIndex((p) => p.id === action.payload.id);
        if (idx >= 0) state.payments[idx] = action.payload;
      })
      .addCase(deletePaymentRemote.fulfilled, (state, action) => {
        state.payments = state.payments.filter((p) => p.id !== action.payload);
      })
      .addCase(fetchPayments.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addMatcher(
        isAnyOf(fetchPayments.rejected, createPayment.rejected, updatePaymentRemote.rejected, deletePaymentRemote.rejected),
        (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as { message?: string } | undefined)?.message || action.error.message;
    }
    );
  },
});

export const {} = paymentsSlice.actions;
export default paymentsSlice.reducer;


import { createAsyncThunk, createSlice, isAnyOf, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/user.types';
import { toApiError } from '@/api/error';
import { loginRequest, profileRequest } from '@/api/authApi';

export interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  status: 'idle',
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await loginRequest(payload);
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  }
);

export const loadProfile = createAsyncThunk('auth/loadProfile', async (_, { rejectWithValue }) => {
  try {
    return await profileRequest();
  } catch (e) {
    return rejectWithValue(toApiError(e));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = undefined;
      localStorage.removeItem('token');
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.user = { username: action.payload.user.email, role: action.payload.user.role };
        state.token = action.payload.token;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        const profile = action.payload;
        if (!profile) return;
        state.user = { username: profile.email, role: profile.role };
      })
      .addMatcher(isAnyOf(login.pending, loadProfile.pending), (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addMatcher(isAnyOf(login.rejected, loadProfile.rejected), (state, action) => {
        state.status = 'failed';
        const payload = action.payload as { message?: string } | undefined;
        state.error = payload?.message || action.error.message || 'Request failed';
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;


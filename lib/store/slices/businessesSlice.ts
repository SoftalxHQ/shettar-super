import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface Business {
  id: number;
  name: string;
  business_unique_id?: string;
  category?: string;
  location?: string;
  owner?: {
    name: string;
    email: string;
  };
  revenue?: number;
  reservations?: number;
  rooms?: number;
  verified?: boolean;
  bank_verified?: boolean;
  created_at?: string;
  status?: string;
  withdrawable_balance?: number;
  pending_balance?: number;
}

interface BusinessesState {
  businesses: Business[];
  selectedBusiness: Business | null;
}

const initialState: BusinessesState = {
  businesses: [],
  selectedBusiness: null,
};

const businessesSlice = createSlice({
  name: "businesses",
  initialState,
  reducers: {
    setBusinesses: (state, action: PayloadAction<Business[]>) => {
      state.businesses = action.payload;
    },
    setSelectedBusiness: (state, action: PayloadAction<Business | null>) => {
      state.selectedBusiness = action.payload;
    },
  },
});

export const { setBusinesses, setSelectedBusiness } = businessesSlice.actions;
export const selectBusinesses = (state: RootState) =>
  state.businesses.businesses;
export const selectSelectedBusiness = (state: RootState) =>
  state.businesses.selectedBusiness;
export default businessesSlice.reducer;

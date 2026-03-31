import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface SupportTicket {
  id: number;
  ticket_id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  business?: string;
  business_id?: string;
  description?: string;
  assigned_to?: string | null;
  last_updated?: string;
}

interface SupportTicketsState {
  tickets: SupportTicket[];
  selectedTicket: SupportTicket | null;
}

const initialState: SupportTicketsState = {
  tickets: [],
  selectedTicket: null,
};

const supportTicketsSlice = createSlice({
  name: "supportTickets",
  initialState,
  reducers: {
    setTickets: (state, action: PayloadAction<SupportTicket[]>) => {
      state.tickets = action.payload;
    },
    setSelectedTicket: (state, action: PayloadAction<SupportTicket | null>) => {
      state.selectedTicket = action.payload;
    },
  },
});

export const { setTickets, setSelectedTicket } = supportTicketsSlice.actions;
export const selectTickets = (state: RootState) => state.supportTickets.tickets;
export const selectSelectedTicket = (state: RootState) =>
  state.supportTickets.selectedTicket;
export default supportTicketsSlice.reducer;

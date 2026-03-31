import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface User {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  businesses?: string[];
  status?: string;
  joined?: string;
  last_login?: string;
  total_bookings?: number;
}

interface UsersState {
  users: User[];
  selectedUser: User | null;
}

const initialState: UsersState = {
  users: [],
  selectedUser: null,
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
  },
});

export const { setUsers, setSelectedUser } = usersSlice.actions;
export const selectUsers = (state: RootState) => state.users.users;
export const selectSelectedUser = (state: RootState) =>
  state.users.selectedUser;
export default usersSlice.reducer;

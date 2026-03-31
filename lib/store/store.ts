import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./slices/authSlice";
import usersReducer from "./slices/usersSlice";
import businessesReducer from "./slices/businessesSlice";
import notificationsReducer from "./slices/notificationsSlice";
import supportTicketsReducer from "./slices/supportTicketsSlice";
import { apiService } from "./services/api";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist auth slice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError: (err: any) => {
    if (process.env.NODE_ENV === "development") {
      console.error("Redux persist rehydration error:", err);
    }
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  businesses: businessesReducer,
  notifications: notificationsReducer,
  supportTickets: supportTicketsReducer,
  [apiService.reducerPath]: apiService.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiService.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

// TypeScript types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

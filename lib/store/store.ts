import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createTransform,
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
import "./services/marketer-agency-api";

const stripAuthJwt = createTransform(
  (inboundState: { token?: unknown }) => {
    if (!inboundState || typeof inboundState !== "object") return inboundState;
    const { token: _token, ...rest } = inboundState;
    return rest;
  },
  (outboundState: object) => ({
    ...outboundState,
    token: null,
  }),
  { whitelist: ["auth"] },
);

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
  // Nested `blacklist: ["token"]` is not enough at root; strip JWT from the auth slice.
  transforms: [stripAuthJwt],
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

// Infer from the unpersisted reducer so slice keys are not Partial (persist wraps them).
export type RootState = ReturnType<typeof rootReducer>;

// redux-persist + JWT strip transform widens PreloadedState; cast keeps RootState clean.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const persistedReducer = persistReducer(persistConfig, rootReducer as any) as typeof rootReducer;

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

export type AppDispatch = typeof store.dispatch;

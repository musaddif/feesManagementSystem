import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlices";
import commonReducer from "./slices/commonSlices";
import amountReducer from "./slices/amountSlice";

const persistAuth = {
  key: "auth",
  storage,
};
const persistCommon = {
  key: "common",
  storage,
};
const persistAmount = {
  key: "amount",
  storage,
};

const persistAuthReducer = persistReducer(persistAuth, authReducer);
const persistCommonReducer = persistReducer(persistCommon, commonReducer);
const persistAmountReducer = persistReducer(persistAmount, amountReducer);

const store = configureStore({
  reducer: {
    auth: persistAuthReducer,
    common: persistCommonReducer,
    amount: persistAmountReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);
export { store, persistor };

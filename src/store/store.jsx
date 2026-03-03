import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./slices/authSlices";
import commonReducer from "./slices/commonSlices";

const persistAuth = {
  key: "auth",
  storage,
};
const persistCommon = {
  key: "common",
  storage,
};

const persistAuthReducer = persistReducer(persistAuth, authReducer);
const persistCommonReducer = persistReducer(persistCommon, commonReducer);

const store = configureStore({
  reducer: {
    auth: persistAuthReducer,
    common: persistCommonReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);
export { store, persistor };

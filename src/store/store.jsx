import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { authSlice } from "./slices/AuthSlices";



const persistAuth ={
    key:"auth",
    storage
}
const persistCommon ={
    key :"common",
    storage
}

const persistAuthReducer = persistReducer(persistAuth,authSlice)
// const persistCommonReducer = persistReducer(persistCommon,commonSlice)
const store = configureStore({
    reducer:{
        auth: persistAuthReducer
    },
    middleware:()=>getDefaultMiddleware({
        serializableCheck: false,
    })
})

const persistor = persistStore(store)
export {persistor,store};

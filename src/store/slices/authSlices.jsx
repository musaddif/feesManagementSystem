import { createSlice } from "@reduxjs/toolkit";
initialState ={}
export const authSlice = createSlice({
    name:"authUser",
    initialState,
    reducer:{
        getLogIn:(state,action)=>({})
    }
})


export const {getLogIn} = authSlice.actions;
export default authSlice.reducer


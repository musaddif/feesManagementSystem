import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";



export const test = createAsyncThunk (
    "test",async (_request,{dispatch})=>{
        try{
            const response = await axios.get('/room')
            console.log('BE resposev = ',response);
            
        }
        catch(err){console.log('error',err);
        }
    }
)

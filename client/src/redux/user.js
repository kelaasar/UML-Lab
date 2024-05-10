import {createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice ({
    name: "user",
    initialState: {
        uid: null
    },
    reducers: {
        login: (state, data) => {
            state.uid = data.payload;
        },
        logout: (state) => {
            state.uid = null;
        }
    }
});

export const {login, logout} = userSlice.actions;
export default userSlice.reducer;
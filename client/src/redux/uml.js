import {createSlice } from '@reduxjs/toolkit';

export const umlSlice = createSlice ({
    name: "uml",
    initialState: {
        uml_id: null
    },
    reducers: {
        setUML: (state, data) => {
            state.uml_id = data.payload;
        },
        removeUML: (state) => {
            state.uml_id = null;
        }
    }
});

export const {setUML, removeUML} = umlSlice.actions;
export default umlSlice.reducer;
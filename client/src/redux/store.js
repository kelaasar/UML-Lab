import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user';
import umlReducer from './uml';

export default configureStore({
	reducer: {
        user: userReducer,
        uml: umlReducer
    }
});
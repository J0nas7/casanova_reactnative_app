// External
import { configureStore } from '@reduxjs/toolkit'

// Internal
import authReducer from './slices/authSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer
    }
})

// Export the RootState type for use in components
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

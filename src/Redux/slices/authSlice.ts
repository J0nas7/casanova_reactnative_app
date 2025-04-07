import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { User } from '@/src/Types';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type MainViewJumbotronType = {
    faIcon?: IconDefinition;
    htmlIcon?: string;
    title: string;
    iconAction?: Function,
    visibility: number;
}

interface AuthState {
    isLoggedIn: boolean | undefined;
    authUser: User | undefined;
    accessToken: string;
    refreshToken: string;
    mainViewJumbotron: MainViewJumbotronType
}

const initialState: AuthState = {
    isLoggedIn: undefined,
    authUser: undefined,
    accessToken: '',
    refreshToken: '',
    mainViewJumbotron: { title: 'CasaNova', visibility: 100 }
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setIsLoggedIn: (state, action: PayloadAction<boolean>) => {
            state.isLoggedIn = action.payload
        },
        setAuthUser: (state, action: PayloadAction<any>) => {
            state.authUser = action.payload
        },
        setAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload
        },
        setRefreshToken: (state, action: PayloadAction<string>) => {
            state.refreshToken = action.payload
        },
        setMainViewJumbotron: (state, action: PayloadAction<MainViewJumbotronType>) => {
            const { visibility } = action.payload;
            if (visibility < 0) {
                action.payload.visibility = 0
            } else if (visibility > 100) {
                action.payload.visibility = 100
            }

            state.mainViewJumbotron = action.payload;
        }
    },
})

// Export actions and reducer
export const {
    setIsLoggedIn,
    setAuthUser,
    setAccessToken,
    setRefreshToken,
    setMainViewJumbotron
} = authSlice.actions

export default authSlice.reducer

export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn
export const selectAuthUser = (state: RootState) => state.auth.authUser
export const selectAccessToken = (state: RootState) => state.auth.accessToken
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken
export const selectMainViewJumbotron = (state: RootState) => state.auth.mainViewJumbotron

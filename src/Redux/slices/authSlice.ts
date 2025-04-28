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
    userId: number | undefined;
    accessToken: string;
    refreshToken: string;
    mainViewJumbotron: MainViewJumbotronType;
    appErrorMsg: string | undefined;
}

const initialState: AuthState = {
    isLoggedIn: undefined,
    authUser: undefined,
    userId: undefined,
    accessToken: '',
    refreshToken: '',
    mainViewJumbotron: { title: 'CasaNova', visibility: 100 },
    appErrorMsg: undefined,
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
        setUserId: (state, action: PayloadAction<any>) => {
            state.userId = action.payload
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
        },
        setAppErrorMsg: (state, action: PayloadAction<string | undefined>) => {
            state.appErrorMsg = action.payload
        },
    },
})

// Export actions and reducer
export const {
    setIsLoggedIn,
    setAuthUser,
    setUserId,
    setAccessToken,
    setRefreshToken,
    setMainViewJumbotron,
    setAppErrorMsg
} = authSlice.actions

export default authSlice.reducer

export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn
export const selectAuthUser = (state: RootState) => state.auth.authUser
export const selectUserId = (state: RootState) => state.auth.userId
export const selectAccessToken = (state: RootState) => state.auth.accessToken
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken
export const selectMainViewJumbotron = (state: RootState) => state.auth.mainViewJumbotron
export const selectAppErrorMsg = (state: RootState) => state.auth.appErrorMsg

// External
import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { useNavigation } from "@react-navigation/native"

// Internal
import { useAxios, useStorage } from './'
import { apiResponseDTO, User } from "@/src/Types"
import {
    setIsLoggedIn,
    setAccessToken,
    setAuthUser,
    AppDispatch,
    useAuthActions,
    setUserId,
} from '@/src/Redux'
import { StackNavigationProp } from "@react-navigation/stack"
import { RootStackParamList } from "../Views"

export const useAuth = () => {
    const { httpPostWithData } = useAxios()
    const { fetchIsLoggedInStatus } = useAuthActions()
    const { setItem, deleteItem, getItem } = useStorage();

    const dispatch = useDispatch<AppDispatch>()
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [errorMsg, setErrorMsg] = useState<string>('')
    const [status, setStatus] = useState<string>('')

    const saveLoginSuccess = async (loginData: any) => {
        const newAccessToken = loginData.accessToken
        const newAuthUser: User = loginData.user

        console.log("saveLoginSuccess", newAccessToken, newAuthUser)
        await setItem("accessToken", newAccessToken)
        await setItem("userId", (newAuthUser.User_ID ?? "0").toString())

        dispatch(setAccessToken(newAccessToken))
        dispatch(setIsLoggedIn(true))
        dispatch(setAuthUser(newAuthUser))
        dispatch(setUserId((newAuthUser.User_ID ?? "0").toString()))

        navigation.navigate("Home")  // Assuming "Home" is the screen name after login
        return true
    }

    const processResult = (fromAction: string, theResult: apiResponseDTO) => {
        if (fromAction !== 'login') return false

        setStatus('resolved')

        if (theResult.success === true) {
            console.log("User logged in:", theResult.data)
            return saveLoginSuccess(theResult.data)
        }

        console.log("Login failed", theResult)
        setErrorMsg(theResult.message || "Login failed.")
        return false
    }

    const handleLoginSubmit = async (emailInput: string, passwordInput: string): Promise<boolean> => {
        setStatus('resolving')
        let errorData: apiResponseDTO
        let error = false

        if (!emailInput || !passwordInput) {
            errorData = {
                success: false,
                message: "Missing necessary credentials.",
                data: false,
            }
            error = true
        }

        const loginVariables = {
            User_Email: emailInput,
            password: passwordInput,
        }

        try {
            if (!error) {
                const data = await httpPostWithData("auth/login", loginVariables)
                return processResult("login", data)
            }
        } catch (e) {
            console.log("useAuth login error", e)
            errorData = {
                success: false,
                message: "Login failed. Try again.",
                data: false,
            }
            error = true
        }

        processResult("login", errorData!)
        return false
    }

    const handleLogoutSubmit = async () => {
        // Clear user data
        await deleteItem("accessToken")
        dispatch(setAccessToken(""))
        dispatch(setIsLoggedIn(false))
        dispatch(setAuthUser(undefined))
        dispatch(setUserId(undefined))
        navigation.navigate("Login")  // Navigate to sign-in screen after logout
    }

    // Check if the user is logged in when the app starts
    useEffect(() => {
        const checkLoginStatus = async () => {
            const accessToken = await getItem("accessToken")
            const userId = await getItem("userId")
            if (accessToken && userId) {
                dispatch(setAccessToken(accessToken))
                dispatch(setIsLoggedIn(true))
                dispatch(setUserId(userId))
                dispatch(fetchIsLoggedInStatus())
            } else {
                dispatch(setAccessToken(""))
                dispatch(setIsLoggedIn(false))
                dispatch(setUserId(undefined))
            }
        }

        checkLoginStatus()
    }, [dispatch])

    return {
        saveLoginSuccess,
        handleLoginSubmit,
        handleLogoutSubmit,
        errorMsg,
        status,
    }
}

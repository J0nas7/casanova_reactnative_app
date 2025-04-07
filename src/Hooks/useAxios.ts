// External
import axios, { AxiosRequestConfig } from 'axios'

// Internal
import { env, paths } from '@/src/env'
//import { useAuthContext, useCookie } from './'
import { axiosHeaders, postContent } from '@/src/Types'
import { useStorage } from './'

export const useAxios = () => {
    // Hooks
    const { getItem, deleteItem } = useStorage()
    //const { getCurrentToken, getAuthContext, doLogout } = useAuthContext()

    // Redux (This function is not supported in React Server Components. Please only use this export in a Client Component.)
    // const accessToken = useTypedSelector(selectAccessToken)

    // Axios stuff
    axios.defaults.withCredentials = true

    type ErrorProps = {
        errorContext: any
        actionType: string
        apiEndPoint: string
        tokenName: string
        postContent?: postContent
    }

    /**
     * Perform an asynchronous HTTP action (GET, POST, PUT, DELETE) using Axios.
     * @param {string} actionType - The type of HTTP action (get, post, put, delete).
     * @param {string} apiEndPoint - The API endpoint to interact with.
     * @param {string} tokenName - The name of the token to include in the request headers.
     * @param {postContent} postContent - The optional content to include in POST or PUT requests.
     */
    const axiosAction = async (actionType: string, apiEndPoint: string, tokenName: string, postContent?: postContent) => {
        // console.log("axiosAction", actionType, apiEndPoint)

        //console.log("API: "+apiEndPoint, postContent)
        //console.log("axios", theSpace, getCurrentToken("accessToken")!.slice(0, 5))
        let accessToken = await getItem("accessToken")
        let axiosUrl = `${env.url.API_URL + paths.API_ROUTE + apiEndPoint}`
        let headers: axiosHeaders = {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`//+getCurrentToken(tokenName)
        }
        let config: AxiosRequestConfig = {
            withCredentials: true,
            headers: headers,
        }

        // Check if postContent contains a file (e.g., image file) and use FormData if it does
        let dataToSend: any = postContent;

        if (postContent && (Object.values(postContent).some((value) => value instanceof File || Array.isArray(value)))) {
            const formData = new FormData();
            for (const key in postContent) {
                if (key === "images" && Array.isArray(postContent[key])) {
                    // Append each image separately under the same key
                    postContent[key].forEach((file) => {
                        formData.append("images[]", file);
                    });
                } else {
                    let value = postContent[key];

                    // Convert "true", "false" and "null" strings to actual types
                    if (value === "true") value = true;
                    if (value === "false") value = false;
                    if (value === "null") value = null;

                    // Convert actual types to JSON string, so the backend can properly interpret them
                    if (
                        typeof value === "boolean" 
                        || value === null 
                        // || Array.isArray(value)
                    ) value = JSON.stringify(value)

                    formData.append(key, value);
                }
            }
            console.log("formData", formData)
            dataToSend = formData;
            // Adjust headers for file upload
            if (config.headers) config.headers['Content-Type'] = 'multipart/form-data';
        } else {
            dataToSend = postContent
            // Otherwise, stringify postContent for non-file data
            // dataToSend = { postContent: JSON.stringify(postContent) };
        }

        try {
            if (actionType === "get") {
                // Perform a HTTP GET request
                const { data: response } = await axios.get(axiosUrl, config)
                return response
            } else if (actionType === "post") {
                // Perform a HTTP POST request
                const { data: response } = await axios.post(axiosUrl, dataToSend, config)
                return response
            } else if (actionType === "put") {
                // Perform a HTTP PUT request
                const { data: response } = await axios.put(axiosUrl, dataToSend, config)
                return response
            } else if (actionType === "delete") {
                // Perform a HTTP DELETE request
                const { data: response } = await axios.delete(axiosUrl, config)
                return response
            }
        } catch (error: unknown) {
            // Handle errors, log them, and return the error object
            console.log(`axiosAction ${actionType.toUpperCase()} error`, error)
            return error
        }
    }

    const refreshJWTAndTryAgain = async ({ errorContext, actionType, apiEndPoint, tokenName, postContent }: ErrorProps) => {
        // If need for JWT refresh token
        let newE
        if (errorContext.response &&
            (errorContext.response.data.error === "UserOnly Unauthorized" ||
                errorContext.response.data.message === "Token has expired")
        ) {
            try {
                // Request a new JWT access token
                /*const getToken = await axiosAction("get", "refreshJWT", "refreshToken")
                const newToken = getToken.authorisation?.newAccessToken
                if (newToken) {
                    // Re-try original axios request with new token
                    try {
                        //setTheCookie("accessToken", newToken)
                        const { data: tryAgain } = await axiosAction(actionType, apiEndPoint, newToken, postContent)
                        console.log("useAxios refreshJWTAndTryAgain() success", tryAgain)
                        return tryAgain
                    } catch (e: unknown) {
                        newE = e
                        console.log("tryAgain E", e)
                    }
                } else {*/
                return false
                //}
            } catch (e: unknown) {
                newE = e
                console.log("getToken E", e)
            }
        }

        return newE
    }

    const handleError = async ({ errorContext, actionType, apiEndPoint, tokenName, postContent }: ErrorProps) => {
        if (errorContext.response) console.log(actionType + " send", errorContext)

        if (errorContext.response?.data?.error && tokenName === "accessToken") {
            const refreshProps = { errorContext, actionType, apiEndPoint, tokenName, postContent }
            //const send = await refreshJWTAndTryAgain(refreshProps)

            /*console.log("handleError send", send)
            if (send.response?.data || !send) {
                if (getAuthContext("accessToken")) {
                    alert("Your login session has expired. You will be logged out.")
                }*/
            deleteItem("accessToken")
            return false
            // }
            // return send
        }
    }

    const httpPostWithData = async (apiEndPoint: string, postContent?: postContent, tokenName: string = 'accessToken') => {
        const actionType = "post"
        let send = await axiosAction(actionType, apiEndPoint, tokenName, postContent)

        if (send.response?.data?.error && tokenName === "accessToken") {
            const errorContext = send
            const errorProps = { errorContext, actionType, apiEndPoint, tokenName, postContent }
            send = await handleError(errorProps)

            if (send.response?.data || !send) return false
        }
        return send
    }

    const httpPutWithData = async (apiEndPoint: string, putContent?: postContent, tokenName: string = 'accessToken') => {
        const actionType = "put"
        let send = await axiosAction(actionType, apiEndPoint, tokenName, putContent)

        if (send.response?.data?.error && tokenName === "accessToken") {
            const errorContext = send
            const errorProps = { errorContext, actionType, apiEndPoint, tokenName, putContent }
            send = await handleError(errorProps)

            if (send.response?.data || !send) return false
        }
        return send
    }

    const httpGetRequest = async (apiEndPoint: string, tokenName: string = 'accessToken') => {
        const actionType = "get"
        let send = await axiosAction(actionType, apiEndPoint, tokenName)

        if (send.response?.data?.error && tokenName === "accessToken") {
            const errorContext = send
            const errorProps = { errorContext, actionType, apiEndPoint, tokenName }
            send = await handleError(errorProps)

            if (send.response?.data || !send) return false
        }
        return send
    }

    const httpDeleteRequest = async (apiEndPoint: string, tokenName: string = 'accessToken') => {
        const actionType = 'delete'
        let send = await axiosAction(actionType, apiEndPoint, tokenName)

        if (send.response?.data?.error && tokenName === 'accessToken') {
            const errorContext = send
            const errorProps = { errorContext, actionType, apiEndPoint, tokenName }
            send = await handleError(errorProps)

            if (send.response?.data || !send) return false
        }
        return send
    }
    
    return {
        httpPostWithData,
        httpPutWithData,
        httpGetRequest,
        httpDeleteRequest
    }
}
// External
import { Dispatch } from 'redux';
import NetInfo from "@react-native-community/netinfo";

// Internal
import { setAuthUser, setIsLoggedIn } from '../slices/authSlice';
import { useStorage, useAxios } from '@/src/Hooks';

export const useAuthActions = () => {
    const { httpGetRequest } = useAxios();
    const { getItem, deleteItem } = useStorage();

    /**
     * @returns {Function} An asynchronous function to be dispatched, which updates the logged-in status.
     * 
     * @remarks
     * - Makes a GET request to the `auth/me` endpoint.
     * - If the server indicates the user is logged in:
     *   - Dispatches an action to update the `isLoggedIn` state to `true`.
     *   - Dispatches an action to update the authenticated user's details in the store.
     * - Logs any errors encountered during the request.
     */
    // Fetches the user's logged-in status from the server and updates the Redux store accordingly.
    const fetchIsLoggedInStatus = () => async (dispatch: Dispatch) => {
        try {
            const data = await httpGetRequest('auth/me');
            
            if (
                data &&
                data.userData &&
                data.message === 'Is logged in'
            ) {
                // Update the Redux store with the user's logged-in status and details
                dispatch(setIsLoggedIn(true));
                dispatch(setAuthUser(data.userData));
            } else if (data.error === 'Not authenticated') {
                // Handle user not logged in (clear stored tokens)
                await deleteItem('accessToken'); // Remove token from AsyncStorage
                dispatch(setIsLoggedIn(false));
            }
        } catch (e) {
            console.error('fetchIsLoggedInStatus', e);
        }
    };

    return {
        fetchIsLoggedInStatus,
    };
};

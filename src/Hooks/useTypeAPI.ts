// External
import React from "react";

// Internal
import { useAxios } from "./useAxios"; // Assuming you have a custom hook for Axios requests
import { Alert } from "react-native";

interface APIResponse<T> {
    data: T;
    message?: string;
}

// Define the ID field constraint with a dynamic key
type HasIDField<T, IDKey extends string> = T & {
    [key in IDKey]: number; // Define the dynamic ID field based on the resource
};

// A generic hook for handling API operations on different resources
export const useTypeAPI = <T extends { [key: string]: any }, IDKey extends keyof T>(
    resource: string,
    idFieldName: IDKey,
    parentResource: string
) => {
    // Hooks
    const { httpGetRequest, httpPostWithData, httpPutWithData, httpDeleteRequest } = useAxios()

    // Fetch items (R in CRUD)
    const fetchItems = async () => {
        try {
            const data = await httpGetRequest(`${resource}`);
            console.log(`fetchItems ${resource}`, data)

            if (data) return data

            throw new Error(`Failed to fetchItems ${resource}`);
        } catch (error: any) {
            console.log(error.message || `An error occurred while fetching ${resource}.`);
            return false;
        }
    };

    // Fetch items by parent ID (R in CRUD)
    const fetchItemsByParent = async (parentId: number) => {
        try {
            // : APIResponse<T[]>
            const data = await httpGetRequest(`${parentResource}/${parentId}/${resource}`);
            console.log(`fetchItemsByParent: ${parentResource}/${parentId}/${resource}`, data)

            if (data) return data

            throw new Error(`Failed to fetchItemsByParent ${resource}`);
        } catch (error: any) {
            console.log(error.message || `An error occurred while fetching ${parentResource}.`);
            return false;
        }
    };

    // Fetch a single item (R in CRUD)
    const fetchItem = async (itemId: number) => {
        try {
            // : APIResponse<T>
            const response = await httpGetRequest(`${resource}/${itemId}`)
            // console.log(`fetch${resource}`, response)

            if (!response.message || (response.message && response.success)) return response

            throw new Error(`Failed to fetchItem ${resource}`);
        } catch (error: any) {
            console.log(error.message || `An error occurred while fetching the ${resource}.`);
            return false;
        }
    };

    // Create a new item (C in CRUD)
    const postItem = async (newItem: Omit<T, IDKey>) => {
        try {
            const response: APIResponse<T> = await httpPostWithData(resource, newItem);

            console.log(`${resource} postItem`, response)
            if (response) return true

            throw new Error(`Failed to add ${resource}`);
        } catch (error: any) {
            console.log(error.message || `An error occurred while adding the ${resource}.`);
            return false;
        }
    };

    // Update an existing item (U in CRUD)
    const updateItem = async (updatedItem: T) => {
        try {
            const response: APIResponse<T> = await httpPutWithData(`${resource}/${updatedItem[idFieldName]}`, updatedItem);

            console.log("updateItem", response)
            if (!response.message) return true;

            console.log(`${resource} updateItem failed`, response)
            throw new Error(`Failed to update ${resource}`);
        } catch (error: any) {
            console.log(error.message || `An error occurred while updating the ${resource}.`);
            return false;
        }
    };

    // Delete an item (D in CRUD)
    const deleteItem = async (itemId: number): Promise<boolean> => {
        let singular = resource
        if (resource.endsWith("s")) singular = resource.slice(0, -1)

        return new Promise((resolve) => {
            Alert.alert(
                `Delete ${singular}`,
                `Are you sure you want to delete this ${singular}?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => resolve(false),
                    },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                            // Now we handle the async logic separately
                            (async () => {
                                try {
                                    const response = await httpDeleteRequest(`${resource}/${itemId}`);
                                    if (!response.message) {
                                        throw new Error(`Failed to delete ${resource}`);
                                    }
                                    resolve(true);
                                } catch (error: any) {
                                    console.log(error.message || `An error occurred while deleting the ${resource}.`);
                                    resolve(false);
                                }
                            })();
                        },
                    },
                ],
                { cancelable: true }
            );
        });
    };

    return {
        fetchItems,
        fetchItemsByParent,
        fetchItem,
        postItem,
        updateItem,
        deleteItem,
    };
};

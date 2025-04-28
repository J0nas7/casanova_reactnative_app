// External
import React, { useState } from "react"
import { useDispatch } from "react-redux"

// Internal
import { useTypeAPI } from "@/src/Hooks"
import { AppDispatch, setAppErrorMsg } from "../Redux"

// Generic context and provider to handle different resources like teams, tasks, organisations, etc.
export const useResourceContext = <T extends { [key: string]: any }, IDKey extends keyof T>(
    resource: string,
    idFieldName: IDKey,
    parentResource: string,
    parentIdFieldName: string | string[],
    parentRelation: string | undefined,
    singularKeys: {
        [key: string]: { join: string; on: string };
    } | undefined
) => {
    const {
        getItemsFromSQLite,
        getItemsByIdFromSQLite,
        getItemFromSQLite,
        upsertItemsToSQLite,
        fetchItems,
        fetchItemsByParent,
        fetchItem,
        postItem,
        updateItem,
        deleteItem,
        //setupTables,
        executeSql,
        isOnline
    } = useTypeAPI<T, IDKey>(resource, idFieldName, parentResource)

    const dispatch = useDispatch<AppDispatch>()

    // React.useEffect(() => {
    //     const initializeTables = async () => {
    //         await setupTables();
    //     };
    //     initializeTables();
    // }, []);

    const [items, setItems] = useState<T[]>([])
    const [itemsById, setItemsById] = useState<T[]>([])
    const [itemById, setItemById] = useState<T | undefined | false>(undefined)
    const [newItem, setNewItem] = useState<T | undefined>(undefined)
    const [itemDetail, setItemDetail] = useState<T | undefined>(undefined)

    // Reads items from SQLite first, then tries to sync with the API if online
    const readItems = async (refresh?: boolean) => {
        if (refresh) setItems([])

        // 1. Always read from SQLite first
        const localData = await getItemsFromSQLite()
        if (localData) setItems(localData)

        // 2. Try syncing from API if online
        if (!await isOnline()) {
            dispatch(setAppErrorMsg("You don't have an internet connection."))
        } else {
            try {
                const remoteData = await fetchItems()
                if (remoteData.message == "Network Error") {
                    console.warn(`[${resource}][readItems] Remote data is not an array`, typeof remoteData, JSON.stringify(remoteData));
                    dispatch(setAppErrorMsg("Could not sync with server."))
                } else {
                    let upsertData: any
                    if (Array.isArray(remoteData)) {
                        upsertData = remoteData
                    } else if (typeof remoteData === "object") {
                        upsertData = [remoteData]
                    }
                    // console.log("Remote data:", remoteData)
                    await upsertItemsToSQLite(upsertData, singularKeys);
                    const updatedLocal = await getItemsFromSQLite();
                    setItems(updatedLocal);
                }
            } catch (error) {
                console.warn(`[${resource}] Sync failed, using offline data`, error)
            }
        }
    }

    // Reads items by parent ID from SQLite first, then tries to sync with the API if online
    const readItemsById = async (parentId: number, refresh?: boolean) => {
        if (refresh) setItemsById([])

        // 1. Always read from SQLite first
        const localData = await getItemsByIdFromSQLite(parentIdFieldName, parentId, parentRelation, singularKeys)
        console.log("Local data:", localData)
        if (localData) setItemsById(localData)

        // 2. Try syncing from API if online
        if (!await isOnline()) {
            dispatch(setAppErrorMsg("You don't have an internet connection."))
        } else {
            try {
                const remoteData = await fetchItemsByParent(parentId) // Fetch all items by parentId
                if (remoteData.message == "Network Error") {
                    console.warn(`[${resource}][readItemsById] Remote data is not an array`, typeof remoteData, JSON.stringify(remoteData));
                    dispatch(setAppErrorMsg("Could not sync with server."))
                } else {
                    let upsertData: any
                    if (Array.isArray(remoteData)) {
                        upsertData = remoteData
                    } else if (typeof remoteData === "object") {
                        upsertData = [...remoteData]
                    }
                    console.log("remoteItem size:", upsertData.length)

                    for (const item of upsertData) {
                        console.log(`remoteItem ${item.Property_ID}/${item.property.Property_ID}`);
                    }
                    // console.log("Remote data:", remoteData)
                    await upsertItemsToSQLite(upsertData, singularKeys);
                    const updatedLocal = await getItemsByIdFromSQLite(parentIdFieldName, parentId, parentRelation, singularKeys)
                    
                    console.log("Updated local messages:", resource, updatedLocal.length, updatedLocal)
                    
                    // console.log("Updated local data:", updatedLocal)
                    setItemsById(updatedLocal);
                }
            } catch (error) {
                console.warn(`[${resource}] Sync failed, using offline data`, error)
            }
        }
    }

    // Reads item by ID from SQLite first, then tries to sync with the API if online
    const readItemById = async (itemId: number) => {
        // 1. Always read from SQLite first
        const localData = await getItemFromSQLite(itemId) // Fetch item by id
        if (localData) setItemById(localData ? localData : false)

        // 2. Try syncing from API if online
        if (!await isOnline()) {
            dispatch(setAppErrorMsg("You don't have an internet connection."))
        } else {
            try {
                const remoteData = await fetchItem(itemId) // Fetch item by id
                if (remoteData.message == "Network Error") {
                    console.warn(`[${resource}][readItemById] Remote data is not an array`, typeof remoteData, JSON.stringify(remoteData))
                    dispatch(setAppErrorMsg("Could not sync with server."))
                } else {
                    let upsertData: any
                    if (Array.isArray(remoteData)) {
                        upsertData = remoteData
                    } else if (typeof remoteData === "object") {
                        upsertData = [remoteData]
                    }
                    // console.log("Remote data:", remoteData)
                    await upsertItemsToSQLite(upsertData, singularKeys);
                    const updatedLocal = await getItemFromSQLite(itemId) // Fetch item by id;
                    setItemById(updatedLocal ? updatedLocal : false)
                }
            } catch (error) {
                console.warn(`[${resource}] Sync failed, using offline data`, error)
            }
        }
    }

    const addItem = async (parentId: number, object?: T) => {
        if (newItem || object) {
            const createdItem = await postItem(object || newItem!)
            if (createdItem) {
                const data = await fetchItemsByParent(parentId) // Refresh items from API
                if (data) {
                    setItemsById(data)
                    setNewItem(undefined)
                }
            }
        }
    }

    const handleChangeNewItem = async (field: keyof T, value: string, object?: T) => {
        if (object) {
            setNewItem((prevState) => ({
                ...prevState,
                ...object
            } as T))
        } else {
            setNewItem((prevState) => ({
                ...prevState,
                [field]: value,
            } as T))
        }
    }

    const saveItemChanges = async (itemChanges: T, parentId: number) => {
        const updatedItem = await updateItem(itemChanges)
        if (updatedItem) {
            const data = await fetchItemsByParent(parentId) // Refresh items from API
            if (data) {
                setItemsById(data)
            }
        }
    }

    const removeItem = async (itemId: number, parentId: number) => {
        const success = await deleteItem(itemId)
        if (success) {
            const data = await fetchItemsByParent(parentId) // Refresh items after deletion
            if (data) setItemsById(data)
        }
        return success
    }

    return {
        // loading,
        // error,
        items,
        itemsById,
        itemById,
        newItem,
        itemDetail,
        setItemDetail,
        handleChangeNewItem,
        readItems,
        readItemsById,
        readItemById,
        addItem,
        saveItemChanges,
        removeItem,
        executeSql
    }
}

//// REST OF FILE IS DEPRECATED
// Generic Provider for any resource
/*export const ResourceProvider = <T extends { [key: string]: any }, IDKey extends keyof T>({
    resource,
    idFieldName,
    children,
}: {
    resource: string
    idFieldName: IDKey
    children: React.ReactNode
}) => {
    const resourceContext = useResourceContext<T, IDKey>(resource, idFieldName, "")

    return <ResourceContext.Provider value={resourceContext}>{children}</ResourceContext.Provider>
}*/

// Create a context for any resource
//export const ResourceContext = createContext<any>(undefined)

// Custom hook to use resource context
/*export const useResource = () => {
    const context = useContext(ResourceContext)
    if (!context) {
        throw new Error("useResource must be used within a ResourceProvider")
    }
    return context
}*/

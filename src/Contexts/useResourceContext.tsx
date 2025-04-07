// External
import React, { useState } from "react"

// Internal
import { useTypeAPI } from "@/src/Hooks"

// Generic context and provider to handle different resources like teams, tasks, organisations, etc.
export const useResourceContext = <T extends { [key: string]: any }, IDKey extends keyof T>(
    resource: string,
    idFieldName: IDKey,
    parentResource: string
) => {
    const { fetchItems, fetchItemsByParent, fetchItem, postItem, updateItem, deleteItem } = useTypeAPI<T, IDKey>(resource, idFieldName, parentResource)

    const [items, setItems] = useState<T[]>([])
    const [itemsById, setItemsById] = useState<T[]>([])
    const [itemById, setItemById] = useState<T | undefined | false>(undefined)
    const [newItem, setNewItem] = useState<T | undefined>(undefined)
    const [itemDetail, setItemDetail] = useState<T | undefined>(undefined)

    const readItems = async (refresh?: boolean) => {
        if (refresh) setItems([])

        const data = await fetchItems() // Fetch all items
        console.log("readItems", data)
        if (data) setItems(data)
    }

    const readItemsById = async (parentId: number, refresh?: boolean) => {
        if (refresh) setItemsById([])

        const data = await fetchItemsByParent(parentId) // Fetch all items by parentId
        console.log("readItemsById", data)
        if (data) setItemsById(data)
    }

    const readItemById = async (itemId: number) => {
        const data = await fetchItem(itemId) // Fetch item by id

        setItemById(data ? data : false)
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

// External
import React from "react";
import SQLite, { SQLiteDatabase, ResultSet, Transaction, SQLError, openDatabase } from 'react-native-sqlite-storage';
import NetInfo from "@react-native-community/netinfo";

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
    
    const dbPromise: Promise<SQLiteDatabase> = new Promise((resolve, reject) => {
        const db = SQLite.openDatabase(
            {
                name: 'myapp.db',
                location: 'default',
            },
            () => resolve(db),
            (error) => {
                console.error("Failed to open DB", error);
                reject(error);
            }
        );
    });

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
    
    const getItemsFromSQLite = async (
        otherResource?: string,
        parentKey?: string,
        parentValue?: string
    ): Promise<T[]> => {
        try {
            // Construct base query
            let query = `SELECT * FROM ${otherResource ?? resource}`;
            if (otherResource && parentKey && parentValue) {
                query += ` WHERE ${parentKey} = ${parentValue}`;
            }

            // Execute query
            const results = await executeSql(query); // Abstracted SQLite call
            const items = results.rows.raw() || [];
            console.log(`getItemsFromSQLite ${otherResource ?? resource}`, items);

            // If fetching another resource, return directly
            if (otherResource) return items;

            // Process items and relationships
            const itemsWithRelations = await processItemsWithRelations(items);

            console.log("itemsWithRelations0", itemsWithRelations[0]);
            return itemsWithRelations;

        } catch (error: any) {
            console.error(`Failed to getItemsFromSQLite for ${resource}`, error);
            return [];
        }
    };

    // Helper function to process items and add relationships
    const processItemsWithRelations = async (items: any[]): Promise<any[]> => {
        return Promise.all(
            items.map(async (item) => {
                const itemId = item[`${String(idFieldName)}`]; // e.g., _ID
                const related: Record<string, any> = {};

                // Extract relationships
                const relationships = Object.entries(item).filter(([key, value]) =>
                    !key.includes('_') && value !== undefined
                );

                // Process relationships if they exist
                if (relationships.length > 0) {
                    console.log("relationGetShips", relationships, idFieldName, itemId);
                    for (const [relationKey, relationValue] of relationships) {
                        // Skip non-collection relationships
                        if (!relationKey.endsWith('s')) continue;

                        // Resolve related data for one-to-many and one-to-one relationships
                        const tableName = relationKey.endsWith('s') ? relationKey : `${relationKey}s`;
                        console.log("relationGetRelation", relationKey, relationValue, tableName);

                        // Resolve the related data (e.g., images, favorites, etc.)
                        related[tableName] = await getItemsFromSQLite(tableName, idFieldName.toString(), itemId);
                        console.log(`eager ${tableName}`, related[tableName]);
                    }
                    console.log("relationGetRelated", related);
                }

                // Merge original item with related data
                const data = { ...item, ...related };
                console.log("relationGetData", data);

                return data;
            })
        );
    };

    const upsertItemsToSQLite = async (items: T[], otherResource?: string) => {
        try {
            if (!Array.isArray(items)) {
                throw new TypeError(`Expected 'items' to be an array, got ${typeof items}`);
            }

            for (const item of items) {
                // 1. Insert base resource fields
                const filteredEntries = Object.entries(item).filter(([key]) => key.includes('_'));
                const columns = filteredEntries.map(([key]) => key);
                const values = filteredEntries.map(([, value]) =>
                    Array.isArray(value) ? JSON.stringify(value) : value
                );
                const placeholders = columns.map(() => '?').join(', ');

                const query = `
                    INSERT OR REPLACE INTO ${otherResource ?? resource} (${columns.join(', ')})
                    VALUES (${placeholders})
                `;

                await executeSql(query, values);

                if (!otherResource) {
                    // 2. Recursively upsert relationships
                    const promises: Promise<any>[] = [];

                    const relationships = Object.entries(item).filter(([key, value]) => {
                        return !key.includes('_') && value !== null && value !== undefined;
                    });

                    console.log("relationShipsUpsert", relationships)

                    // Loop through each relationship and add it to the related object
                    for (const [relationKey, relationValue] of relationships) {
                        const tableName = relationKey.endsWith('s') ? relationKey : `${relationKey}s`;
                        console.log("relationKeyUpsert", relationKey)
                        console.log("relationValueUpsert", relationValue)

                        // If it's a one-to-many relationship (e.g., 'images', 'favorites'), ensure it's an array
                        if (Array.isArray(relationValue)) {
                            promises.push(upsertItemsToSQLite(relationValue, tableName));
                        } else if (typeof relationValue === 'object') {
                            promises.push(upsertItemsToSQLite([relationValue], tableName));
                        }
                    }

                    await Promise.all(promises);
                }
            }
            console.log(`upsertItemsToSQLite ${otherResource ?? resource} - ${items.length} items`);
        } catch (error: any) {
            console.error(`Failed to upsertItemsToSQLite for ${otherResource ?? resource}`, error);
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

    const executeSql = async (query: string, params: any[] = []): Promise<ResultSet> => {
        const db = await dbPromise;

        return new Promise((resolve, reject) => {
            db.transaction(
                (tx: Transaction) => {
                    tx.executeSql(
                        query,
                        params,
                        (_: Transaction, result: ResultSet) => resolve(result),
                        (_: Transaction, error: any) => {
                            console.error("SQL Error", error);
                            reject(error);
                            return false;
                        }
                    );
                },
                (txError) => {
                    console.error("Transaction Error", txError);
                    reject(txError);
                }
            );
        });
    };

    /**
     * Sets up the necessary database tables for the application.
     * 
     * This method creates the following tables if they do not already exist:
     * - `properties`: Stores information about properties, including details such as title, description, address, price, and associated user.
     * - `users`: Stores user information, including personal details, email, and role.
     * - `images`: Stores image metadata related to properties, such as image name, path, and URL.
     * - `messages`: Stores messages exchanged between users, including sender, receiver, and property context.
     * - `favorites`: Stores information about properties marked as favorites by tenants.
     * 
     * Each table includes fields for tracking creation, updates, and deletions.
     * Foreign key relationships are defined where applicable.
     * 
     * @async
     * @function setupTables
     * @returns {Promise<void>} Resolves when all tables are successfully created.
     */
    /*const setupTables = async () => {
        // Drop tables if exists
        // Create properties table
        await executeSql(`
            CREATE TABLE IF NOT EXISTS properties (
                Property_ID INTEGER PRIMARY KEY,
                User_ID INTEGER,
                Property_Title TEXT,
                Property_Description TEXT,
                Property_Address TEXT,
                Property_City TEXT,
                Property_Zip_Code TEXT,
                Property_Latitude REAL,
                Property_Longitude REAL,
                Property_Price_Per_Month REAL,
                Property_Num_Bedrooms INTEGER,
                Property_Num_Bathrooms INTEGER,
                Property_Square_Feet INTEGER,
                Property_Amenities TEXT,
                Property_Property_Type INTEGER,
                Property_Available_From TEXT,
                Property_Available_To TEXT,
                Property_Is_Active INTEGER,
                Property_CreatedAt TEXT,
                Property_UpdatedAt TEXT,
                Property_DeletedAt TEXT,

                user TEXT,
                images TEXT,
                messages TEXT,
                favorites TEXT,

                FOREIGN KEY (User_ID) REFERENCES users(User_ID)
            );
        `);

        // Create users table
        await executeSql(`
            CREATE TABLE IF NOT EXISTS users (
                User_ID INTEGER PRIMARY KEY,
                User_First_Name TEXT,
                User_Last_Name TEXT,
                User_Email TEXT,
                User_Password TEXT,
                User_Role TEXT,
                User_Profile_Picture TEXT,
                User_Address TEXT,
                User_Phone_Number TEXT,
                User_CreatedAt TEXT,
                User_UpdatedAt TEXT,
                User_DeletedAt TEXT
            );
        `);

        // Create images table
        await executeSql(`
            CREATE TABLE IF NOT EXISTS images (
                Image_ID INTEGER PRIMARY KEY,
                Property_ID INTEGER,
                Image_Name TEXT,
                Image_Path TEXT,
                Image_Type TEXT,
                Image_URL TEXT,
                Image_Order INTEGER,
                Image_CreatedAt TEXT,
                Image_UpdatedAt TEXT,
                Image_DeletedAt TEXT
            );
        `);

        // Create messages table
        await executeSql(`
            CREATE TABLE IF NOT EXISTS messages (
                Message_ID INTEGER PRIMARY KEY,
                Sender_ID INTEGER,
                Receiver_ID INTEGER,
                Property_ID INTEGER,
                Message_Text TEXT,
                Message_Read_At TEXT,
                Message_CreatedAt TEXT,
                Message_UpdatedAt TEXT,
                Message_DeletedAt TEXT
            );
        `);

        // Create favorites table
        await executeSql(`
            CREATE TABLE IF NOT EXISTS favorites (
                Favorite_ID INTEGER PRIMARY KEY,
                Tenant_ID INTEGER,
                Property_ID INTEGER,
                Favorite_CreatedAt TEXT,
                Favorite_UpdatedAt TEXT,
                Favorite_DeletedAt TEXT
            );
        `);
    };*/

    /**
     * Checks the current network connectivity status.
     *
     * @returns {Promise<boolean>} A promise that resolves to `true` if the device is connected to the internet, otherwise `false`.
     */
    const isOnline = async (): Promise<boolean> => {
        const state = await NetInfo.fetch();
        return state.isConnected ?? false;
    };

    return {
        fetchItems,
        getItemsFromSQLite,
        upsertItemsToSQLite,
        fetchItemsByParent,
        fetchItem,
        postItem,
        updateItem,
        deleteItem,
        //setupTables,
        executeSql,
        isOnline,
    };
};

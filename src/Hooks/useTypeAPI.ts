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
        parentValue?: string,
        singularMapping?: {
            join: string;
            on: string;
        } | undefined,
        deepEager: boolean = false
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
            if (otherResource && !deepEager) return items;

            // Process items and relationships
            const itemsWithRelations = await processItemsWithRelations(items, undefined, singularMapping, otherResource);

            console.log("itemsWithRelations0", itemsWithRelations[0]);
            return itemsWithRelations;

        } catch (error: any) {
            console.error(`Failed to getItemsFromSQLite for ${resource}`, error);
            return [];
        }
    };

    const getItemsByIdFromSQLite = async (
        parentIdFieldName: string | string[],
        parentId: number,
        parentRelation: string | undefined,
        singularKeys: {
            [key: string]: { join: string; on: string };
        } | undefined,
        otherResource?: string,
        parentKey?: string,
        parentValue?: string,
    ): Promise<T[]> => {
        try {
            // Construct base query
            let query = `SELECT * FROM ${otherResource ?? resource} WHERE `;

            if (otherResource && parentKey && parentValue) {
                query += `${parentKey} = ${parentValue}`;
            } else if (typeof parentIdFieldName === 'string') {
                query += `${parentIdFieldName} = ${parentId}`;
            } else if (Array.isArray(parentIdFieldName)) {
                query += parentIdFieldName.map(field => `${field} = ${parentId}`).join(` ${parentRelation} `);
            }

            // Execute query
            const results = await executeSql(query); // Abstracted SQLite call
            const items = results.rows.raw() || [];

            // If fetching another resource, return directly
            if (otherResource) return items;

            // Process items and relationships
            const itemsWithRelations = await processItemsWithRelations(items, singularKeys, undefined, otherResource);

            console.log("itemsWithRelations0", itemsWithRelations[0]);
            return itemsWithRelations;

        } catch (error: any) {
            console.error(`Failed to getItemsByIdFromSQLite for ${resource}`, error);
            return [];
        }
    };

    const getItemFromSQLite = async (
        id: number | string,
        otherResource?: string,
        singularMapping?: {
            join: string;
            on: string;
        },
        deepEager: boolean = false
    ): Promise<T | null> => {
        try {
            // Construct query to get a single item
            const tableName = otherResource ?? resource;
            const query = `SELECT * FROM ${tableName} WHERE ${idFieldName.toString()} = ${id}`;

            // Execute query
            const results = await executeSql(query);
            const items = results.rows.raw() || [];
            const item = items[0];

            console.log(`getItemFromSQLite ${tableName}`, item);

            if (!item) return null; // No item found

            // If fetching from another resource and no deep eager loading requested, return directly
            if (otherResource && !deepEager) return item;

            // Process relationships if needed
            const [itemWithRelations] = await processItemsWithRelations([item], undefined, singularMapping, otherResource);

            console.log("itemWithRelations", itemWithRelations);
            return itemWithRelations;

        } catch (error: any) {
            console.error(`Failed to getItemFromSQLite for ${resource}`, error);
            return null;
        }
    };

    // Helper function to process items and add relationships
    const processItemsWithRelations = async (
        items: any[],
        singularKeys?: Record<string, { join: string; on: string }>,
        inheritedSingularMapping?: { join: string; on: string },
        otherResource?: string
    ): Promise<any[]> => {
        return Promise.all(items.map(async (item) => {
            const itemId = item[String(idFieldName)];
            const related: Record<string, any> = {};

            const relationships = Object.entries(item).filter(([key, value]) =>
                !key.includes('_') && value !== undefined
            );

            for (const [relationKey] of relationships) {
                const singularMapping = singularKeys?.[relationKey];
                const isPlural = relationKey.endsWith('s');
                const tableName = singularMapping?.join || (isPlural ? relationKey : `${relationKey}s`);

                const getRelatedItems = async () => {
                    if (isPlural) {
                        return otherResource
                            ? await getItemsFromSQLite(
                                tableName,
                                inheritedSingularMapping?.on,
                                item[inheritedSingularMapping?.on ?? '']
                            )
                            : await getItemsFromSQLite(
                                tableName,
                                idFieldName.toString(),
                                itemId
                            );
                    } else if (singularMapping) {
                        const result = await getItemsFromSQLite(
                            tableName,
                            singularMapping.on,
                            itemId,
                            singularMapping,
                            true
                        );
                        return result[0] ?? null;
                    }
                    return null;
                };

                const relationData = await getRelatedItems();
                if (relationData !== null) {
                    related[isPlural ? tableName : relationKey] = relationData;
                }
            }

            return { ...item, ...related };
        }));
    };

    const upsertItemsToSQLite = async (
        items: T[],
        singularKeys: {
            [key: string]: { join: string; on: string };
        } | undefined,
        otherResource?: string
    ) => {
        try {
            if (!Array.isArray(items)) {
                throw new TypeError(`Expected 'items' to be an array, got ${typeof items}`);
            }

            for (const item of items) {
                console.log(`remoteItem ${otherResource ? 'otherResource'+otherResource : resource} upsert`, `${item.Message_ID}/${item.Property_ID}`)
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

                const upserted = await executeSql(query, values)

                if (!otherResource) {
                    // 2. Recursively upsert relationships
                    const promises: Promise<any>[] = [];

                    const relationships = Object.entries(item).filter(([key, value]) => {
                        // Check if the key is a relationship (not containing '_')
                        // Also check if the value is not null or undefined
                        return !key.includes('_') && value !== null && value !== undefined;
                    });

                    console.log("relationShipsUpsert", relationships)

                    // Loop through each relationship and add it to the related object
                    for (const [relationKey, relationValue] of relationships) {
                        let tableName = ""

                        const singularMapping = singularKeys?.[relationKey as keyof typeof singularKeys];

                        if (relationKey.endsWith('s')) {
                            tableName = relationKey
                        } else if (singularMapping) {
                            tableName = singularMapping.join;
                        } else {
                            tableName = `${relationKey}s`;
                        }

                        console.log("relationKeyAndTableNameUpsert", relationKey, tableName)
                        console.log("relationValueUpsert", relationValue)

                        // If it's a one-to-many relationship (e.g., 'images', 'favorites'), ensure it's an array
                        if (Array.isArray(relationValue)) {
                            promises.push(upsertItemsToSQLite(relationValue, undefined, tableName));
                        } else if (typeof relationValue === 'object') {
                            promises.push(upsertItemsToSQLite([relationValue], undefined, tableName));
                        }
                    }

                    await Promise.all(promises);
                }
            }
            console.log(`upsertItemsToSQLite ${otherResource ?? resource} - ${items.length} items`);
        } catch (error: any) {
            console.error(`Failed to upsertItemsToSQLite for ${otherResource ?? resource}`, error, JSON.stringify(items));
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

    // Checks the current network connectivity status.
    // A promise that resolves to `true` if the device is connected to the internet, otherwise `false`.
    const isOnline = async (): Promise<boolean> => {
        const state = await NetInfo.fetch();
        return state.isConnected ?? false;
    };

    return {
        fetchItems,
        getItemsFromSQLite,
        getItemsByIdFromSQLite,
        getItemFromSQLite,
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

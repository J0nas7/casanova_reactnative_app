// External
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useStorage = () => {
    const getItem = async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error(`Error getting item "${key}":`, error);
            return null;
        }
    };

    const setItem = async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error(`Error setting item "${key}":`, error);
        }
    };

    const deleteItem = async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error(`Error deleting item "${key}":`, error);
        }
    };

    const getAllItems = async (): Promise<Record<string, string>> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const entries = await AsyncStorage.multiGet(keys);
            return Object.fromEntries(entries.filter(([key, value]) => value !== null) as [string, string][]);
        } catch (error) {
            console.error("Error getting all items:", error);
            return {};
        }
    };

    return {
        getItem,
        setItem,
        deleteItem,
        getAllItems,
    };
};

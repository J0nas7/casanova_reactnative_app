// External
import React, { createContext, useContext, useState } from "react"

// Internal
import { useResourceContext } from "@/src/Contexts/useResourceContext"
import { User, Property, PropertyImage, Message, Favorite, UserFields, PropertyFields, MessageFields, PropertyStates } from "@/src/Types"
import { useAxios } from "@/src/Hooks";
import { ResultSet } from "react-native-sqlite-storage";

// Context for Users
export type UsersContextType = {
    usersById: User[];
    userDetail: User | undefined;
    newUser: User | undefined;
    setUserDetail: React.Dispatch<React.SetStateAction<User | undefined>>;
    handleChangeNewUser: (field: UserFields, value: string) => Promise<void>
    addUser: (parentId: number, object?: User) => Promise<void>
    saveUserChanges: (itemChanges: User, parentId: number) => Promise<void>
    removeUser: (itemId: number, parentId: number) => Promise<boolean>
    // userLoading: boolean;
    // userError: string | null;
};

const defaultUsersContextValue: UsersContextType = {
    usersById: [],
    userDetail: undefined,
    newUser: undefined,
    setUserDetail: () => {},
    handleChangeNewUser: async () => {},
    addUser: async () => {},
    saveUserChanges: async () => {},
    removeUser: async () => false,
};

const UsersContext = createContext<UsersContextType>(defaultUsersContextValue);

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        itemsById: usersById,
        newItem: newUser,
        itemDetail: userDetail,
        setItemDetail: setUserDetail,
        handleChangeNewItem: handleChangeNewUser,
        addItem: addUser,
        saveItemChanges: saveUserChanges,
        removeItem: removeUser,
        executeSql
        // loading: userLoading,
        // error: userError,
    } = useResourceContext<User, "User_ID">(
        "users",
        "User_ID",
        "",
        "",
        undefined,
        undefined
    );

    setupOfflineTables(executeSql)

    return (
        <UsersContext.Provider value={{
            usersById,
            userDetail,
            newUser,
            setUserDetail,
            handleChangeNewUser,
            addUser,
            saveUserChanges,
            removeUser,
            // userLoading,
            // userError,
        }}>
            {children}
        </UsersContext.Provider>
    );
};

export const useUsersContext = () => {
    const context = useContext(UsersContext);
    if (!context) {
        throw new Error("useUsersContext must be used within a UsersProvider");
    }
    return context;
};

// Context for Properties
export type PropertiesContextType = {
    properties: Property[];
    propertiesById: Property[];
    propertyById: PropertyStates
    propertyDetail: Property | undefined;
    newProperty: Property | undefined;
    readProperties: (refresh?: boolean) => Promise<void>
    readPropertiesByUserId: (parentId: number, refresh?: boolean) => Promise<void>
    readPropertyById: (itemId: number) => Promise<void>
    setPropertyDetail: React.Dispatch<React.SetStateAction<Property | undefined>>;
    handleChangeNewProperty: (field: PropertyFields, value: string) => Promise<void>
    addProperty: (parentId: number, object?: Property) => Promise<void>
    createPropertyWithImages: (property: Property, images: any[]) => Promise<Property | false>
    updatePropertyWithImages: (property: Property, images: (string | any)[]) => Promise<Property | false>
    updatePropertyAvailability: (property: Property, availabilityData: {
        Property_Available_From?: string;
        Property_Available_To?: string;
        Property_Is_Active: boolean;
    }) => Promise<Property | false>;
    savePropertyChanges: (propertyChanges: Property, parentId: number) => Promise<void>
    removeProperty: (itemId: number, parentId: number) => Promise<boolean>
};

export const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export const PropertiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { httpPostWithData, httpPutWithData } = useAxios()

    const {
        items: properties,
        itemsById: propertiesById,
        itemById: propertyById,
        newItem: newProperty,
        itemDetail: propertyDetail,
        readItems: readProperties,
        readItemsById: readPropertiesByUserId,
        readItemById: readPropertyById,
        setItemDetail: setPropertyDetail,
        handleChangeNewItem: handleChangeNewProperty,
        addItem: addProperty,
        saveItemChanges: savePropertyChanges,
        removeItem: removeProperty,
        executeSql
        // loading: propertyLoading,
        // error: propertyError,
    } = useResourceContext<Property, "Property_ID">(
        "properties", // The resource name
        "Property_ID", // The ID field name
        "users", // The parent resource name
        "User_ID", // The parent ID field name
        undefined, // The parent relation
        {
            user: { join: "users", on: "User_ID" }
        }
    );

    setupOfflineTables(executeSql)

    const createPropertyWithImages = async (property: Property, images: any[]) => {
        console.log("createPropertyWithImages", property, images)
        const result = await httpPostWithData("createPropertyWithImages", { ...property, images })

        if (result.property) {
            return result.property
        } else {
            return false
        }
    }

    /**
     * Updates a property along with its associated images.
     * Sends the updated property data and images to the API.
     * 
     * @param property - The property object to be updated.
     * @param images - An array of images (either strings or any (File) objects) to be associated with the property.
     * @returns The updated property object if successful, or `false` if the update fails.
     */
    const updatePropertyWithImages = async (property: Property, images: (string | any)[]) => {
        //console.log(images.length, "updatePropertyWithImages before API", property, images);

        // Make an API call to update the property with the provided images
        const result = await httpPostWithData(`updatePropertyWithImages/${property.Property_ID}`, { ...property, images });

        //console.log("updatePropertyWithImages after API", result);

        // Return the updated property if the API call was successful, otherwise return false
        if (result.property) {
            return result.property;
        } else {
            return false;
        }
    }

    /**
     * Updates the availability details of a property.
     * Sends the availability data to the API for the specified property.
     * 
     * @param propertyId - The ID of the property to be updated.
     * @param availabilityData - An object containing the availability details (e.g., dates and active status).
     * @returns A success message if the update is successful, or `false` if it fails.
     */
    const updatePropertyAvailability = async (
        property: Property,
        availabilityData: {
            Property_Available_From?: string;
            Property_Available_To?: string;
            Property_Is_Active: boolean;
        }
    ): Promise<Property | false> => {
        try {
            // Make an API call to update the property availability
            const result = await httpPutWithData(`properties/${property.Property_ID}/availability`, availabilityData);

            // Return the updated property if the API call was successful, otherwise return false
            if (result.property) {
                return result.property;
            } else {
                return false;
            }
        } catch (error) {
            console.error("Error updating property availability:", error);
            return false;
        }
    };

    return (
        <PropertiesContext.Provider value={{
            properties,
            propertiesById,
            propertyById,
            newProperty,
            propertyDetail,
            readProperties,
            readPropertiesByUserId,
            readPropertyById,
            setPropertyDetail,
            handleChangeNewProperty,
            addProperty,
            createPropertyWithImages,
            updatePropertyWithImages,
            updatePropertyAvailability,
            savePropertyChanges,
            removeProperty,
            // propertyLoading,
            // propertyError,
        }}>
            {children}
        </PropertiesContext.Provider>
    );
};

export const usePropertiesContext = () => {
    const context = useContext(PropertiesContext);
    if (!context) {
        throw new Error("usePropertiesContext must be used within a PropertiesProvider");
    }
    return context;
};

// Context for Messages
export type MessagesContextType = {
    messages: Message[];
    messagesById: Message[];
    messageById: Message | undefined | false
    messageDetail: Message | undefined;
    newMessage: Message | undefined;
    readMessages: (refresh?: boolean) => Promise<void>
    readMessagesByUserId: (parentId: number) => Promise<void>
    readMessageById: (itemId: number) => Promise<void>
    setMessageDetail: React.Dispatch<React.SetStateAction<Message | undefined>>;
    handleChangeNewMessage: (field: MessageFields, value: string) => Promise<void>
    addMessage: (parentId: number, object?: Message) => Promise<void>
    saveMessageChanges: (messageChanges: Message, parentId: number) => Promise<void>
    removeMessage: (itemId: number, parentId: number) => Promise<boolean>
};

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        items: messages,
        itemsById: messagesById,
        itemById: messageById,
        newItem: newMessage,
        itemDetail: messageDetail,
        readItems: readMessages,
        readItemsById: readMessagesByUserId,
        readItemById: readMessageById,
        setItemDetail: setMessageDetail,
        handleChangeNewItem: handleChangeNewMessage,
        addItem: addMessage,
        saveItemChanges: saveMessageChanges,
        removeItem: removeMessage,
        executeSql
        // loading: messageLoading,
        // error: messageError,
    } = useResourceContext<Message, "Message_ID">(
        "messages",
        "Message_ID",
        "users",
        ["Sender_ID", "Receiver_ID"],
        "OR",
        {
            sender: { join: "users", on: "User_ID" },
            receiver: { join: "users", on: "User_ID" },
            property: { join: "properties", on: "Property_ID" },
        } // singularKeys
    );

    setupOfflineTables(executeSql)

    return (
        <MessagesContext.Provider value={{
            messages,
            messagesById,
            messageById,
            newMessage,
            messageDetail,
            readMessages,
            readMessagesByUserId,
            readMessageById,
            setMessageDetail,
            handleChangeNewMessage,
            addMessage,
            saveMessageChanges,
            removeMessage,
            // messageLoading,
            // messageError,
        }}>
            {children}
        </MessagesContext.Provider>
    );
};

export const useMessagesContext = () => {
    const context = useContext(MessagesContext);
    if (!context) {
        throw new Error("useMessagesContext must be used within a MessagesProvider");
    }
    return context;
};

const setupOfflineTables = async (executeSql: (query: string, params?: any[]) => Promise<ResultSet>) => {
    // await executeSql(`DROP TABLE IF EXISTS users`);
    // await executeSql(`DROP TABLE IF EXISTS properties`);
    // await executeSql(`DROP TABLE IF EXISTS images`);
    // await executeSql(`DROP TABLE IF EXISTS favorites`);
    // await executeSql(`DROP TABLE IF EXISTS messages`);

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
            Message_DeletedAt TEXT,

            sender TEXT,
            receiver TEXT,
            property TEXT
        );
    `);
};


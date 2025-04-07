// User Type
export type User = {
    User_ID?: number;
    User_First_Name: string;
    User_Last_Name: string;
    User_Email: string;
    User_Password?: string;
    User_Role: 'Administrator' | 'Landlord' | 'Tenant';
    User_Profile_Picture?: string | null;
    User_Address?: string;
    User_CreatedAt?: string;
    User_UpdatedAt?: string;
    User_DeletedAt?: string;

    // Relationships
    properties?: Property[];
    messagesSent?: Message[];
    messagesReceived?: Message[];
    favorites?: Favorite[];
};

export type UserFields =
    "User_ID" | "User_First_Name" | "User_Last_Name" | "User_Email" |
    "User_Password" | "User_Role" | "User_Profile_Picture" | "User_Address" |
    "User_CreatedAt" | "User_UpdatedAt";

// Property Type
export type Property = {
    Property_ID?: number;
    User_ID: number;
    Property_Title: string;
    Property_Description: string;
    Property_Address: string;
    Property_City: string;
    // Property_State: string;
    Property_Zip_Code: string;
    Property_Latitude: number;
    Property_Longitude: number;
    Property_Price_Per_Month: number;
    Property_Num_Bedrooms: number;
    Property_Num_Bathrooms: number;
    Property_Square_Feet: number;
    Property_Amenities: string[];
    Property_Property_Type: number;
    Property_Available_From: string;
    Property_Is_Active: boolean;
    Property_CreatedAt?: string;
    Property_UpdatedAt?: string;

    // Relationships
    user?: User;
    images?: PropertyImage[];
    messages?: Message[];
    favorites?: Favorite[];
};

export type PropertyFields =
    "Property_ID" | "User_ID" | "Property_Title" | "Property_Description" |
    "Property_Address" | "Property_City" | "Property_Zip_Code" |
    "Property_Latitude" | "Property_Longitude" | "Property_Price_Per_Month" |
    "Property_Num_Bedrooms" | "Property_Num_Bathrooms" | "Property_Square_Feet" |
    "Property_Amenities" | "Property_Property_Type" | "Property_Available_From" |
    "Property_Is_Active" | "Property_CreatedAt" | "Property_UpdatedAt";

export type PropertyStates = Property|undefined|false

// Property type mapping (number -> string)
export const propertyTypeMap: { [key: number]: string } = {
    1: "Apartment",
    2: "Room",
    3: "House",
    4: "Townhouse",
}

// PropertyImage Type
export type PropertyImage = {
    Image_ID?: number; // Primary key
    Property_ID?: number; // Foreign key to CN_Properties
    Image_Name?: string; // File name
    Image_Path?: string; // Storage path
    Image_Type?: string; // File type (image, video, etc.)
    Image_URL?: string; // Image URL
    Image_Order: number; // Order of the image

    // Relationships
    property?: Property;
};

export type PropertyImageFields =
    "Image_ID" | "Property_ID" | "Image_Name" | "Image_Path" | "Image_Type" |
    "Image_URL" | "Image_Order";

// Message Type
export type Message = {
    Message_ID?: number;
    Sender_ID: number;
    Receiver_ID: number;
    Property_ID?: number;
    Message_Text: string;
    Message_CreatedAt?: string;
    Message_UpdatedAt?: string;

    // Relationships
    sender?: User;
    receiver?: User;
    property?: Property;
};

export type MessageFields =
    "Message_ID" | "Sender_ID" | "Receiver_ID" | "Property_ID" |
    "Message_Text" | "Message_CreatedAt" | "Message_UpdatedAt";

// Favorite Type
export type Favorite = {
    Favorite_ID?: number;
    Tenant_ID: number;
    Property_ID: number;
    Favorite_CreatedAt?: string;
    Favorite_UpdatedAt?: string;

    // Relationships
    tenant?: User;
    property?: Property;
};

export type FavoriteFields =
    "Favorite_ID" | "Tenant_ID" | "Property_ID" | "Favorite_CreatedAt" | "Favorite_UpdatedAt";

// Notification Type
export type Notification = {
    Notification_ID?: number;
    User_ID: number;
    Notification_Message: string;
    Notification_Read: boolean;
    Notification_CreatedAt?: string;
    Notification_UpdatedAt?: string;

    // Relationships
    user?: User;
};

export type NotificationFields =
    "Notification_ID" | "User_ID" | "Notification_Message" | "Notification_Read" |
    "Notification_CreatedAt" | "Notification_UpdatedAt";

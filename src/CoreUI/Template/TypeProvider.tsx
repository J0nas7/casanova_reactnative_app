// External
import React from 'react';

// Internal
import { 
    UsersProvider, PropertiesProvider, MessagesProvider,//, PropertyImagesProvider, MessagesProvider, FavoritesProvider,
} from "@/src/Contexts"

const providers: any[] = [
    // UsersProvider,
    PropertiesProvider,
    // // PropertyImagesProvider,
    MessagesProvider,
    // // FavoritesProvider,
]

export const TypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children)
}
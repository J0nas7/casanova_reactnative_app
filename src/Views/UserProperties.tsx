import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faArrowLeft, faHouseChimney, faPencil, faTrashCan } from "@fortawesome/free-solid-svg-icons";

// Internal Imports
import { usePropertiesContext } from "@/src/Contexts";
import { Property } from "@/src/Types";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./MainView";
import { PropertyCard } from "../Components/Partials/properties/PropertyCard";
import { selectAuthUser, selectMainViewJumbotron, setMainViewJumbotron, useTypedSelector } from "@/src/Redux";
import useMainViewJumbotron from "../Hooks/useMainViewJumbotron";

export const UserProperties: React.FC = () => {
    // Hooks
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { propertiesById, readPropertiesByUserId, removeProperty } = usePropertiesContext()
    const { defaultJumboState, setDefaultJumboState, handleScroll } = useMainViewJumbotron({
        title: `My Listings (0)`,
        faIcon: faArrowLeft,
        htmlIcon: '🔑',
        visibility: 100
    })

    // Redux (Authenticated User)
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron);
    const authUser = useTypedSelector(selectAuthUser);

    // Local State
    const [renderProperties, setRenderProperties] = useState<Property[] | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch properties when component mounts
    useEffect(() => {
        const fetchProperties = async () => {
            if (authUser?.User_ID) {
                await readPropertiesByUserId(authUser.User_ID);
                setLoading(false);
            }
        };
        fetchProperties();
    }, [authUser]);

    useEffect(() => {
        if (Array.isArray(propertiesById)) {
            setRenderProperties(propertiesById)

            if (propertiesById.length > 0) {
                setRefreshing(false)
            }
        }
    }, [propertiesById]);

    // Handle deletion of property
    const handleDelete = async (property: Property) => {
        if (!authUser?.User_ID || !property.Property_ID) return;

        await removeProperty(property.Property_ID, authUser.User_ID);
        await readPropertiesByUserId(authUser.User_ID);
    };
    
    // This function will be called when the user pulls down to refresh
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        
        if (authUser?.User_ID) await readPropertiesByUserId(authUser.User_ID, true)
    }, []);

    /**
     * useEffects
     */
    useFocusEffect(
        useCallback(() => {
            setDefaultJumboState({
                ...defaultJumboState,
                title: `My Listings (${renderProperties?.length})`,
                visibility: defaultJumboState?.visibility ?? 100,
            })
        }, [renderProperties])
    )

    if (!authUser?.User_ID) {
        navigation.navigate('Login');
        return null;
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000FF" />
                <Text>Loading properties...</Text>
            </View>
        );
    }

    if (!renderProperties || renderProperties.length === 0) {
        return (
            <View style={styles.pageContent}>
                <View style={styles.noPropertiesContainer}>
                    <Text>You have no properties listed. Add a new one on our website.</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                        <Text style={styles.searchLink}>Go to Search</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.pageContent}>
            {/* Properties Grid */}
            <FlatList
                data={renderProperties}
                keyExtractor={(item) => (item.Property_ID ?? '').toString()}
                numColumns={1}
                renderItem={({ item }) => (
                    <PropertyCard property={item} />
                )}
                onScroll={handleScroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    pageContent: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noPropertiesContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    searchLink: {
        color: '#1ab11f',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 16
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});

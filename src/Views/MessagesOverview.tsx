import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

// Internal
import { useMessagesContext } from '@/src/Contexts';
import { useTypedSelector, selectAuthUser, selectUserId } from '@/src/Redux';
import { LoginView } from './LoginView';
import useMainViewJumbotron from '../Hooks/useMainViewJumbotron';
import { Message, Property, PropertyImage } from '../Types';
import { env } from '../env';
import { RefreshControl } from 'react-native-gesture-handler';

export const MessagesOverview: React.FC = () => {
    // Hooks
    const { messagesById, readMessagesByUserId } = useMessagesContext();
    const userId = useTypedSelector(selectUserId);
    const route = useRoute<any>();
    const { handleScroll, handleFocusEffect } = useMainViewJumbotron({
        title: 'Messages',
        htmlIcon: '📬',
        visibility: 100
    })

    // State
    const [refreshing, setRefreshing] = useState<boolean>(false)

    // Methods
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        if (userId) {
            readMessagesByUserId(userId);
        }
    }, [])

    // Effects
    useEffect(() => {
        if (userId) {
            readMessagesByUserId(userId);
        }
    }, [userId]);

    useEffect(() => {
        if (messagesById.length > 0) {
            setRefreshing(false);
        }
    }, [messagesById]);

    useFocusEffect(
        useCallback(() => {
            handleFocusEffect()
        }, [])
    )

    if (!userId) return <LoginView />;

    return (
        <View style={styles.container}>
            <MessagesList
                messages={messagesById}
                authUserId={userId}
                handleScroll={handleScroll}
                onRefresh={onRefresh}
                refreshing={refreshing}
            />
        </View>
    );
};

interface MessagesListProps {
    messages: Message[];
    authUserId: number;
    handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onRefresh: () => void;
    refreshing: boolean;
}

const MessagesList: React.FC<MessagesListProps> = ({
    messages,
    authUserId,
    handleScroll,
    onRefresh,
    refreshing
}) => {
    const [uniqueProperties, setUniqueProperties] = useState<Record<number, Property>>({});
    const [uniqueItems, setUniqueItems] = useState<Record<number, { message: Message; property: Property | undefined }>>({});
    const navigation = useNavigation<any>();

    useEffect(() => {
        if (Array.isArray(messages) && messages.length > 0) {
            const propertiesMap: Record<number, Property> = {};
            const itemsMap: Record<number, { message: Message; property: Property | undefined }> = {};
            
            messages.forEach((msg) => {
                const property = msg.property;
                const propertyId = property?.Property_ID
                const messagePropertyId = msg.Property_ID

                const isUserRelated = msg.Sender_ID === Number(authUserId) || msg.Receiver_ID === Number(authUserId);
                
                if (messagePropertyId && isUserRelated) {
                    itemsMap[messagePropertyId] = { message: msg, property};
                }
                if (propertyId && property) {
                    propertiesMap[propertyId] = property;
                }
            });
            setUniqueItems(itemsMap);
            setUniqueProperties(propertiesMap);
        }
    }, [messages])
    
    const items = Object.values(uniqueItems)
    
    if (!messages.length) {
        return (
            <View style={styles.emptyWrapper}>
                <Text style={styles.heading}>Messages (0)</Text>
                <Text style={styles.emptyText}>No messages found</Text>
            </View>
        );
    }

    const renderItem = ({ item: {message, property} }: { item: { message: Message; property: Property | undefined } }) => {
        const uniqueProperty = uniqueProperties[message.Property_ID ?? 0]
        const image = uniqueProperty.images?.find((img: PropertyImage) => img.Image_Order === 1);
        const imageSrc = image?.Image_URL || `${env.url.API_URL}/storage/${image?.Image_Path}`;

        return (
            <TouchableOpacity
                key={message.Property_ID}
                style={styles.item}
                onPress={() => {
                    if (message.Property_ID) {
                        navigation.navigate('MessageConversation', { propertyId: message.Property_ID.toString() })
                    }
                }}
            >
                <Image source={{ uri: imageSrc }} style={styles.image} />
                <Text style={styles.propertyText}>
                    {uniqueProperty.Property_Address}, {uniqueProperty.Property_City}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.heading}>Messages ({items.length})</Text>
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item: { message: Message; property: Property | undefined }) => (item.message.Property_ID ?? 'unknown').toString()}
                onScroll={handleScroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mobileMenuTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
    },

    wrapper: {
        padding: 16,
    },
    heading: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    emptyWrapper: {
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        marginTop: 16,
        fontSize: 14,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#f4f4f5',
    },
    image: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
    },
    propertyText: {
        fontSize: 14,
        flexShrink: 1,
    },
});


import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    NativeSyntheticEvent,
    NativeScrollEvent,
    RefreshControl,

    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    Alert,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useMessagesContext } from '@/src/Contexts';
import { AppDispatch, selectMainViewJumbotron, selectUserId, setMainViewJumbotron, useTypedSelector } from '@/src/Redux';
import { Message, Property } from '@/src/Types';
import { env } from '@/src/env';
import { PropertyImage } from '../Types';
import { LoginView } from './LoginView';
import useMainViewJumbotron from '../Hooks/useMainViewJumbotron';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';

export const MessageView: React.FC = () => {
    // Hooks
    const { messagesById, readMessagesByUserId } = useMessagesContext();
    const userId = useTypedSelector(selectUserId);
    const route = useRoute<any>();
    const { handleScroll, handleFocusEffect } = useMainViewJumbotron({
        title: 'Conversation',
        faIcon: faArrowLeft,
        htmlIcon: '📧',
        visibility: 100
    })

    // State
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const { propertyId } = route.params as { propertyId: string };  // Get propertyId from route params
    const selectedProperty: Property | undefined = Array.isArray(messagesById)
        ? messagesById.find(
            (msg) => msg.property?.Property_ID?.toString() === propertyId
        )?.property
        : undefined;

    // Methods
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        if (userId) {
            readMessagesByUserId(userId);
        }
    }, [])

    // Effects
    useEffect(() => {
        if (userId) readMessagesByUserId(userId);
    }, [userId]);

    useEffect(() => {
        console.log("Selected propertyId", propertyId, selectedProperty?.Property_ID)
    }, [selectedProperty, propertyId]);

    useEffect(() => {
        if (messagesById.length > 0) {
            setRefreshing(false);
        }
    }, [messagesById])

    useFocusEffect(
        useCallback(() => {
            handleFocusEffect()
        }, [])
    )

    if (!userId) return <LoginView />;

    return (
        <View style={styles.messagesWrapper}>
            {selectedProperty ? (
                <MessageConversation
                    messages={messagesById}
                    selectedProperty={selectedProperty}
                    authUserId={userId}
                    handleScroll={handleScroll}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                />
            ) : (
                <View style={styles.fallbackContainer}>
                    <Text style={styles.fallbackText}>
                        {propertyId
                            ? 'The conversation was not found'
                            : 'Select a conversation to start chatting'}
                    </Text>
                </View>
            )}
        </View>
    );
};

interface MessageConversationProps {
    messages: Message[];
    selectedProperty: Property;
    authUserId?: number;
    handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    onRefresh: () => void;
    refreshing: boolean;
}

const MessageConversation: React.FC<MessageConversationProps> = ({
    messages,
    selectedProperty,
    authUserId,
    handleScroll,
    onRefresh,
    refreshing,
}) => {
    // Hooks
    const { addMessage } = useMessagesContext();

    // Redux
    const dispatch = useDispatch<AppDispatch>();
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron);
    const userId = useTypedSelector(selectUserId);

    // State
    const [conversation, setConversation] = useState<Message[]>([]);
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
    const [typeMessage, setTypeMessage] = useState<string>("");

    // Methods
    const handleMessageSend = async () => {
        if (!userId || !selectedProperty.Property_ID) {
            Alert.alert("User or Property ID is missing. Try again.");
            return
        }

        const messageData: Message = {
            Sender_ID: userId,
            Receiver_ID: selectedProperty.User_ID,
            Property_ID: selectedProperty.Property_ID,
            Message_Text: typeMessage
        };

        setTypeMessage(""); // Clear the message after sending
        Keyboard.dismiss // Close the composer

        // Send the messageData to your backend or API
        const messageSend = await addMessage(userId, messageData)
    }

    // Effects
    useFocusEffect(
        useCallback(() => {
            setConversation([]); // Reset conversation on focus

            if (selectedProperty.User_ID) {
                const filtered = messages
                    .filter(
                        (msg) => {
                            return ((msg.Sender_ID === selectedProperty.User_ID) ||
                                (msg.Receiver_ID === selectedProperty.User_ID)) &&
                                Boolean(msg.Property_ID === selectedProperty.Property_ID)
                        }
                    )
                    .sort((a, b) =>
                        new Date(a.Message_CreatedAt || 0).getTime() -
                        new Date(b.Message_CreatedAt || 0).getTime()
                    );

                setConversation(filtered);
            }
        }, [messages, selectedProperty])
    )

    // Keyboard handling to adjust the view when the keyboard is shown
    useEffect(() => {
        const onKeyboardToggle = (event: any) => {
            setKeyboardVisible(!keyboardVisible)
            dispatch(setMainViewJumbotron({
                ...mainViewJumbotron,
                visibility: 0
            }))
        };

        const showSub = Keyboard.addListener('keyboardDidShow', onKeyboardToggle);
        const hideSub = Keyboard.addListener('keyboardDidHide', onKeyboardToggle);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const image = selectedProperty.images?.find((img: PropertyImage) => img.Image_Order === 1);
    const imageSrc = image?.Image_URL || `${env.url.API_URL}/storage/${image?.Image_Path}`;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.chatContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Image source={{ uri: imageSrc }} style={styles.headerImage} />
                        <View>
                            <Text style={styles.propertyTitle}>
                                {selectedProperty.Property_Address}, {selectedProperty.Property_City}
                            </Text>
                            <Text style={styles.agentName}>
                                {selectedProperty.user?.User_First_Name} {selectedProperty.user?.User_Last_Name}
                            </Text>
                        </View>
                    </View>

                    {/* Chat messages */}
                    <ScrollView
                        style={styles.chatScroll}
                        onScroll={(e) => {
                            if (!keyboardVisible) handleScroll(e)
                        }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {conversation.map((msg) => {
                            const isOwnMessage = msg.Sender_ID === authUserId;
                            return (
                                <View
                                    key={msg.Message_ID}
                                    style={[
                                        styles.messageBubbleWrapper,
                                        isOwnMessage ? styles.alignRight : styles.alignLeft,
                                    ]}
                                >
                                    <Text style={styles.messageMeta}>
                                        {msg.sender?.User_First_Name} {msg.sender?.User_Last_Name}
                                    </Text>
                                    <Text style={styles.messageMeta}>
                                        {msg.Message_CreatedAt && new Date(msg.Message_CreatedAt).toLocaleString()}
                                    </Text>
                                    <View
                                        style={[
                                            styles.messageBubble,
                                            isOwnMessage ? styles.ownMessage : styles.theirMessage,
                                        ]}
                                    >
                                        <Text style={isOwnMessage ? styles.ownText : styles.theirText}>
                                            {msg.Message_Text}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {/* Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            value={typeMessage}
                            onChangeText={setTypeMessage}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleMessageSend}>
                            <Text style={styles.sendText}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    messagesWrapper: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fallbackText: {
        fontSize: 16,
        color: '#999',
    },
    chatContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    headerImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
    },
    propertyTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    agentName: {
        fontSize: 14,
        color: '#666',
    },
    chatScroll: {
        flex: 1,
        padding: 12,
    },
    messageBubbleWrapper: {
        marginBottom: 10,
        maxWidth: '80%',
    },
    alignRight: {
        alignSelf: 'flex-end',
    },
    alignLeft: {
        alignSelf: 'flex-start',
    },
    messageMeta: {
        fontSize: 10,
        color: '#888',
    },
    messageBubble: {
        borderRadius: 10,
        padding: 10,
        marginTop: 2,
    },
    ownMessage: {
        backgroundColor: '#2563eb',
    },
    theirMessage: {
        backgroundColor: '#e5e7eb',
    },
    ownText: {
        color: 'white',
    },
    theirText: {
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        padding: 10,
        borderRadius: 8,
    },
    sendButton: {
        backgroundColor: '#2563eb',
        marginLeft: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    sendText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

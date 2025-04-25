// External
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Alert, Platform, StyleSheet, RefreshControl, Keyboard, KeyboardTypeOptions, KeyboardAvoidingView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

// Internal
import { usePropertiesContext } from "@/src/Contexts";
import { Property, PropertyFields, PropertyStates, propertyTypeMap } from "@/src/Types";
import { selectAuthUser } from "@/src/Redux";
import { RootStackParamList } from "./MainView";
import useMainViewJumbotron from "../Hooks/useMainViewJumbotron";

export const EditProperty: React.FC = () => {
    // Hooks
    const route = useRoute();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { propertyById, readPropertyById, updatePropertyWithImages, updatePropertyAvailability } = usePropertiesContext();
    const { handleScroll, handleFocusEffect } = useMainViewJumbotron({
        title: `Edit Listing`,
        faIcon: faArrowLeft,
        htmlIcon: '🔑',
        visibility: 100
    })

    // State
    const { propertyId } = route.params as { propertyId: string };
    const authUser = useSelector(selectAuthUser); // Redux authenticated user
    const [renderProperty, setRenderProperty] = useState<PropertyStates>(undefined);
    const [uploadedFiles, setUploadedFiles] = useState<(File | string)[]>([]);
    const [refreshing, setRefreshing] = useState(false)

    // Keyboard toolbar
    const scrollRef = useRef<ScrollView>(null);
    const inputRefs = useRef<TextInput[]>([]);
    const inputLayouts = useRef<{ [key: number]: { y: number; height: number } }>({});
    const inputs = [
        { label: "Property Title", field: "Property_Title", keyboard: "default" },
        { label: "Price per Month", field: "Property_Price_Per_Month", keyboard: "numeric" },
        { label: "Number of Bedrooms", field: "Property_Num_Bedrooms", keyboard: "numeric" },
        { label: "Number of Bathrooms", field: "Property_Num_Bathrooms", keyboard: "numeric" },
        { label: "Square Feet", field: "Property_Square_Feet", keyboard: "numeric" },
    ]

    // Methods
    const onRefresh = useCallback(() => {
        Alert.alert(
            "Confirm",
            "Are you sure you want to reset your changes?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Yes",
                    onPress: () => {
                        setRefreshing(true);
                        readPropertyById(parseInt(propertyId));
                    },
                },
            ]
        );
    }, [])

    const handleInputChange = (field: PropertyFields, value: string | number) => {
        if (renderProperty) {
            setRenderProperty({
                ...renderProperty,
                [field]: typeof value === "number" ? parseInt(value.toString(), 10) : value,
            });
        }
    };

    const handleSaveProperty = async () => {
        if (!renderProperty) return;

        const errors: string[] = [];

        if (!renderProperty.Property_Title || renderProperty.Property_Title.length > 255)
            errors.push("Title is required and must be under 255 characters.");
        if (!renderProperty.Property_Address || renderProperty.Property_Address.length > 500)
            errors.push("Address is required and must be under 500 characters.");
        if (!renderProperty.Property_City || renderProperty.Property_City.length > 255)
            errors.push("City is required and must be under 255 characters.");
        if (!renderProperty.Property_Zip_Code || renderProperty.Property_Zip_Code.length > 20)
            errors.push("Zip code is required and must be under 20 characters.");
        if (renderProperty.Property_Price_Per_Month <= 0)
            errors.push("Monthly price must be greater than 0.");
        if (renderProperty.Property_Num_Bedrooms < 1)
            errors.push("At least 1 bedroom is required.");
        if (renderProperty.Property_Num_Bathrooms < 1)
            errors.push("At least 1 bathroom is required.");

        if (errors.length > 0) {
            Alert.alert("Validation Error", errors.join("\n"));
            return;
        }

        const property = await updatePropertyWithImages(renderProperty, uploadedFiles);
        if (property) {
            navigation.navigate("My Properties");
        } else {
            Alert.alert("Error", "An error happened, please try again.");
        }
    };

    const handleUpdateAvailability = async () => {
        if (!renderProperty) return;

        Alert.alert(
            "Confirm",
            "Are you sure you want to change availability?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Yes",
                    onPress: async () => {
                        const updated = await updatePropertyAvailability(renderProperty, {
                            Property_Available_From: renderProperty.Property_Available_From,
                            Property_Available_To: renderProperty.Property_Available_To,
                            Property_Is_Active: !renderProperty.Property_Is_Active
                        });

                        if (updated) {
                            navigation.navigate("EditProperty", { propertyId: (updated.Property_ID ?? "").toString() });
                        } else {
                            Alert.alert("Error", "Failed to update.");
                        }
                    }
                }
            ]
        );
    };

    // Effects
    useEffect(() => {
        if (authUser?.User_ID) {
            readPropertyById(parseInt(propertyId));
        }
    }, [authUser]);

    useEffect(() => {
        setRenderProperty(propertyById)

        if (refreshing) setRefreshing(false)
    }, [propertyById]);

    useFocusEffect(
        useCallback(() => {
            handleFocusEffect()
        }, [])
    )

    // Render
    if (!authUser?.User_ID) return <Text>Please log in to edit this listing.</Text>;
    if (propertyById === false) return <Text>Property not found.</Text>;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // Adjust if you have headers/navbars
        >
            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.container}
                onScroll={handleScroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text style={styles.heading}>Edit Listing</Text>

                {renderProperty && (
                    <>
                        {!renderProperty.Property_Is_Active && (
                            <Text style={{ color: "red", fontWeight: "bold", marginVertical: 10 }}>
                                This property is currently marked as rented out.
                            </Text>
                        )}

                        {inputs.map((input, index) => (
                            <View
                                key={index}
                                onLayout={(event) => {
                                    inputLayouts.current[index] = event.nativeEvent.layout;
                                }}
                            >
                                <Text>{input.label}</Text>
                                <TextInput
                                    ref={(ref) => {
                                        if (ref) inputRefs.current[index] = ref;
                                    }} // Assign ref to input
                                    style={styles.input}
                                    placeholder={input.label}
                                    value={renderProperty[input.field as keyof Property]?.toString()}
                                    onChangeText={(text) =>
                                        handleInputChange(input.field as PropertyFields, text)
                                    }
                                    onFocus={() => {
                                        // Delay to ensure layout has been measured
                                        setTimeout(() => {
                                            const layout = inputLayouts.current[index];
                                            if (layout) {
                                                scrollRef.current?.scrollTo({
                                                    y: layout.y - 20, // Add some padding above input
                                                    animated: true,
                                                });
                                            }
                                        }, 100);
                                    }}
                                    keyboardType={input.keyboard as KeyboardTypeOptions}

                                    returnKeyType="next"
                                    onSubmitEditing={() => inputRefs.current[(index + 1)]?.focus()} // Move to password field
                                    blurOnSubmit={false} // Prevent keyboard from dismissing
                                />
                            </View>
                        ))}

                        <Text>Property Type</Text>
                        <Picker
                            selectedValue={renderProperty.Property_Property_Type.toString()}
                            onValueChange={(value: string) => handleInputChange("Property_Property_Type", value)}
                            style={styles.input}
                        >
                            <Picker.Item label="Select property type" value="" />
                            {Object.entries(propertyTypeMap).map(([key, label]) => (
                                <Picker.Item key={key} label={label} value={key} />
                            ))}
                        </Picker>

                        <View
                            onLayout={(event) => {
                                inputLayouts.current[5] = event.nativeEvent.layout;
                            }}
                        >
                            <Text>Description</Text>
                            <TextInput
                                ref={(ref) => {
                                    if (ref) inputRefs.current[5] = ref;
                                }} // Assign ref to input
                                style={[styles.input, styles.textarea]}
                                placeholder="Description"
                                value={renderProperty.Property_Description}
                                onChangeText={(text) => handleInputChange("Property_Description", text)}
                                onFocus={() => {
                                    // Delay to ensure layout has been measured
                                    setTimeout(() => {
                                        const layout = inputLayouts.current[5];
                                        if (layout) {
                                            scrollRef.current?.scrollTo({
                                                y: layout.y - 20, // Add some padding above input
                                                animated: true,
                                            });
                                        }
                                    }, 100);
                                }}
                                multiline
                                numberOfLines={6}

                                blurOnSubmit={true}
                            />
                        </View>

                        <View style={{ flex: 1, flexDirection: "column", gap: 10 }}>
                            <Button title="Save Listing" onPress={handleSaveProperty} />
                            <Button
                                title={renderProperty.Property_Is_Active ? "Mark as Rented Out" : "Mark as Available"}
                                onPress={handleUpdateAvailability}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    textarea: {
        height: 120,
        textAlignVertical: "top",
    },
});

export default EditProperty;

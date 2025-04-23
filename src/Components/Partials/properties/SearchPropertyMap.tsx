import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Property } from "@/src/types";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Filters, RootStackParamList } from "@/src/Views";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faList } from "@fortawesome/free-solid-svg-icons";

const { width, height } = Dimensions.get("window");

interface PropertyMapProps {
    properties: Property[];
    updateFilter: (key: keyof Filters, value: string) => void
}

export const SearchPropertyMap: React.FC<PropertyMapProps> = ({ properties, updateFilter }) => {
    const [defaultRegion, setDefaultRegion] = useState({
        latitude: 39.8283,
        longitude: -98.5795,
        latitudeDelta: 20,
        longitudeDelta: 20,
    });

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    useEffect(() => {
        if (properties.length > 0) {
            const { Property_Latitude, Property_Longitude } = properties[0];
            setDefaultRegion({
                latitude: Property_Latitude,
                longitude: Property_Longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
            });
        }
    }, [properties]);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.listButton}
                onPress={() => updateFilter("view", "list")}
            >
                <FontAwesomeIcon icon={faList} />
                <Text>List</Text>
            </TouchableOpacity>
            <MapView
                style={styles.map}
                initialRegion={defaultRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {properties.map((property) => {
                    const image = property.images?.find(img => img.Image_Order === 1);

                    return (
                        <Marker
                            key={property.Property_ID}
                            coordinate={{
                                latitude: property.Property_Latitude,
                                longitude: property.Property_Longitude,
                            }}
                        >
                            <Callout onPress={() => navigation.navigate("PropertyDetails", { propertyId: (property.Property_ID ?? "").toString() })}>
                                <View style={styles.callout}>
                                    {image && (
                                        <Image
                                            source={{ uri: image.Image_URL }}
                                            style={styles.image}
                                            resizeMode="cover"
                                        />
                                    )}
                                    <Text style={styles.title}>{property.Property_Title}</Text>
                                    <Text style={styles.subtitle}>
                                        {property.Property_City}, {property.Property_Zip_Code}
                                    </Text>
                                    <Text style={styles.details}>
                                        {property.Property_Square_Feet} m² · {property.Property_Num_Bedrooms} vær.
                                    </Text>
                                    <Text style={styles.price}>
                                        {property.Property_Price_Per_Month.toLocaleString()} kr./md.
                                    </Text>
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: height * 0.75,
        borderRadius: 12,
        overflow: "hidden",
    },
    listButton: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    map: {
        width: "100%",
        height: "100%",
    },
    callout: {
        width: 260,
        padding: 8,
    },
    image: {
        width: "100%",
        height: 100,
        borderRadius: 8,
        marginBottom: 6,
    },
    title: {
        fontWeight: "bold",
        fontSize: 14,
    },
    subtitle: {
        color: "#555",
        fontSize: 12,
    },
    details: {
        fontSize: 12,
        marginTop: 4,
        color: "#666",
    },
    price: {
        marginTop: 4,
        fontSize: 14,
        color: "green",
        fontWeight: "bold",
    },
});

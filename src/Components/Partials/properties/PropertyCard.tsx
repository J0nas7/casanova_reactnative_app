import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Property } from '@/src/Types';
import { RootStackParamList } from '@/src/Views';
import { env } from '@/src/env';

type PropertyCardProps = {
    property: Property;
};

const propertyTypeMap: Record<string, string> = {
    apartment: 'Apartment',
    house: 'House',
    condo: 'Condo',
    // Add other mappings as needed
};

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const image = property.images?.find(img => img.Image_Order === 1);

    const handlePress = () => {
        if (property.Property_ID) {
            navigation.navigate('PropertyDetails', { propertyId: property.Property_ID.toString() })
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.card}>
            <View style={styles.imageContainer}>
                {image ? (
                    <Image
                        source={{
                            uri:
                                image.Image_URL ||
                                `${env.url.API_URL}/storage/${image.Image_Path}`,
                        }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imageFallback}>
                        <Text>No Image</Text>
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <Text style={styles.title}>{property.Property_Title}</Text>
                <Text style={styles.city}>{property.Property_City}</Text>
                <Text style={styles.price}>${property.Property_Price_Per_Month} / month</Text>

                <View style={styles.meta}>
                    <Text>{property.Property_Num_Bedrooms} Beds</Text>
                    <Text>{property.Property_Num_Bathrooms} Baths</Text>
                    <Text>{propertyTypeMap[property.Property_Property_Type] || 'Property'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 16,
    },
    imageContainer: {
        height: 180,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {},
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    city: {
        color: '#666',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#16a34a',
        marginBottom: 8,
    },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        color: '#666',
        fontSize: 12,
    },
});

// External
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, ScrollView, Text, Button, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Keyboard, Platform, Animated, RefreshControl } from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSliders } from '@fortawesome/free-solid-svg-icons';

// Internal
import { usePropertiesContext } from '@/src/Contexts'
import { Property, propertyTypeMap } from '@/src/Types'
import { Field } from '@/src/Components'
import { PropertyCard } from '../Components/Partials/properties/PropertyCard'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { AppDispatch, selectMainViewJumbotron, setMainViewJumbotron, useTypedSelector } from '../Redux';
import useMainViewJumbotron from '../Hooks/useMainViewJumbotron';

interface Filters {
    propertyType: string
    city: string
    minPrice: string
    maxPrice: string
    bedrooms: string
    bathrooms: string
}

export const SearchListingsView: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>()
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron)

    const route = useRoute()
    const routeParams = route.params as Partial<Filters> | undefined

    const [refreshing, setRefreshing] = useState(false)
    const [filters, setFilters] = useState<Filters>({
        propertyType: routeParams?.propertyType || '',
        city: routeParams?.city || '',
        minPrice: routeParams?.minPrice || '',
        maxPrice: routeParams?.maxPrice || '',
        bedrooms: routeParams?.bedrooms || '',
        bathrooms: routeParams?.bathrooms || '',
    })

    const { properties, readProperties } = usePropertiesContext()
    const { handleScroll, handleFocusEffect } = useMainViewJumbotron({
        title: 'Search for Listings',
        htmlIcon: '🔍',
        visibility: 100
    })

    useFocusEffect(
        useCallback(() => {
            handleFocusEffect()
        }, [dispatch])
    )

    useEffect(() => {
        readProperties()
    }, [])

    useEffect(() => {
        if (Array.isArray(properties) && properties.length > 0) {
            setRefreshing(false)
        }
    }, [properties])

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        readProperties(true)
    }, [])

    const [showFilters, setShowFilters] = useState<boolean>(false)
    const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false)
    const [modalTop] = useState(new Animated.Value(-500)) // Initial position of modal off-screen

    const updateFilter = (key: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const filteredProperties = Array.isArray(properties) ? properties.filter((property) => {
        return (
            (!filters.city || property.Property_City.toLowerCase().includes(filters.city.toLowerCase())) &&
            (!filters.minPrice || property.Property_Price_Per_Month >= Number(filters.minPrice)) &&
            (!filters.maxPrice || property.Property_Price_Per_Month <= Number(filters.maxPrice)) &&
            (!filters.bedrooms || property.Property_Num_Bedrooms >= Number(filters.bedrooms)) &&
            (!filters.bathrooms || property.Property_Num_Bathrooms >= Number(filters.bathrooms)) &&
            (!filters.propertyType || property.Property_Property_Type == Number(filters.propertyType))
        )
    }) : []

    // Keyboard listeners to detect when keyboard is shown or hidden
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, [])

    const openModal = () => {
        setShowFilters(true)
        // Animate the modal to come down from the top
        Animated.spring(modalTop, {
            toValue: 0, // Final position
            useNativeDriver: true,
        }).start()
    }

    const closeModal = () => {
        Keyboard.dismiss()
        readProperties()
        // Animate the modal back to the top
        Animated.spring(modalTop, {
            toValue: -500, // Start position off-screen
            useNativeDriver: true,
        }).start(() => setShowFilters(false)) // Once animation is complete, hide the modal
    }

    return (
        <ScrollView
            style={styles.container}
            onScroll={handleScroll}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <TouchableOpacity onPress={openModal} style={styles.headline}>
                <Text style={{ fontWeight: 'bold' }}>
                    {properties.length} Listings
                </Text>
                <Text>
                    <FontAwesomeIcon icon={faSliders} size={20} />
                </Text>
            </TouchableOpacity>

            {/* Listings Section */}
            <View style={styles.listings}>
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
                        <PropertyCard key={property.Property_ID} property={property} />
                    ))
                ) : (
                    <Text style={styles.noResults}>No properties found. Try adjusting your filters.</Text>
                )}
            </View>

            {/* Filters Modal Section */}
            <Modal
                visible={showFilters}
                // animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.modalBackground}>
                        <Animated.View
                            style={[styles.modalContainer, { transform: [{ translateY: modalTop }] }]}
                        >
                            {/* <View style={styles.modalContainer}> */}
                            <SafeAreaView>
                                <Text style={styles.subheading}>Filters</Text>

                                <Text style={styles.label}>Property Type</Text>
                                <View style={styles.select}>
                                    {propertyTypeMap && Object.entries(propertyTypeMap).map(([key, value]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[
                                                styles.option,
                                                filters.propertyType === key && styles.optionSelected,
                                            ]}
                                            onPress={() => updateFilter('propertyType', filters.propertyType === key ? '' : key)}
                                        >
                                            <Text>{value}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Field
                                    type="text"
                                    lbl="City"
                                    placeholder="Enter city"
                                    value={filters.city}
                                    onChange={(val: string) => updateFilter('city', val)}
                                    disabled={false}
                                />

                                <View style={styles.row}>
                                    <Field
                                        type="number"
                                        lbl="Min Price"
                                        placeholder="0"
                                        value={filters.minPrice}
                                        onChange={(val: string) => updateFilter('minPrice', val)}
                                        disabled={false}
                                        style={{ width: '50%' }}
                                    />
                                    <Field
                                        lbl="Max Price"
                                        type="number"
                                        placeholder="10000"
                                        value={filters.maxPrice}
                                        onChange={(val: string) => updateFilter('maxPrice', val)}
                                        disabled={false}
                                        style={{ width: '50%' }}
                                    />
                                </View>

                                <View style={styles.row}>
                                    <Field
                                        lbl="Bedrooms"
                                        type="number"
                                        placeholder="1+"
                                        value={filters.bedrooms}
                                        onChange={(val: string) => updateFilter('bedrooms', val)}
                                        disabled={false}
                                        style={{ width: '50%' }}
                                    />
                                    <Field
                                        lbl="Bathrooms"
                                        type="number"
                                        placeholder="1+"
                                        value={filters.bathrooms}
                                        onChange={(val: string) => updateFilter('bathrooms', val)}
                                        disabled={false}
                                        style={{ width: '50%' }}
                                    />
                                </View>

                                <Button title="Close Filters" onPress={closeModal} />
                            </SafeAreaView>
                            {/* </View> */}
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    headline: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    heading: {
        fontSize: 26,
        fontWeight: 'bold'
    },
    subheading: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
    },
    listings: {
        marginTop: 8,
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        marginTop: 8,
    },
    label: {
        marginTop: 8,
        marginBottom: 4,
        fontWeight: '500',
    },
    select: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    option: {
        backgroundColor: '#f2f2f2',
        padding: 8,
        borderRadius: 6,
    },
    optionSelected: {
        backgroundColor: '#d6e4ff',
    },
    noResults: {
        marginTop: 16,
        fontSize: 16,
        color: '#777',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '100%',
        padding: 20,
        backgroundColor: 'white',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
})


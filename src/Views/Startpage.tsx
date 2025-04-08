// External
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, RefreshControl } from 'react-native'

// Internal
import { usePropertiesContext } from '@/src/Contexts'
import { Property, propertyTypeMap } from '@/src/Types'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from './MainView'
import { env } from '../env'
import { PropertyCard } from '../Components/Partials/properties/PropertyCard'
import { useDispatch } from 'react-redux'
import { AppDispatch, selectMainViewJumbotron, setMainViewJumbotron, useTypedSelector } from '../Redux'
import useMainViewJumbotron from '../Hooks/useMainViewJumbotron'

export const Startpage = () => {
    // Hooks
    const { properties, readProperties } = usePropertiesContext()
    const { handleScroll, handleFocusEffect } = useMainViewJumbotron({
        title: 'CasaNova',
        htmlIcon: '🏠',
        visibility: 100
    })

    // Redux
    const dispatch = useDispatch<AppDispatch>()
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron)

    // State
    const [numberOfProperties, setNumberOfProperties] = useState<number>(0)
    const [refreshing, setRefreshing] = useState(false)
    
    // Methods
    const onRefresh = useCallback(() => {
        setRefreshing(true)
        readProperties(true)
    }, [])

    // Effects
    useEffect(() => {
        readProperties()
    }, [])

    useEffect(() => {
        setNumberOfProperties(properties.length)
        if (properties.length > 0) {
            setRefreshing(false)
        }
    }, [properties])

    useFocusEffect(
        useCallback(() => {
            handleFocusEffect()
        }, [dispatch])
    )

    // Render
    return (
        <ScrollView
            style={styles.pageContent}
            onScroll={handleScroll}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <Text style={styles.heading}>
                Browse among {numberOfProperties} available properties
            </Text>

            <LatestAds properties={properties} />
            <PropertyCategories />
            <PopularCities properties={properties} />
            <PopularAds properties={properties} />
        </ScrollView>
    )
}

export const LatestAds = ({ properties }: { properties: Property[] }) => {
    if (!Array.isArray(properties) || properties.length === 0) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🆕 Latest Listings</Text>
                <Text style={styles.subText}>No properties available at the moment.</Text>
            </View>
        )
    }

    const latestProperties = [...properties]
        .sort((a, b) => (b.Property_ID ?? 0) - (a.Property_ID ?? 0))
        .slice(0, 6)

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🆕 Latest Listings</Text>
            {latestProperties.map((property) => (
                <PropertyCard key={property.Property_ID} property={property} />
            ))}
        </View>
    )
}

type NavigationProp = StackNavigationProp<RootStackParamList, 'Search'>

export const PropertyCategories = () => {
    const navigation = useNavigation<NavigationProp>()

    const categories = [
        { name: 'Apartments', icon: '🏢' },
        { name: 'Rooms', icon: '🏘' },
        { name: 'Houses', icon: '🏡' },
        { name: 'Townhouses', icon: '🏰' },
        { name: 'All rentals', icon: '' },
    ]

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏡 Property Categories</Text>
            <View style={styles.categoryRow}>
                {categories.map((category, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.categoryCard}
                        onPress={() => {
                            if (category.name === 'All rentals') {
                                navigation.navigate('Search')
                            }
                        }}
                    >
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                        <Text style={styles.categoryText}>{category.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    )
}

export const PopularCities = ({ properties }: { properties: Property[] }) => {
    if (!Array.isArray(properties) || properties.length === 0) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌆 Popular Cities</Text>
                <Text style={styles.subText}>No popular cities to display at the moment.</Text>
            </View>
        )
    }

    const cityCounts: { [key: string]: number } = {}
    properties.forEach((property) => {
        const city = property.Property_City
        if (city) {
            cityCounts[city] = (cityCounts[city] || 0) + 1
        }
    })

    const popularCities = Object.entries(cityCounts).map(([name, listings]) => ({ name, listings }))

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌆 Popular Cities</Text>
            {popularCities.map((city, index) => (
                <View key={index} style={styles.cityCard}>
                    <Text style={styles.cardTitle}>{city.name}</Text>
                    <Text style={styles.cardSub}>{city.listings} listing{city.listings > 1 ? 's' : ''}</Text>
                </View>
            ))}
        </View>
    )
}

export const PopularAds = ({ properties }: { properties: Property[] }) => {
    if (!Array.isArray(properties) || properties.length === 0) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔥 Most Popular Ads</Text>
                <Text style={styles.subText}>No popular ads to display at the moment.</Text>
            </View>
        )
    }

    const popularProperties = [...properties]
        .sort((a, b) => b.Property_Price_Per_Month - a.Property_Price_Per_Month)
        .slice(0, 3)

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Most Popular Ads</Text>
            {popularProperties.map((property) => (
                <PropertyCard key={property.Property_ID} property={property} />
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    pageContent: { padding: 16, backgroundColor: '#f5f5f5' },
    heading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16
    },
    section: { marginVertical: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    subText: { color: 'gray', marginTop: 4 },
    card: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 12, overflow: 'hidden', elevation: 2 },
    image: { width: '100%', height: 180, resizeMode: 'cover' },
    imagePlaceholder: { backgroundColor: '#ddd' },
    cardContent: { padding: 12 },
    cardTitle: { fontSize: 18, fontWeight: '600' },
    cardSub: { fontSize: 14, color: 'gray', marginVertical: 4 },
    cardPrice: { fontSize: 16, fontWeight: 'bold', color: 'green' },
    cardDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    cardDetail: { fontSize: 12, color: 'gray' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginVertical: 4, flexDirection: 'row', alignItems: 'center', width: '48%' },
    categoryIcon: { fontSize: 24, marginRight: 8 },
    categoryText: { fontSize: 16, fontWeight: '500' },
    cityCard: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, elevation: 1 },
})

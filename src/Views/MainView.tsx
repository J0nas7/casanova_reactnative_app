// External
import React, { use, useEffect } from 'react'
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEnvelope, faHome, faKey, faSearch, faUser } from '@fortawesome/free-solid-svg-icons'

// Internal
import { AppDispatch, selectAuthUser, selectMainViewJumbotron, setMainViewJumbotron, useTypedSelector } from '../Redux'
import { useAuth } from '@/src/Hooks'
import { LoginView, SearchListingsView, Startpage, UserProperties } from './'
import PropertyDetails from './PropertyDetails'
import { useDispatch } from 'react-redux'

export type RootStackParamList = {
    Tabs: undefined
    Home: undefined
    Search: undefined
    Login: undefined
    "My Properties": undefined
    PropertyDetails: { propertyId: string };
}

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator<RootStackParamList>()

const BottomTabs: React.FC = () => {
    const { } = useAuth()
    const authUser = useTypedSelector(selectAuthUser)

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = faHome; // Default icon

                    if (route.name === 'Home') {
                        iconName = faHome
                    } else if (route.name === 'Search') {
                        iconName = faSearch
                    } else if (route.name === 'Login') {
                        iconName = faUser
                    } else if (route.name === 'Messages') {
                        iconName = faEnvelope
                    } else if (route.name === 'My Properties') {
                        iconName = faKey
                    }

                    return <FontAwesomeIcon icon={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#0000FF',
                tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerShown: false,  // Hide header title for all screens in this navigator
            })}
        >
            <Tab.Screen 
                name="Home" 
                component={Startpage} 
                // options={{ unmountOnBlur: true }} // this removes the screen from memory when you navigate away
            />
            <Tab.Screen name="Search" component={SearchListingsView} />
            {authUser ? (
                <>
                    {/* <Tab.Screen name="Messages" component={MessagesView} /> */}
                    <Tab.Screen name="My Properties" component={UserProperties} />
                </>
            ) : (
                <Tab.Screen name="Login" component={LoginView} />
            )}
        </Tab.Navigator>
    )
}

const RootNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={BottomTabs} />
            <Stack.Screen name="PropertyDetails" component={PropertyDetails} />
        </Stack.Navigator>
    )
}

const MainViewJumbotron: React.FC = () => {
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron)
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
    
    if (mainViewJumbotron.visibility === 0) return null

    return (
        <View style={{
            width: '100%',
            height: 100,
            maxHeight: mainViewJumbotron.visibility,
            opacity: mainViewJumbotron.visibility / 100,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            backgroundColor: '#4ade80', // Tailwind bg-green-400 equivalent
        }}>
            <SafeAreaView style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: mainViewJumbotron.faIcon ? 'space-between' : 'center',
                alignItems: 'center',
                gap: 4,
                padding: 16
            }}>
                {mainViewJumbotron.faIcon && (
                    <TouchableOpacity
                        style={{ padding: 4 }}
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack()
                            } else {
                                navigation.navigate('Home') // Fallback to home
                            }
                        }}
                    >
                        <FontAwesomeIcon icon={mainViewJumbotron.faIcon} color={'white'} size={20} />
                    </TouchableOpacity>
                )}

                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                    {mainViewJumbotron.htmlIcon && (
                        <>
                            {mainViewJumbotron.htmlIcon}{' '}
                        </>
                    )}
                    {mainViewJumbotron.title}
                </Text>

                {mainViewJumbotron.faIcon && (
                    <View style={{ padding: 4 }}></View>
                )}
            </SafeAreaView>
        </View>
    )
}

export const MainView: React.FC = () => {
    const isAppReady = true         // Placeholder: toggle for loading screen

    return (
        <NavigationContainer>
            <MainViewJumbotron />

            <SafeAreaView style={styles.container}>
                {isAppReady ? (
                    <RootNavigator />
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#000" />
                    </View>
                )}
            </SafeAreaView>
        </NavigationContainer>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
})

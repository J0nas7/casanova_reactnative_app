// External
import React, { use, useEffect } from 'react'
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faBars, faEnvelope, faHome, faKey, faSearch, faUser } from '@fortawesome/free-solid-svg-icons'

// Internal
import { AppDispatch, selectIsLoggedIn, selectMainViewJumbotron, setMainViewJumbotron, useTypedSelector } from '../Redux'
import { useAuth } from '@/src/Hooks'
import { LoginView, SearchListingsView, Startpage, UserProperties } from './'
import PropertyDetails from './PropertyDetails'
import { MenuView } from './MenuView'
import { MessagesOverview } from './MessagesOverview'
import { MessageView } from './MessageView'
import EditProperty from './EditProperty'
import { Snackbar } from '../Components/UI/Snackbar'

export type RootStackParamList = {
    Tabs: undefined
    Home: undefined
    Search: undefined
    Login: undefined
    Profile: undefined
    Logout: undefined
    "My Properties": undefined
    PropertyDetails: { propertyId: string };
    MessageConversation: { propertyId: string };
    EditProperty: { propertyId: string };
}

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator<RootStackParamList>()
const MenuStack = createNativeStackNavigator();

type MenuStackProps = { name: string; component: React.FC<{}> }

const BottomTabs: React.FC = () => {
    const { } = useAuth()
    const isLoggedIn = useTypedSelector(selectIsLoggedIn)

    const ScreenWithJumbotron: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <>
            <HeaderJumbotron />
            {children}
            <Snackbar />
        </>
    );

    const withJumbotron = (Component: React.FC): React.FC => {
        return (props: any) => (
            <ScreenWithJumbotron>
                <Component {...props} />
            </ScreenWithJumbotron>
        );
    };

    const MenuStackNavigator: React.FC<MenuStackProps> = ({ name, component }) => {
        return (
            <MenuStack.Navigator screenOptions={{ headerShown: false }}>
                <MenuStack.Screen name={name} component={withJumbotron(component)} />
                <MenuStack.Screen name="PropertyDetails" component={withJumbotron(PropertyDetails)} />
                <MenuStack.Screen name="EditProperty" component={withJumbotron(EditProperty)} />
                <MenuStack.Screen name="My Properties" component={withJumbotron(UserProperties)} />
                <MenuStack.Screen name="MessageConversation" component={withJumbotron(MessageView)} />
            </MenuStack.Navigator>
        );
    };

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
                    } else if (route.name === 'Menu') {
                        iconName = faBars
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
            <Tab.Screen name="Home">
                {() => <MenuStackNavigator name="Home" component={Startpage} />}
            </Tab.Screen>
            <Tab.Screen name="Search">
                {() => <MenuStackNavigator name="Search" component={SearchListingsView} />}
            </Tab.Screen>
            {isLoggedIn ? (
                <>
                    <Tab.Screen name="Messages">
                        {() => <MenuStackNavigator name="Messages" component={MessagesOverview} />}
                    </Tab.Screen>
                    <Tab.Screen name="Menu">
                        {() => <MenuStackNavigator name="Menu" component={MenuView} />}
                    </Tab.Screen>
                </>
            ) : (
                <Tab.Screen name="Login" component={withJumbotron(LoginView)} />
            )}
        </Tab.Navigator>
    )
}

const RootNavigator: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={BottomTabs} />
            {/* <Stack.Screen name="PropertyDetails" component={PropertyDetails} />
            <Stack.Screen name="My Properties" component={UserProperties} /> */}
        </Stack.Navigator>
    )
}

const HeaderJumbotron: React.FC = () => {
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

    useEffect(() => {
        SplashScreen.hide()
    }, [])

    return (
        <NavigationContainer>
            {/* <SafeAreaView style={styles.container}> */}
            <View style={styles.container}>
                {isAppReady ? (
                    <RootNavigator />
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#000" />
                    </View>
                )}
            </View>
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

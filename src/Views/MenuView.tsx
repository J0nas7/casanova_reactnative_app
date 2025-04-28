import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useMainViewJumbotron from '../Hooks/useMainViewJumbotron';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faHome, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { RootStackParamList } from './MainView';
import { useAuth } from '../Hooks';

export const MenuView = () => {
    // Hooks
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { handleLogoutSubmit } = useAuth();
    const { handleFocusEffect } = useMainViewJumbotron({
        title: '',
        htmlIcon: '',
        visibility: 100
    })

    // Methods
    const handlePress = (menuItem: keyof RootStackParamList) => {
        navigation.navigate(menuItem as any);
    };

    // Effects
    useFocusEffect(
        useCallback(() => {
            handleFocusEffect()
        }, [])
    )

    const menuItems = [
        { label: 'Profile', icon: faUser, action: () => handlePress('Profile') },
        { label: 'My Properties', icon: faHome, action: () => handlePress('My Properties') },
        { label: 'Logout', icon: faSignOutAlt, action: () => handleLogoutSubmit() },
    ];

    return (
        <View style={styles.container}>
            {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
                    <FontAwesomeIcon icon={item.icon} size={24} color="#343a40" />
                    <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e9ecef',
    },
    menuItem: {
        width: '90%',
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        paddingVertical: 8,
        marginVertical: 10,
        backgroundColor: '#dee2e6',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuText: {
        color: '#343a40',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

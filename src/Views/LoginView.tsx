import React, { useCallback, useEffect, useState } from "react"
import { View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from "react-native"

// Internal
import { useAuth } from "@/src/Hooks"
import { AppDispatch, selectMainViewJumbotron, setMainViewJumbotron, useTypedSelector } from "../Redux"
import { useDispatch } from "react-redux"
import { useFocusEffect } from "@react-navigation/native"
import useMainViewJumbotron from "../Hooks/useMainViewJumbotron"

export const LoginView: React.FC = () => {
    // Hooks
    const dispatch = useDispatch<AppDispatch>()
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron)
    const { handleLoginSubmit } = useAuth()
    const { handleFocusEffect } = useMainViewJumbotron({
        title: 'Sign In',
        htmlIcon: '👤',
        visibility: 100
    })

    // Internal variables
    const [userEmail, setUserEmail] = useState<string>(
        __DEV__ ? 'admin@casanova.com' : ''
    )
    const [userPassword, setUserPassword] = useState<string>(
        __DEV__ ? 'admin123' : ''
    )
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [loginPending, setLoginPending] = useState<boolean>(false)

    // Methods
    const doLogin = () => {
        if (loginPending) return
        setLoginPending(true)

        handleLoginSubmit(userEmail, userPassword)
            .then((loginResult) => {
                if (loginResult) {
                    // Handle successful login
                    // You can use navigation to route after login
                }
            })
            .finally(() => {
                setLoginPending(false)
            })
    }

    // Effects
    useFocusEffect(
        useCallback(() => {
            handleFocusEffect()
        }, [dispatch])
    )

    return (
        <View style={styles.container}>
            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={userEmail}
                        onChangeText={setUserEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loginPending}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={userPassword}
                        onChangeText={setUserPassword}
                        placeholder="Enter your password"
                        secureTextEntry={!showPassword}
                        editable={!loginPending}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.showHideText}>
                            {showPassword ? 'Hide' : 'Show'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Button
                    title="Login"
                    onPress={doLogin}
                    disabled={loginPending}
                    color="#1ab11f"
                />
            </View>

            <View style={styles.linksContainer}>
                <TouchableOpacity onPress={() => {/* Navigate to forgot password screen */ }}>
                    <Text style={styles.link}>Forgot your password?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {/* Navigate to create account screen */ }}>
                    <Text style={styles.link}>Create a new account</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    form: {
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        marginBottom: 4,
        fontWeight: '600',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingLeft: 10,
        fontSize: 16,
    },
    showHideText: {
        color: '#1ab11f',
        marginTop: 8,
        textAlign: 'right',
    },
    linksContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    link: {
        color: '#1ab11f',
        fontWeight: 'bold',
        marginTop: 8,
        textDecorationLine: 'underline',
    },
})

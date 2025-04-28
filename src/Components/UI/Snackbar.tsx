// External
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

// Internal
import { RootStackParamList } from '@/src/Views';
import { AppDispatch, selectAppErrorMsg, setAppErrorMsg, useTypedSelector } from '@/src/Redux';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';

export const Snackbar: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const dispatch = useDispatch<AppDispatch>();

    const appErrorMsg = useTypedSelector(selectAppErrorMsg);

    if (!appErrorMsg) return null;

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={styles.appMessage}>{appErrorMsg}</Text>
                <TouchableOpacity
                    onPress={() => {
                        dispatch(setAppErrorMsg(undefined));
                    }}
                >
                    <FontAwesomeIcon style={styles.closeBar} icon={faXmark} size={20} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        backgroundColor: 'red',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    appMessage: {
        color: 'white',
        fontSize: 16,
    },
    closeBar: {
        color: 'black'
    },
});

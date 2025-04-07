import React, { ReactNode } from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
    StyleProp,
    ViewStyle
} from 'react-native';

type FieldProps = {
    type: string;
    lbl: string;
    customId?: string;
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: any) => void;
    endButton?: () => void;
    endContent?: ReactNode;
    disabled: boolean;
    error?: string;
    required?: boolean;
    style?: StyleProp<ViewStyle>;
    displayLabel?: boolean;
    innerLabel?: boolean;
    placeholder?: string;
    description?: string;
    grow?: boolean;
    growMin?: number;
    className?: string;
};

export const Field: React.FC<FieldProps> = ({
    type,
    lbl,
    customId,
    value,
    onChange,
    onKeyDown,
    endButton,
    endContent,
    disabled,
    error,
    required,
    style,
    displayLabel,
    innerLabel,
    placeholder,
    description,
    grow,
    growMin,
}) => {
    const keyboardType = type === 'number' ? 'numeric' : type === 'email' ? 'email-address' : 'default';

    return (
        <View style={[
            styles.container, 
            error && styles.errorContainer,
            style
        ]}>
            {((lbl || displayLabel) && !innerLabel) && (
                <Text style={styles.label}>
                    {lbl}{required ? ' *' : ''}
                </Text>
            )}

            <View style={styles.inputWrapper}>
                <TextInput
                    style={[
                        styles.input, 
                        grow && { height: growMin || 80 }
                    ]}
                    value={value}
                    placeholder={innerLabel ? lbl : placeholder}
                    onChangeText={onChange}
                    editable={!disabled}
                    keyboardType={keyboardType}
                    onKeyPress={onKeyDown}
                    multiline={grow}
                />

                {endButton && (
                    <TouchableOpacity onPress={endButton} style={styles.endButton}>
                        <Text>{endContent}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {description && <Text style={styles.description}>{description}</Text>}
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16
    },
    errorContainer: {
        borderColor: 'red',
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
        color: '#333',
    },
    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    endButton: {
        marginLeft: 8,
    },
    description: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    error: {
        fontSize: 12,
        color: 'red',
        marginTop: 4,
    },
});

// External
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Dimensions, Image } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faBed, faBath, faRulerCombined, faMoneyBillWave, faHouseChimney, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

// Internal
import { usePropertiesContext } from '@/src/Contexts';
import { Property, PropertyImage, propertyTypeMap, User } from '@/src/Types';
import { RootStackParamList } from './MainView';
import { env } from '../env';
import { useDispatch } from 'react-redux';
import { AppDispatch, selectMainViewJumbotron, setMainViewJumbotron, useTypedSelector } from '../Redux';
import useMainViewJumbotron from '../Hooks/useMainViewJumbotron';

const PropertyDetails: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>()
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron)

    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const { propertyId } = route.params as { propertyId: string };  // Get propertyId from route params
    const { propertyById, readPropertyById } = usePropertiesContext()
    const { defaultJumboState, setDefaultJumboState } = useMainViewJumbotron({
        title: "",
        faIcon: faArrowLeft,
        htmlIcon: undefined,
        visibility: 100
    })

    const [renderProperty, setRenderProperty] = useState<Property | undefined>(undefined);

    useEffect(() => {
        readPropertyById(parseInt(propertyId));  // Fetch property by ID
    }, [propertyId]);

    useEffect(() => {
        if (propertyById) {
            setRenderProperty(propertyById);
        }
    }, [propertyById])

    useEffect(() => {
        if (renderProperty) {
            const propertyTitle =
                `${renderProperty.Property_Num_Bedrooms}-room${' '}` +
                `${propertyTypeMap[renderProperty.Property_Property_Type]} of${' '}` +
                `${renderProperty.Property_Square_Feet} sqft`;
            
            setDefaultJumboState({
                ...defaultJumboState,
                title: propertyTitle,
                visibility: defaultJumboState?.visibility ?? 100,
            })
        }
    }, [renderProperty]);

    if (!renderProperty) return <Text>Loading...</Text>;

    if (propertyById === false) {
        return (
            <View>
                <Text>Property not found</Text>
                <TouchableOpacity onPress={() => navigation.navigate('My Properties')}>
                    <Text style={{ color: 'blue' }}>Go to Your Listings</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return <PropertyDetailsView property={renderProperty} />;
};

interface PropertyDetailsViewProps {
    property: Property;
}

const PropertyDetailsView: React.FC<PropertyDetailsViewProps> = ({ property }) => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [showMessageComposer, setShowMessageComposer] = useState<boolean>(false);

    if (!property.Property_Title) {
        return (
            <View>
                <Text>Property not found</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                    <Text style={{ color: 'blue' }}>Go to search</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ padding: 16 }}>
            {/* Property Availability */}
            {!property.Property_Is_Active && (
                <View style={{ backgroundColor: 'rgba(255, 0, 0, 0.5)', padding: 16, marginBottom: 16 }}>
                    <FontAwesomeIcon icon={faHouseChimney} style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white' }}>This listing is marked as unavailable.</Text>
                </View>
            )}

            {/* Jumbotron - Property Images */}
            <JumbotronImageRotation
                property={property}
                numberInRotation={3}
                setShowJumbotronHighlightImage={() => null}
            />

            {/* Property Information Section */}
            <PropertyInformationSection property={property} showMessageComposer={showMessageComposer} setShowMessageComposer={setShowMessageComposer} />
        </View>
    );
};

interface JumbotronImageRotationProps {
    property: Property;
    image?: PropertyImage
    numberInRotation: number; // Number of images to show in rotation at once
    enableAutoRotation?: boolean; // Boolean to enable/disable auto-rotation
    setShowJumbotronHighlightImage: (image: PropertyImage) => void; // Function to show the highlighted image
}

export const JumbotronImageRotation: React.FC<JumbotronImageRotationProps> = ({
    property,
    image,
    numberInRotation,
    enableAutoRotation = true, // Default to true if not provided
    setShowJumbotronHighlightImage,
}) => {
    const [currentImageOrderNr, setCurrentImageOrderNr] = useState<number>(0)
    const [currentRight, setCurrentRight] = useState<number>(0);
    const [nextRight, setNextRight] = useState<number>(100);
    const [rotationEnabled, setRotationEnabled] = useState<boolean>(enableAutoRotation);
    const imageCount = property.images?.length || 0;

    /**
     * Methods
     */

    // Function to run slider animation
    const runSliderAnimation = (duration = 1000, reverse = false) => {
        const stepTime = 10; // Update every 10ms
        const steps = duration / stepTime;
        const increment = 100 / steps;

        let current = reverse ? -100 : 0;
        let next = reverse ? 0 : 100;

        const currentInterval = setInterval(() => {
            current += reverse ? increment : -increment;
            if ((reverse && current >= 0) || (!reverse && current <= -100)) {
                current = reverse ? 0 : -100;
                clearInterval(currentInterval);
            }
            setCurrentRight(Math.round(current));
        }, stepTime);

        const nextInterval = setInterval(() => {
            next += reverse ? increment : -increment;
            if ((reverse && next >= 100) || (!reverse && next <= 0)) {
                next = reverse ? 100 : 0;
                clearInterval(nextInterval);
            }
            setNextRight(Math.round(next));
        }, stepTime);
    }

    useEffect(() => {
        if (rotationEnabled && imageCount > numberInRotation) {
            const mainInterval = setInterval(() => {
                runSliderAnimation()
            }, 3000); // Run every 3 seconds

            return () => clearInterval(mainInterval);
        }
    }, [imageCount, rotationEnabled, numberInRotation]);

    // Handle the interval logic based on rotationEnabled
    useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;
        let interval: NodeJS.Timeout | null = null;

        if (rotationEnabled && imageCount > numberInRotation) {
            console.log("Starting rotation (delay first by 3s)");

            timeout = setTimeout(() => {
                interval = setInterval(() => {
                    if (rotationEnabled) {
                        console.log("Rotating to next image", rotationEnabled);
                        setCurrentImageOrderNr((prevNr) => (prevNr + 1) % imageCount);
                    }
                }, 3000); // Rotate every 3 seconds after initial delay
            }, 3000); // Delay first rotation by 3 seconds
        } else {
            console.log("Rotation disabled");
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
                console.log("First delay cleared");
            }
            if (interval) {
                clearInterval(interval);
                console.log("Interval cleared");
            }
        };
    }, [imageCount, rotationEnabled, numberInRotation])

    const handlePrev = () => {
        setRotationEnabled(false)
        runSliderAnimation(250, true)
        setCurrentImageOrderNr((prevNr) => (prevNr - 1 + imageCount) % imageCount);
    };

    const handleNext = () => {
        setRotationEnabled(false)
        runSliderAnimation(250)
        setCurrentImageOrderNr((prevNr) => (prevNr + 1) % imageCount);
    };

    useEffect(() => {
        if (image && numberInRotation === 1) {
            const index = image.Image_Order || 0;
            setCurrentImageOrderNr(index - 1)
        }
    }, [image, numberInRotation])

    // Get the N images in rotation (in this case, `numberInRotation` is dynamic)
    const currentImages = imageCount > 0 && property.images
        ? Array.from({ length: Math.min(numberInRotation, imageCount) }).map((_, i) => {
            if (!property.images) return undefined;

            const index = (currentImageOrderNr + i) % imageCount;
            const nextIndex = (index + 1) % imageCount;
            const sortedImages = [...property.images].sort((a, b) => a.Image_Order - b.Image_Order);
            return {
                current: sortedImages[index],
                next: sortedImages[nextIndex],
            };
        })
        : [];

    return (
        <View style={stylesImageRotation.container}>
            {/* Image Grid */}
            <View style={stylesImageRotation.imageWrapper}>
                {currentImages.length > 0 ? (
                    currentImages.map((image, i) => (
                        <TouchableOpacity
                            key={i}
                            style={stylesImageRotation.imageContainer}
                            onPress={() =>
                                setShowJumbotronHighlightImage(
                                    (currentRight === -100 ? image?.next : image?.current) as PropertyImage
                                )
                            }
                        >
                            {/* Current Image */}
                            <Image
                                source={{
                                    uri:
                                        image?.current?.Image_URL ||
                                        `${env.url.API_URL}/storage/${image?.current?.Image_Path}`,
                                }}
                                style={[
                                    stylesImageRotation.image,
                                    numberInRotation > 1 && stylesImageRotation.absoluteImage,
                                    { left: `${currentRight}%` },
                                ]}
                                resizeMode="cover"
                            />

                            {/* Next Image */}
                            {numberInRotation > 1 && (
                                <Image
                                    source={{
                                        uri:
                                            image?.next?.Image_URL ||
                                            `${env.url.API_URL}/storage/${image?.next?.Image_Path}`,
                                    }}
                                    style={[
                                        stylesImageRotation.image,
                                        stylesImageRotation.absoluteImage,
                                        { right: `${-nextRight}%` },
                                    ]}
                                    resizeMode="cover"
                                />
                            )}

                            {/* Image Counter (current) */}
                            {!(currentRight === -100 && numberInRotation > 1) && (
                                <Text style={stylesImageRotation.imageCountText}>
                                    {(currentImageOrderNr + i) % imageCount + 1} / {imageCount}
                                </Text>
                            )}

                            {/* Image Counter (next) */}
                            {numberInRotation > 1 && (
                                <Text
                                    style={[
                                        stylesImageRotation.imageCountText,
                                        { right: (numberInRotation > 1 ? `${-nextRight}%` : 8) },
                                    ]}
                                >
                                    {(currentImageOrderNr + i + 1) % imageCount + 1} / {imageCount}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    Array.from({ length: numberInRotation }).map((_, index) => (
                        <View key={index} style={stylesImageRotation.imageContainer}>
                            <Image
                                source={{ uri: 'https://placecats.com/400/500' }}
                                style={stylesImageRotation.image}
                                resizeMode="cover"
                            />
                        </View>
                    ))
                )}
            </View>

            {/* Arrows */}
            {imageCount > numberInRotation && (
                <>
                    <TouchableOpacity style={stylesImageRotation.arrowLeft} onPress={handlePrev}>
                        <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={stylesImageRotation.arrowRight} onPress={handleNext}>
                        <FontAwesomeIcon icon={faArrowRight} size={20} color="#fff" />
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const screenWidth = Dimensions.get('window').width;
const stylesImageRotation = StyleSheet.create({
    container: {
        position: 'relative',
        maxHeight: '100%',
    },
    imageWrapper: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
    },
    imageContainer: {
        position: 'relative',
        width: screenWidth,
        height: 300,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    absoluteImage: {
        position: 'absolute',
    },
    imageCountText: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        fontSize: 12,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
    },
    arrowLeft: {
        position: 'absolute',
        left: 10,
        top: '50%',
        transform: [{ translateY: -20 }],
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
        zIndex: 10,
    },
    arrowRight: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -20 }],
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
        zIndex: 10,
    },
});

interface PropertyInformationSectionProps {
    property: Property;
    showMessageComposer: boolean;
    setShowMessageComposer: React.Dispatch<React.SetStateAction<boolean>>;
}

const PropertyInformationSection: React.FC<PropertyInformationSectionProps> = ({ property, showMessageComposer, setShowMessageComposer }) => (
    <ScrollView style={{ marginTop: 16 }}>

        {/* Left Section - Title & Description */}
        <View style={{ flex: 2, backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{property.Property_Title}</Text>
            <Text style={{ color: '#777' }}>{property.Property_Description.replace(/<\/?[^>]+(>|$)/g, "")}</Text>
        </View>

        {/* Right Section - Property Details */}
        <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>🏠 Property Details</Text>
            <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#333' }}>
                    <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: 'green', marginRight: 8 }} />
                    <Text>
                        <Text style={{ fontWeight: 'bold' }}>Price:</Text> ${property.Property_Price_Per_Month} / month
                    </Text>
                </Text>
            </View>
            <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#333' }}>
                    <FontAwesomeIcon icon={faBed} style={{ color: 'blue', marginRight: 8 }} />
                    <Text>
                        <Text style={{ fontWeight: 'bold' }}>Bedrooms:</Text> {property.Property_Num_Bedrooms}
                    </Text>
                </Text>
            </View>
            <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#333' }}>
                    <FontAwesomeIcon icon={faBath} style={{ color: 'blue', marginRight: 8 }} />
                    <Text>
                        <Text style={{ fontWeight: 'bold' }}>Bathrooms:</Text> {property.Property_Num_Bathrooms}
                    </Text>
                </Text>
            </View>
            <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#333' }}>
                    <FontAwesomeIcon icon={faRulerCombined} style={{ color: '#777', marginRight: 8 }} />
                    <Text>
                        <Text style={{ fontWeight: 'bold' }}>Size:</Text> {property.Property_Square_Feet} sqft
                    </Text>
                </Text>
            </View>

            {/* Message Composer */}
            <View style={{ marginTop: 16 }}>
                <TouchableOpacity
                    onPress={() => setShowMessageComposer(!showMessageComposer)}
                    style={{
                        backgroundColor: '#007BFF',
                        padding: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ color: 'white' }}>
                        Write message to landlord
                    </Text>
                </TouchableOpacity>
                {showMessageComposer && (
                    // Here, you can render your message composer if needed
                    <Text>Message Composer will go here</Text>
                )}
            </View>
        </View>
    </ScrollView>
);

export default PropertyDetails;

// External
import React, { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

// Internal
import {
    AppDispatch,
    MainViewJumbotronType,
    selectMainViewJumbotron,
    setMainViewJumbotron,
    useTypedSelector
} from '@/src/Redux'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

const useMainViewJumbotron = (defaultJumbo: MainViewJumbotronType | undefined) => {
    const dispatch = useDispatch<AppDispatch>()
    const mainViewJumbotron = useTypedSelector(selectMainViewJumbotron)

    const [defaultJumboState, setDefaultJumboState] = React.useState<MainViewJumbotronType | undefined>(defaultJumbo)

    // This function will be called when the user scrolls
    const scrollOffset = useRef(0)
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentOffset = event.nativeEvent.contentOffset.y
        
        if (currentOffset <= 0) {
            dispatch(setMainViewJumbotron({
                ...mainViewJumbotron,
                visibility: 100
            }))
            scrollOffset.current = currentOffset
            return
        }

        const direction = currentOffset > scrollOffset.current ? 'down' : 'up'

        dispatch(setMainViewJumbotron({
            ...mainViewJumbotron,
            visibility: direction === 'down' ?
                (mainViewJumbotron.visibility - 10) :
                (mainViewJumbotron.visibility + 10)
        }))

        scrollOffset.current = currentOffset
    }

    // This function will be called when the user focuses on the screen
    const handleFocusEffect = () => {
        dispatch(setMainViewJumbotron({
            ...mainViewJumbotron,
            ...defaultJumboState
        }))
    }

    useEffect(() => {
        // Set the default jumbotron state
        dispatch(setMainViewJumbotron({
            ...mainViewJumbotron,
            ...defaultJumboState
        }))
    }, [defaultJumboState])

    return {
        defaultJumboState,
        setDefaultJumboState,
        handleScroll,
        handleFocusEffect
    }
}

export default useMainViewJumbotron

// External
import React from 'react'
import { Provider } from 'react-redux'

// Internal
import { MainView } from '@/src/Views'
import { store } from '@/src/Redux'
import { TypeProvider } from './src/CoreUI/Template/TypeProvider'

function App() {
    return (
        <MainView />
    )
}

const AppProvider = () => (
    <Provider store={store}>
        <TypeProvider>
            <App />
        </TypeProvider>
    </Provider>
)

export default AppProvider
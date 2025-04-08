npm install:
    @reduxjs/toolkit react-redux redux-thunk
    @react-navigation/native
    @react-navigation/stack @react-navigation/native-stack
    axios
    @react-native-async-storage/async-storage

    react-native-gesture-handler
    react-native-screens
    react-native-safe-area-context

    react-native-svg @fortawesome/react-native-fontawesome @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-brands-svg-icons @fortawesome/free-regular-svg-icons

    @react-navigation/bottom-tabs react-native-paper
    





    react-native-webview@11.25.0
    formik yup
    react-native-splash-screen
    @react-native-firebase/app@latest @react-native-firebase/auth@latest @react-native-firebase/firestore@latest @react-native-firebase/messaging
    react-native-push-notification
    react-native-device-info
    

    react-native-fbsdk-next
    @react-native-google-signin/google-signin

    react-native-safari-view react-native-inappbrowser-reborn

    react-native-keyboard-aware-scroll-view
    react-native-notifications

    --save-dev:
        babel-plugin-module-resolver


        
        @types/react-native-push-notification
        @types/react-native-safari-view





Key: 
Team: 


## iOS repo-update:
pod install --repo-update

## Android Studio couldn't find node?
## Should be run from a terminal window.
## If you are using Mac you can run Android Studio using this command in terminal. 
open -a /Applications/Android\ Studio.app

## Update JavaScript bundle for Android
npx react-native bundle --platform android --dev true --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

## APK build for Android
./gradlew assembleRelease
=> android/app/build/outputs/apk/release/

## AAB build for Android
./gradlew bundleRelease

## macOS Play a sound after finishing a command:
&& afplay /System/Library/Sounds/Submarine.aiff -v 10

Versioning:
npm version patch/minor/major --no-git-tag-version
npx react-native-version

npm version
npx react-native --version

Xcode Derived Data:
~/Library/Developer/Xcode/DerivedData

Before AirDrop sharing:
rm -f package-lock.json
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/build
rm -rf android/build
rm -rf android/app/build


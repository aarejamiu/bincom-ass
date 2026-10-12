# CV Cordova App

## Setup
```
npm install -g cordova
cd cv-app
cordova platform add android      # and/or: cordova platform add browser
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-geolocation
cordova plugin add cordova-plugin-device
```

The app contains Profile, Education, Skills/Projects, and Contact pages. Use the
bottom navigation, Previous/Next buttons, or swipe left and right to move between
pages. On a device, Profile lets you take a photo or choose one from the gallery;
Contact can show your current location and device details, open the location in
Maps, send an email, and share the CV.

Update the sample personal and education details in `www/index.html` and the
skills, projects, and contact email in `www/js/app.js` before distributing the
app.

## Run
```
cordova run browser
cordova run android          # device/emulator
cordova build android        # APK in platforms/android/app/build/outputs/apk
```

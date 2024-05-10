import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB3boZBkBB2Dm2mH8G5ZWmdJiqrwOdq6zI",
    authDomain: "cs-130-project-4a50e.firebaseapp.com",
    projectId: "cs-130-project-4a50e",
    storageBucket: "cs-130-project-4a50e.appspot.com",
    messagingSenderId: "778681514699",
    appId: "1:778681514699:web:41ee99f72d206c8524394e",
    measurementId: "G-QN029G6K4X"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export default firebase;
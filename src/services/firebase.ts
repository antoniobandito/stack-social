import { getApps, initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { setLogLevel } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCw9Ff3frX1PYwziK0Jr3I9yvyvkWxy9P8",
    authDomain: "stack-efd80.firebaseapp.com",
    projectId: "stack-efd80",
    storageBucket: "stack-efd80.appspot.com",
    messagingSenderId: "808166236379",
    appId: "1:808166236379:web:ce1fb65ef5b289283bacfe",
    measurementId: "G-R8G3CE6FJ0",
};

// Initalize Firebase app only if not already intialized 

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
// Set authentication persistence to local storage
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Auth persistence set to local storage");
    })
    .catch((error) => {
        console.error("Error setting auth persistence:", error);
    });

const db = getFirestore(app);
const storage = getStorage(app);

setLogLevel('debug');

export { auth, db, storage };


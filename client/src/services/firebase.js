// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { differenceInDays, startOfDay } from 'date-fns';

const firebaseConfig = {
    apiKey: "AIzaSyD64jDtSIROG3ApTlpPD7WJRTNCgEmbmp8",
  authDomain: "fit-streak-79534.firebaseapp.com",
  databaseURL: "https://fit-streak-79534-default-rtdb.firebaseio.com",
  projectId: "fit-streak-79534",
  storageBucket: "fit-streak-79534.firebasestorage.app",
  messagingSenderId: "78437991007",
  appId: "1:78437991007:web:687fcbff074412fdd3d1ea",
  measurementId: "G-T4JKE250K3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// src/services/firebase.js
export const authService = {
    register: async (email, password) => {
        try {
            console.log('Starting registration process for:', email);
            
            // Create user in Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User created in Authentication:', user.uid);

            // Verify the user is properly authenticated
            const currentUser = auth.currentUser;
            console.log('Current authenticated user:', currentUser?.uid);
            
            if (!currentUser) {
                throw new Error('User not properly authenticated after creation');
            }

            // Create the user document in Firestore
            const userRef = doc(db, 'users', user.uid);
            console.log('Attempting to create Firestore document for user:', user.uid);

            // Get the user's ID token to verify authentication state
            const idToken = await currentUser.getIdToken();
            console.log('Successfully obtained user ID token');

            const userData = {
                email: user.email,
                createdAt: serverTimestamp(),
                streak: 1,
                lastCheckIn: null,
                goals: {
                    distance: { value: 2.0, unit: 'miles', current: 0 },
                    time: { value: 20, unit: 'mins', current: 0 },
                    calories: { value: 200, unit: 'cal', current: 0 }
                }
            };

            console.log('User data to be stored:', userData);

            try {
                // Verify the document doesn't already exist
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    console.log('Document already exists for user:', user.uid);
                    return user;
                }

                await setDoc(userRef, userData);
                console.log('Successfully created Firestore document');
                
                // Verify the document was created
                const verifyDoc = await getDoc(userRef);
                if (!verifyDoc.exists()) {
                    throw new Error('Document was not created successfully');
                }
                console.log('Verified document creation:', verifyDoc.data());
            } catch (firestoreError) {
                console.error('Firestore error details:', {
                    code: firestoreError.code,
                    message: firestoreError.message,
                    stack: firestoreError.stack
                });
                
                if (firestoreError.code === 'permission-denied') {
                    console.error('Permission denied. Check Firestore rules.');
                    console.log('Current security context:', {
                        uid: currentUser.uid,
                        email: currentUser.email,
                        isAnonymous: currentUser.isAnonymous,
                        emailVerified: currentUser.emailVerified
                    });
                }
                throw firestoreError;
            }

            return user;
        } catch (error) {
            console.error('Registration error:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    },

    // ... rest of the service
    getCurrentUser: () => {
        return auth.currentUser;
    },

    subscribeToAuthChanges: (callback) => {
        return onAuthStateChanged(auth, callback);
    }
};

export const streakService = {
    async initializeUserStreak(userId) {
        console.log('Starting initializeUserStreak with userId:', userId);
        
        if (!userId) {
            console.error('No userId provided to initializeUserStreak');
            throw new Error('User ID is required');
        }

        // Verify authentication state
        const currentUser = auth.currentUser;
        console.log('Current authenticated user:', currentUser?.uid);
        
        if (!currentUser) {
            console.error('No authenticated user found');
            throw new Error('User must be authenticated');
        }

        if (currentUser.uid !== userId) {
            console.error('User ID mismatch:', {
                providedId: userId,
                currentUserId: currentUser.uid
            });
            throw new Error('User ID mismatch');
        }

        try {
            const userRef = doc(db, 'users', userId);
            console.log('Attempting to access document at:', `users/${userId}`);
            
            const userDoc = await getDoc(userRef);
            console.log('Document exists?', userDoc.exists());

            if (!userDoc.exists()) {
                console.log('Creating new user document...');
                const userData = {
                    streak: 1,
                    lastCheckIn: null,
                    goals: {
                        distance: { value: 2.0, unit: 'miles', current: 0 },
                        time: { value: 20, unit: 'mins', current: 0 },
                        calories: { value: 200, unit: 'cal', current: 0 }
                    }
                };

                try {
                    await setDoc(userRef, userData);
                    console.log('Successfully created user document');
                } catch (writeError) {
                    console.error('Error writing document:', {
                        code: writeError.code,
                        message: writeError.message,
                        details: writeError
                    });
                    throw writeError;
                }
            }

            return { streak: 1, lastCheckIn: null };
        } catch (error) {
            console.error('Error in initializeUserStreak:', {
                code: error.code,
                message: error.message,
                details: error
            });
            throw error; // Throw the original error to preserve the error details
        }
    },

    async getStreak(userId) {
        if (!userId) {
            console.error('No userId provided to getStreak');
            throw new Error('User ID is required');
        }

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.error('User document not found');
                throw new Error('User document not found');
            }

            const userData = userDoc.data();
            return {
                streak: userData.streak || 0,
                lastCheckIn: userData.lastCheckIn
            };
        } catch (error) {
            console.error('Error getting streak:', error);
            throw error;
        }
    }
};

export { auth, db };
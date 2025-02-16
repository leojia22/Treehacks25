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

            // Initialize Terra auth after successful registration
            try {
                await terraService.getTerraAuthToken(user.uid);
            } catch (terraError) {
                console.error('Terra authentication failed:', terraError);
                // We don't throw here to not block the registration process
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

    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Initialize Terra auth after successful login
            try {
                await terraService.getTerraAuthToken(user.uid);
            } catch (terraError) {
                console.error('Terra authentication failed:', terraError);
                // We don't throw here to not block the login process
            }

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
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

import axios from "axios";

const BACKEND_URL = "http://localhost:5002";
const dev_id = '4actk-fitstreak-testing-wfRE9vBU8U'
const api_key = 'A-vwB8CGUoNrQvbP0SUM-dD4mABGFq7Z'
export const terraService = {
    async getTerraAuthToken(userId) {
        try {
            console.log("Making request to Terra service with userId:", userId);
            const response = await axios.post(
                `${BACKEND_URL}/authToken`, 
                { reference_id: userId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': api_key,      // Make sure these values are defined
                        'dev-id': dev_id
                    },
                    withCredentials: false  // Set to true if you need cookies
                }
            );
            console.log("Received response:", response);
            return response.data;
        } catch (error) {
            console.error("Full error object:", error);
            console.error("Error response:", error.response);
            console.error("Error request:", error.request);
            console.error("Error config:", error.config);
            throw error;
        }
    }
};

export const streakService = {
    initializeUserStreak: async (userId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/get_streak`);
            return {
                streak: response.data.streak.current,
                lastCheckIn: new Date()
            };
        } catch (error) {
            console.error('Error initializing streak:', error);
            throw error;
        }
    },

    getStreak: async (userId) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/get_streak`);
            return {
                streak: response.data.streak.current,
                lastCheckIn: new Date()
            };
        } catch (error) {
            console.error('Error getting streak:', error);
            throw error;
        }
    },

    updateStreak: async (userId) => {
        try {
            const response = await axios.post(`${BACKEND_URL}/update_streak`);
            return {
                streak: response.data.streak.current,
                lastCheckIn: new Date()
            };
        } catch (error) {
            console.error('Error updating streak:', error);
            throw error;
        }
    },

    resetStreak: async (userId) => {
        try {
            const response = await axios.post(`${BACKEND_URL}/reset_streak`);
            return {
                streak: response.data.streak.current,
                lastCheckIn: new Date()
            };
        } catch (error) {
            console.error('Error resetting streak:', error);
            throw error;
        }
    }
};

export const goalsService = {
    async getGoals() {
        try {
            const response = await fetch('http://localhost:5002/get_goals');
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.error);
            return data.goals;
        } catch (error) {
            console.error('Error getting goals:', error);
            throw error;
        }
    },

    async updateGoals() {
        try {
            const response = await fetch('http://localhost:5002/get_goals');
            const data = await response.json();
            if (data.status === 'error') throw new Error(data.error);
            return data.goals;
        } catch (error) {
            console.error('Error updating goals:', error);
            throw error;
        }
    }
};

export { auth, db };
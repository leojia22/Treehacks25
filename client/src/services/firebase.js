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
    collection,
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { differenceInDays, startOfDay } from 'date-fns';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD64jDtSIROG3ApTlpPD7WJRTNCgEmbmp8",
    authDomain: "running-app-3c8af.firebaseapp.com",
    projectId: "running-app-3c8af",
    storageBucket: "running-app-3c8af.appspot.com",
    messagingSenderId: "1019404978793",
    appId: "1:1019404978793:web:f17e7721f57f64e6e5ab62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Default user data
const defaultUserData = {
    streak: 0,
    lastCheckIn: null,
    createdAt: serverTimestamp(),
    goals: {
        distance: { value: 2.0, unit: 'miles', current: 0 },
        time: { value: 20, unit: 'mins', current: 0 },
        calories: { value: 200, unit: 'cal', current: 0 }
    }
};

// Auth service
export const authService = {
    // Register new user
    register: async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                ...defaultUserData,
                email: user.email,
            });

            return user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    // Sign in existing user
    login: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Sign out
    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser: () => {
        return auth.currentUser;
    },

    // Subscribe to auth state changes
    subscribeToAuthChanges: (callback) => {
        return onAuthStateChanged(auth, callback);
    }
};

// Streak service
export const streakService = {
    // Initialize user streak
    async initializeUserStreak(userId) {
        if (!userId) throw new Error('User ID is required');

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, defaultUserData);
            }
        } catch (error) {
            console.error('Error initializing user streak:', error);
            throw new Error('Failed to initialize user data');
        }
    },

    // Update streak
    async updateStreak(userId) {
        if (!userId) throw new Error('User ID is required');

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                await this.initializeUserStreak(userId);
                return { streak: 0, lastCheckIn: null };
            }

            const userData = userDoc.data();
            const now = startOfDay(new Date());
            const lastCheckIn = userData.lastCheckIn ? startOfDay(userData.lastCheckIn.toDate()) : null;
            
            let newStreak = userData.streak || 0;
            
            if (!lastCheckIn) {
                // First check-in
                newStreak = 1;
            } else {
                const daysSinceLastCheckIn = differenceInDays(now, lastCheckIn);
                
                if (daysSinceLastCheckIn === 1) {
                    // Consecutive day, increment streak
                    newStreak += 1;
                } else if (daysSinceLastCheckIn === 0) {
                    // Same day, keep streak
                    return {
                        streak: newStreak,
                        lastCheckIn
                    };
                } else {
                    // Missed a day, reset streak
                    newStreak = 1;
                }
            }

            // Update in Firebase
            await updateDoc(userRef, {
                streak: newStreak,
                lastCheckIn: now
            });

            return {
                streak: newStreak,
                lastCheckIn: now
            };
        } catch (error) {
            console.error('Error updating streak:', error);
            throw new Error('Failed to update streak');
        }
    },

    // Get current streak
    async getStreak(userId) {
        if (!userId) throw new Error('User ID is required');

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                await this.initializeUserStreak(userId);
                return { streak: 0, lastCheckIn: null };
            }

            const userData = userDoc.data();
            const lastCheckIn = userData.lastCheckIn ? userData.lastCheckIn.toDate() : null;
            
            // Check if streak should be reset
            if (lastCheckIn) {
                const daysSinceLastCheckIn = differenceInDays(new Date(), lastCheckIn);
                if (daysSinceLastCheckIn > 1) {
                    // Reset streak if more than one day has passed
                    await updateDoc(userRef, {
                        streak: 0
                    });
                    return { streak: 0, lastCheckIn };
                }
            }

            return {
                streak: userData.streak || 0,
                lastCheckIn
            };
        } catch (error) {
            console.error('Error getting streak:', error);
            throw new Error('Failed to get streak');
        }
    }
};

// Goals service
export const goalsService = {
    // Get user goals
    async getUserGoals(userId) {
        if (!userId) throw new Error('User ID is required');

        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User document not found');
            }

            return userDoc.data().goals;
        } catch (error) {
            console.error('Error getting goals:', error);
            throw new Error('Failed to get user goals');
        }
    },

    // Update user goals
    async updateGoals(userId, newGoals) {
        if (!userId) throw new Error('User ID is required');

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                goals: newGoals
            });
        } catch (error) {
            console.error('Error updating goals:', error);
            throw new Error('Failed to update goals');
        }
    }
};

export { auth, db };
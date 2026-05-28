import { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

interface UseAuthReturn {
    currentUser: User | null;
    isAuthReady: boolean;
    handleSignOut: () => Promise<void>;
}

/**
 * Custom hook for managing Firebase authentication state
 * Handles Google sign-in with anonymous fallback
 */
export function useAuth(): UseAuthReturn {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const authInitialized = useRef(false);

    useEffect(() => {
        const initAuth = async () => {
            if (!auth) {
                console.error("Firebase configuration is missing.");
                // Fail open so UI can handle it or show error
                setIsAuthReady(true);
                return;
            }

            // Timeout Failsafe: If Firebase doesn't respond in 5s, assume unauthenticated
            const timeoutId = setTimeout(() => {
                if (!authInitialized.current) {
                    console.warn("Auth check timed out. Defaulting to unauthenticated.");
                    authInitialized.current = true;
                    setIsAuthReady(true);
                }
            }, 5000);

            const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
                if (!authInitialized.current) {
                    authInitialized.current = true;
                }
                setCurrentUser(user);
                setIsAuthReady(true);
            });

            return () => {
                unsubscribe();
                clearTimeout(timeoutId);
            };
        };

        initAuth();
    }, []);

    const handleSignOut = async () => {
        if (auth) {
            try {
                await signOut(auth);
            } catch (e) {
                console.error("Sign out failed:", e);
                throw e;
            }
        }
    };

    return { currentUser, isAuthReady, handleSignOut };
}

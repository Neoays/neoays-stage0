import { useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { UserProfile } from '../types';

interface MobileCheckResult {
    exists: boolean;
    userId?: string;
    userName?: string;
    email?: string;
    profile?: UserProfile;
}

interface UseMobileVerificationReturn {
    checkMobileExists: (mobile: string) => Promise<MobileCheckResult>;
    getUserByMobile: (mobile: string) => Promise<UserProfile | null>;
    checking: boolean;
    error: string | null;
}

/**
 * Custom hook for mobile number verification
 * Checks if a mobile number exists in the database
 * Returns user information if found
 */
export function useMobileVerification(): UseMobileVerificationReturn {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkMobileExists = useCallback(async (mobile: string): Promise<MobileCheckResult> => {
        if (!mobile || mobile.length < 10) {
            return { exists: false };
        }

        setChecking(true);
        setError(null);

        try {
            // Query users collection for matching mobile number
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('mobileNumber', '==', mobile));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // User exists
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as UserProfile;

                return {
                    exists: true,
                    userId: userDoc.id,
                    userName: userData.displayName || userData.username,
                    email: userData.email,
                    profile: { ...userData, id: userDoc.id }
                };
            }

            // User doesn't exist
            return { exists: false };
        } catch (err: any) {
            console.error('Error checking mobile number:', err);
            setError(err.message || 'Failed to verify mobile number');
            return { exists: false };
        } finally {
            setChecking(false);
        }
    }, []);

    const getUserByMobile = useCallback(async (mobile: string): Promise<UserProfile | null> => {
        const result = await checkMobileExists(mobile);
        return result.profile || null;
    }, [checkMobileExists]);

    return {
        checkMobileExists,
        getUserByMobile,
        checking,
        error
    };
}

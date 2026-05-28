import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { User } from 'firebase/auth';
import { ThemeId } from '../types/theme';

export const useSaveThemeToFirebase = (
    currentUser: User | null,
    themeId: ThemeId
) => {
    useEffect(() => {
        const saveTheme = async () => {
            if (!currentUser || !db) return;

            try {
                const userDocRef = doc(db, `users/${currentUser.uid}`);
                await updateDoc(userDocRef, {
                    themeId: themeId,
                });
                // Success notification could be added here
            } catch (error) {
                console.error('Failed to save theme to Firebase:', error);
            }
        };

        // Debounce the save operation
        const timeoutId = setTimeout(saveTheme, 1000);
        return () => clearTimeout(timeoutId);
    }, [currentUser, themeId]);
};

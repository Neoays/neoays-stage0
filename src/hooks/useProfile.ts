import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebaseConfig';
import { UserProfile, UserLink } from '../types';

interface UseProfileReturn {
    profileData: UserProfile | null;
    loading: boolean;
    isRefreshing: boolean;
    setProfileData: React.Dispatch<React.SetStateAction<UserProfile | null>>;
    handleUpdateProfileLinks: (updatedLinks: UserLink[]) => Promise<void>;
    handleUpdatePhoto: (imageDataUrl: string) => Promise<void>;
}

interface UseProfileOptions {
    currentUser: User | null;
    isAuthReady: boolean;
    onNotification: (notif: { type: 'error' | 'success', message: string }) => void;
    targetProfileId?: string | null;
}

/**
 * Custom hook for managing user profile data and operations.
 * Uses localStorage cache for instant loading on return visits,
 * then silently refreshes from Firestore in the background.
 */
export function useProfile({ currentUser, isAuthReady, onNotification, targetProfileId }: UseProfileOptions): UseProfileReturn {
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const targetCollection = targetProfileId ? 'profiles' : 'users';
    const finalDocId = targetProfileId || currentUser?.uid;

    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            if (!db || !currentUser || !isAuthReady || currentUser.isAnonymous || !finalDocId) {
                if (isAuthReady && isMounted) {
                    setProfileData(null);
                    setLoading(false);
                }
                return;
            }

            // ─────────────────────────────────────────────────────────
            // STEP 1: Check localStorage cache for instant load (<5ms)
            // ─────────────────────────────────────────────────────────
            const cacheKey = `dashboard_profile_${finalDocId}`;
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const cacheAge = Date.now() - (parsed._cachedAt || 0);
                    if (cacheAge < 10 * 60 * 1000) { // 10 minutes
                        if (isMounted) {
                            setProfileData(parsed);
                            setLoading(false);
                            setIsRefreshing(true);
                        }
                        // Silently refresh from Firestore in background
                        refreshFromFirebase(cacheKey, isMounted, true);
                        return;
                    }
                }
            } catch { /* Corrupted cache, continue to fresh fetch */ }

            // ─────────────────────────────────────────────────────────
            // STEP 2: No cache — fresh load from Firestore
            // ─────────────────────────────────────────────────────────
            setIsRefreshing(true);
            await refreshFromFirebase(cacheKey, isMounted, false);
        };

        const refreshFromFirebase = async (cacheKey: string, mounted: boolean, silent: boolean) => {
            let timeoutId: ReturnType<typeof setTimeout> | undefined;

            // 5s failsafe timeout
            if (!silent) {
                timeoutId = setTimeout(() => {
                    if (mounted) {
                        console.warn('Profile fetch timeout — stopping loading state');
                        setLoading(false);
                    }
                }, 5000);
            }

            try {
                const profileRef = doc(db, `${targetCollection}/${finalDocId}`);
                const profileSnap = await getDoc(profileRef);
                if (timeoutId) clearTimeout(timeoutId);

                if (!mounted) return;

                if (profileSnap.exists()) {
                    const data = { id: profileSnap.id, ...profileSnap.data() } as UserProfile;
                    setProfileData(data);
                    // Update cache
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({ ...data, _cachedAt: Date.now() }));
                    } catch { /* Storage quota exceeded — ignore */ }
                } else {
                    console.warn('Profile not found for user:', finalDocId);
                    if (!silent) setProfileData(null);
                }

                if (!silent) setLoading(false);
                setIsRefreshing(false);
            } catch (e) {
                if (timeoutId) clearTimeout(timeoutId);
                console.error('Error fetching user profile:', e);
                if (mounted && !silent) {
                    onNotification({ type: 'error', message: 'Failed to fetch user profile.' });
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, isAuthReady, targetProfileId, finalDocId, targetCollection]);

    const handleUpdateProfileLinks = async (updatedLinks: UserLink[]) => {
        if (!db || !currentUser || !finalDocId) {
            onNotification({ type: 'error', message: 'Not authenticated.' });
            return;
        }
        const profileDocPath = `${targetCollection}/${finalDocId}`;
        try {
            await updateDoc(doc(db, profileDocPath), { links: updatedLinks });
            setProfileData(prev => prev ? { ...prev, links: updatedLinks } : null);
            onNotification({ type: 'success', message: 'Links updated successfully!' });
        } catch (error) {
            console.error('Error updating links: ', error);
            onNotification({ type: 'error', message: 'Failed to update links.' });
        }
    };

    const handleUpdatePhoto = async (imageDataUrl: string) => {
        if (!storage || !db || !currentUser || !finalDocId) {
            onNotification({ type: 'error', message: 'Services not ready. Please wait.' });
            return;
        }
        onNotification({ type: 'success', message: 'Uploading your new photo...' });
        const storageRef = ref(storage, `profileImages/${finalDocId}`);
        try {
            await uploadString(storageRef, imageDataUrl, 'data_url');
            const downloadURL = await getDownloadURL(storageRef);
            const profileDocPath = `${targetCollection}/${finalDocId}`;
            await updateDoc(doc(db, profileDocPath), { photoURL: downloadURL });
            setProfileData(prev => prev ? { ...prev, photoURL: downloadURL } : null);
            onNotification({ type: 'success', message: 'Profile photo updated!' });
        } catch (error) {
            console.error('Error updating profile photo:', error);
            onNotification({ type: 'error', message: 'Failed to update profile photo.' });
        }
    };

    return {
        profileData,
        loading,
        isRefreshing,
        setProfileData,
        handleUpdateProfileLinks,
        handleUpdatePhoto
    };
}

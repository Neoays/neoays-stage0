import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { UserProfile } from '../types';
import PublicProfilePage from '../features/profile/PublicProfilePage';
import ProfileSkeleton from '../components/ProfileSkeleton';
import { ConnectionsProvider } from '../contexts/ConnectionsContext';
import { useAuth } from '../hooks/useAuth';

// =============================================================================
// INSTANT LOADING ARCHITECTURE
// =============================================================================
// 1. Try Firebase Hosting CDN first (/profiles/{username}.json) - ~50ms
// 2. Show theme-matching skeleton immediately
// 3. Load full profile from Firestore in background
// =============================================================================

interface CDNProfile {
    username?: string;
    nEliteRedirectEnabled?: boolean;
    profileType?: string;
    displayName?: string;
    mobileNumber?: string;
    photoURL?: string;
    themeId?: string;
    themeSettings?: {
        layoutStyle?: string;
        primaryColor?: string;
    };
}

// Fetch from Firebase Hosting CDN (instant ~50ms)
const fetchFromCDN = async (username: string): Promise<CDNProfile | null> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

        const response = await fetch(`/profiles/${username.toLowerCase()}.json`, {
            cache: 'default',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        // CDN fetch failed, continue with Firebase
    }
    return null;
};

const PublicProfileView = ({ username }: { username: string }) => {
    const { currentUser } = useAuth();
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [cdnData, setCdnData] = useState<CDNProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const dataFetched = useRef(false);

    useEffect(() => {
        if (dataFetched.current) return;
        dataFetched.current = true;

        const loadProfile = async () => {
            const cacheKey = `profile_v2_${username.toLowerCase()}`;

            // =================================================================
            // STEP 1: Check localStorage cache
            // =================================================================
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    const cacheAge = Date.now() - (parsed._cachedAt || 0);
                    if (cacheAge < 5 * 60 * 1000) { // 5 minute cache (was 1 hour)
                        // nElite: instant redirect even from cache
                        if (parsed.nEliteRedirectEnabled && parsed.username) {
                            const protocol = window.location.protocol;
                            window.location.replace(`${protocol}//ncard.neoays.com/${parsed.username}`);
                            return;
                        }
                        setProfileData(parsed);
                        setCdnData(parsed); // Use for theme info
                        applyTheme(parsed); // Apply theme immediately from cache
                        setIsLoading(false);
                        loadFromFirebase(cacheKey, true); // Background refresh
                        return;
                    }
                } catch (e) { /* Invalid cache */ }
            }

            // =================================================================
            // STEP 2: Try CDN for instant theme info (skeleton matching only)
            // =================================================================
            const cdnProfile = await fetchFromCDN(username);
            if (cdnProfile) {
                // nElite: instant redirect from CDN profile if enabled
                if (cdnProfile.nEliteRedirectEnabled && cdnProfile.username) {
                    const protocol = window.location.protocol;
                    window.location.replace(`${protocol}//ncard.neoays.com/${cdnProfile.username}`);
                    return;
                }

                setCdnData(cdnProfile);
                // Apply theme immediately so skeleton matches the profile theme
                if (cdnProfile.themeSettings?.primaryColor) {
                    document.documentElement.style.setProperty('--color-primary', cdnProfile.themeSettings.primaryColor);
                }
                // DO NOT set profileData or isLoading here — keep skeleton visible
                // until full Firebase data arrives to prevent partial-render flashing
            }

            // =================================================================
            // STEP 3: Load full profile from Firebase
            // =================================================================
            await loadFromFirebase(cacheKey, false);
        };

        const loadFromFirebase = async (cacheKey: string, silent: boolean) => {
            try {
                if (!db) throw new Error("Firestore not initialized");

                // Find profile
                const usernameDocSnap = await getDoc(doc(db, `usernames/${username.toLowerCase()}`));
                let targetId = '';
                let targetCollection = 'users';

                if (usernameDocSnap.exists()) {
                    const mapping = usernameDocSnap.data() as { userId?: string, profileId?: string };
                    targetId = mapping.profileId || mapping.userId || '';
                    if (mapping.profileId) {
                        targetCollection = 'profiles';
                    } else if (mapping.userId) {
                        targetCollection = 'public_profiles'; // Prioritize migrated public collection
                    }
                }

                if (!targetId) {
                    // Start checking isolated public profiles first!
                    const publicProfileDoc = await getDoc(doc(db, 'public_profiles', username));
                    if (publicProfileDoc.exists()) {
                        targetId = publicProfileDoc.id;
                        targetCollection = 'public_profiles';
                    } else {
                        // Fallback to legacy
                        const profileDoc = await getDoc(doc(db, 'profiles', username));
                        if (profileDoc.exists()) {
                            targetId = profileDoc.id;
                            targetCollection = 'profiles';
                        } else {
                            const userDoc = await getDoc(doc(db, 'users', username));
                            if (userDoc.exists()) {
                                targetId = userDoc.id;
                                targetCollection = 'users';
                            }
                        }
                    }
                }

                if (!targetId) {
                    if (!silent) {
                        setProfileData(null);
                        setIsLoading(false);
                    }
                    return;
                }

                // STRICT DATA ISOLATION: Public profile reads ONLY from `public_profiles`.
                // Fallback to `users` ONLY if `public_profiles` has no document (pre-migration).
                let finalData: UserProfile | null = null;

                if (targetCollection === 'public_profiles') {
                    const publicSnap = await getDoc(doc(db, `public_profiles/${targetId}`));

                    if (publicSnap.exists()) {
                        // Public profile exists — use ONLY this data, no merge from users
                        finalData = { id: targetId, ...publicSnap.data() } as UserProfile;
                    } else {
                        // Pre-migration fallback: public_profiles not yet created, read from users
                        const legacySnap = await getDoc(doc(db, `users/${targetId}`));
                        if (legacySnap.exists()) {
                            finalData = { id: targetId, ...legacySnap.data() } as UserProfile;
                        }
                    }
                } else {
                    const profileDocSnap = await getDoc(doc(db, `${targetCollection}/${targetId}`));
                    if (profileDocSnap.exists()) {
                        finalData = { id: profileDocSnap.id, ...profileDocSnap.data() } as UserProfile;
                    }
                }

                if (finalData) {
                    // ── nElite: instant, no-delay redirect ──────────────────
                    if (finalData.nEliteRedirectEnabled && finalData.username) {
                        // Redirect to ncard.neoays.com, preserving the protocol
                        // so both http and https work correctly in all environments.
                        const protocol = window.location.protocol; // 'https:' or 'http:'
                        window.location.replace(`${protocol}//ncard.neoays.com/${finalData.username}`);
                        return; // Stop further rendering/processing
                    }
                    // ────────────────────────────────────────────────────────

                    setProfileData(finalData);
                    setIsLoading(false);

                    // Cache
                    try {
                        localStorage.setItem(cacheKey, JSON.stringify({ ...finalData, _cachedAt: Date.now() }));
                    } catch { /* Quota exceeded */ }

                    // Apply theme
                    applyTheme(finalData);

                    // Track view
                    trackView(targetCollection, targetId);
                }
            } catch (error) {
                console.error("Firebase load error:", error);
                if (!silent) {
                    setProfileData(null);
                    setIsLoading(false);
                }
            }
        };

        const applyTheme = (data: UserProfile) => {
            if (data.themeSettings) {
                const root = document.documentElement;
                if (data.themeSettings.primaryColor) {
                    root.style.setProperty('--color-primary', data.themeSettings.primaryColor);
                }
                if (data.themeSettings.customFont) {
                    const font = data.themeSettings.customFont;
                    root.style.setProperty('--font-family', font);
                    root.style.setProperty('--font-heading', font);
                    const fontName = font.split(',')[0].replace(/['"]/g, '').trim();
                    const systemFonts = ['Inter', 'sans-serif', 'serif', 'monospace'];
                    if (!systemFonts.includes(fontName)) {
                        const linkId = `google-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
                        if (!document.getElementById(linkId)) {
                            const link = document.createElement('link');
                            link.id = linkId;
                            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;600;700;800&display=swap`;
                            link.rel = 'stylesheet';
                            document.head.appendChild(link);
                        }
                    }
                }
            }
            document.title = `${data.displayName || data.username} | Neoays`;
        };

        const trackView = (collection: string, id: string) => {
            const sessionKey = `viewed_${id}`;
            if (!sessionStorage.getItem(sessionKey)) {
                setDoc(doc(db, `${collection}/${id}/stats/general`), {
                    totalViews: increment(1),
                    lastViewed: serverTimestamp()
                }, { merge: true }).catch(() => { });
                sessionStorage.setItem(sessionKey, 'true');
            }
        };

        loadProfile();
    }, [username]);

    // Show theme-matching skeleton while loading
    if (isLoading && !profileData) {
        return (
            <ProfileSkeleton
                themeId={cdnData?.themeId}
                layoutStyle={cdnData?.themeSettings?.layoutStyle}
                primaryColor={cdnData?.themeSettings?.primaryColor}
            />
        );
    }

    return (
        <ConnectionsProvider userId={currentUser?.uid || ''}>
            <Helmet>
                <title>{`${profileData?.displayName || profileData?.username || 'Profile'} | Neoays`}</title>
                <meta name="description" content={profileData?.bio || `Connect with ${profileData?.displayName || profileData?.username} on Neoays.`} />
                <meta property="og:type" content="profile" />
                <meta property="og:title" content={profileData?.displayName || profileData?.username || 'Digital Profile'} />
                <meta property="og:description" content={profileData?.bio || `Connect on Neoays.`} />
                <meta property="og:url" content={window.location.href} />
                {profileData?.photoURL && <meta property="og:image" content={profileData.photoURL} />}
                <meta property="og:site_name" content="Neoays" />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            {/* Smooth fade-in to prevent flash */}
            <div className="animate-fade-in" style={{ animationDuration: '0.3s' }}>
                <PublicProfilePage profileData={profileData} isLoading={isLoading} />
            </div>
        </ConnectionsProvider>
    );
};

export default PublicProfileView;

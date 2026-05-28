import React, { useState, useEffect } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { auth, db } from '../../services/firebaseConfig';
import AuthScreen from './AuthScreen';

interface AuthContainerProps {
    onLoginSuccess: (user: User) => void;
}

const AuthContainer: React.FC<AuthContainerProps> = ({ onLoginSuccess }) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const [status, setStatus] = useState<'idle' | 'checking' | 'exists' | 'new'>('idle');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'error' | 'success', message: string } | null>(null);

    // Debounced identifier check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (identifier.length >= 3) {
                checkIdentifier(identifier);
            } else {
                setStatus('idle');
                setAuthMode('signup');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [identifier]);

    const checkIdentifier = async (val: string) => {
        if (!db || !auth) return;
        setStatus('checking');

        const cleanVal = val.toLowerCase().trim();

        try {
            // 1. Check if it's an email
            if (cleanVal.includes('@') && cleanVal.includes('.')) {
                const methods = await fetchSignInMethodsForEmail(auth, cleanVal);
                if (methods.length > 0) {
                    setAuthMode('login');
                    setStatus('exists');
                    return;
                }
            }

            // 2. Check if it's a username (strip @ if present)
            const username = cleanVal.startsWith('@') ? cleanVal.slice(1) : cleanVal;
            const userDoc = await getDoc(doc(db, 'usernames', username));
            if (userDoc.exists()) {
                setAuthMode('login');
                setStatus('exists');
                return;
            }

            // 3. Check if it's a mobile number (numeric)
            const numericValue = cleanVal.replace(/[^0-9+]/g, '');
            if (numericValue.length >= 8) {
                const mobileDoc = await getDoc(doc(db, 'mobiles', numericValue));
                if (mobileDoc.exists()) {
                    setAuthMode('login');
                    setStatus('exists');
                    return;
                }
            }

            // Default to signup if not found
            setAuthMode('signup');
            setStatus('new');
        } catch (e) {
            console.error("Error checking identifier:", e);
            setStatus('idle');
        }
    };

    const handleUnifiedAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !db) return setNotification({ type: 'error', message: "Service not ready." });
        if (!identifier || !password) return setNotification({ type: 'error', message: "Please fill all fields." });

        setIsLoading(true);
        setNotification(null);

        try {
            let finalEmail = "";
            const cleanIdentifier = identifier.toLowerCase().trim();

            if (authMode === 'login') {
                // Resolve email for login
                if (cleanIdentifier.includes('@') && cleanIdentifier.includes('.')) {
                    finalEmail = cleanIdentifier;
                } else if (cleanIdentifier.startsWith('@')) {
                    const userDoc = await getDoc(doc(db, 'usernames', cleanIdentifier.slice(1)));
                    const userId = userDoc.data()?.userId;
                    const profile = await getDoc(doc(db, 'users', userId));
                    finalEmail = profile.data()?.email;
                } else {
                    // Try username first, then mobile
                    const userDoc = await getDoc(doc(db, 'usernames', cleanIdentifier));
                    if (userDoc.exists()) {
                        const userId = userDoc.data()?.userId;
                        const profile = await getDoc(doc(db, 'users', userId));
                        finalEmail = profile.data()?.email;
                    } else {
                        const numericValue = cleanIdentifier.replace(/[^0-9+]/g, '');
                        const mobileDoc = await getDoc(doc(db, 'mobiles', numericValue));
                        if (mobileDoc.exists()) {
                            const userId = mobileDoc.data()?.userId;
                            const profile = await getDoc(doc(db, 'users', userId));
                            finalEmail = profile.data()?.email;
                        }
                    }
                }

                if (!finalEmail) throw new Error("Could not resolve account email.");
                const userCredential = await signInWithEmailAndPassword(auth, finalEmail, password);
                onLoginSuccess(userCredential.user);
            } else {
                // Signup Flow
                if (cleanIdentifier.includes('@') && cleanIdentifier.includes('.')) {
                    finalEmail = cleanIdentifier;
                } else {
                    // Generate proxy email for mobile/username signup
                    const suffix = cleanIdentifier.startsWith('@') ? cleanIdentifier.slice(1) : cleanIdentifier.replace(/[^a-z0-9]/g, '');
                    finalEmail = `${suffix.toLowerCase()}@auth.neoays.com`;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, finalEmail, password);
                await createProfileDocuments(userCredential.user, cleanIdentifier, finalEmail);
                onLoginSuccess(userCredential.user);
            }
        } catch (e) {
            const err = e as FirebaseError;
            console.error("Auth error:", err);
            let message = "An error occurred. Please try again.";
            if (err.code === 'auth/wrong-password') message = "Invalid password.";
            else if (err.code === 'auth/user-not-found') message = "Account not found.";
            else if (err.code === 'auth/email-already-in-use') {
                message = "This identifier is already linked to an account. Switching to Login...";
                setAuthMode('login');
                setStatus('exists');
            }
            else if (err.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
            else if (err.message) message = err.message;
            setNotification({ type: 'error', message });
        } finally {
            setIsLoading(false);
        }
    };

    const createProfileDocuments = async (user: User, idVal: string, resolvedEmail: string) => {
        if (!db) {
            console.error("Firestore not available for profile creation");
            throw new Error("Database not ready. Please try again.");
        }
        const cleanId = idVal.toLowerCase().trim();
        let username = "";
        let mobile = "";

        if (cleanId.includes('@') && cleanId.includes('.')) {
            username = cleanId.split('@')[0].replace(/[^a-z0-9]/g, ''); // default username from email
        } else if (cleanId.replace(/[^0-9+]/g, '').length >= 8) {
            mobile = cleanId.replace(/[^0-9+]/g, '');
            username = mobile; // default username to mobile
        } else {
            username = cleanId.startsWith('@') ? cleanId.slice(1) : cleanId;
        }

        // Check if username already exists, if so, add random suffix
        let finalUsername = username;
        const existingDoc = await getDoc(doc(db, `usernames/${username}`));
        if (existingDoc.exists()) {
            finalUsername = `${username}${Math.random().toString(36).substring(2, 6)}`;
        }

        // Create username mapping
        await setDoc(doc(db, `usernames/${finalUsername}`), { userId: user.uid });

        if (mobile) {
            await setDoc(doc(db, `mobiles/${mobile}`), { userId: user.uid });
        }

        // Create user profile document
        await setDoc(doc(db, `users/${user.uid}`), {
            username: finalUsername,
            displayName: finalUsername,
            email: resolvedEmail,
            mobileNumber: mobile,
            links: [],
            photoURL: user.photoURL || '',
            isPublic: true,
            createdAt: new Date().toISOString()
        });

        console.log("Profile created successfully for:", finalUsername);
    };

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            // Optionally check if profile exists, if not create one
            const profileSnap = await getDoc(doc(db!, 'users', userCredential.user.uid));
            if (!profileSnap.exists()) {
                await createProfileDocuments(userCredential.user, userCredential.user.email!, userCredential.user.email!);
            }
            onLoginSuccess(userCredential.user);
        } catch (error) {
            const err = error as FirebaseError;
            setNotification({ type: 'error', message: `Google Sign-In failed: ${err.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthScreen
            identifier={identifier} setIdentifier={setIdentifier}
            password={password} setPassword={setPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            authMode={authMode}
            status={status}
            isLoading={isLoading}
            notification={notification}
            handleUnifiedAuth={handleUnifiedAuth}
            handleGoogleSignIn={handleGoogleSignIn}
            handleForgotPassword={() => setNotification({ type: 'error', message: "Please use Email to reset password." })}
            setAuthMode={setAuthMode}
        />
    );
};

export default AuthContainer;

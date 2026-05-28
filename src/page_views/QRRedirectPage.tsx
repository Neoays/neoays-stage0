import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SpinnerIcon } from '../components/Icons';
import AuthContainer from '../features/auth/AuthContainer';

interface QRPageProps {
    qrId: string;
}

const QRRedirectPage: React.FC<QRPageProps> = ({ qrId }) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [qrData, setQRData] = useState<any>(null);
    const [claimSuccess, setClaimSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAuth, setShowAuth] = useState(false);

    // Listen for auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchQR = async () => {
            try {
                const qrRef = doc(db, 'nsales_qr_codes', qrId.toUpperCase());
                const qrDoc = await getDoc(qrRef);

                if (!qrDoc.exists()) {
                    setError('This QR code is not valid');
                    setLoading(false);
                    return;
                }

                const data = qrDoc.data();
                setQRData(data);

                // Increment scan count
                await updateDoc(qrRef, { scans: increment(1) });

                // If QR is linked to a username, redirect immediately
                if (data.linkedUsername) {
                    window.location.href = `${window.location.origin}/@${data.linkedUsername}`;
                    return;
                }

                // QR is not linked - show claim flow
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch QR', err);
                setError('Something went wrong');
                setLoading(false);
            }
        };

        fetchQR();
    }, [qrId]);

    const handleClaimQR = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Get user's profile to find their username
            const profileRef = doc(db, 'users', user.uid);
            const profileDoc = await getDoc(profileRef);

            if (!profileDoc.exists() || !profileDoc.data()?.username) {
                setError('You need to set up a profile with a username first');
                setLoading(false);
                return;
            }

            const username = profileDoc.data().username;

            // Update the QR code with this user's info
            const qrRef = doc(db, 'nsales_qr_codes', qrId.toUpperCase());
            await updateDoc(qrRef, {
                linkedUsername: username,
                linkedProfileId: user.uid,
                claimedAt: new Date()
            });

            setClaimSuccess(true);

            // Redirect to their profile after a short delay
            setTimeout(() => {
                window.location.href = `${window.location.origin}/@${username}`;
            }, 2000);
        } catch (err) {
            console.error('Failed to claim QR', err);
            setError('Failed to claim this QR code');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = () => {
        setShowAuth(false);
        // After login, the auth state listener will update `user`
        // Then user can click "Connect to My Profile"
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                <div className="text-center">
                    <SpinnerIcon className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                    <p className="text-white/70 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-2xl">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">{error}</h1>
                    <p className="text-slate-500 text-sm mb-6">The QR code "{qrId}" could not be found or is invalid.</p>
                    <a
                        href="/"
                        className="inline-block px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                    >
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    if (claimSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-2xl">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">QR Code Connected!</h1>
                    <p className="text-slate-500 text-sm mb-6">
                        This QR code (<span className="font-mono font-bold">{qrId}</span>) is now linked to your profile.
                        Redirecting...
                    </p>
                    <SpinnerIcon className="w-6 h-6 text-green-600 animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    // Show auth container in a modal if user clicks sign in
    if (showAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                    <button
                        onClick={() => setShowAuth(false)}
                        className="text-slate-400 hover:text-slate-600 text-2xl float-right"
                    >
                        &times;
                    </button>
                    <h2 className="text-xl font-black text-slate-900 mb-4">Sign In to Claim QR</h2>
                    <AuthContainer onLoginSuccess={handleLoginSuccess} />
                </div>
            </div>
        );
    }

    // QR is not linked - show claim flow
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📱</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Connect Your Profile</h1>
                    <p className="text-slate-500 text-sm">
                        QR Code <span className="font-mono font-bold text-indigo-600">{qrId}</span> is available!
                        Link it to your Neoays profile.
                    </p>
                </div>

                {!user ? (
                    <div className="space-y-4">
                        <p className="text-center text-sm text-slate-600 font-medium">
                            Sign in or create an account to claim this QR code
                        </p>
                        <button
                            onClick={() => setShowAuth(true)}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg text-sm uppercase tracking-widest"
                        >
                            Sign In / Sign Up
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-indigo-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-indigo-700">
                                Signed in as <span className="font-bold">{user.email || user.phoneNumber}</span>
                            </p>
                        </div>
                        <button
                            onClick={handleClaimQR}
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg text-sm uppercase tracking-widest disabled:opacity-50"
                        >
                            {loading ? 'Connecting...' : 'Connect to My Profile'}
                        </button>
                        <p className="text-center text-xs text-slate-400">
                            This QR will redirect to your public profile when scanned
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRRedirectPage;

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { useConnections } from '../../contexts/ConnectionsContext';
import { useAuth } from '../../hooks/useAuth';
import { UserIcon, CheckCircleIcon, SpinnerIcon } from '../../components/Icons';
import QuickConnectModal from './QuickConnectModal';

interface ConnectButtonProps {
    profileData: UserProfile;
}

const ConnectButton: React.FC<ConnectButtonProps> = ({ profileData }) => {
    const { connections, addConnection, deleteConnection, loading } = useConnections();
    const { currentUser } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showQuickAuth, setShowQuickAuth] = useState(false);
    const [pendingConnect, setPendingConnect] = useState(false);

    // Auto-connect if auth was successful and pending
    useEffect(() => {
        if (currentUser && !currentUser.isAnonymous && pendingConnect && !loading) {
            handleConnect();
            setPendingConnect(false);
        }
    }, [currentUser, pendingConnect, loading]);

    // Don't show on own profile
    const targetId = profileData.id || profileData.userId;
    if (currentUser?.uid === targetId) {
        return null;
    }

    const isConnected = connections.some(c => c.profileId === targetId || (c as any).username === profileData.username);

    const handleConnect = async () => {
        if (!currentUser || currentUser.isAnonymous) {
            setShowQuickAuth(true);
            setPendingConnect(true);
            return;
        }

        if (!targetId) {
            console.error("Profile ID missing");
            alert("Cannot connect: Profile ID not found.");
            return;
        }

        setIsProcessing(true);
        try {
            if (isConnected) {
                const conn = connections.find(c => c.profileId === targetId || (c as any).username === profileData.username);
                if (conn?.id) await deleteConnection(conn.id);
            } else {
                await addConnection({
                    profileId: targetId,
                    profileName: profileData.displayName || profileData.username || '',
                    profileType: (profileData.profileType || 'personal') as any,
                    category: profileData.category || profileData.businessCategory || '',
                    city: profileData.city || '',
                    country: profileData.country || '',
                    savedBy: currentUser.uid,
                    username: profileData.username || '',
                    photoURL: profileData.photoURL || ''
                } as any);
            }
        } catch (error: any) {
            console.error("Connection failed:", error);
            alert(`Failed to connect: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <button
                onClick={handleConnect}
                disabled={isProcessing || loading}
                className={`px-6 py-4 rounded-full shadow-xl transition-all flex items-center justify-center gap-3 border-4 border-white font-black uppercase tracking-widest text-xs active:scale-95 ${isConnected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white hover:scale-105 shadow-indigo-200'
                    }`}
            >
                {isProcessing ? (
                    <SpinnerIcon className="h-5 w-5 animate-spin" />
                ) : isConnected ? (
                    <CheckCircleIcon className="h-5 w-5" />
                ) : (
                    <UserIcon className="h-5 w-5" />
                )}
                {isConnected ? 'Connected' : 'Connect'}
            </button>

            <QuickConnectModal
                isOpen={showQuickAuth}
                onClose={() => setShowQuickAuth(false)}
                onSuccess={() => { }} // Logic handled by useEffect
                profileName={profileData.displayName || profileData.username}
            />
        </>
    );
};

export default ConnectButton;

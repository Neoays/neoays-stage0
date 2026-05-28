import React from 'react';
import { UserProfile } from '../../types';
import ThemedProfileLayout from '../../components/layouts/ThemedProfileLayout';

const PublicProfilePage = ({ profileData, isLoading = false }: { profileData: UserProfile | null, isLoading?: boolean }) => {
    if (!profileData && !isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Profile Not Found</h2>
                    <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>This profile doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    return <ThemedProfileLayout profileData={profileData as UserProfile} isLoading={isLoading} />;
};

export default PublicProfilePage;

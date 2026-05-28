import React, { useState } from 'react';
import { UserProfile } from '../../types';
import PublicMenuView from '../../page_views/PublicMenuView';
import PublicProductView from '../../page_views/PublicProductView';
import PublicReviewView from '../../page_views/PublicReviewView';
import PublicSurveyView from '../../page_views/PublicSurveyView';
import NGameModule from '../nGame/NGameModule';
import FloatingActionsPanel from '../../components/FloatingActionsPanel';
import { TimesCircleIcon } from '../../components/Icons';

interface PublicFeatureManagerProps {
    profileData: UserProfile;
    bubbleLinks?: { id: string; url: string; title: string; iconType?: string }[];
}

const PublicFeatureManager: React.FC<PublicFeatureManagerProps> = ({ profileData, bubbleLinks = [] }) => {
    const [activeOverlay, setActiveOverlay] = useState<'menu' | 'game' | 'products' | 'review' | 'survey' | null>(null);

    // Check URL params for direct actions
    // Check URL params for direct actions
    React.useEffect(() => {
        let params = new URLSearchParams(window.location.search);
        let action = params.get('action');

        // Fallback: Check hash for params (e.g. /#/username?action=survey)
        if (!action && window.location.hash.includes('?')) {
            const hashQuery = window.location.hash.split('?')[1];
            params = new URLSearchParams(hashQuery);
            action = params.get('action');
        }

        if (action === 'survey') {
            setActiveOverlay('survey');
        } else if (action === 'menu') {
            setActiveOverlay('menu');
        } else if (action === 'review') {
            setActiveOverlay('review');
        } else if (action === 'products' || action === 'shop') {
            setActiveOverlay('products');
        }
    }, []);

    return (
        <>
            {/* Unified Floating Actions Panel */}
            <FloatingActionsPanel
                profileData={profileData}
                bubbleLinks={bubbleLinks}
                onOpenMenu={() => setActiveOverlay('menu')}
                onOpenProducts={() => setActiveOverlay('products')}
                onOpenGame={() => setActiveOverlay('game')}
                onOpenReview={() => setActiveOverlay('review')}
                onOpenSurvey={() => setActiveOverlay('survey')}
            />

            {/* Menu Overlay */}
            {activeOverlay === 'menu' && (
                <div className="fixed inset-0 z-[1000] animate-fade-in">
                    <PublicMenuView
                        profileData={profileData}
                        onClose={() => setActiveOverlay(null)}
                    />
                </div>
            )}

            {/* Products Overlay */}
            {activeOverlay === 'products' && (
                <div className="fixed inset-0 z-[1000] animate-fade-in">
                    <PublicProductView
                        profileData={profileData}
                        onClose={() => setActiveOverlay(null)}
                    />
                </div>
            )}

            {/* Google Review Overlay */}
            {activeOverlay === 'review' && (
                <div className="fixed inset-0 z-[1000] animate-fade-in">
                    <PublicReviewView
                        profileData={profileData}
                        onClose={() => setActiveOverlay(null)}
                    />
                </div>
            )}

            {/* Survey Overlay */}
            {activeOverlay === 'survey' && (
                <div className="fixed inset-0 z-[1000] animate-fade-in">
                    <PublicSurveyView
                        profileData={profileData}
                        onClose={() => setActiveOverlay(null)}
                    />
                </div>
            )}

            {/* Game Overlay */}
            {activeOverlay === 'game' && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fade-in overflow-y-auto">
                    <button
                        onClick={() => setActiveOverlay(null)}
                        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[1010] bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full text-white transition-colors flex items-center justify-center shadow-lg backdrop-blur-md"
                        aria-label="Close Game"
                    >
                        <TimesCircleIcon className="h-6 w-6" />
                    </button>
                    <div className="w-full max-w-4xl relative mt-8 sm:mt-0">
                        <NGameModule
                            profileData={profileData}
                            businessId={profileData.id}
                            businessName={profileData.displayName}
                            businessLogo={profileData.photoURL}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default PublicFeatureManager;

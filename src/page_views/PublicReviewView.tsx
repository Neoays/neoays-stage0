import React, { useState } from 'react';
import { UserProfile } from '../types';

interface PublicReviewViewProps {
    profileData: UserProfile;
    onClose: () => void;
}

const PublicReviewView: React.FC<PublicReviewViewProps> = ({ profileData, onClose }) => {
    const [hoveredStar, setHoveredStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);

    const handleStarClick = (rating: number) => {
        setSelectedStar(rating);
        // Redirect to Google Maps review page
        if (profileData.googleMapsReviewLink) {
            // Small delay so user sees their selection
            setTimeout(() => {
                window.open(profileData.googleMapsReviewLink, '_blank');
                onClose();
            }, 500);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center p-0 sm:p-4 pt-0 overflow-y-auto">
            <div className="bg-white w-full sm:max-w-md sm:rounded-3xl overflow-hidden min-h-screen sm:min-h-0 sm:mt-8 animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full text-white flex items-center justify-center hover:bg-white/30 transition"
                    >
                        ×
                    </button>

                    <div className="relative z-10">
                        {profileData.photoURL ? (
                            <img
                                src={profileData.photoURL}
                                alt={profileData.displayName}
                                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white/30 shadow-xl object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-white/20 flex items-center justify-center text-3xl font-black text-white">
                                {profileData.displayName?.charAt(0) || '?'}
                            </div>
                        )}
                        <h2 className="text-2xl font-black text-white mb-1">{profileData.displayName}</h2>
                        <p className="text-white/80 text-sm">wants to hear from you!</p>
                    </div>
                </div>

                {/* Rating Section */}
                <div className="p-8 text-center">
                    <h3 className="text-xl font-black text-gray-900 mb-2">How was your experience?</h3>
                    <p className="text-gray-500 text-sm mb-8">Tap a star to rate us on Google</p>

                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                                onClick={() => handleStarClick(star)}
                                className={`text-5xl transition-all duration-200 transform ${star <= (hoveredStar || selectedStar)
                                        ? 'scale-110 drop-shadow-lg'
                                        : 'grayscale opacity-40'
                                    }`}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>

                    {selectedStar > 0 && (
                        <div className="animate-fade-in">
                            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm mb-4">
                                <span className="animate-spin">↻</span> Redirecting to Google...
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-400 mt-8">
                        Your feedback helps us improve our service ❤️
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full p-3 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicReviewView;

import React from 'react';
import { UserProfile, UserLink } from '../types';
import { PhoneIcon, DocumentTextIcon, ShoppingBagIcon, TagIcon, PlayIcon, StarIcon, ClipboardListIcon } from './Icons';

interface FloatingActionsPanelProps {
    profileData: UserProfile;
    bubbleLinks?: UserLink[];
    onOpenMenu?: () => void;
    onOpenProducts?: () => void;
    onOpenGame?: () => void;
    onOpenReview?: () => void;
    onOpenSurvey?: () => void;
}

/**
 * Unified floating actions panel that consolidates all profile floating buttons
 * with proper z-index management, mobile responsive positioning, and no overlaps.
 */
const FloatingActionsPanel: React.FC<FloatingActionsPanelProps> = ({
    profileData,
    bubbleLinks = [],
    onOpenMenu,
    onOpenProducts,
    onOpenGame,
    onOpenReview,
    onOpenSurvey
}) => {
    const hasMenu = (profileData.menuEnabled !== false) && (profileData.menuItems?.length || 0) > 0;
    const hasProducts = profileData.productsEnabled && (profileData.productItems?.length || 0) > 0;
    const isGameEnabled = profileData.gameEnabled !== false;
    const hasPdf = !!profileData.pdfUrl;

    // Review and Survey for any non-personal profile (business, ngo, society_club, staff, etc.)
    const isBusiness = profileData.profileType !== 'personal' && profileData.profileType !== 'personal_jobseeker';
    const hasReview = isBusiness && profileData.reviewEnabled && !!profileData.googleMapsReviewLink;
    const hasSurvey = isBusiness && profileData.surveyEnabled;

    // Check if any actions are available
    const hasAnyAction = hasMenu || hasProducts || isGameEnabled || hasPdf || hasReview || hasSurvey || bubbleLinks.length > 0;

    if (!hasAnyAction) return null;

    return (
        <>
            {/* Floating Actions Container - Right side, stacked vertically */}
            <div className="fixed bottom-6 right-4 z-[998] flex flex-col gap-3 items-end
                            sm:bottom-8 sm:right-6">

                {/* PDF / Catalog Button */}
                {hasPdf && (
                    <a
                        href={profileData.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-center
                                   w-12 h-12 sm:w-14 sm:h-14
                                   bg-emerald-600 text-white rounded-full 
                                   shadow-lg shadow-emerald-500/30
                                   hover:scale-110 active:scale-95 transition-all duration-200
                                   border-2 border-white"
                        aria-label="View PDF/Catalog"
                    >
                        <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                                        bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider
                                        px-3 py-2 rounded-xl
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        whitespace-nowrap shadow-xl pointer-events-none
                                        hidden sm:block">
                            View Catalog
                        </span>
                    </a>
                )}

                {/* Google Review Button */}
                {hasReview && onOpenReview && (
                    <button
                        onClick={onOpenReview}
                        className="group relative flex items-center justify-center
                                   w-12 h-12 sm:w-14 sm:h-14
                                   bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full 
                                   shadow-lg shadow-orange-500/30
                                   hover:scale-110 active:scale-95 transition-all duration-200
                                   border-2 border-white"
                        aria-label="Rate Us"
                    >
                        <StarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                                        bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider
                                        px-3 py-2 rounded-xl
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        whitespace-nowrap shadow-xl pointer-events-none
                                        hidden sm:block">
                            Rate Us ⭐
                        </span>
                    </button>
                )}

                {/* Survey Button */}
                {hasSurvey && onOpenSurvey && (
                    <button
                        onClick={onOpenSurvey}
                        className="group relative flex items-center justify-center
                                   w-12 h-12 sm:w-14 sm:h-14
                                   bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-full 
                                   shadow-lg shadow-rose-500/30
                                   hover:scale-110 active:scale-95 transition-all duration-200
                                   border-2 border-white"
                        aria-label="Take Survey"
                    >
                        <ClipboardListIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                                        bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider
                                        px-3 py-2 rounded-xl
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        whitespace-nowrap shadow-xl pointer-events-none
                                        hidden sm:block">
                            Take Survey
                        </span>
                    </button>
                )}

                {/* Menu Button */}
                {hasMenu && onOpenMenu && (
                    <button
                        onClick={onOpenMenu}
                        className="group relative flex items-center justify-center
                                   w-12 h-12 sm:w-14 sm:h-14
                                   bg-indigo-600 text-white rounded-full 
                                   shadow-lg shadow-indigo-500/30
                                   hover:scale-110 active:scale-95 transition-all duration-200
                                   border-2 border-white"
                        aria-label="Open Menu"
                    >
                        <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                                        bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider
                                        px-3 py-2 rounded-xl
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        whitespace-nowrap shadow-xl pointer-events-none
                                        hidden sm:block">
                            Digital Menu
                        </span>
                    </button>
                )}

                {/* Products Button */}
                {hasProducts && onOpenProducts && (
                    <button
                        onClick={onOpenProducts}
                        className="group relative flex items-center justify-center
                                   w-12 h-12 sm:w-14 sm:h-14
                                   bg-purple-600 text-white rounded-full 
                                   shadow-lg shadow-purple-500/30
                                   hover:scale-110 active:scale-95 transition-all duration-200
                                   border-2 border-white"
                        aria-label="View Products"
                    >
                        <TagIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                                        bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider
                                        px-3 py-2 rounded-xl
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        whitespace-nowrap shadow-xl pointer-events-none
                                        hidden sm:block">
                            Products
                        </span>
                    </button>
                )}

                {/* nGame Button */}
                {isGameEnabled && onOpenGame && (
                    <button
                        onClick={onOpenGame}
                        className="group relative flex items-center justify-center
                                   w-12 h-12 sm:w-14 sm:h-14
                                   bg-amber-500 text-white rounded-full 
                                   shadow-lg shadow-amber-500/30
                                   hover:scale-110 active:scale-95 transition-all duration-200
                                   border-2 border-white"
                        aria-label="Play nGame"
                    >
                        <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        {/* Pulse indicator */}
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                                        bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider
                                        px-3 py-2 rounded-xl
                                        opacity-0 group-hover:opacity-100 transition-opacity
                                        whitespace-nowrap shadow-xl pointer-events-none
                                        hidden sm:block">
                            Play nGame
                        </span>
                    </button>
                )}

                {/* Custom Bubble Links */}
                {bubbleLinks.map((link, idx) => (
                    <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-center
                                   w-12 h-12 sm:w-14 sm:h-14
                                   bg-slate-700 text-white rounded-full 
                                   shadow-lg shadow-slate-500/30
                                   hover:scale-110 active:scale-95 transition-all duration-200
                                   border-2 border-white"
                        title={link.title}
                        style={{ animationDelay: `${idx * 50}ms` }}
                        aria-label={link.title}
                    >
                        {link.iconType === 'phone' ? <PhoneIcon className="h-5 w-5" /> :
                            link.iconType === 'email' ? '✉️' :
                                link.iconType === 'whatsapp' ? '💬' :
                                    link.iconType === 'location' ? '📍' : '🔗'}
                    </a>
                ))}
            </div>
        </>
    );
};

export default FloatingActionsPanel;

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, QrcodeIcon, StarIcon, CheckCircleIcon } from './Icons';

// Use the placeholder we generated (in real app we would import the asset)
// For now, I will assume it's available or use a nice CSS gradient fallback if not found
// I'll use a data URI or just a placeholder div if the image isn't moved yet.
// Since I cannot move the image easily I will use a high quality gradient fallback 
// but referencing the idea of the "Digital Future"

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to Neoays',
        desc: 'Your all-in-one digital identity, marketing, and loyalty platform.',
        icon: (
            <div className="w-full h-40 bg-gray-900 rounded-xl overflow-hidden relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-80"></div>
                <div className="relative z-10 text-white text-center p-4">
                    <h1 className="text-3xl font-black tracking-tighter mb-2">NEOAYS</h1>
                    <p className="text-sm opacity-90 font-medium">The Future of Digital Connection</p>
                </div>
                {/* Abstract shapes */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400 rounded-full blur-3xl opacity-20 transform translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400 rounded-full blur-3xl opacity-20 transform -translate-x-10 translate-y-10"></div>
            </div>
        )
    },
    {
        id: 'profile',
        title: 'Your Digital Identity',
        desc: 'Customize your profile with a bio, location, and services. Share it instantly via QR code or NFC card.',
        icon: <QrcodeIcon className="w-20 h-20 text-indigo-500 mx-auto mb-4" />
    },
    {
        id: 'vouchers',
        title: 'Create & Manage Offers',
        desc: 'Attract customers by creating digital vouchers. Set terms, images, and expiry dates effortlessly.',
        icon: (
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🏷️</span>
            </div>
        )
    },
    {
        id: 'feedback',
        title: 'Feedback & Rewards',
        desc: 'Collect customer feedback and automatically reward them with vouchers to keep them coming back.',
        icon: <StarIcon className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
    },
    {
        id: 'analytics',
        title: 'Track Your Growth',
        desc: 'View real-time stats on who is viewing your profile and claiming your offers.',
        icon: <ChartBarIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
    }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        localStorage.setItem('neoays_onboarding_seen', 'true');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-0 sm:p-4 pt-8 sm:pt-12 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100 flex flex-col min-h-[500px]">

                {/* Step Content */}
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                    <div className="mb-6 w-full animate-scale-in">
                        {STEPS[currentStep].icon}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in" key={currentStep}>
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed text-sm animate-fade-in" key={currentStep + '_desc'}>
                        {STEPS[currentStep].desc}
                    </p>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-2 mb-4">
                    {STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`}
                        />
                    ))}
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <button
                        onClick={handleFinish}
                        className="text-gray-400 text-sm font-medium hover:text-gray-600 transition px-4 py-2"
                    >
                        Skip
                    </button>

                    <button
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transform hover:scale-[1.02] transition-all flex items-center"
                    >
                        {currentStep === STEPS.length - 1 ? (
                            <>Get Started <CheckCircleIcon className="w-5 h-5 ml-2" /></>
                        ) : (
                            'Next'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;

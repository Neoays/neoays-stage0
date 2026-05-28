import React from 'react';
import { WhatsAppIcon } from './Icons';

interface WhatsAppFloatingBubbleProps {
    mobileNumber?: string;
    profileName?: string;
}

const WhatsAppFloatingBubble: React.FC<WhatsAppFloatingBubbleProps> = ({
    mobileNumber,
    profileName = "this profile"
}) => {
    if (!mobileNumber) return null;

    // Clean mobile number (remove spaces, dashes, etc.)
    const cleanNumber = mobileNumber.replace(/[^0-9+]/g, '');

    // Default message
    const message = `Hi! I found ${profileName} on Neoays and would like to connect.`;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 animate-bounce-subtle group"
            aria-label="Contact via WhatsApp"
        >
            <WhatsAppIcon className="w-7 h-7" />

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Message on WhatsApp
                <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
        </a>
    );
};

export default WhatsAppFloatingBubble;

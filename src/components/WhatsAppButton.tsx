import React from 'react';
import { WhatsAppIcon } from './Icons';

const WHATSAPP_NUMBER = "916238999409"; // Replace with your actual WhatsApp number, including country code

const WhatsAppButton = ({ message, className }: { message: string, className?: string }) => {
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    return (
        <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center rounded-lg bg-green-500 font-semibold text-white transition-all duration-300 hover:bg-green-600 active:scale-95 ${className || 'w-full px-4 py-3 mt-4'}`}
        >
            <WhatsAppIcon className="h-4 w-4 mr-2" /> {className?.includes('text-[9px]') ? 'WhatsApp' : 'Contact via Whatsapp'}
        </a>
    );
};

export default WhatsAppButton;
export { WHATSAPP_NUMBER };

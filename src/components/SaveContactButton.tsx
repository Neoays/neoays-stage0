import React from 'react';
import { UserProfile } from '../types';

interface SaveContactButtonProps {
    profileData: UserProfile;
    primaryColor?: string;
}

const SaveContactButton: React.FC<SaveContactButtonProps> = ({ profileData, primaryColor }) => {
    // Check if Save Contact is enabled (default: true)
    if (!(profileData.saveContactEnabled ?? true)) {
        return null;
    }

    // Use profile's primary color or default to indigo
    const buttonColor = primaryColor || profileData.themeSettings?.primaryColor || '#6366f1';

    const saveContact = () => {
        // Build VCF content with all available contact info
        const lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${profileData.displayName || profileData.username}`,
        ];

        // Add optional fields
        if (profileData.mobileNumber) {
            lines.push(`TEL;TYPE=CELL:${profileData.mobileNumber}`);
        }
        if (profileData.email) {
            lines.push(`EMAIL:${profileData.email}`);
        }
        if (profileData.businessCategory) {
            lines.push(`TITLE:${profileData.businessCategory}`);
        }
        if (profileData.website) {
            lines.push(`URL:${profileData.website}`);
        }
        if (profileData.bio) {
            lines.push(`NOTE:${profileData.bio.replace(/\n/g, '\\n')}`);
        }
        // Add profile URL
        lines.push(`URL;TYPE=WORK:${window.location.href}`);

        // Add photo if available (as URL reference)
        if (profileData.photoURL) {
            lines.push(`PHOTO;VALUE=URI:${profileData.photoURL}`);
        }

        lines.push('END:VCARD');

        const vcard = lines.join('\n');
        const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${profileData.username || 'contact'}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={saveContact}
            className="w-14 h-14 flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 border-4 border-white"
            title="Save Contact"
            style={{
                backgroundColor: buttonColor,
            }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </button>
    );
};

export default SaveContactButton;

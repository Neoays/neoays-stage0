import React from 'react';

interface WorksAtInlineProps {
    worksAt?: {
        companyId: string;
        companyName: string;
        companyLogo?: string;
        companyUsername: string;
        role?: string;
    };
    primaryColor?: string;
}

/**
 * Inline "Works At" display - shows near bio section
 */
const WorksAtInline: React.FC<WorksAtInlineProps> = ({ worksAt, primaryColor }) => {
    if (!worksAt?.companyUsername) return null;

    const badgeColor = primaryColor || '#6366f1';
    const profileUrl = `/${worksAt.companyUsername}`;

    return (
        <a
            href={profileUrl}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold hover:opacity-90 transition-all hover:scale-105"
            style={{ backgroundColor: badgeColor }}
        >
            {worksAt.companyLogo ? (
                <img
                    src={worksAt.companyLogo}
                    alt={worksAt.companyName}
                    className="w-5 h-5 rounded-full object-cover border border-white/30"
                />
            ) : (
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                    {worksAt.companyName?.charAt(0)?.toUpperCase() || 'C'}
                </span>
            )}
            <span className="opacity-80 text-[10px]">Works at</span>
            <span className="font-black">{worksAt.companyName}</span>
        </a>
    );
};

export default WorksAtInline;

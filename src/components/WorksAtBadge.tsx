import React from 'react';

interface WorksAtBadgeProps {
    worksAt?: {
        companyId: string;
        companyName: string;
        companyLogo?: string;
        companyUsername: string;
        role?: string;
    };
    worksAtDisplay?: 'inline' | 'floating' | 'disabled';
    primaryColor?: string;
}

const WorksAtBadge: React.FC<WorksAtBadgeProps> = ({ worksAt, worksAtDisplay, primaryColor }) => {
    // Only show if display mode is 'floating'
    if (!worksAt?.companyUsername || worksAtDisplay !== 'floating') return null;

    const badgeColor = primaryColor || '#6366f1';
    const profileUrl = `/${worksAt.companyUsername}`;

    return (
        <a
            href={profileUrl}
            className="fixed bottom-20 left-4 z-40 group"
            title={`Works at ${worksAt.companyName}`}
        >
            {/* Animated ring */}
            <div
                className="absolute inset-0 rounded-full opacity-30 animate-ping"
                style={{ backgroundColor: badgeColor, animationDuration: '2s' }}
            />

            {/* Badge container */}
            <div
                className="relative flex items-center gap-2 pl-1 pr-3 py-1 rounded-full shadow-lg border-2 border-white hover:scale-105 transition-all"
                style={{ backgroundColor: badgeColor }}
            >
                {/* Company logo */}
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {worksAt.companyLogo ? (
                        <img
                            src={worksAt.companyLogo}
                            alt={worksAt.companyName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-xs font-black" style={{ color: badgeColor }}>
                            {worksAt.companyName?.charAt(0)?.toUpperCase() || 'C'}
                        </span>
                    )}
                </div>

                {/* Text */}
                <div className="text-white">
                    <div className="text-[8px] font-bold uppercase tracking-wider opacity-80">Works at</div>
                    <div className="text-[10px] font-black leading-tight truncate max-w-[80px]">
                        {worksAt.companyName}
                    </div>
                </div>
            </div>

            {/* Tooltip on hover */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {worksAt.role ? `${worksAt.role} at ` : 'View '}{worksAt.companyName}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
            </div>
        </a>
    );
};

export default WorksAtBadge;

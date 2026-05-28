import React from 'react';
import { UserProfile } from '../../types';
import {
    UserIcon,
    BriefcaseIcon,
    OfficeBuildingIcon,
    IdentificationIcon,
    HeartIcon,
    UserGroupIcon
} from '../../components/Icons';

interface ProfileTypeSelectorProps {
    currentType: UserProfile['profileType'];
    onTypeSelect: (type: UserProfile['profileType']) => void;
}

const ProfileTypeSelector: React.FC<ProfileTypeSelectorProps> = ({ currentType, onTypeSelect }) => {
    const types: { id: UserProfile['profileType'], label: string, icon: React.ReactNode }[] = [
        { id: 'personal', label: 'Personal', icon: <UserIcon className="w-3.5 h-3.5" /> },
        { id: 'business', label: 'Business', icon: <OfficeBuildingIcon className="w-3.5 h-3.5" /> },
        { id: 'business_person', label: 'Exec', icon: <IdentificationIcon className="w-3.5 h-3.5" /> },
        { id: 'staff', label: 'Staff', icon: <UserIcon className="w-3.5 h-3.5" /> },
        { id: 'ngo', label: 'NGO / Charity', icon: <HeartIcon className="w-3.5 h-3.5" /> },
        { id: 'society_club', label: 'Club / Society', icon: <UserGroupIcon className="w-3.5 h-3.5" /> },
        { id: 'personal_jobseeker', label: 'Jobseeker', icon: <BriefcaseIcon className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-6 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar-hide h-10">
                <div className="flex flex-col border-r border-gray-100 pr-3 mr-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap leading-tight">Switch</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest whitespace-nowrap leading-tight">Identity</span>
                </div>
                {types.map(t => (
                    <button
                        key={t.id}
                        onClick={() => onTypeSelect(t.id)}
                        className={`group flex items-center gap-2 text-[11px] font-black uppercase tracking-tight whitespace-nowrap transition-all px-3 py-2 rounded-lg border ${currentType === t.id
                            ? 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-sm shadow-indigo-100'
                            : 'text-gray-400 border-transparent hover:text-indigo-400 hover:bg-gray-50'
                            }`}
                    >
                        <span className={`${currentType === t.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-400'}`}>
                            {t.icon}
                        </span>
                        {t.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProfileTypeSelector;

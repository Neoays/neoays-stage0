import React, { useEffect, useState, useRef } from 'react';
import Globe from 'react-globe.gl';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { UserProfile } from '../types';

interface GlobeMapProps {
    onSelectProfile: (username: string) => void;
}

const GlobeMap: React.FC<GlobeMapProps> = ({ onSelectProfile }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const globeRef = useRef<any>();

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                // Fetch profiles that are public and have coordinates
                const q = query(
                    collection(db, 'users'),
                    where('isPublic', '==', true),
                    limit(100)
                );
                const querySnapshot = await getDocs(q);
                const fetchedProfiles: UserProfile[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data() as UserProfile;
                    if (data.coordinates && data.coordinates.lat && data.coordinates.lng) {
                        fetchedProfiles.push(data);
                    }
                });
                setProfiles(fetchedProfiles);
            } catch (error) {
                console.error("Error fetching profiles for globe:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    // Custom point layer for profiles
    const gData = profiles.map(p => ({
        lat: p.coordinates!.lat,
        lng: p.coordinates!.lng,
        size: 0.1,
        color: '#6366f1',
        label: p.displayName || p.username,
        username: p.username
    }));

    return (
        <div className="relative w-full h-[500px] bg-slate-900 rounded-3xl overflow-hidden group shadow-2xl">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white text-xs font-black uppercase tracking-widest">Scanning Network...</p>
                    </div>
                </div>
            )}

            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                pointsData={gData}
                pointAltitude={0.05}
                pointColor="color"
                pointRadius={0.5}
                pointsMerge={true}
                pointLabel="label"
                onPointClick={(point: any) => onSelectProfile(point.username)}
                atmosphereColor="#6366f1"
                atmosphereAltitude={0.15}
            />

            {/* Overlay Info */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 transition-transform group-hover:scale-105 duration-500">
                    <h4 className="text-white text-lg font-black italic tracking-tight mb-1">GLOBAL DISCOVERY</h4>
                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">{profiles.length} ACTIVE NODES ONLINE</p>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
                <button
                    onClick={() => {
                        if (globeRef.current) {
                            globeRef.current.controls().autoRotate = !globeRef.current.controls().autoRotate;
                        }
                    }}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/10 group/btn"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">Toggle Rotation</span>
                </button>
            </div>
        </div>
    );
};

export default GlobeMap;

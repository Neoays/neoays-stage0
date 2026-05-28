import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import {
    GiftIcon,
    CheckCircleIcon,
    SpinnerIcon
} from '../../components/Icons';

// Game components
import MemoryMatch from './games/MemoryMatch';
import SpinWheel from './games/SpinWheel';
import CatchGame from './games/CatchGame';
import FlappyBird from './games/FlappyBird';

interface NGameModuleProps {
    profileData: UserProfile;
    businessId?: string;
    businessName?: string;
    businessLogo?: string;
    isStandalone?: boolean;
}

type GameType = 'memory' | 'spin' | 'catch' | 'flappy' | null;

interface GameScore {
    score: number;
    businessId: string;
    businessName: string;
    gameType: GameType;
    isGuest: boolean;
}

const NGameModule: React.FC<NGameModuleProps> = ({
    profileData,
    businessId,
    businessName,
    businessLogo,
    isStandalone = false
}) => {
    const [activeGame, setActiveGame] = useState<GameType>(null);
    const [totalScore, setTotalScore] = useState(0);
    const [gamesPlayed, setGamesPlayed] = useState(0);

    const isGuest = !profileData;

    const handleGameComplete = (score: number, gameType: GameType) => {
        setTotalScore(prev => prev + score);
        setGamesPlayed(prev => prev + 1);
        setActiveGame(null);

        // TODO: Save score to Firestore leaderboard
        console.log('Game completed:', { score, gameType, businessId, isGuest });
    };

    const games = [
        {
            id: 'memory',
            name: 'Memory Match',
            desc: 'Match the logos!',
            icon: '🧠',
            color: 'from-purple-500 to-pink-500',
            points: 'Up to 500 pts'
        },
        {
            id: 'spin',
            name: 'Lucky Spin',
            desc: 'Spin to win!',
            icon: '🎡',
            color: 'from-amber-500 to-orange-500',
            points: 'Random prizes'
        },
        {
            id: 'catch',
            name: 'Catch Drop',
            desc: 'Catch the falling items!',
            icon: '🧺',
            color: 'from-cyan-500 to-blue-500',
            points: 'Up to 1000 pts'
        },
        {
            id: 'flappy',
            name: 'Flappy Bird',
            desc: 'Dodge the pipes!',
            icon: '🐦',
            color: 'from-indigo-500 to-violet-500',
            points: 'Up to 1000 pts'
        }
    ];

    // Active game view
    if (activeGame) {
        return (
            <div className={`bg-slate-900 ${isStandalone ? 'rounded-3xl overflow-hidden' : 'min-h-screen rounded-3xl overflow-hidden'}`}>
                {/* Always-visible sticky top bar with back button */}
                <div className="sticky top-0 z-50 p-3 bg-slate-800/95 backdrop-blur-sm flex items-center justify-between border-b border-slate-700">
                    <button
                        onClick={() => setActiveGame(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
                    >
                        ← Back to Games
                    </button>
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                        <span>🏆</span>
                        <span>{totalScore} pts</span>
                    </div>
                    <button
                        onClick={() => setActiveGame(null)}
                        className="w-8 h-8 bg-slate-700 hover:bg-red-500/80 rounded-xl text-white font-bold flex items-center justify-center transition-all text-lg"
                        title="Exit Game"
                    >
                        ✕
                    </button>
                </div>

                {activeGame === 'memory' && (
                    <MemoryMatch
                        businessLogo={businessLogo || profileData.photoURL}
                        brandColor={'#6366f1'}
                        onComplete={(score: number) => handleGameComplete(score, 'memory')}
                    />
                )}
                {activeGame === 'spin' && (
                    <SpinWheel
                        businessLogo={businessLogo || profileData.photoURL}
                        brandColor={'#f59e0b'}
                        onComplete={(score: number) => handleGameComplete(score, 'spin')}
                    />
                )}
                {activeGame === 'catch' && (
                    <CatchGame
                        businessLogo={businessLogo || profileData.photoURL}
                        brandColor={'#06b6d4'}
                        onComplete={(score: number) => handleGameComplete(score, 'catch')}
                    />
                )}
                {activeGame === 'flappy' && (
                    <FlappyBird
                        businessLogo={businessLogo || profileData.photoURL}
                        brandColor={'#6366f1'}
                        onComplete={(score: number) => handleGameComplete(score, 'flappy')}
                    />
                )}
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isStandalone ? 'max-w-4xl mx-auto p-4' : ''}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-white/20 p-2 rounded-xl backdrop-blur-sm text-2xl">🎮</span>
                        <h1 className="text-4xl font-black tracking-tighter">nGame</h1>
                    </div>
                    <p className="text-lg font-medium opacity-95 max-w-xl leading-relaxed">
                        Play, earn points, win rewards!
                    </p>

                    {/* Score Display */}
                    <div className="mt-6 flex items-center gap-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3">
                            <p className="text-xs uppercase tracking-widest opacity-70">Your Score</p>
                            <p className="text-3xl font-black">{totalScore} pts</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3">
                            <p className="text-xs uppercase tracking-widest opacity-70">Games</p>
                            <p className="text-3xl font-black">{gamesPlayed}</p>
                        </div>
                        {isGuest && (
                            <div className="bg-amber-500/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-amber-400/30">
                                <p className="text-xs font-bold text-amber-300">Playing as Guest</p>
                                <p className="text-[10px] opacity-70">Sign in to save scores</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Games Grid */}
            <div>
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">
                    Choose a Game
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {games.map(game => (
                        <button
                            key={game.id}
                            onClick={() => setActiveGame(game.id as GameType)}
                            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group overflow-hidden relative"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                            <div className="relative z-10">
                                <span className="text-5xl mb-4 block">{game.icon}</span>
                                <h4 className="text-xl font-black text-gray-900 mb-1">{game.name}</h4>
                                <p className="text-sm text-gray-500 mb-3">{game.desc}</p>
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${game.color} text-white`}>
                                    {game.points}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white">
                <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-gray-400">
                    🏆 Top Players
                </h3>
                <div className="space-y-3">
                    {[
                        { rank: 1, name: 'You', score: totalScore, isYou: true },
                        { rank: 2, name: 'Guest_4821', score: 850, isYou: false },
                        { rank: 3, name: 'Ahmed M.', score: 720, isYou: false },
                    ].map(player => (
                        <div
                            key={player.rank}
                            className={`flex items-center gap-4 p-3 rounded-xl ${player.isYou ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30' : 'bg-slate-800'}`}
                        >
                            <span className={`text-2xl font-black ${player.rank === 1 ? 'text-amber-400' : player.rank === 2 ? 'text-gray-300' : 'text-amber-600'}`}>
                                #{player.rank}
                            </span>
                            <div className="flex-1">
                                <p className="font-bold">{player.name}</p>
                            </div>
                            <span className="font-black text-amber-400">{player.score} pts</span>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">
                    View Full Leaderboard →
                </button>
            </div>
        </div>
    );
};

export default NGameModule;

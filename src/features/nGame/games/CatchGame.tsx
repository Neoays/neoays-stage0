import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CatchGameProps {
    businessLogo?: string;
    brandColor?: string;
    onComplete: (score: number) => void;
}

interface FallingItem {
    id: number;
    x: number;
    y: number;
    emoji: string;
    points: number;
    speed: number;
}

const CatchGame: React.FC<CatchGameProps> = ({ businessLogo, brandColor = '#06b6d4', onComplete }) => {
    const [gameStarted, setGameStarted] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [basketX, setBasketX] = useState(50);
    const [items, setItems] = useState<FallingItem[]>([]);
    const [catchStreak, setCatchStreak] = useState(0);

    const gameAreaRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const itemIdRef = useRef(0);

    const goodItems = ['🎁', '⭐', '💎', '🏆', '💰'];
    const badItems = ['💣', '🔥'];

    const spawnItem = useCallback(() => {
        const isGood = Math.random() > 0.2; // 80% good items
        const emoji = isGood
            ? goodItems[Math.floor(Math.random() * goodItems.length)]
            : badItems[Math.floor(Math.random() * badItems.length)];

        const newItem: FallingItem = {
            id: itemIdRef.current++,
            x: 10 + Math.random() * 80, // Random x position (10-90%)
            y: 0,
            emoji,
            points: isGood ? 10 + Math.floor(Math.random() * 20) : -30,
            speed: 1 + Math.random() * 2
        };

        setItems(prev => [...prev, newItem]);
    }, []);

    // Game loop
    useEffect(() => {
        if (!gameStarted || isComplete) return;

        const gameLoop = () => {
            setItems(prev => {
                const updated = prev.map(item => ({
                    ...item,
                    y: item.y + item.speed
                }));

                // Check for catches
                const caught: number[] = [];
                const remaining = updated.filter(item => {
                    const basketLeft = basketX - 10;
                    const basketRight = basketX + 10;

                    if (item.y >= 85 && item.y <= 95 && item.x >= basketLeft && item.x <= basketRight) {
                        caught.push(item.id);
                        if (item.points > 0) {
                            setScore(s => s + item.points + (catchStreak * 2));
                            setCatchStreak(s => s + 1);
                        } else {
                            setScore(s => Math.max(0, s + item.points));
                            setCatchStreak(0);
                        }
                        return false;
                    }

                    // Remove items that fell off screen
                    if (item.y > 100) {
                        if (item.points > 0) setCatchStreak(0); // Break streak on miss
                        return false;
                    }

                    return true;
                });

                return remaining;
            });

            animationRef.current = requestAnimationFrame(gameLoop);
        };

        animationRef.current = requestAnimationFrame(gameLoop);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [gameStarted, isComplete, basketX, catchStreak]);

    // Spawn items periodically
    useEffect(() => {
        if (!gameStarted || isComplete) return;

        const spawnInterval = setInterval(spawnItem, 800);
        return () => clearInterval(spawnInterval);
    }, [gameStarted, isComplete, spawnItem]);

    // Timer
    useEffect(() => {
        if (!gameStarted || isComplete) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsComplete(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameStarted, isComplete]);

    // Mouse/touch controls
    const handleMove = useCallback((clientX: number) => {
        if (!gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        setBasketX(Math.max(10, Math.min(90, x)));
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

    const startGame = () => {
        setGameStarted(true);
        setScore(0);
        setTimeLeft(30);
        setItems([]);
        setCatchStreak(0);
        setIsComplete(false);
    };

    if (!gameStarted) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-white">
                <div className="text-6xl mb-6">🧺</div>
                <h2 className="text-3xl font-black mb-4">Catch Drop</h2>
                <p className="text-gray-400 mb-8 text-center max-w-md">
                    Move the basket to catch falling gifts! Avoid the bombs! 💣
                </p>
                <div className="text-sm text-gray-500 mb-4">
                    🎁 = +10-30 pts | 💣 = -30 pts | Streak bonus!
                </div>
                <button
                    onClick={startGame}
                    style={{ backgroundColor: brandColor }}
                    className="px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
                >
                    Start Game 🚀
                </button>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-white">
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-3xl font-black mb-2">Game Over!</h2>
                <div className="text-6xl font-black text-amber-400 mb-8">{score} pts</div>
                <div className="flex gap-4">
                    <button
                        onClick={startGame}
                        className="px-6 py-3 bg-slate-700 rounded-xl font-bold hover:bg-slate-600 transition-colors"
                    >
                        Play Again
                    </button>
                    <button
                        onClick={() => onComplete(score)}
                        style={{ backgroundColor: brandColor }}
                        className="px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        Continue →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            {/* Stats Bar */}
            <div className="flex justify-between items-center mb-4 text-white">
                <div className="flex gap-4">
                    <div className="bg-slate-800 px-4 py-2 rounded-xl">
                        <span className="text-xs text-gray-400">Score</span>
                        <p className="text-xl font-bold text-amber-400">{score}</p>
                    </div>
                    {catchStreak > 2 && (
                        <div className="bg-orange-500 px-4 py-2 rounded-xl animate-pulse">
                            <span className="text-xs">Streak</span>
                            <p className="text-xl font-bold">🔥 x{catchStreak}</p>
                        </div>
                    )}
                </div>
                <div className={`px-4 py-2 rounded-xl ${timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`}>
                    <span className="text-xs text-gray-400">Time</span>
                    <p className="text-xl font-bold">{timeLeft}s</p>
                </div>
            </div>

            {/* Game Area */}
            <div
                ref={gameAreaRef}
                className="relative w-full h-[60vh] bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl overflow-hidden touch-none cursor-none"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            >
                {/* Falling Items */}
                {items.map(item => (
                    <div
                        key={item.id}
                        className="absolute text-4xl transition-transform"
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {item.emoji}
                    </div>
                ))}

                {/* Basket */}
                <div
                    className="absolute bottom-4 text-5xl transition-all duration-75"
                    style={{
                        left: `${basketX}%`,
                        transform: 'translateX(-50%)'
                    }}
                >
                    🧺
                </div>

                {/* Instructions */}
                <div className="absolute bottom-0 left-0 right-0 text-center text-gray-500 text-xs py-2">
                    Move mouse/finger to control basket
                </div>
            </div>
        </div>
    );
};

export default CatchGame;

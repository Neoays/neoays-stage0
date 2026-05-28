import React, { useState, useEffect, useCallback } from 'react';

interface MemoryMatchProps {
    businessLogo?: string;
    brandColor?: string;
    onComplete: (score: number) => void;
}

interface Card {
    id: number;
    value: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const MemoryMatch: React.FC<MemoryMatchProps> = ({ businessLogo, brandColor = '#6366f1', onComplete }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);

    const emojis = ['🎁', '⭐', '🏆', '💎', '🎯', '🔥', '💰', '🎪'];

    const initializeGame = useCallback(() => {
        const gameCards: Card[] = [];
        const shuffledEmojis = [...emojis].sort(() => Math.random() - 0.5).slice(0, 8);

        shuffledEmojis.forEach((emoji, index) => {
            gameCards.push({ id: index * 2, value: emoji, isFlipped: false, isMatched: false });
            gameCards.push({ id: index * 2 + 1, value: emoji, isFlipped: false, isMatched: false });
        });

        // Shuffle cards
        setCards(gameCards.sort(() => Math.random() - 0.5));
        setFlippedCards([]);
        setMoves(0);
        setMatches(0);
        setIsComplete(false);
        setTimeLeft(60);
        setScore(0);
        setGameStarted(true);
    }, []);

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

    // Check for win
    useEffect(() => {
        if (matches === 8 && gameStarted) {
            const finalScore = Math.max(0, 500 - (moves * 5) + (timeLeft * 5));
            setScore(finalScore);
            setIsComplete(true);
            onComplete(finalScore);
        }
    }, [matches, moves, timeLeft, gameStarted, onComplete]);

    const handleCardClick = (cardId: number) => {
        if (flippedCards.length === 2) return;
        if (cards.find(c => c.id === cardId)?.isMatched) return;
        if (flippedCards.includes(cardId)) return;

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);
        setCards(prev => prev.map(card =>
            card.id === cardId ? { ...card, isFlipped: true } : card
        ));

        if (newFlipped.length === 2) {
            setMoves(prev => prev + 1);

            const [first, second] = newFlipped;
            const firstCard = cards.find(c => c.id === first);
            const secondCard = cards.find(c => c.id === second);

            if (firstCard?.value === secondCard?.value) {
                // Match found
                setTimeout(() => {
                    setCards(prev => prev.map(card =>
                        card.id === first || card.id === second
                            ? { ...card, isMatched: true }
                            : card
                    ));
                    setMatches(prev => prev + 1);
                    setFlippedCards([]);
                }, 300);
            } else {
                // No match
                setTimeout(() => {
                    setCards(prev => prev.map(card =>
                        card.id === first || card.id === second
                            ? { ...card, isFlipped: false }
                            : card
                    ));
                    setFlippedCards([]);
                }, 1000);
            }
        }
    };

    if (!gameStarted) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-white">
                <div className="text-6xl mb-6">🧠</div>
                <h2 className="text-3xl font-black mb-4">Memory Match</h2>
                <p className="text-gray-400 mb-8 text-center max-w-md">
                    Match all pairs before time runs out! Fewer moves = more points.
                </p>
                <button
                    onClick={initializeGame}
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
                <div className="text-6xl mb-6">{matches === 8 ? '🎉' : '⏰'}</div>
                <h2 className="text-3xl font-black mb-2">
                    {matches === 8 ? 'You Won!' : 'Time\'s Up!'}
                </h2>
                <div className="text-6xl font-black text-amber-400 mb-4">{score} pts</div>
                <div className="text-gray-400 mb-8">
                    {matches}/8 matches in {moves} moves
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={initializeGame}
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
            <div className="flex justify-between items-center mb-6 text-white">
                <div className="flex gap-4">
                    <div className="bg-slate-800 px-4 py-2 rounded-xl">
                        <span className="text-xs text-gray-400">Moves</span>
                        <p className="text-xl font-bold">{moves}</p>
                    </div>
                    <div className="bg-slate-800 px-4 py-2 rounded-xl">
                        <span className="text-xs text-gray-400">Matches</span>
                        <p className="text-xl font-bold">{matches}/8</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-xl ${timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-slate-800'}`}>
                    <span className="text-xs text-gray-400">Time</span>
                    <p className="text-xl font-bold">{timeLeft}s</p>
                </div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                {cards.map(card => (
                    <button
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        disabled={card.isMatched || flippedCards.length === 2}
                        className={`aspect-square rounded-2xl text-4xl flex items-center justify-center font-bold transition-all duration-300 transform ${card.isFlipped || card.isMatched
                                ? 'bg-white text-slate-900 scale-105'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-500'
                            } ${card.isMatched ? 'opacity-60 scale-95' : ''}`}
                        style={card.isFlipped || card.isMatched ? { borderColor: brandColor, borderWidth: 3 } : {}}
                    >
                        {card.isFlipped || card.isMatched ? card.value : '?'}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MemoryMatch;

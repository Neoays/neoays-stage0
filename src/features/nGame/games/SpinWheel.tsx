import React, { useState, useCallback, useRef } from 'react';

interface SpinWheelProps {
    businessLogo?: string;
    brandColor?: string;
    onComplete: (score: number) => void;
}

interface Segment {
    label: string;
    value: number;
    color: string;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ businessLogo, brandColor = '#f59e0b', onComplete }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<Segment | null>(null);
    const [hasSpun, setHasSpun] = useState(false);
    const wheelRef = useRef<HTMLDivElement>(null);

    const segments: Segment[] = [
        { label: '50', value: 50, color: '#ef4444' },
        { label: '100', value: 100, color: '#f97316' },
        { label: '25', value: 25, color: '#eab308' },
        { label: '200', value: 200, color: '#22c55e' },
        { label: '10', value: 10, color: '#06b6d4' },
        { label: '500', value: 500, color: '#8b5cf6' },
        { label: '75', value: 75, color: '#ec4899' },
        { label: '150', value: 150, color: '#3b82f6' },
    ];

    const spinWheel = useCallback(() => {
        if (isSpinning || hasSpun) return;

        setIsSpinning(true);
        setResult(null);

        // Random spins (5-10 full rotations) plus random offset
        const spins = 5 + Math.random() * 5;
        const segmentAngle = 360 / segments.length;
        const randomOffset = Math.random() * 360;
        const totalRotation = rotation + (spins * 360) + randomOffset;

        setRotation(totalRotation);

        // Calculate result after spin
        setTimeout(() => {
            const normalizedRotation = (totalRotation % 360);
            const segmentIndex = Math.floor((360 - normalizedRotation + segmentAngle / 2) % 360 / segmentAngle) % segments.length;
            setResult(segments[segmentIndex]);
            setIsSpinning(false);
            setHasSpun(true);
        }, 4000);
    }, [isSpinning, hasSpun, rotation, segments]);

    const handleContinue = () => {
        if (result) {
            onComplete(result.value);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-white">
            <h2 className="text-3xl font-black mb-8">🎡 Lucky Spin</h2>

            {/* Wheel Container */}
            <div className="relative mb-8">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                    <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-lg"></div>
                </div>

                {/* Wheel */}
                <div
                    ref={wheelRef}
                    className="w-72 h-72 rounded-full relative overflow-hidden shadow-2xl border-4 border-white/20"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                    }}
                >
                    {segments.map((segment, index) => {
                        const angle = (360 / segments.length) * index;
                        const skew = 90 - (360 / segments.length);

                        return (
                            <div
                                key={index}
                                className="absolute w-1/2 h-1/2 origin-bottom-right"
                                style={{
                                    transform: `rotate(${angle}deg) skewY(${skew}deg)`,
                                    backgroundColor: segment.color,
                                }}
                            >
                                <div
                                    className="absolute w-full h-full flex items-start justify-center pt-4"
                                    style={{
                                        transform: `skewY(${-skew}deg) rotate(${360 / segments.length / 2}deg)`,
                                    }}
                                >
                                    <span className="text-white font-black text-xl transform -rotate-90">
                                        {segment.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                        {businessLogo ? (
                            <img src={businessLogo} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <span className="text-2xl">🎯</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className="mb-8 text-center animate-bounce">
                    <p className="text-gray-400 mb-2">You won!</p>
                    <div className="text-6xl font-black text-amber-400">{result.value} pts</div>
                </div>
            )}

            {/* Spin Button */}
            {!hasSpun ? (
                <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    style={{ backgroundColor: brandColor }}
                    className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                >
                    {isSpinning ? 'Spinning...' : 'SPIN! 🎲'}
                </button>
            ) : (
                <button
                    onClick={handleContinue}
                    style={{ backgroundColor: brandColor }}
                    className="px-10 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform"
                >
                    Collect Points →
                </button>
            )}

            {!hasSpun && (
                <p className="text-gray-500 text-sm mt-4">One spin per session</p>
            )}
        </div>
    );
};

export default SpinWheel;

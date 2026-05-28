import React, { useEffect, useRef, useState } from 'react';
import { TrophyIcon, PlayIcon, ReloadIcon } from '../../../components/Icons';

interface FlappyBirdProps {
    businessLogo?: string;
    brandColor?: string;
    onComplete?: (score: number) => void;
}

const FlappyBird: React.FC<FlappyBirdProps> = ({ businessLogo, brandColor = '#6366f1', onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('nGameFlappyHighScore') || '0'));

    // Game Constants
    const CANVAS_WIDTH = 400;
    const CANVAS_HEIGHT = 600;
    const GRAVITY = 0.25;
    const FLAP_STRENGTH = -4.5;
    const SPAWN_RATE = 100; // frames
    const PIPE_SPEED = 2;
    const PIPE_WIDTH = 60;
    const PIPE_GAP = 150;

    const gameLoopRef = useRef<number>();
    const birdRef = useRef({ y: 300, v: 0 });
    const pipesRef = useRef<{ x: number, y: number }[]>([]);
    const frameCountRef = useRef(0);

    const startGame = () => {
        birdRef.current = { y: 300, v: 0 };
        pipesRef.current = [];
        frameCountRef.current = 0;
        setScore(0);
        setGameState('playing');
    };

    const flap = () => {
        if (gameState === 'playing') {
            birdRef.current.v = FLAP_STRENGTH;
        } else if (gameState === 'idle' || gameState === 'gameOver') {
            startGame();
        }
    };

    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const update = () => {
            frameCountRef.current++;

            // Update Bird
            birdRef.current.v += GRAVITY;
            birdRef.current.y += birdRef.current.v;

            // Spawn Pipes
            if (frameCountRef.current % SPAWN_RATE === 0) {
                const pipeHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
                pipesRef.current.push({ x: CANVAS_WIDTH, y: pipeHeight });
            }

            // Update Pipes
            pipesRef.current.forEach(pipe => {
                pipe.x -= PIPE_SPEED;
            });

            // Remove off-screen pipes
            if (pipesRef.current[0]?.x < -PIPE_WIDTH) {
                pipesRef.current.shift();
                setScore(s => s + 1);
            }

            // Collision Check
            if (birdRef.current.y > CANVAS_HEIGHT || birdRef.current.y < 0) {
                endGame();
            }

            pipesRef.current.forEach(pipe => {
                const birdX = 50;
                const birdY = birdRef.current.y;
                const birdSize = 25;

                if (
                    birdX + birdSize > pipe.x &&
                    birdX < pipe.x + PIPE_WIDTH &&
                    (birdY < pipe.y || birdY + birdSize > pipe.y + PIPE_GAP)
                ) {
                    endGame();
                }
            });
        };

        const draw = () => {
            // Clear
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // BG Gradient
            const gd = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            gd.addColorStop(0, '#f8fafc');
            gd.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = gd;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Draw Pipes with brand color
            pipesRef.current.forEach(pipe => {
                // Top Pipe
                ctx.fillStyle = brandColor;
                ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y);
                // Bottom Pipe
                ctx.fillRect(pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.y + PIPE_GAP));

                // Pipe Caps (darker shade)
                ctx.fillStyle = '#4f46e5';
                ctx.fillRect(pipe.x - 2, pipe.y - 10, PIPE_WIDTH + 4, 10);
                ctx.fillRect(pipe.x - 2, pipe.y + PIPE_GAP, PIPE_WIDTH + 4, 10);
            });

            // Draw Bird
            ctx.save();
            ctx.translate(50, birdRef.current.y);
            ctx.rotate(Math.min(birdRef.current.v * 0.1, 0.5));

            // Body
            ctx.fillStyle = '#4338ca';
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(10, -5, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(13, -5, 2, 0, Math.PI * 2);
            ctx.fill();

            // Wing
            ctx.fillStyle = brandColor;
            ctx.beginPath();
            ctx.ellipse(-10, 5, 12, 6, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Score UI
            ctx.fillStyle = '#1e293b';
            ctx.font = 'black 40px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 80);
        };

        const endGame = () => {
            setGameState('gameOver');
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('nGameFlappyHighScore', score.toString());
            }
            if (onComplete) onComplete(score);
            cancelAnimationFrame(gameLoopRef.current!);
        };

        const loop = () => {
            update();
            draw();
            gameLoopRef.current = requestAnimationFrame(loop);
        };

        gameLoopRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(gameLoopRef.current!);
    }, [gameState, score, highScore, onComplete, brandColor]);

    return (
        <div className="relative flex flex-col items-center p-4">
            <div
                className="relative overflow-hidden rounded-[2rem] border-[12px] border-white shadow-2xl bg-white cursor-pointer"
                onClick={flap}
                onKeyDown={e => e.key === ' ' && flap()}
                tabIndex={0}
            >
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="max-w-full h-auto"
                />

                {/* Overlays */}
                {gameState === 'idle' && (
                    <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
                        <div className="bg-white/10 p-6 rounded-full mb-6 ring-8 ring-white/5">
                            <PlayIcon className="h-16 w-16" />
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Flappy Bird</h2>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-8">Tap to Start</p>
                        <div className="flex gap-4">
                            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md">
                                <p className="text-[10px] font-black uppercase opacity-60">High Score</p>
                                <p className="text-xl font-black">{highScore}</p>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'gameOver' && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white animate-fade-in">
                        <TrophyIcon className="h-20 w-20 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        <h2 className="text-5xl font-black uppercase tracking-tighter mb-2">Game Over</h2>
                        <div className="flex gap-8 my-8 text-center">
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60">Score</p>
                                <p className="text-4xl font-black">{score}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60">Best</p>
                                <p className="text-4xl font-black">{highScore}</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); startGame(); }}
                            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                        >
                            <ReloadIcon className="h-5 w-5" /> Play Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlappyBird;

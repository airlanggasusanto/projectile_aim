"use client";
import { useEffect, useRef, useState } from "react";

const CANVAS_W = 800;
const CANVAS_H = 600;
const GRAVITY = 0.4;
const SLING_POS = { x: 100, y: CANVAS_H - 150 };

interface GameState {
  status: "menu" | "playing" | "gameover";
  score: number;
  timeLeft: number;
  ball: { x: number; y: number; vx: number; vy: number; radius: number; isFired: boolean };
  target: { x: number; y: number; w: number; h: number };
  obstacles: Array<{ x: number; y: number; w: number; h: number }>;
  drag: { startX: number; startY: number; currentX: number; currentY: number; isDragging: boolean };
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqRef = useRef<number>(null);

  const [uiStatus, setUiStatus] = useState<"menu" | "playing" | "gameover">("menu");
  const [finalScore, setFinalScore] = useState(0);

  const state = useRef<GameState>({
    status: "menu",
    score: 0,
    timeLeft: 60,
    ball: { ...SLING_POS, vx: 0, vy: 0, radius: 12, isFired: false },
    target: { x: 0, y: 0, w: 0, h: 0 },
    obstacles: [],
    drag: { startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false },
  });

  const circleRectCollide = (circle: any, rect: any) => {
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;

    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    return distance <= circle.radius;
  };

  const resetBall = (st: GameState) => {
    st.ball.isFired = false;
    st.ball.x = SLING_POS.x;
    st.ball.y = SLING_POS.y;
    st.ball.vx = 0;
    st.ball.vy = 0;
  };

  const generateLevel = (st: GameState) => {
    resetBall(st);
    st.target = { x: 600 + Math.random() * 100, y: 100 + Math.random() * 350, w: 40, h: 40 };
    st.obstacles = [];
    const numObs = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numObs; i++) {
      st.obstacles.push({
        x: 350 + i * 150,
        y: Math.random() > 0.5 ? 50 : CANVAS_H - (150 + Math.random() * 100),
        w: 30,
        h: 150 + Math.random() * 100,
      });
    }
  };

  const startGame = () => {
    const st = state.current;
    st.status = "playing";
    st.score = 0;
    st.timeLeft = 60;
    generateLevel(st);
    setUiStatus("playing");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    let secondTimer = 0;

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      const st = state.current;

      if (st.status === "playing") {
        secondTimer += dt;
        if (secondTimer >= 1000) {
          st.timeLeft -= 1;
          secondTimer = 0;
          if (st.timeLeft <= 0) {
            st.status = "gameover";
            setFinalScore(st.score);
            setUiStatus("gameover"); 
          }
        }

        if (st.ball.isFired) {
          st.ball.vy += GRAVITY;
          st.ball.x += st.ball.vx;
          st.ball.y += st.ball.vy;

          if (st.ball.y > CANVAS_H + 50 || st.ball.x > CANVAS_W + 50 || st.ball.x < -50) {
            resetBall(st);
          }

          for (let obs of st.obstacles) {
            if (circleRectCollide(st.ball, obs)) {
              resetBall(st);
            }
          }

          if (circleRectCollide(st.ball, st.target)) {
            st.score += 1;
            generateLevel(st);
          }
        }
      }

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (st.status === "playing") {
        ctx.fillStyle = "white";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`Score: ${st.score}`, 20, 40);
        ctx.textAlign = "right";
        ctx.fillStyle = st.timeLeft <= 10 ? "#ef4444" : "white";
        ctx.fillText(`Time: ${st.timeLeft}s`, CANVAS_W - 20, 40);

        ctx.fillStyle = "#ef4444";
        st.obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.w, obs.h));

        ctx.fillStyle = "#22c55e";
        ctx.fillRect(st.target.x, st.target.y, st.target.w, st.target.h);

        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.arc(SLING_POS.x, SLING_POS.y, 8, 0, Math.PI * 2);
        ctx.fill();

        if (st.drag.isDragging && !st.ball.isFired) {
          const dx = st.drag.startX - st.drag.currentX;
          const dy = st.drag.startY - st.drag.currentY;
          const MULTIPLIER = 0.15;

          ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(st.ball.x, st.ball.y);
          ctx.lineTo(st.ball.x - dx, st.ball.y - dy);
          ctx.stroke();

          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          let simX = st.ball.x;
          let simY = st.ball.y;
          let simVx = dx * MULTIPLIER;
          let simVy = dy * MULTIPLIER;
          for (let i = 1; i <= 60; i++) {
            simVy += GRAVITY;
            simX += simVx;
            simY += simVy;
            if (i % 5 === 0) {
              ctx.beginPath();
              ctx.arc(simX, simY, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(st.ball.x, st.ball.y, st.ball.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      reqRef.current = requestAnimationFrame(loop);
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current!);
  }, []);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = state.current;
    if (st.status === "playing" && !st.ball.isFired) {
      // PERBAIKAN: Memaksa browser mengunci event pointer ke elemen canvas
      // meskipun kursor mouse/jari ditarik keluar dari batas canvas
      e.currentTarget.setPointerCapture(e.pointerId); 
      
      const pos = getPointerPos(e);
      st.drag.isDragging = true;
      st.drag.startX = pos.x;
      st.drag.startY = pos.y;
        st.drag.currentX = pos.x;
        st.drag.currentY = pos.y;
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = state.current;
      if (st.drag.isDragging) {
        const pos = getPointerPos(e);
        st.drag.currentX = pos.x;
        st.drag.currentY = pos.y;
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const st = state.current;
      if (st.drag.isDragging) {
        // PERBAIKAN: Melepaskan kuncian pointer setelah klik dilepas
        e.currentTarget.releasePointerCapture(e.pointerId);

        st.drag.isDragging = false;
        const dx = st.drag.startX - st.drag.currentX;
        const dy = st.drag.startY - st.drag.currentY;
        st.ball.vx = dx * 0.15;
        st.ball.vy = dy * 0.15;
        st.ball.isFired = true;
      }
    };

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-4xl relative overflow-hidden rounded-xl shadow-2xl border-4 border-slate-700">
          
          {uiStatus !== "playing" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              {uiStatus === "menu" ? (
                <>
                  <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-wider text-center">
                    PROJECTILE AIMING
                  </h1>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full font-bold text-xl transition-all shadow-lg"
                  >
                    Start Game
                  </button>
                </>
              ) : (
                <>
                  <h1 className="text-5xl font-black text-red-500 mb-2">TIME'S UP!</h1>
                  <p className="text-2xl text-white font-medium mb-8">Final Score: {finalScore}</p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full font-bold text-xl transition-all shadow-lg"
                  >
                    Play Again
                  </button>
                </>
              )}
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-auto bg-slate-900 touch-none block"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
        
        <p className="mt-6 text-gray-400 text-sm text-center max-w-md">
          Touch and drag to aim the blue projectile. Launch it toward the green box while avoiding the red box!
        </p>
      </main>
    );
  }
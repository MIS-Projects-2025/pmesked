import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

export default function Maintenance() {
  const [activeGame, setActiveGame] = useState(null);

  return (
    <AuthenticatedLayout>
      <Head title="Maintenance" />

      <style>{`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes bgMove {
    0% { background-position: 0 0; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0 0; }
  }

  .animated-bg {
    background: linear-gradient(135deg, #3a3a3a, #4f4f4f, #5c5c5c, #3a3a3a);
    background-size: 200% 200%;
    animation: bgMove 10s ease infinite;
  }

  .spin {
    animation: spin 5s linear infinite;
  }
`}</style>


      <div className="min-h-screen animated-bg flex justify-center items-center px-4 rounded-md border border-2 border-blue-400">
        <div className="bg-white/90 backdrop-blur-xl w-full max-w-3xl rounded-2xl shadow-2xl p-10 border border-4 border-[#3c8dbc]">

          <div className="flex flex-col items-center">
            <svg className="w-24 h-24 mb-3" style={{ animation: "spin 4s linear infinite" }} xmlns="http://www.w3.org/2000/svg" fill="#6b7280" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.11-.64l-1.92-3.32a.5.5 0 00-.61-.22l-2.39.96c-.49-.38-1.04-.7-1.63-.94l-.36-2.54A.488.488 0 0014.29 2h-4.58a.5.5 0 00-.49.42l-.36 2.54c-.59.24-1.14.56-1.63.94l-2.39-.96a.5.5 0 00-.61.22L2.71 8.84c-.14.23-.08.53.11.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.11.64l1.92 3.32c.14.23.44.33.61.22l2.39-.96c.49.38 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h4.58c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.14-.56 1.63-.94l2.39.96c.23.11.52.01.61-.22l1.92-3.32a.5.5 0 00-.11-.64l-2.03-1.58zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 8.5 12 8.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
            </svg>

            <h1 className="text-4xl font-extrabold text-gray-700 uppercase">Maintenance System</h1>
            <p className="text-gray-600 mt-2">This module is under development — play a mini-game while waiting!</p>
          </div>

          <div className="mt-8 w-full text-center">
            {!activeGame && <GameMenu setActiveGame={setActiveGame} />}

            {activeGame === "dots" && <ClickTheDot onBack={() => setActiveGame(null)} />}
            {activeGame === "catch" && <CatchFalling onBack={() => setActiveGame(null)} />}
            {activeGame === "memory" && <MemoryFlip onBack={() => setActiveGame(null)} />}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

/* -------------------------------
   GAME MENU
--------------------------------*/
function GameMenu({ setActiveGame }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-gray-700">
      <GameCard title="Click The Dot" emoji="🎯" onClick={() => setActiveGame("dots")} />
      <GameCard title="Catch the Falling" emoji="🪂" onClick={() => setActiveGame("catch")} />
      <GameCard title="Memory Flip" emoji="🧠" onClick={() => setActiveGame("memory")} />
    </div>
  );
}

function GameCard({ title, emoji, onClick }) {
  return (
    <div onClick={onClick} className="cursor-pointer bg-blue-100 hover:bg-blue-200 transition p-6 rounded-xl shadow text-lg font-semibold flex flex-col items-center">
      <div className="text-4xl">{emoji}</div>
      <div className="mt-2">{title}</div>
    </div>
  );
}

/* -------------------------------
   GAME 1 — CLICK THE DOT
--------------------------------*/
function ClickTheDot({ onBack }) {
  const canvasRef = useRef();
  const [score, setScore] = useState(0);
  const [dot, setDot] = useState({ x: 100, y: 100 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function moveDot() {
      const x = Math.random() * 680 + 10;
      const y = Math.random() * 280 + 10;
      setDot({ x, y });
    }

    const interval = setInterval(moveDot, 1000);

    function draw() {
      ctx.clearRect(0, 0, 700, 300);
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 12, 0, Math.PI * 2);
      ctx.fill();
      requestAnimationFrame(draw);
    }
    draw();

    return () => clearInterval(interval);
  }, [dot]);

  function handleClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dist = Math.hypot(x - dot.x, y - dot.y);
    if (dist < 15) setScore((s) => s + 1);
  }

  return (
    <div className="text-center">
      <button onClick={onBack} className="mb-3 px-3 py-1 bg-gray-300 rounded">⬅ Back</button>
      <p className="font-bold text-xl">Score: {score}</p>
      <canvas ref={canvasRef} width={700} height={300} onClick={handleClick} className="border rounded mt-3" />
    </div>
  );
}

/* -------------------------------
   GAME 2 — CATCH THE FALLING
--------------------------------*/
function CatchFalling({ onBack }) {
  const canvasRef = useRef();
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let bucketX = 300;
    let itemX = Math.random() * 680;
    let itemY = 100;
    let velX = 3; // horizontal speed
    let velY = 3; // vertical speed
    const radius = 12; // circle radius

    function update() {
      ctx.clearRect(0, 0, 700, 300);

      // move item
      itemX += velX;
      itemY += velY;

      // bounce off walls
      if (itemX < radius || itemX > 700 - radius) velX *= -1;
      if (itemY < radius) velY *= -1;

      // check collision with bucket
      if (
        itemY + radius >= 260 &&
        itemX > bucketX &&
        itemX < bucketX + 80 &&
        velY > 0
      ) {
        setScore((s) => s + 1);
        velY *= -1; // bounce up
      }

      // reset if it goes below canvas
      if (itemY > 300) {
        itemX = Math.random() * 680;
        itemY = 100;
        velY = 3;
        velX = 3;
      }

      // draw circle
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(itemX, itemY, radius, 0, Math.PI * 2);
      ctx.fill();

      // draw bucket
      ctx.fillStyle = "blue";
      ctx.fillRect(bucketX, 260, 80, 25);

      requestAnimationFrame(update);
    }

    update();

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      bucketX = e.clientX - rect.left - 40;
    };
    window.addEventListener("mousemove", handleMouse);

    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <div className="text-center">
      <button onClick={onBack} className="mb-3 px-3 py-1 bg-gray-300 rounded">⬅ Back</button>
      <p className="font-bold text-xl">Score: {score}</p>
      <canvas ref={canvasRef} width={700} height={300} className="border rounded mt-3" />
    </div>
  );
}


/* -------------------------------
   GAME 3 — MEMORY FLIP
--------------------------------*/
function MemoryFlip({ onBack }) {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState([]);

  useEffect(() => {
    let nums = [1, 2, 3, 1, 2, 3];
    nums.sort(() => Math.random() - 0.5);
    setCards(nums);
  }, []);

  function flip(i) {
    if (selected.length === 2 || matched.includes(i)) return;
    setSelected([...selected, i]);

    if (selected.length === 1) {
      const a = selected[0];
      const b = i;
      if (cards[a] === cards[b]) {
        setMatched([...matched, a, b]);
      }
      setTimeout(() => setSelected([]), 700);
    }
  }

  return (
    <div className="text-center">
      <button onClick={onBack} className="mb-3 px-3 py-1 bg-gray-300 rounded">⬅ Back</button>
      <div className="grid grid-cols-3 gap-4 w-40 mx-auto">
        {cards.map((val, i) => (
          <div
            key={i}
            onClick={() => flip(i)}
            className="w-20 h-20 bg-blue-200 flex justify-center items-center rounded text-xl font-bold cursor-pointer"
          >
            {selected.includes(i) || matched.includes(i) ? val : "?"}
          </div>
        ))}
      </div>
    </div>
  );
}

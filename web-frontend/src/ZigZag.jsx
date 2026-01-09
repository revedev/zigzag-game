import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
// --- NEW IMPORT: CONNECT TO LINERA BRIDGE ---
import { lineraService } from './LineraBridge'; 

// --- CONFIGURATION ---
const TILE_SIZE = 2.2;
const START_SPEED = 0.12;
const LEVEL_THRESHOLD = 50;

const THEMES = [
  { bg: '#c0392b', tileTop: '#ecf0f1', tileSide: '#7f8c8d', ball: '#2c3e50', diamond: '#f1c40f', ui: '#fff' },
  { bg: '#2980b9', tileTop: '#d6eaf8', tileSide: '#1a5276', ball: '#111', diamond: '#f39c12', ui: '#fff' },
  { bg: '#27ae60', tileTop: '#abebc6', tileSide: '#145a32', ball: '#fff', diamond: '#8e44ad', ui: '#222' },
  { bg: '#4a235a', tileTop: '#e8daef', tileSide: '#2e0b3c', ball: '#00f3ff', diamond: '#00ff00', ui: '#fff' }
];

// --- AUDIO ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isMuted = false;

const playSound = (type) => {
  if (isMuted || audioCtx.state === 'suspended') {
      if(audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      if(isMuted) return;
  }
  const now = audioCtx.currentTime;

  try {
    if (type === 'tap') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'diamond') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'crash') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch(e) {}
};

// --- 3D COMPONENTS ---
const Tile = ({ position, falling, theme }) => {
  const mesh = useRef();
  useFrame((state, delta) => {
    if (falling && mesh.current) {
      mesh.current.position.y -= 25 * delta;
      mesh.current.rotation.x += 5 * delta;
    }
  });
  return (
    <group position={position}>
      <mesh ref={mesh}>
        <boxGeometry args={[TILE_SIZE, 0.6, TILE_SIZE]} />
        <meshStandardMaterial attach="material-0" color={theme.tileSide} />
        <meshStandardMaterial attach="material-1" color={theme.tileSide} />
        <meshStandardMaterial attach="material-2" color={theme.tileTop} />
        <meshStandardMaterial attach="material-3" color={theme.tileSide} />
        <meshStandardMaterial attach="material-4" color={theme.tileSide} />
        <meshStandardMaterial attach="material-5" color={theme.tileSide} />
      </mesh>
    </group>
  );
};

const Diamond = ({ position, theme }) => {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = 1.5 + Math.sin(t * 8) * 0.3;
    ref.current.rotation.y += 0.05;
  });
  return (
    <mesh ref={ref} position={[position[0], 1.5, position[2]]}>
      <octahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color={theme.diamond} emissive={theme.diamond} emissiveIntensity={0.8} />
    </mesh>
  );
};

const Ball = ({ position, color }) => (
  <mesh position={[position[0], 0.8, position[2]]} castShadow>
    <sphereGeometry args={[0.45, 32, 32]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

const CameraController = ({ ballPos }) => {
  const { camera } = useThree();
  useFrame(() => {
    if (!ballPos) return;
    const offset = 50;
    const target = new THREE.Vector3(ballPos[0] + offset, offset, ballPos[2] + offset);
    camera.position.lerp(target, 0.2);
    camera.lookAt(ballPos[0], 0, ballPos[2]);
  });
  return null;
};

// --- GAME LOGIC ---
const GameScene = ({ onScore, setGameOver, isPlaying, onStart, score }) => {
  const { scene } = useThree();
  const theme = THEMES[(Math.floor(score / LEVEL_THRESHOLD)) % THEMES.length];

  useEffect(() => { scene.background = new THREE.Color(theme.bg); }, [theme]);

  const [path, setPath] = useState([]);
  const [diamonds, setDiamonds] = useState([]);
  const [ballPos, setBallPos] = useState([0, 0, 0]);
  const [velocity, setVelocity] = useState([0, 0, 0]);
  const tileIdCounter = useRef(0);

  const state = useRef({
    speed: START_SPEED,
    dir: 0,
    genCount: 0,
    score: 0
  });

  useEffect(() => {
    const initPath = [];
    for (let i = 0; i < 25; i++) {
      initPath.push({ x: 0, z: -(i * TILE_SIZE), falling: false, id: tileIdCounter.current++ });
    }
    let last = { x: 0, z: -(24 * TILE_SIZE) };
    state.current.genCount = 8;
    const newPath = [...initPath];
    for(let i=0; i<80; i++) {
      last = generateNextBlock(last);
      newPath.push(last);
    }
    setPath(newPath);
  }, []);

  const generateNextBlock = (last) => {
    state.current.genCount--;
    if (state.current.genCount <= 0) {
      state.current.dir = state.current.dir === 0 ? 1 : 0;
      state.current.genCount = score < 50 ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 6) + 2;
    }
    const isForward = state.current.dir === 0;
    return {
      x: isForward ? last.x : last.x + TILE_SIZE,
      z: isForward ? last.z - TILE_SIZE : last.z,
      falling: false,
      id: tileIdCounter.current++
    };
  };

  useFrame((_, delta) => {
    if (!isPlaying) return;

    const moveDist = state.current.speed * (TILE_SIZE * 50) * delta;
    const newPos = [
      ballPos[0] + velocity[0] * moveDist,
      0,
      ballPos[2] + velocity[2] * moveDist
    ];
    setBallPos(newPos);

    const tolerance = TILE_SIZE * 0.6;
    const onTile = path.some(p =>
      !p.falling &&
      Math.abs(p.x - newPos[0]) < tolerance &&
      Math.abs(p.z - newPos[2]) < tolerance
    );

    if (!onTile) {
      playSound('crash');
      setGameOver();
      return;
    }

    let newPath = [...path];
    let changed = false;

    newPath.forEach(p => {
      const dist = Math.sqrt(Math.pow(p.x - newPos[0], 2) + Math.pow(p.z - newPos[2], 2));
      if (dist > (TILE_SIZE * 2.5) && !p.falling) {
         if ((velocity[2] < 0 && p.z > newPos[2] + TILE_SIZE) || (velocity[0] > 0 && p.x < newPos[0] - TILE_SIZE)) {
             p.falling = true;
             changed = true;
         }
      }
    });

    const lastTile = newPath[newPath.length - 1];
    if (Math.sqrt(Math.pow(lastTile.x - newPos[0], 2) + Math.pow(lastTile.z - newPos[2], 2)) < (60 * TILE_SIZE)) {
        let next = generateNextBlock(lastTile);
        newPath.push(next);
        if (Math.random() > 0.7) setDiamonds(prev => [...prev, { x: next.x, z: next.z, id: Date.now() }]);
        changed = true;
    }

    if (newPath.length > 150) {
        newPath = newPath.slice(newPath.length - 100);
        changed = true;
    }
    if (changed) setPath(newPath);

    const collected = diamonds.find(d => Math.abs(d.x - newPos[0]) < 1.0 && Math.abs(d.z - newPos[2]) < 1.0);
    if (collected) {
        playSound('diamond');
        setDiamonds(prev => prev.filter(d => d !== collected));

        // --- CONNECTED TO LINERA ---
        lineraService.submitScore(5); // Send score to blockchain
        // ---------------------------

        state.current.score += 5;
        onScore(Math.floor(state.current.score));
    }

    state.current.score += 0.05;
    onScore(Math.floor(state.current.score));
    if (state.current.speed < 0.22) state.current.speed += 0.000008;
  });

  const handleTap = () => {
    if (!isPlaying) {
      onStart();
      playSound('tap');
      setVelocity([0, 0, -1]);
      return;
    }
    playSound('tap');
    if (velocity[2] !== 0) setVelocity([1, 0, 0]);
    else setVelocity([0, 0, -1]);
  };

  return (
    <>
      <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={25} near={-5000} far={10000} />
      <CameraController ballPos={ballPos} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[10, 20, 5]} intensity={1.5} castShadow />
      <group onClick={handleTap}>
        <mesh visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}><planeGeometry args={[5000, 5000]} /></mesh>
        <Ball position={ballPos} color={theme.ball} />
        {path.map((p) => <Tile key={p.id} position={[p.x, 0, p.z]} falling={p.falling} theme={theme} />)}
        {diamonds.map(d => <Diamond key={d.id} position={[d.x, 0, d.z]} theme={theme} />)}
      </group>
    </>
  );
};

// --- UI COMPONENTS ---
const SettingsModal = ({ onClose, toggleSound, isMuted, onConnectWallet }) => (
  <div style={{
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff', padding: '20px', borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)', width: '280px', textAlign: 'center', pointerEvents: 'auto', zIndex: 100
  }}>
    <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>SETTINGS</h2>

    <button onClick={toggleSound} style={btnStyle}>
      {isMuted ? '🔇 UNMUTE SOUND' : '🔊 MUTE SOUND'}
    </button>

    <button onClick={() => window.open('https://discord.com', '_blank')} style={{...btnStyle, background: '#5865F2'}}>
      💬 JOIN DISCORD
    </button>

    <button onClick={onConnectWallet} style={{...btnStyle, background: '#e67e22'}}>
      🦊 LINERA WALLET
    </button>

    <button onClick={onClose} style={{...btnStyle, background: '#95a5a6', marginTop: '20px'}}>
      CLOSE
    </button>
  </div>
);

const btnStyle = {
  width: '100%', padding: '12px', margin: '5px 0', borderRadius: '8px',
  border: 'none', background: '#333', color: 'white', fontWeight: 'bold', cursor: 'pointer'
};

const UI = ({ score, status, onRestart, toggleSettings }) => {
  const theme = THEMES[(Math.floor(score / LEVEL_THRESHOLD)) % THEMES.length];
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', display: 'flex', flexDirection: 'column', padding: '20px',
      touchAction: 'none', fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '4rem', fontWeight: '900', color: theme.ui, textShadow: '2px 2px rgba(0,0,0,0.3)' }}>{score}</div>
          <button onClick={toggleSettings} style={{ pointerEvents: 'auto', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer' }}>⚙️</button>
      </div>

      {status === 'START' && (
         <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: '900', color: theme.ball, textShadow: '3px 3px white' }}>ZIG ZAG</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.ball, marginTop: '10px' }}>TAP TO START</p>
         </div>
      )}

      {status === 'GAMEOVER' && (
         <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', backgroundColor: 'white', padding: '40px', width: '80%', maxWidth: '300px',
            borderRadius: '20px', pointerEvents: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
         }}>
            <h1 style={{ color: '#c0392b', margin: 0 }}>GAME OVER</h1>
            <h2 style={{ color: '#2c3e50', fontSize: '4rem', margin: '10px 0' }}>{score}</h2>
            <button onClick={onRestart} style={btnStyle}>RETRY</button>
         </div>
      )}
    </div>
  );
};

// --- APP WRAPPER ---
const ZigZag = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("START");
  const [key, setKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMuted] = useState(false);
  const [wallet, setWallet] = useState(null);

  const toggleSound = () => {
    isMuted = !isMuted;
    setMuted(isMuted);
  };

  const connectWallet = () => {
    // Placeholder for actual Linera connection
    setWallet("0x123...abc");
    alert("Linera Wallet Connected (Simulation)");
  };

  return (
    <div style={{ width: '100vw', height: '100vh', touchAction: 'none', background: '#333' }}>
      <Canvas shadows key={key} dpr={[1, 2]}>
        <GameScene onScore={setScore} setGameOver={() => setStatus("GAMEOVER")} isPlaying={status === "PLAYING"} onStart={() => setStatus("PLAYING")} score={score} />
      </Canvas>
      <UI score={score} status={status} onRestart={() => { setScore(0); setStatus("START"); setKey(k => k + 1); }} toggleSettings={() => setShowSettings(true)} />
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} toggleSound={toggleSound} isMuted={muted} onConnectWallet={connectWallet} />
      )}
    </div>
  );
};

export default ZigZag;
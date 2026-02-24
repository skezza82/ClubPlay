"use client";

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { ArcadeGame } from '@/app/arcade/page';

interface ArcadeMachineProps {
    game: ArcadeGame;
    position: [number, number, number];
    rotation: [number, number, number];
    isActive: boolean;
    onClick: () => void;
    onPlay: () => void;
}

export function ArcadeMachine({ game, position, rotation, isActive, onClick, onPlay }: ArcadeMachineProps) {
    const groupRef = useRef<THREE.Group>(null);
    const screenRef = useRef<THREE.Mesh>(null);

    // Fallback texture for the screen
    const dummyTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = '#7c3aed';
            ctx.font = 'bold 60px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(game.title, 256, 256);
        }
        return new THREE.CanvasTexture(canvas);
    }, [game.title]);

    // Use actual texture if available, else the dummy
    const [texture, setTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        if (game.image && game.image !== '/images/retro-club-bg.png') {
            const loader = new THREE.TextureLoader();
            loader.load(game.image, (tex) => {
                setTexture(tex);
            });
        }
    }, [game.image]);

    useFrame((state) => {
        if (groupRef.current) {
            // Hover animation for active machine
            const targetY = isActive ? position[1] + 0.3 : position[1];
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

            // Subtle floating if active
            if (isActive) {
                groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.002;
            }
        }
        if (screenRef.current && isActive && (texture || dummyTexture)) {
            // Very subtle screen pulse effect
            (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
        }
    });

    const arcadeColor = isActive ? '#7c3aed' : '#1a1a1a';
    const emissiveColor = isActive ? '#7c3aed' : '#000000';
    const panelColor = isActive ? '#2a2a2a' : '#111111';

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            onClick={(e) => {
                e.stopPropagation();
                if (isActive) {
                    onPlay();
                } else {
                    onClick();
                }
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            {/* Main Cabinet Body */}
            <mesh position={[0, 1.5, -0.6]}>
                <boxGeometry args={[1.5, 3, 1.2]} />
                <meshStandardMaterial color={arcadeColor} roughness={0.8} />
                <Edges color={isActive ? '#a78bfa' : '#333'} threshold={15} />
            </mesh>

            {/* Screen Hood (Top extended out) */}
            <mesh position={[0, 2.8, 0.1]}>
                <boxGeometry args={[1.5, 0.4, 0.6]} />
                <meshStandardMaterial color={arcadeColor} />
            </mesh>

            {/* Screen Panel (Slanted) */}
            <mesh position={[0, 2.0, -0.1]} rotation={[-Math.PI / 8, 0, 0]}>
                <boxGeometry args={[1.3, 1.2, 0.1]} />
                <meshStandardMaterial color="#000" />
            </mesh>

            {/* The Screen Display */}
            <mesh ref={screenRef} position={[0, 2.0, -0.04]} rotation={[-Math.PI / 8, 0, 0]}>
                <planeGeometry args={[1.2, 1.1]} />
                <meshStandardMaterial
                    map={texture || dummyTexture}
                    emissive={isActive ? '#ffffff' : '#000000'}
                    emissiveMap={texture || dummyTexture}
                    emissiveIntensity={isActive ? 0.5 : 0}
                />
            </mesh>

            {/* Control Panel Base */}
            <mesh position={[0, 1.2, 0.4]} rotation={[Math.PI / 12, 0, 0]}>
                <boxGeometry args={[1.5, 0.15, 0.7]} />
                <meshStandardMaterial color={panelColor} roughness={0.5} />
                <Edges color={isActive ? '#a78bfa' : '#333'} />
            </mesh>

            {/* Joystick Base */}
            <mesh position={[-0.4, 1.3, 0.4]}>
                <cylinderGeometry args={[0.08, 0.1, 0.05]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            {/* Joystick Stick */}
            <mesh position={[-0.4, 1.4, 0.4]} rotation={[0.1, 0, 0.1]}>
                <cylinderGeometry args={[0.02, 0.02, 0.2]} />
                <meshStandardMaterial color="#ccc" metalness={0.8} />
            </mesh>
            {/* Joystick Ball */}
            <mesh position={[-0.41, 1.5, 0.41]}>
                <sphereGeometry args={[0.08]} />
                <meshStandardMaterial color="#ef4444" roughness={0.2} />
            </mesh>

            {/* Buttons */}
            <mesh position={[0.2, 1.28, 0.35]}>
                <cylinderGeometry args={[0.05, 0.05, 0.02]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.2} />
            </mesh>
            <mesh position={[0.4, 1.28, 0.45]}>
                <cylinderGeometry args={[0.05, 0.05, 0.02]} />
                <meshStandardMaterial color="#eab308" roughness={0.2} />
            </mesh>
            <mesh position={[0.6, 1.28, 0.35]}>
                <cylinderGeometry args={[0.05, 0.05, 0.02]} />
                <meshStandardMaterial color="#ef4444" roughness={0.2} />
            </mesh>

            {/* Marquee Glowing Sign */}
            <mesh position={[0, 2.8, 0.41]}>
                <planeGeometry args={[1.4, 0.3]} />
                <meshStandardMaterial
                    color={emissiveColor}
                    emissive={emissiveColor}
                    emissiveIntensity={isActive ? 1.5 : 0.2}
                />
            </mesh>
            {/* Game Title on Marquee */}
            {dummyTexture && (
                <Text
                    position={[0, 2.8, 0.42]}
                    fontSize={isActive ? 0.15 : 0.12}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={1.3}
                >
                    {game.title}
                </Text>
            )}

            {/* Coin slots */}
            <mesh position={[-0.3, 0.6, -0.05]}>
                <boxGeometry args={[0.1, 0.2, 0.05]} />
                <meshStandardMaterial color="#555" metalness={0.8} />
            </mesh>
            <mesh position={[0.3, 0.6, -0.05]}>
                <boxGeometry args={[0.1, 0.2, 0.05]} />
                <meshStandardMaterial color="#555" metalness={0.8} />
            </mesh>

            {/* Glowing effect below for active machine */}
            {isActive && (
                <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[2.5, 2.5]} />
                    <meshBasicMaterial color="#7c3aed" transparent opacity={0.3} />
                </mesh>
            )}
        </group>
    );
}

export default ArcadeMachine;

"use client";

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useFBX, useTexture } from '@react-three/drei';
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
            // Hover animation for active machine. Since we scaled by 2, hover height needs to be higher.
            const targetY = isActive ? position[1] + 0.6 : position[1];
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);

            // Subtle floating if active
            if (isActive) {
                groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.004;
            }
        }
    });

    // Load FBX Model and PBR Textures
    const fbx = useFBX('/models/midway-pacman/02_arcade.fbx');
    const [albedoMap, emissionMap, metallicMap, normalMap] = useTexture([
        '/models/midway-pacman/arcade_arcade_MAT_AlbedoTransparency.png',
        '/models/midway-pacman/arcade_arcade_MAT_Emission.png',
        '/models/midway-pacman/arcade_arcade_MAT_MetallicSmoothness.png',
        '/models/midway-pacman/arcade_arcade_MAT_Normal.png',
    ]);

    // Clone the FBX so each machine gets its own instance and materials can be modified independently
    const clonedFbx = useMemo(() => {
        const clone = fbx.clone(true);
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;

                // Create a standard material with our PBR maps
                const material = new THREE.MeshStandardMaterial({
                    map: albedoMap,
                    emissiveMap: emissionMap,
                    emissive: new THREE.Color('#ffffff'),
                    // Set a default low emission so the marquee glows slightly even when inactive
                    emissiveIntensity: isActive ? 1.0 : 0.2,
                    metalnessMap: metallicMap,
                    normalMap: normalMap,
                    roughness: 0.5,
                    metalness: 1.0,
                });

                mesh.material = material;
            }
        });

        // Scale and position fixes often needed for raw FBX imports
        clone.scale.set(0.015, 0.015, 0.015);
        // Sometimes models face the wrong way
        clone.rotation.set(0, Math.PI, 0);
        // Adjust vertical alignment to sit on the floor
        clone.position.set(0, 0, 0);

        return clone;
    }, [fbx, albedoMap, emissionMap, metallicMap, normalMap, texture, dummyTexture, isActive]);

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            scale={[2, 2, 2]} // Scale the entire machine by 2x
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
            {/* The Loaded Midway Pac-Man Model */}
            <primitive object={clonedFbx} />

            {/* The Screen Display Overlay - Placed roughly over the original monitor.
                The midway pacman screen is slanted far back and high up. */}
            <mesh position={[0, 1.48, 0.35]} rotation={[-Math.PI / 4, 0, 0]}>
                <planeGeometry args={[0.6, 0.6]} />
                <meshStandardMaterial
                    map={texture || dummyTexture}
                    emissive={isActive ? '#ffffff' : '#000000'}
                    emissiveMap={texture || dummyTexture}
                    emissiveIntensity={isActive ? 0.8 : 0}
                />
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

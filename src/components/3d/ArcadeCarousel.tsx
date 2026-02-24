"use client";

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { ArcadeMachine } from './ArcadeMachine';
import { ArcadeGame } from '@/app/arcade/page';

interface ArcadeCarouselProps {
    games: ArcadeGame[];
    activeGameId: string | null;
    setActiveGameId: (id: string | null) => void;
    onPlay: (game: ArcadeGame) => void;
}

function CarouselGroup({ games, activeGameId, setActiveGameId, onPlay }: ArcadeCarouselProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    // Find active index
    let activeIndex = games.findIndex(g => g.id === activeGameId);
    if (activeIndex === -1) activeIndex = 0; // Default to first game facing camera if none active

    const count = games.length;
    // We want the active machine to face the camera. 
    // If we place them evenly on a circle, and angle 0 is facing outward towards Z
    const angleStep = (Math.PI * 2) / count;

    // Target rotation based on active game: we rotate the group negatively so that
    // the machine at activeIndex * angleStep is brought back to 0 (facing camera).
    const targetGroupRotationY = -activeIndex * angleStep;

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Smoothly rotate the entire carousel
            groupRef.current.rotation.y = THREE.MathUtils.damp(
                groupRef.current.rotation.y,
                targetGroupRotationY,
                4,
                delta
            );
        }

        // Gentle camera zoom effect based on active state
        const targetZ = activeGameId ? 5.5 : 8.5;
        const targetY = activeGameId ? 2.5 : 3.5;

        // Use lerp instead of individual assignments to satisfy mutability linters
        const targetPosition = new THREE.Vector3(0, targetY, targetZ);
        camera.position.lerp(targetPosition, delta * 4);

        camera.lookAt(0, 2.0, 0); // Always look towards center of scene
    });

    const radius = Math.max(3.5, count * 0.8); // Scale radius dynamically based on number of games

    return (
        <group ref={groupRef}>
            {games.map((game, i) => {
                const angle = i * angleStep;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;

                return (
                    <ArcadeMachine
                        key={game.id}
                        game={game}
                        position={[x, 0, z]}
                        // The machine rotates to face outwards from the center
                        rotation={[0, angle, 0]}
                        isActive={game.id === activeGameId}
                        onClick={() => setActiveGameId(game.id)}
                        onPlay={() => onPlay(game)}
                    />
                );
            })}
        </group>
    );
}

export function ArcadeCarousel(props: ArcadeCarouselProps) {
    return (
        <div className="w-full h-full min-h-[500px] relative pointer-events-auto">
            <Canvas camera={{ position: [0, 3.5, 8.5], fov: 45 }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
                <spotLight
                    position={[0, 8, 5]}
                    angle={0.8}
                    penumbra={1}
                    intensity={2}
                    color="#7c3aed"
                    distance={20}
                />

                <CarouselGroup {...props} />

                {/* Minimal shadow alternative */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                    <planeGeometry args={[20, 20]} />
                    <meshBasicMaterial color="#000000" transparent opacity={0.5} />
                </mesh>

                {/* Allows user to marginally drag/look around, restricted so they can't break view */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                    minAzimuthAngle={-Math.PI / 8}
                    maxAzimuthAngle={Math.PI / 8}
                    enableDamping
                />
            </Canvas>

            {/* Carousel Navigation Hints */}
            {!props.activeGameId && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 pointer-events-none md:hidden">
                    <span className="text-white/60 text-xs uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                        Swipe or Click to Select
                    </span>
                </div>
            )}
        </div>
    );
}

export default ArcadeCarousel;

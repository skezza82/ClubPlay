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

    const pacmanGame: ArcadeGame = {
        id: 'pacman',
        title: 'Pac-Man',
        description: 'Classic arcade maze game.',
        // We'll use a placeholder or known image, assuming it exists
        image: '/images/retro-club-bg.png',
        url: 'https://archive.org/embed/arcade_pacman',
        publisher: 'Midway',
        type: 'iframe'
    };

    // The camera logic is simplified for a single, static machine.
    // It will always look at the center where the Pac-Man machine is.
    useFrame((state, delta) => {
        // Gentle camera zoom effect based on active state.
        // We position the camera *outside* the circle relative to the active radius
        const targetZ = activeGameId ? 5.5 : 8.5; // Closer when active, further when not
        const targetY = activeGameId ? 5.5 : 8.5; // Raised camera higher for the 2x scaled models

        // Use lerp for smooth camera movement
        const targetPosition = new THREE.Vector3(0, targetY, targetZ);
        camera.position.lerp(targetPosition, delta * 4);

        // Always look towards the single machine at the center
        const lookTarget = new THREE.Vector3(0, 4.0, 0);
        camera.lookAt(lookTarget);
    });

    return (
        <group ref={groupRef}>
            <ArcadeMachine
                key={pacmanGame.id}
                game={pacmanGame}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                isActive={true} // Hardcoding to always active for now
                onClick={() => { }} // No-op
                onPlay={() => onPlay(pacmanGame)}
            />
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

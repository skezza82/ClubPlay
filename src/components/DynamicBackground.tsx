"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

export const DynamicBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme, bgType } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let mouseX = 0;
        let mouseY = 0;
        let targetMouseX = 0;
        let targetMouseY = 0;

        // Configuration
        const MOUSE_INFLUENCE = 100;

        const getThemeColors = () => {
            switch (theme) {
                case 'sunset': return ['#FF7E5F', '#FEB47B', '#FF2E63', '#E03E52'];
                case 'deepsea': return ['#00D1FF', '#0070F3', '#00F5FF', '#0055FF'];
                case 'matrix': return ['#00FF41', '#008F11', '#00FF41', '#003B00'];
                case 'vampire': return ['#FF2E2E', '#950740', '#C3073F', '#6F2232'];
                case 'midnight': return ['#A084E8', '#6F61C0', '#8F43EE', '#522546'];
                case 'cyber':
                default: return ['#66FCF1', '#45A29E', '#00D1FF', '#0070F3'];
            }
        };

        const getBackgroundColor = () => {
            switch (theme) {
                case 'sunset': return '#1a0a0a';
                case 'deepsea': return '#050a15';
                case 'matrix': return '#0d0208';
                case 'vampire': return '#110101';
                case 'midnight': return '#080312';
                case 'cyber':
                default: return '#0a0b10';
            }
        };

        // Different state objects for different backgrounds
        let connectivityParticles: any[] = [];
        let stars: any[] = [];
        let shootingStars: any[] = [];
        let pacmanEntities: any[] = [];
        let auroraWaves: any[] = [];
        let gridOffset = 0;

        const initBackground = () => {
            const colors = getThemeColors();

            // Clear all
            connectivityParticles = [];
            stars = [];
            shootingStars = [];
            pacmanEntities = [];
            auroraWaves = [];

            if (bgType === 'connectivity') {
                for (let i = 0; i < 40; i++) {
                    connectivityParticles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: (Math.random() - 0.5) * 0.4,
                        size: Math.random() * 2.5 + 1,
                        color: colors[Math.floor(Math.random() * colors.length)]
                    });
                }
            } else if (bgType === 'galaxy') {
                for (let i = 0; i < 200; i++) {
                    stars.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        size: Math.random() * 1.5,
                        opacity: Math.random(),
                        speed: Math.random() * 0.05
                    });
                }
            } else if (bgType === 'pacman') {
                // Initial ghost and pacman
                pacmanEntities.push({
                    type: 'pacman',
                    x: -50,
                    y: canvas.height * 0.5,
                    vx: 2,
                    size: 20
                });
                for (let i = 0; i < 3; i++) {
                    pacmanEntities.push({
                        type: 'ghost',
                        x: -150 - (i * 60),
                        y: canvas.height * 0.5,
                        vx: 2,
                        size: 20,
                        color: colors[i % colors.length]
                    });
                }
            } else if (bgType === 'aurora') {
                for (let i = 0; i < 5; i++) {
                    auroraWaves.push({
                        y: canvas.height * (0.4 + (i - 2) * 0.1),
                        height: canvas.height * 0.6,
                        amplitude: 60 + Math.random() * 80,
                        frequency: 0.0005 + Math.random() * 0.001,
                        speed: 0.005 + Math.random() * 0.01,
                        phase: Math.random() * Math.PI * 2,
                        color: colors[i % colors.length],
                        thickness: 2 + Math.random() * 4
                    });
                }
            }
        };

        const drawConnectivity = () => {
            const colors = getThemeColors();
            const accentColor = colors[0];
            const connectionDist = 150;

            for (let i = 0; i < connectivityParticles.length; i++) {
                const p1 = connectivityParticles[i];
                for (let j = i + 1; j < connectivityParticles.length; j++) {
                    const p2 = connectivityParticles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDist) {
                        const alpha = 1 - (dist / connectionDist);
                        ctx.strokeStyle = `${accentColor}${Math.floor(alpha * 0.25 * 255).toString(16).padStart(2, '0')}`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                p1.x += p1.vx;
                p1.y += p1.vy;

                // Mouse influence
                const mDx = p1.x - mouseX;
                const mDy = p1.y - mouseY;
                const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
                if (mDist < MOUSE_INFLUENCE) {
                    const force = (MOUSE_INFLUENCE - mDist) / MOUSE_INFLUENCE;
                    p1.x += mDx * force * 0.03;
                    p1.y += mDy * force * 0.03;
                }

                if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
                if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

                ctx.fillStyle = p1.color;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        };

        const drawGalaxy = () => {
            // Draw static stars
            stars.forEach(star => {
                star.opacity += (Math.random() - 0.5) * 0.05;
                if (star.opacity < 0.1) star.opacity = 0.1;
                if (star.opacity > 1) star.opacity = 1;

                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                star.y += star.speed;
                if (star.y > canvas.height) star.y = 0;
            });

            // Random shooting stars
            if (Math.random() < 0.01) {
                shootingStars.push({
                    x: Math.random() * canvas.width,
                    y: 0,
                    vx: (Math.random() - 0.5) * 10 + 5,
                    vy: Math.random() * 10 + 5,
                    len: Math.random() * 80 + 20,
                    opacity: 1
                });
            }

            shootingStars.forEach((s, idx) => {
                ctx.strokeStyle = `rgba(255, 255, 255, ${s.opacity})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x + s.vx, s.y + s.vy);
                ctx.stroke();

                s.x += s.vx;
                s.y += s.vy;
                s.opacity -= 0.02;

                if (s.opacity <= 0) shootingStars.splice(idx, 1);
            });
        };

        const drawPacman = () => {
            const colors = getThemeColors();
            const accent = colors[0];

            // Draw grid of dots
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            const spacing = 40;
            for (let x = 20; x < canvas.width; x += spacing) {
                for (let y = 20; y < canvas.height; y += spacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            pacmanEntities.forEach(ent => {
                if (ent.type === 'pacman') {
                    ctx.fillStyle = "#FFFF00";
                    ctx.beginPath();
                    // Chomp animation
                    const mouth = Math.abs(Math.sin(Date.now() * 0.01)) * 0.2;
                    ctx.arc(ent.x, ent.y, ent.size, (mouth) * Math.PI, (2 - mouth) * Math.PI);
                    ctx.lineTo(ent.x, ent.y);
                    ctx.fill();
                } else {
                    ctx.fillStyle = ent.color;
                    // Draw Ghost shape
                    ctx.beginPath();
                    ctx.arc(ent.x, ent.y, ent.size, Math.PI, 0);
                    ctx.lineTo(ent.x + ent.size, ent.y + ent.size);
                    ctx.lineTo(ent.x - ent.size, ent.y + ent.size);
                    ctx.fill();
                    // Eyes
                    ctx.fillStyle = "white";
                    ctx.beginPath();
                    ctx.arc(ent.x - 7, ent.y - 5, 4, 0, Math.PI * 2);
                    ctx.arc(ent.x + 7, ent.y - 5, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                ent.x += ent.vx;
                if (ent.x > canvas.width + 100) ent.x = -200;
            });
        };

        const drawAurora = () => {
            ctx.globalCompositeOperation = 'screen';
            auroraWaves.forEach((wave, i) => {
                wave.phase += wave.speed;

                // Draw multiple layers for each "ribbon" to get soft glow
                for (let j = 0; j < 3; j++) {
                    ctx.beginPath();

                    const opacity = 0.15 / (j + 1);

                    for (let x = -50; x <= canvas.width + 50; x += 15) {
                        // Combine two sine waves for complex XMB motion
                        const y1 = Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
                        const y2 = Math.sin(x * (wave.frequency * 0.5) + (wave.phase * 0.7)) * (wave.amplitude * 0.5);
                        const mouseFactor = (1 - Math.min(Math.abs(x - mouseX) / 500, 1)) * 40;
                        const y = wave.y + y1 + y2 - mouseFactor;

                        if (x === -50) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }

                    ctx.lineWidth = 1.5 + (j * 2);
                    ctx.strokeStyle = `${wave.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }
            });
            ctx.globalCompositeOperation = 'source-over';
        };

        const drawRetroGrid = () => {
            const colors = getThemeColors();
            const accent = colors[0];

            // Use time-based offset for perfect smoothness
            const time = Date.now() * 0.05;
            gridOffset = time % 40;

            ctx.lineWidth = 1;
            const horizon = canvas.height * 0.45;
            const gridWidth = canvas.width * 2;
            const centerX = canvas.width / 2;

            // Draw horizontal lines with perspective
            for (let i = 0; i < 20; i++) {
                // Perspective spacing: lines get further apart as they come forward
                const pos = (i * 40 + gridOffset) / 800;
                const y = horizon + (Math.pow(pos, 2) * (canvas.height - horizon));

                if (y > horizon && y < canvas.height) {
                    const opacity = Math.min((y - horizon) / 200, 0.4);
                    ctx.strokeStyle = `${accent}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
            }

            // Draw vertical perspective lines
            ctx.strokeStyle = accent + "22";
            for (let x = -gridWidth; x <= gridWidth; x += 80) {
                ctx.beginPath();
                ctx.moveTo(centerX + x * 0.1, horizon);
                ctx.lineTo(centerX + x, canvas.height);
                ctx.stroke();
            }

            // Horizon glow
            const gradient = ctx.createLinearGradient(0, horizon - 2, 0, horizon + 20);
            gradient.addColorStop(0, accent + "66");
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, horizon - 2, canvas.width, 25);
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            mouseX += (targetMouseX - mouseX) * 0.1;
            mouseY += (targetMouseY - mouseY) * 0.1;

            const bgColor = getBackgroundColor();
            const bgGradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 0,
                canvas.width / 2, canvas.height / 2, canvas.width
            );
            bgGradient.addColorStop(0, bgColor);
            bgGradient.addColorStop(1, '#000000');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Execute specific bg type draw
            switch (bgType) {
                case 'connectivity': drawConnectivity(); break;
                case 'galaxy': drawGalaxy(); break;
                case 'pacman': drawPacman(); break;
                case 'aurora': drawAurora(); break;
                case 'retrogrid': drawRetroGrid(); break;
                default: drawConnectivity();
            }

            // Subtle mouse glow
            const colors = getThemeColors();
            const accent = colors[0];
            const glowGradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 350);
            glowGradient.addColorStop(0, `${accent}10`);
            glowGradient.addColorStop(1, `${accent}00`);
            ctx.fillStyle = glowGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            targetMouseX = e.clientX;
            targetMouseY = e.clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                targetMouseX = e.touches[0].clientX;
                targetMouseY = e.touches[0].clientY;
            }
        };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initBackground();
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme, bgType]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full -z-[100] pointer-events-none opacity-30"
        />
    );
};

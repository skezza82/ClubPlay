import { useState, useEffect, useCallback } from 'react';
import { randomTetromino, TETROMINOS } from './tetrominos';

export const STAGE_WIDTH = 10;
export const STAGE_HEIGHT = 20;

export const createStage = () =>
    Array.from(Array(STAGE_HEIGHT), () =>
        Array.from(Array(STAGE_WIDTH), () => [0, 'clear'])
    );

export const checkCollision = (player: any, stage: any[], { x: moveX, y: moveY }: { x: number, y: number }) => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
        for (let x = 0; x < player.tetromino[y].length; x += 1) {
            // 1. Check that we're on an actual Tetromino cell
            if (player.tetromino[y][x] !== 0) {
                const targetY = y + player.pos.y + moveY;
                const targetX = x + player.pos.x + moveX;

                // 2. Check that our move is inside the game areas height (y)
                // We shouldn't go through the bottom of the play area
                if (
                    !stage[targetY] ||
                    // 3. Check that our move is inside the game areas width (x)
                    !stage[targetY][targetX] ||
                    // 4. Check that the cell we're moving to isn't set to clear
                    stage[targetY][targetX][1] !== 'clear'
                ) {
                    return true;
                }
            }
        }
    }
    return false;
};

// --- Custom Hooks ---

export const useGameStatus = (rowsCleared: number) => {
    const [score, setScore] = useState(0);
    const [rows, setRows] = useState(0);
    const [level, setLevel] = useState(0);

    useEffect(() => {
        const calcScore = () => {
            // We have score calculation
            const linePoints = [40, 100, 300, 1200];
            if (rowsCleared > 0) {
                setScore((prev) => prev + linePoints[rowsCleared - 1] * (level + 1));
                setRows((prev) => prev + rowsCleared);
                setLevel((prev) => prev + rowsCleared);
            }
        };
        calcScore();
    }, [rowsCleared, level]);

    return { score, setScore, rows, setRows, level, setLevel };
};

export const usePlayer = () => {
    const [player, setPlayer] = useState({
        pos: { x: 0, y: 0 },
        tetromino: TETROMINOS[0].shape,
        collided: false,
    });

    const rotate = (matrix: any[][], dir: number) => {
        // Make the rows to become cols (transpose)
        const rotated = matrix.map((_, index) => matrix.map((col) => col[index]));
        // Reverse each row to get a rotated matrix
        if (dir > 0) return rotated.map((row) => row.reverse());
        return rotated.reverse();
    };

    const playerRotate = (stage: any[][], dir: number) => {
        const clonedPlayer = JSON.parse(JSON.stringify(player));
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

        const pos = clonedPlayer.pos.x;
        let offset = 1;
        while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
            clonedPlayer.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > clonedPlayer.tetromino[0].length) {
                rotate(clonedPlayer.tetromino, -dir);
                clonedPlayer.pos.x = pos;
                return;
            }
        }
        setPlayer(clonedPlayer);
    };

    const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
        setPlayer((prev) => ({
            ...prev,
            pos: { x: (prev.pos.x += x), y: (prev.pos.y += y) },
            collided,
        }));
    };

    const resetPlayer = useCallback(() => {
        setPlayer({
            pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
            tetromino: randomTetromino().shape,
            collided: false,
        });
    }, []);

    return { player, updatePlayerPos, resetPlayer, playerRotate, setPlayer };
};

export const useStage = (player: any, resetPlayer: () => void) => {
    const [stage, setStage] = useState(createStage());
    const [rowsCleared, setRowsCleared] = useState(0);

    useEffect(() => {
        setRowsCleared(0);

        const sweepRows = (newStage: any[][]) => {
            return newStage.reduce((ack, row) => {
                if (row.findIndex((cell) => cell[0] === 0) === -1) {
                    setRowsCleared((prev) => prev + 1);
                    // Add new empty row at top
                    ack.unshift(Array.from(Array(newStage[0].length), () => [0, 'clear']));
                    return ack;
                }
                ack.push(row);
                return ack;
            }, []);
        };

        const updateStage = (prevStage: any[][]) => {
            // First flush the stage from the previous render
            const newStage = prevStage.map((row) =>
                row.map((cell) => (cell[1] === 'clear' ? [0, 'clear'] : cell))
            );

            // Then draw the tetromino
            player.tetromino.forEach((row: any[], y: number) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        const targetY = y + player.pos.y;
                        const targetX = x + player.pos.x;
                        if (
                            targetY >= 0 &&
                            targetY < newStage.length &&
                            targetX >= 0 &&
                            targetX < newStage[0].length
                        ) {
                            newStage[targetY][targetX] = [
                                value,
                                `${player.collided ? 'merged' : 'clear'}`,
                            ];
                        }
                    }
                });
            });

            // Then check if it collided
            if (player.collided) {
                resetPlayer();
                return sweepRows(newStage);
            }

            return newStage;
        };

        setStage((prev) => updateStage(prev));
    }, [player, resetPlayer]);

    return { stage, setStage, rowsCleared };
};

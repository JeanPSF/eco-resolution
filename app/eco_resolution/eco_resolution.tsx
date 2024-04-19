"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./eco_resolution.module.scss";

interface TupleKeyedObject<T> {
  [key: `${number},${number}`]: T;
}
interface Coordenate {
  x: number;
  y: number;
}
interface Player {
  name: string;
  coord: Coordenate;
  force: number;
  inteligence: number;
  agility: number;
}
//  map values:
// - wall
// - player
// - goal
export default function EcoResolution() {
  const size = 11;
  const p1Init = {
    name: "P1",
    coord: { x: 0, y: 0 },
    force: 1,
    agility: 1,
    inteligence: 1,
  };
  const p2Init = {
    name: "P2",
    coord: { x: 1, y: 0 },
    force: 1,
    agility: 1,
    inteligence: 1,
  };
  const rows = Array.from({ length: size }, (_, index) => index);
  const isRunning = useRef(false);
  const turnRef = useRef<() => Promise<void>>(async () => {});
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const [players, setPlayers] = useState<Player[]>([p1Init, p2Init]);
  const [goal, setGoal] = useState<{ x: number; y: number }>({ x: 10, y: 10 });
  const [walls, setWalls] = useState<TupleKeyedObject<boolean>>({
    "2,0": true,
    "2,1": true,
    "2,2": true,
    "2,3": true,
    "2,4": true,
    "2,5": true,
    "2,6": true,
    "2,7": true,
    "2,8": true,

    "3,8": true,
    "4,8": true,
    "5,8": true,
    "6,8": true,
    "7,8": true,
    "8,8": true,
    "9,8": true,
    "10,8": true,
  });

  const calculatePlayerConflictScore = (player: Player) => {
    return player.agility * 2 + player.force * 4 + player.inteligence * 0.5;
  };

  const resolveConflicts = useCallback((players: Player[]) => {
    const p1 = players[0];
    const p2 = players[1];
    const conflictSeed1 = Math.random();
    let conflictSeed2 = Math.random();
    while (conflictSeed1 === conflictSeed2) {
      conflictSeed2 = Math.random();
    }
    const p1Score = calculatePlayerConflictScore(p1) + conflictSeed1;
    const p2Score = calculatePlayerConflictScore(p2) + conflictSeed2;

    let hasForceAdv = false;
    let hasAgiAdv = false;
    let hasIntAdv = false;
    if (p1Score > p2Score) {
      if (p1.force > p2.force) hasForceAdv = true;
      if (p1.agility > p2.agility) hasAgiAdv = true;
      if (p1.inteligence > p2.inteligence) hasIntAdv = true;
    }
    if (p2Score > p1Score) {
      if (p2.force > p1.force) hasForceAdv = true;
      if (p2.agility > p1.agility) hasAgiAdv = true;
      if (p2.inteligence > p1.inteligence) hasIntAdv = true;
    }
    return {
      winner: p1Score > p2Score ? 1 : 2,
      advantages: { for: hasForceAdv, agi: hasAgiAdv, int: hasIntAdv },
    };
  }, []);

  const moveCloser = useCallback(
    (p: Player) => {
      const hasLeftWall =
        p.coord.x === 0 || walls[`${p.coord.x - 1},${p.coord.y}`]
          ? true
          : false;
      const hasRightWall =
        p.coord.x === size - 1 || walls[`${p.coord.x + 1},${p.coord.y}`]
          ? true
          : false;
      const hasTopWall =
        p.coord.y === 0 || walls[`${p.coord.x},${p.coord.y - 1}`]
          ? true
          : false;
      const hasBottomWall =
        p.coord.y === size - 1 || walls[`${p.coord.x + 1},${p.coord.y + 1}`]
          ? true
          : false;

      console.log(
        "walls => ",
        hasLeftWall,
        hasRightWall,
        hasTopWall,
        hasBottomWall
      );

      if (goal.x > p.coord.x && !hasRightWall) {
        console.log("moving right!", p.name);
        return { ...p, coord: { ...p.coord, x: p.coord.x + 1 } } as Player;
      }
      if (goal.x < p.coord.x && !hasLeftWall) {
        console.log("moving left!", p.name);
        return { ...p, coord: { ...p.coord, x: p.coord.x - 1 } } as Player;
      }
      if (goal.y > p.coord.y && !hasBottomWall) {
        console.log("moving bottom!", p.name);
        return { ...p, coord: { ...p.coord, y: p.coord.y + 1 } } as Player;
      }
      if (goal.y < p.coord.y && !hasTopWall) {
        console.log("moving top!", p.name);
        return { ...p, coord: { ...p.coord, y: p.coord.y - 1 } } as Player;
      }
      console.log("can not move!!!!", p.name);
      return p;
    },
    [goal.x, goal.y, walls]
  );

  const turn = useCallback(async () => {
    console.log("Moving closer!");
    const nextPlayers = players.map((p) => {
      return moveCloser(p);
    });
    const p1 = nextPlayers[0];
    const p2 = nextPlayers[1];
    console.log("raw next state => ", p1.coord, p2.coord);
    if (p1.coord.x !== p2.coord.x || p1.coord.y !== p2.coord.y) {
      console.log("No conflicts, setting raw!");
      setPlayers(nextPlayers);
      return;
    }
    console.log("conflicts found");
    const result = resolveConflicts(nextPlayers);
    if (result.winner === 1) {
      setPlayers([result.advantages.agi ? moveCloser(p1) : p1, players[1]]);
      return;
    }
    if (result.winner === 2) {
      setPlayers([players[0], result.advantages.agi ? moveCloser(p2) : p2]);
    }
  }, [moveCloser, players, resolveConflicts]);

  useEffect(() => {
    turnRef.current = turn; // Update ref to the latest version of turn whenever it changes
  }, [turn]);

  return (
    <div className={`${styles["eco-resolution"]}`}>
      <button
        onClick={() => {
          const interval = setInterval(async () => {
            if (isRunning.current) return;
            isRunning.current = true;
            try {
              await turnRef.current();
            } catch (e) {
              console.log("Error running turn: ", e);
            }
            isRunning.current = false;
          }, 1000);
          setTimer(interval);
        }}
      >
        Play
      </button>
      <button
        onClick={() => {
          clearInterval(timer);
          setPlayers([p1Init, p2Init]);
        }}
      >
        Reset
      </button>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row) => (
          <div key={row} style={{ display: "flex" }}>
            {rows.map((column) => {
              const isWall = walls[`${row},${column}`];
              const isGoal = goal.x === row && goal.y === column;
              const isP1 =
                players[0].coord.x === row && players[0].coord.y === column;
              const isP2 =
                players[1].coord.x === row && players[1].coord.y === column;
              return (
                <div
                  key={column}
                  className={`${styles["grid-cell"]} 
                  ${isGoal ? styles["goal"] : ""} 
                  ${isWall ? styles["wall"] : ""}`}
                  style={{
                    backgroundColor: isP1
                      ? "purple"
                      : isP2
                      ? "lightgreen"
                      : undefined,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

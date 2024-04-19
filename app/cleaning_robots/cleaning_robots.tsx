"use client";
import React, { useEffect, useRef, useState } from "react";

type Robot = {
  id: number;
  batteryLevel: number;
  status: "cleaning" | "waiting";
  usageCount: number;
  room?: string;
};

type Room = {
  name: string;
  size: "pequeno" | "médio" | "grande";
  dirtLevel: number;
};

const RobotController: React.FC = () => {
  const [robots, setRobots] = useState<Robot[]>([
    { id: 1, batteryLevel: 70, status: "waiting", usageCount: 0 },
    { id: 2, batteryLevel: 50, status: "waiting", usageCount: 0 },
  ]);

  const [rooms, setRooms] = useState<Room[]>([
    { name: "Banheiro", size: "pequeno", dirtLevel: 20 },
    { name: "Quarto", size: "médio", dirtLevel: 50 },
    { name: "Sala", size: "grande", dirtLevel: 75 },
  ]);

  const cleaningTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const handleStartCleaning = () => {
    const availableRobots = robots.filter(
      (robot) => robot.status === "waiting" && robot.batteryLevel > 0
    );
    if (availableRobots.length === 0) return;

    const robotToClean = availableRobots.reduce((prev, current) => {
      if (prev.batteryLevel > current.batteryLevel) return prev;
      if (prev.batteryLevel < current.batteryLevel) return current;
      return prev.usageCount <= current.usageCount ? prev : current;
    });

    const batteryCost = { pequeno: 5, médio: 10, grande: 15 };
    let unusedRooms = rooms.filter((room) => {
      const neededBattery = batteryCost[room.size];
      return (
        !robots.some((robot) => robot.room === room.name) &&
        robotToClean.batteryLevel >= neededBattery
      );
    });

    if (unusedRooms.length === 0) return;

    // Sort by dirt level, then shuffle if dirt levels are equal
    unusedRooms.sort((a, b) => b.dirtLevel - a.dirtLevel);
    if (
      unusedRooms[0].dirtLevel === unusedRooms[unusedRooms.length - 1].dirtLevel
    ) {
      unusedRooms = unusedRooms.sort(() => Math.random() - 0.5); // Shuffle randomly
    }

    const roomToClean = unusedRooms[0]; // Select the room

    handleCleaning(robotToClean.id, roomToClean.name, roomToClean.size);
  };

  const handleCleaning = (
    robotId: number,
    roomName: string,
    roomSize: string
  ) => {
    const batteryReduction =
      roomSize === "pequeno" ? 5 : roomSize === "médio" ? 10 : 15;

    setRobots((prevRobots) =>
      prevRobots.map((robot) =>
        robot.id === robotId
          ? {
              ...robot,
              status: "cleaning",
              usageCount: robot.usageCount + 1,
              room: roomName,
            }
          : robot
      )
    );

    clearTimeout(cleaningTimers.current[robotId]);
    cleaningTimers.current[robotId] = setTimeout(() => {
      setRobots((prevRobots) =>
        prevRobots.map((robot) =>
          robot.id === robotId
            ? {
                ...robot,
                batteryLevel: Math.max(
                  0,
                  robot.batteryLevel - batteryReduction
                ),
                status: "waiting",
                room: undefined,
              }
            : robot
        )
      );
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.name === roomName ? { ...room, dirtLevel: 0 } : room
        )
      );
    }, 5000);
  };

  const handleRecharge = (robotId: number) => {
    setRobots((prevRobots) =>
      prevRobots.map((robot) =>
        robot.id === robotId
          ? { ...robot, batteryLevel: Math.min(100, robot.batteryLevel + 30) }
          : robot
      )
    );
  };

  useEffect(() => {
    return () => {
      Object.values(cleaningTimers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div>
      <h1>Robot Vacuum Cleaner Control</h1>
      <div>
        {robots.map((robot) => (
          <div
            key={robot.id}
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid black",
            }}
          >
            <p>
              <strong>Robot {robot.id}</strong> - Battery: {robot.batteryLevel}
              %, Status: {robot.status}, Uses: {robot.usageCount}, Cleaning:{" "}
              {robot.room ?? "None"}
            </p>
            <progress value={robot.batteryLevel} max="100"></progress>
            <button
              onClick={() => handleRecharge(robot.id)}
              disabled={
                robot.status === "cleaning" || robot.batteryLevel >= 100
              }
            >
              Recharge
            </button>
          </div>
        ))}
      </div>
      <div>
        <h2>Rooms and Dirt Levels</h2>
        <table border={1} style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Room</th>
              <th>Size</th>
              <th>Dirt Level</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.name}>
                <td>{room.name}</td>
                <td>{room.size}</td>
                <td>{room.dirtLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={handleStartCleaning}
        style={{
          cursor: "pointer",
          transition: "transform 0.3s ease",
          padding: "10px 20px",
          fontSize: "16px",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Start Cleaning (Auto Select)
      </button>
    </div>
  );
};

export default RobotController;

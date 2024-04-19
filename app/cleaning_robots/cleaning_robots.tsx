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
    let unusedRooms = rooms
      .filter((room) => {
        const neededBattery = batteryCost[room.size];
        return (
          !robots.some((robot) => robot.room === room.name) &&
          robotToClean.batteryLevel >= neededBattery
        );
      })
      .sort((a, b) => b.dirtLevel - a.dirtLevel);

    if (unusedRooms.length === 0) return;

    const roomToClean = unusedRooms[0];
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

  const randomizeDirt = () => {
    setRooms((prevRooms) =>
      prevRooms.map((room) => ({
        ...room,
        dirtLevel: Math.floor(Math.random() * 100), // Randomize dirt level between 0 and 100
      }))
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
              border: `3px solid ${
                robot.status === "cleaning" ? "#f44336" : "#4CAF50"
              }`, // Red when cleaning, green when waiting
              borderRadius: "5px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <p>
              <strong>Robot {robot.id}</strong> - Battery: {robot.batteryLevel}
              %, Status: {robot.status}, Uses: {robot.usageCount}, Cleaning:{" "}
              {robot.room ?? "None"}
            </p>
            <progress
              value={robot.batteryLevel}
              max="100"
              style={{ width: "100%" }}
            ></progress>
            {robot.status === "cleaning" && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "20px",
                  height: "20px",
                  border: "3px solid #f3f3f3", // Light grey for the spinner track
                  borderTop: "3px solid #3498db", // Blue for the spinner itself
                  borderRadius: "50%",
                  animation: "spin 2s linear infinite",
                }}
              ></div>
            )}
            <button
              onClick={() => handleRecharge(robot.id)}
              disabled={
                robot.status === "cleaning" || robot.batteryLevel >= 100
              }
              style={{
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor:
                  robot.status === "cleaning" || robot.batteryLevel >= 100
                    ? "#ccc"
                    : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                marginTop: "10px",
              }}
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
          backgroundColor: "#4CAF50", // Green background
          color: "white", // White text
          border: "none",
          borderRadius: "5px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          margin: "10px",
          outline: "none",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Start Cleaning (Auto Select)
      </button>

      <button
        onClick={randomizeDirt}
        style={{
          cursor: "pointer",
          transition: "transform 0.3s ease",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#f44336", // Red background
          color: "white", // White text
          border: "none",
          borderRadius: "5px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          margin: "10px",
          outline: "none",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Randomize Dirt
      </button>
    </div>
  );
};

export default RobotController;

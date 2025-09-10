import { useState, useEffect } from "react";

export default function useRoomData() {
  const [data, setData] = useState({
    buildings: [],
    roomsByBuilding: {},
    allRooms: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRoomData() {
      try {
        const response = await fetch("/roomStore.json");
        if (!response.ok) {
          throw new Error("Failed to fetch room data");
        }
        const rawData = await response.json();

        // Separate academic blocks and hostels
        const academicRooms = rawData.filter(room => room["Building Name"]);
        const hostelRooms = rawData.filter(room => room["Hostel"]);

        // Transform academic rooms
        const transformedAcademicRooms = academicRooms.map((room) => ({
          building: room["Building Name"]?.trim() || "",
          roomNo: room["Room No."]?.trim() || "",
          labName: room["Lab/Room Name"]?.trim() || "",
          fullName: `${room["Room No."]?.trim() || ""} (${room["Lab/Room Name"]?.trim() || ""})`,
        }));

        // Transform hostel rooms
        const transformedHostelRooms = hostelRooms.map((room) => ({
          building: room["Hostel"]?.trim() || "",
          roomNo: room["Room No"]?.trim() || "",
          labName: `${room["Room Type"]?.trim() || ""} - ${room["Floor/Block"]?.trim() || ""}`,
          fullName: `${room["Room No"]?.trim() || ""} (${room["Room Type"]?.trim() || ""} - ${room["Floor/Block"]?.trim() || ""})`,
        }));

        // Combine all rooms
        const transformedRooms = [...transformedAcademicRooms, ...transformedHostelRooms];

        // Create roomsByBuilding map
        const roomsByBuilding = {};
        transformedRooms.forEach((room) => {
          if (!roomsByBuilding[room.building]) {
            roomsByBuilding[room.building] = [];
          }
          roomsByBuilding[room.building].push(room);
        });

        // Create buildings array sorted alphabetically with hostels first
        const allBuildings = Object.keys(roomsByBuilding);
        const hostels = allBuildings.filter(b => transformedHostelRooms.some(room => room.building === b)).sort();
        const academicBlocks = allBuildings.filter(b => !hostels.includes(b)).sort();
        const buildings = [...hostels, ...academicBlocks];

        setData({
          buildings,
          roomsByBuilding,
          allRooms: transformedRooms,
        });
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    }

    fetchRoomData();
  }, []);

  return { data, loading, error };
}

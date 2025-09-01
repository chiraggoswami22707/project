"use client";

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
    const fetchJsonData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the JSON file from the public folder
        const response = await fetch("/roomStore.json");
        const jsonData = await response.json();

        // Parse the data to extract buildings and rooms
        let buildings = [];
        let roomsByBuilding = {};
        let allRooms = [];

        jsonData.forEach((item) => {
          const { building, roomNo, labName } = item;

          // Add to buildings if not already present
          if (!buildings.includes(building)) {
            buildings.push(building);
            roomsByBuilding[building] = [];
          }

          // Add room to the building
          roomsByBuilding[building].push({
            roomNo,
            labName,
            fullName: `${roomNo} - ${labName}`,
          });

          // Add to allRooms for search
          allRooms.push({
            building,
            roomNo,
            labName,
            fullName: `${roomNo} - ${labName}`,
          });
        });

        setData({ buildings, roomsByBuilding, allRooms });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };


    fetchJsonData();
  }, []);

  return { data, loading, error };
}

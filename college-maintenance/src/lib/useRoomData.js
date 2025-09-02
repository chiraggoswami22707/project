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

        // Fetch both JSON files from the public folder
        const [academicResponse, hostelResponse] = await Promise.all([
          fetch("/roomStore.json"),
          fetch("/All_Hostels_Rooms.json")
        ]);

        const academicData = await academicResponse.json();
        const hostelData = await hostelResponse.json();

        // Combine the data arrays
        const jsonData = [...academicData, ...hostelData];

        // Parse the data to extract buildings and rooms
        let buildings = [];
        let roomsByBuilding = {};
        let allRooms = [];

        jsonData.forEach((item) => {
          let building = "";
          let roomNo = "";
          let labName = "";
          let fullName = "";

          // Check if it's a hostel entry
          if (item.Hostel) {
            // Hostel structure
            building = item.Hostel.trim();
            const floorBlock = item["Floor/Block"] || item["Floor\/Block"] || "";
            roomNo = item["Room No"] || item.roomNo || "";
            labName = item["Room Type"] || "Hostel Room";
            fullName = `${floorBlock} - ${roomNo} (${labName})`;
          } else {
            // Academic building structure
            building = item["Building Name"]?.trim() || item.building?.trim() || "";
            roomNo = item["Room No."]?.trim() || item.roomNo?.trim() || "";
            labName = item["Lab/Room Name"]?.trim() || item.labName?.trim() || "";
            fullName = `${roomNo} - ${labName}`;
          }

          if (!building) return;

          // Add to buildings if not already present
          if (!buildings.includes(building)) {
            buildings.push(building);
            roomsByBuilding[building] = [];
          }

          // Add room to the building
          roomsByBuilding[building].push({
            roomNo,
            labName,
            fullName,
          });

          // Add to allRooms for search
          allRooms.push({
            building,
            roomNo,
            labName,
            fullName,
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

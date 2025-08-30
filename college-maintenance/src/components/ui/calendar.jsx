import React, { useState, useEffect } from "react";

export const Calendar = ({ mode = "single", selected, onSelect, placeholder, className }) => {
  const [currentDate, setCurrentDate] = useState(selected || null);

  useEffect(() => {
    setCurrentDate(selected);
  }, [selected]);

  const handleDateClick = (date) => {
    if (mode === "single") {
      setCurrentDate(date);
      if (onSelect) onSelect(date);
    }
    // For other modes (range, multiple), extend here if needed
  };

  // For simplicity, render an input type="date" as a basic calendar picker
  return (
    <input
      type="date"
      value={currentDate ? currentDate.toISOString().slice(0, 10) : ""}
      onChange={(e) => {
        const newDate = e.target.value ? new Date(e.target.value) : null;
        handleDateClick(newDate);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
};

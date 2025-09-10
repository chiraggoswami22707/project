import React, { useState, useEffect } from "react";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export const Calendar = ({
  mode = "single",
  selected,
  onSelect,
  placeholder,
  className,
}) => {
  // currentWeekStart is the first day of the 7-day period shown
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    if (selected) {
      // Start from the Sunday of the week containing selected date
      const day = selected.getDay();
      return addDays(selected, -day);
    } else {
      const today = new Date();
      const day = today.getDay();
      return addDays(today, -day);
    }
  });

  const [currentSelected, setCurrentSelected] = useState(selected || null);

  useEffect(() => {
    setCurrentSelected(selected);
    if (selected) {
      const day = selected.getDay();
      setCurrentWeekStart(addDays(selected, -day));
    }
  }, [selected]);

  const handleDateClick = (date) => {
    if (mode === "single") {
      setCurrentSelected(date);
      if (onSelect) onSelect(date);
    }
  };

  const goPreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const goNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  // Generate array of 7 dates starting from currentWeekStart
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(addDays(currentWeekStart, i));
  }

  return (
    <div className={`calendar-container ${className || ""}`} style={{ userSelect: "none" }}>
      <div className="calendar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <button
        type="button"
        onClick={goPreviousWeek}
        aria-label="Previous week"
        style={{
          cursor: "pointer",
          background: "none",
          border: "none",
          fontSize: 18,
          fontWeight: "bold",
          color: "#007bff",
        }}
      >
        {'<'}
      </button>
        <div style={{ fontWeight: "bold", fontSize: 16 }}>
          {weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} -{" "}
          {weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
        <button
          type="button"
          onClick={goNextWeek}
          aria-label="Next week"
          style={{
            cursor: "pointer",
            background: "none",
            border: "none",
            fontSize: 18,
            fontWeight: "bold",
            color: "#007bff",
          }}
      >
      </button>
      </div>
      <div className="calendar-week" style={{ display: "flex", justifyContent: "space-between" }}>
        {weekDates.map((date) => {
          const isSelected = currentSelected && isSameDay(date, currentSelected);
          return (
            <div
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleDateClick(date);
                }
              }}
              style={{
                cursor: "pointer",
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: isSelected ? "#007bff" : "transparent",
                color: isSelected ? "white" : "#333",
                textAlign: "center",
                flex: 1,
                userSelect: "none",
              }}
              aria-pressed={isSelected}
              aria-label={`Select ${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`}
            >
              <div style={{ fontSize: 12, marginBottom: 4 }}>{dayNames[date.getDay()]}</div>
              <div style={{ fontSize: 16, fontWeight: "bold" }}>{date.getDate()}</div>
            </div>
          );
        })}
      </div>
      {placeholder && !currentSelected && (
        <div style={{ marginTop: 8, color: "#888", fontSize: 14 }}>{placeholder}</div>
      )}
    </div>
  );
};

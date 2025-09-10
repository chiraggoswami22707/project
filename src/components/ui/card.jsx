"use client";

import React from "react";

function Card({ className = "", children, ...props }) {
  // Only allow allowedProps for <div>
  const allowedProps = {};
  // List of allowed HTML div attributes
  const htmlDivAttrs = [
    "id", "style", "onClick", "onMouseEnter", "onMouseLeave", "role", "tabIndex", "title", "aria-label", // etc
  ];
  for (const key of Object.keys(props)) {
    if (htmlDivAttrs.includes(key) || key.startsWith("data-")) {
      allowedProps[key] = props[key];
    }
  }

  return (
    <div
      {...allowedProps}
      data-slot="card"
      className={`bg-white rounded-xl shadow p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export { Card };
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Zap,
  Wrench,
  Droplet,
  Star,
  Shield,
  Wifi,
  Truck,
  MonitorSpeaker,
  User,
} from "lucide-react";

const iconMap = {
  Electrical: <Zap className="w-8 h-8 text-yellow-500" />,
  Maintenance: <Wrench className="w-8 h-8 text-blue-500" />,
  Plumbing: <Droplet className="w-8 h-8 text-blue-400" />,
  Cleaning: <Star className="w-8 h-8 text-green-500" />,
  Security: <Shield className="w-8 h-8 text-red-500" />,
  Internet: <Wifi className="w-8 h-8 text-purple-500" />,
  Parking: <Truck className="w-8 h-8 text-orange-500" />,
  Other: <MonitorSpeaker className="w-8 h-8 text-gray-500" />,
};

export default function CategoryGrid({ categories, complaintCounts, onCategorySelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {categories.map((cat) => {
        const count = complaintCounts[cat.name] || 0;
        const countLabel = count === 1 ? "complaint" : "complaints";

        return (
          <Card
            key={cat.name}
            onClick={() => onCategorySelect(cat.name)}
            className={`cursor-pointer p-6 rounded-xl shadow-md transition hover:shadow-xl hover:scale-[1.03] ${
              cat.name === "Electrical"
                ? "bg-yellow-50 border border-yellow-200"
                : cat.name === "Plumbing"
                ? "bg-blue-50 border border-blue-200"
                : cat.name === "Cleaning"
                ? "bg-green-50 border border-green-200"
                : cat.name === "Security"
                ? "bg-red-50 border border-red-200"
                : cat.name === "Internet"
                ? "bg-purple-50 border border-purple-200"
                : cat.name === "Parking"
                ? "bg-orange-50 border border-orange-200"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-white shadow-md">
                {iconMap[cat.name] || <User className="w-8 h-8 text-gray-500" />}
              </div>
              <h3 className="font-bold text-lg text-gray-800">{cat.name}</h3>
              <p className="text-sm text-gray-600">{cat.desc}</p>
              {count > 0 && (
                <span
                  className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    cat.name === "Electrical"
                      ? "bg-yellow-200 text-yellow-800"
                      : cat.name === "Plumbing"
                      ? "bg-blue-200 text-blue-800"
                      : cat.name === "Cleaning"
                      ? "bg-green-200 text-green-800"
                      : cat.name === "Security"
                      ? "bg-red-200 text-red-800"
                      : cat.name === "Internet"
                      ? "bg-purple-200 text-purple-800"
                      : cat.name === "Parking"
                      ? "bg-orange-200 text-orange-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {count} {countLabel}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

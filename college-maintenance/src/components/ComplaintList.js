"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { statusClass, priorityClass, formatDate, getEffectiveStatus } from "@/utils/complaintUtils";

export default function ComplaintList({ category, userEmail }) {
  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState({
    status: "All Status",
    priority: "All Priority",
    date: "",
  });

  useEffect(() => {
    if (!category || !userEmail) return;

    const q = query(
      collection(db, "complaints"),
      where("category", "==", category),
      where("assigned", "==", userEmail)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => {
        const c = doc.data();
        return {
          id: doc.id,
          ...c,
          createdAt: c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : c.createdAt || null,
        };
      });
      setComplaints(data);
    });

    return () => unsubscribe();
  }, [category, userEmail]);

  function filteredComplaints() {
    let comps = complaints;
    if (filters.status !== "All Status") {
      comps = comps.filter((comp) => getEffectiveStatus(comp) === filters.status);
    }
    if (filters.priority !== "All Priority") {
      comps = comps.filter((comp) => (comp.priority || "Low") === filters.priority);
    }
    if (filters.date) {
      comps = comps.filter((comp) => {
        if (!comp.createdAt) return false;
        const d = typeof comp.createdAt === "string" ? new Date(comp.createdAt) : comp.createdAt;
        return (
          d.getFullYear() === new Date(filters.date).getFullYear() &&
          d.getMonth() === new Date(filters.date).getMonth() &&
          d.getDate() === new Date(filters.date).getDate()
        );
      });
    }
    return comps;
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div>
          <label className="block text-xs mb-1">Status</label>
          <select
            className="border rounded px-2 py-1"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option>All Status</option>
            <option>Pending</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Reopened</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Priority</label>
          <select
            className="border rounded px-2 py-1"
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          >
            <option>All Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <button
          className="text-xs underline text-blue-600 mt-5"
          onClick={() => setFilters({ status: "All Status", priority: "All Priority", date: "" })}
        >
          Clear Filters
        </button>
      </div>

      {/* Complaints list */}
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {filteredComplaints().map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-2xl shadow-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg">{comp.subject}</span>
            </div>
            <div className="mb-2 text-gray-700">{comp.description}</div>
            <div className="text-xs mb-1">
              <span className="font-medium">Submitted By:</span> {comp.submittedBy}
            </div>
            <div className="text-xs mb-1">
              <span className="font-medium">Date:</span> {formatDate(comp.createdAt)}
            </div>
            <div className="flex gap-2 mt-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(
                  getEffectiveStatus(comp)
                )}`}
              >
                {getEffectiveStatus(comp)}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${priorityClass(
                  comp.priority
                )}`}
              >
                {comp.priority}
              </span>
            </div>
          </div>
        ))}
        {filteredComplaints().length === 0 && (
          <div className="text-center text-gray-500 py-12">No complaints found.</div>
        )}
      </div>
    </div>
  );
}

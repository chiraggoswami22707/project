"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/config";
import {
  collection,
  updateDoc,
  doc,
  query,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ProfileCard from "@/components/ProfileCard";
import CategoryCard from "@/components/CategoryCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";

// Removed import of '@radix-ui/react-dialog' to fix build error due to missing dependency

// CATEGORY DATA
const categories = [
  { name: "Electrical", icon: "⚡", color: "yellow", desc: "Issues related to electrical systems, wiring, and power supply." },
  { name: "Plumbing", icon: "🔧", color: "blue", desc: "Problems with water pipes, faucets, and drainage." },
  { name: "Cleaning", icon: "🧹", color: "green", desc: "Maintenance and cleaning services for facilities." },
  { name: "Security", icon: "🛡️", color: "red", desc: "Concerns about safety, access control, and surveillance." },
  { name: "Internet", icon: "📶", color: "purple", desc: "Network connectivity and Wi-Fi related issues." },
  { name: "Parking", icon: "🚗", color: "orange", desc: "Parking space availability and vehicle-related problems." },
  { name: "Other", icon: "🖥️", color: "gray", desc: "Miscellaneous complaints not covered by other categories." },
];

function formatDate(dateInput) {
  if (!dateInput) return "N/A";
  let date;
  if (typeof dateInput === "object" && dateInput !== null) {
    if (dateInput instanceof Date) date = dateInput;
    else if (dateInput.toDate) date = dateInput.toDate();
    else if (dateInput.seconds !== undefined) date = new Date(dateInput.seconds * 1000);
  } else date = new Date(dateInput);
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status) {
  if (status === "Pending") return "bg-yellow-100 text-yellow-700";
  if (status === "In Progress") return "bg-blue-100 text-blue-700";
  if (status === "Resolved") return "bg-green-100 text-green-700";
  if (status === "Reopened") return "bg-violet-100 text-violet-700";
  return "bg-gray-100 text-gray-700";
}
function priorityClass(priority) {
  if (priority === "High") return "bg-orange-100 text-orange-700";
  if (priority === "Medium") return "bg-yellow-100 text-yellow-700";
  if (priority === "Low") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}
const getEffectiveStatus = (comp) => comp.adminFinalStatus || comp.status;

export default function SupervisorDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filters, setFilters] = useState({
    status: "All Status",
    priority: "All Priority",
    date: "",
  });

  // AUTH GUARD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        if (!user.email.endsWith("@sup.com")) window.location.href = "/login";
      } else {
        setUserEmail("");
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time complaints fetch (assigned to supervisor)
  useEffect(() => {
    if (!userEmail) return;
    const q = query(collection(db, "complaints"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => {
        const c = doc.data();
        return {
          id: doc.id,
          ...c,
          createdAt: c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : c.createdAt || null,
        };
      });
      setComplaints(data.filter((c) => c.assigned === userEmail));
    });
    return () => unsubscribe();
  }, [userEmail]);

  // Filtering logic for inside card (category view)
  function filteredComplaints(category) {
    let comps = complaints.filter(
      (comp) => comp.category === category && comp.assigned === userEmail
    );
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

  // Change status handler
  async function handleStatusChange(complaintId, newStatus) {
    try {
      const complaintRef = doc(db, "complaints", complaintId);
      await updateDoc(complaintRef, { status: newStatus });
      // UI will auto-update via onSnapshot
    } catch (e) {
      alert("Error updating status");
    }
  }

  // Get stats for a category
  function getCategoryStats(categoryName) {
    const catComplaints = complaints.filter(
      (comp) => comp.category === categoryName && comp.assigned === userEmail
    );
    return {
      total: catComplaints.length,
      pending: catComplaints.filter(c => getEffectiveStatus(c) === "Pending").length,
      inProgress: catComplaints.filter(c => getEffectiveStatus(c) === "In Progress").length,
      resolved: catComplaints.filter(c => getEffectiveStatus(c) === "Resolved").length,
      reopened: catComplaints.filter(c => getEffectiveStatus(c) === "Reopened").length,
    };
  }



  // Main UI
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      <div className="w-full max-w-7xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700">
          Graphic Era Hill University – Supervisor Dashboard
        </h1>
        {/* Export to CSV button removed as per user request */}
      </div>
      {/* Category grid view with ProfileCard on left and CategoryCard grid on right */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <ProfileCard
            name="Supervisor Name"
            role="Supervisor"
            email={userEmail}
          />
        </div>
        <div className="md:w-3/4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const stats = getCategoryStats(cat.name);
            const catComplaints = complaints.filter(
              (comp) => comp.category === cat.name && comp.assigned === userEmail
            );
            return (
              <CategoryCard
                key={cat.name}
                category={cat}
                stats={stats}
                complaints={catComplaints}
                onClick={() => setSelectedCategory(cat.name)}
                isSelected={selectedCategory === cat.name}
              />
            );
          })}
        </div>
      </div>
      {/* Modal for detailed complaints */}
      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCategory} Complaints</DialogTitle>
          </DialogHeader>
          <div className="text-gray-600 text-sm mb-4">
            {filteredComplaints(selectedCategory).length} of {complaints.filter(c => c.category === selectedCategory && c.assigned === userEmail).length} complaints
          </div>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div>
              <label className="block text-xs mb-1">Status</label>
              <select
                className="border rounded px-2 py-1"
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
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
                onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
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
                onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <button
              className="text-xs underline text-blue-600 mt-5"
              onClick={() =>
                setFilters({ status: "All Status", priority: "All Priority", date: "" })
              }
            >
              Clear Filters
            </button>
          </div>
          {/* Complaints grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredComplaints(selectedCategory).map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-2xl shadow-xl p-5 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{categories.find(c => c.name === selectedCategory)?.icon}</span>
                  <span className="font-bold">{comp.subject}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">ID: {comp.id}</div>
                <div className="mb-2 text-gray-700">{comp.description}</div>
                <div className="text-xs mb-1">
                  <span className="font-medium">Submitted By:</span> {comp.submittedBy}
                </div>
                <div className="text-xs mb-1">
                  <span className="font-medium">Date:</span> {formatDate(comp.createdAt)}
                </div>
                <div className="flex gap-2 mt-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass(getEffectiveStatus(comp))}`}>
                    {getEffectiveStatus(comp)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityClass(comp.priority)}`}>
                    {comp.priority}
                  </span>
                </div>
                <div>
                  <select
                    value={getEffectiveStatus(comp)}
                    onChange={e => handleStatusChange(comp.id, e.target.value)}
                    className="border rounded px-3 py-2 w-full mt-2"
                  >
                    <option value="Pending">Mark as Pending</option>
                    <option value="In Progress">Mark as In Progress</option>
                    <option value="Resolved">Mark as Resolved</option>
                    <option value="Reopened">Mark as Reopened</option>
                  </select>
                </div>
              </div>
            ))}
            {filteredComplaints(selectedCategory).length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-12">
                No complaints found for this category with selected filters.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/firebase/config";
import {
  collection,
  onSnapshot,
  query,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ProfileCard from "@/components/ProfileCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- CATEGORY DATA ---
const categories = [
  { name: "Electrical", icon: "⚡", desc: "Issues related to electrical systems, wiring, and power supply." },
  { name: "Plumbing", icon: "🔧", desc: "Problems with water pipes, faucets, and drainage." },
  { name: "Cleaning", icon: "🧹", desc: "Maintenance and cleaning services for facilities." },
  { name: "Security", icon: "🛡", desc: "Concerns about safety, access control, and surveillance." },
  { name: "Internet", icon: "📶", desc: "Network connectivity and Wi-Fi related issues." },
  { name: "Parking", icon: "🚗", desc: "Parking space availability and vehicle-related problems." },
  { name: "Other", icon: "🖥", desc: "Miscellaneous complaints not covered by other categories." },
];

// --- FILTER OPTIONS ---
const statusOptions = ["All Status", "Pending", "In Progress", "Resolved", "Reopened", "Assigned"];
const priorityOptions = ["All Priority", "High", "Medium", "Low"];
const userTypeOptions = ["All", "Student", "Staff"];

// --- FORMATTERS ---
function formatDate(dateInput) {
  if (!dateInput) return "N/A";
  let date;
  if (typeof dateInput === "object" && dateInput !== null) {
    if (dateInput instanceof Date) date = dateInput;
    else if (dateInput.toDate) date = dateInput.toDate();
    else if (dateInput.seconds !== undefined) date = new Date(dateInput.seconds * 1000);
  } else date = new Date(dateInput);
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

// --- UPDATE STATUS FUNCTION ---
async function updateStatus(complaintId, newStatus) {
  try {
    const docRef = doc(db, "complaints", complaintId);
    await updateDoc(docRef, { adminFinalStatus: newStatus });
  } catch (error) {
    console.error("Error updating status:", error);
  }
}

export default function SupervisorCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = params.category;
  const [complaints, setComplaints] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [filters, setFilters] = useState({
    status: "All Status",
    priority: "All Priority",
    userType: "All",
    fromDate: "",
    toDate: "",
    search: "",
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // --- AUTH GUARD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        if (!user.email.endsWith("@sup.com")) router.replace("/login");
      } else {
        setUserEmail("");
        router.replace("/login");
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, []);

  // --- REALTIME FETCH ALL COMPLAINTS FOR THIS CATEGORY ---
  useEffect(() => {
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
      setComplaints(data);
    });
    return () => unsubscribe();
  }, []);

  // --- REALTIME FETCH ASSIGNED COMPLAINTS FOR THIS SUPERVISOR IN THIS CATEGORY ---
  useEffect(() => {
    if (!userEmail) return;
    const q = query(collection(db, "complaints"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs
        .map((doc) => {
          const c = doc.data();
          return {
            id: doc.id,
            ...c,
            createdAt: c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : c.createdAt || null,
          };
        })
        .filter((comp) => comp.assignedSupervisor === userEmail);
      setAssignedComplaints(data);
    });
    return () => unsubscribe();
  }, [userEmail]);

  // --- FILTERED complaints for this category ---
  function filteredComplaints() {
    const decodedCategory = decodeURIComponent(categoryParam).toLowerCase();
    let comps = complaints.filter((comp) => {
      const cat = comp.category === null || comp.category === undefined ? "Other" : comp.category;
      return cat.toLowerCase() === decodedCategory;
    });
    if (filters.status !== "All Status") {
      comps = comps.filter((comp) => getEffectiveStatus(comp) === filters.status);
    }
    if (filters.priority !== "All Priority") {
      comps = comps.filter((comp) => (comp.priority || "Low") === filters.priority);
    }
    if (filters.userType !== "All") {
      comps = comps.filter((comp) => {
        const userType = comp.email && comp.email.includes('@staff.com') ? 'Staff' : 'Student';
        return userType === filters.userType;
      });
    }
    if (filters.fromDate) {
      comps = comps.filter((comp) => {
        if (!comp.createdAt) return false;
        const d = typeof comp.createdAt === "string" ? new Date(comp.createdAt) : comp.createdAt;
        const fromDate = new Date(filters.fromDate);
        return d >= fromDate;
      });
    }
    if (filters.toDate) {
      comps = comps.filter((comp) => {
        if (!comp.createdAt) return false;
        const d = typeof comp.createdAt === "string" ? new Date(comp.createdAt) : comp.createdAt;
        const toDate = new Date(filters.toDate);
        return d <= toDate;
      });
    }
    if (filters.search && filters.search.trim() !== "") {
      const s = filters.search.trim().toLowerCase();
      comps = comps.filter(
        (comp) =>
          (comp.subject && comp.subject.toLowerCase().includes(s)) ||
          (comp.description && comp.description.toLowerCase().includes(s)) ||
          (comp.userName && comp.userName.toLowerCase().includes(s)) ||
          (comp.email && comp.email.toLowerCase().includes(s))
      );
    }
    return comps;
  }

  // --- FILTERED assigned complaints for this category and supervisor ---
  function filteredAssignedComplaints() {
    const decodedCategory = decodeURIComponent(categoryParam).toLowerCase();
    let comps = assignedComplaints.filter((comp) => {
      const cat = comp.category === null || comp.category === undefined ? "Other" : comp.category;
      return cat.toLowerCase() === decodedCategory;
    });
    // Filter only updated complaints by status (Pending, In Progress, Resolved, Assigned)
    comps = comps.filter((comp) => {
      const status = getEffectiveStatus(comp);
      return ["Pending", "In Progress", "Resolved", "Assigned"].includes(status);
    });
    return comps;
  }

  const thisCategory = categories.find(
    (cat) => cat.name.toLowerCase() === decodeURIComponent(categoryParam).toLowerCase()
  );

  if (!thisCategory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-bold text-red-700 mb-6">Invalid Category</div>
        <button
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow"
          onClick={() => router.replace("/supervisor-dashboard")}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white px-0 md:px-6 py-6 flex flex-col items-center">
      <div className="w-full max-w-6xl mb-5">
        <ProfileCard
          name="Supervisor Name"
          role="Supervisor"
          email={userEmail}
        />
      </div>
      <div className="w-full max-w-6xl mb-2 flex items-center gap-4">
        <button
          onClick={() => router.push('/supervisor-dashboard')}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700"
        >
          Back to Dashboard
        </button>
        <span className="text-3xl">{thisCategory.icon}</span>
        <span className="text-2xl font-bold">{thisCategory.name} Complaints</span>
        <span className="text-gray-700 ml-2">{thisCategory.desc}</span>
      </div>
      {/* Filters */}
      <div className="w-full max-w-6xl bg-white shadow rounded-xl p-4 mt-6 mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs mb-1">Status</label>
          <select
            className="border rounded px-2 py-1"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">Priority</label>
          <select
            className="border rounded px-2 py-1"
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          >
            {priorityOptions.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">User Type</label>
          <select
            className="border rounded px-2 py-1"
            value={filters.userType}
            onChange={e => setFilters(f => ({ ...f, userType: e.target.value }))}
          >
            {userTypeOptions.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1">From Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={filters.fromDate}
            onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">To Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={filters.toDate}
            onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs mb-1">Search</label>
          <input
            type="text"
            className="border rounded px-2 py-1"
            placeholder="Search complaints"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <button
          className="text-xs underline text-blue-600 mt-5"
          onClick={() =>
            setFilters({ status: "All Status", priority: "All Priority", userType: "All", fromDate: "", toDate: "", search: "" })
          }
        >
          Clear Filters
        </button>
      </div>
      {/* Complaints grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
        {filteredComplaints().map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-2xl shadow-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{thisCategory.icon}</span>
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
            <div className="mt-2 flex flex-col gap-2">
              <label className="block text-xs mb-1">Change Status</label>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={getEffectiveStatus(comp)}
                onChange={(e) => updateStatus(comp.id, e.target.value)}
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
              <button
                className="mt-1 px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                onClick={() => setSelectedComplaint(comp)}
              >
                View Complaint
              </button>
            </div>
          </div>
        ))}
        {filteredComplaints().length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">
            No complaints found for this category with selected filters.
          </div>
        )}
      </div>

      {/* Complaint View Dialog */}
      {selectedComplaint && (
        <>
          {/* Glassmorphism Overlay */}
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 transition-all" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-6 relative max-w-2xl w-full border border-white/40 transition-all duration-300 ease-in-out">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-gray-200/50 pb-3">
                <span className="text-xl font-semibold text-gray-800">Complaint Details</span>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
                >
                  ✕
                </button>
              </div>
              {/* Modal Body */}
              <div className="space-y-4 text-sm text-gray-700 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Subject:</span>
                  <span>{selectedComplaint.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Category:</span>
                  <span>{selectedComplaint.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Priority:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityClass(
                      selectedComplaint.priority
                    )}`}
                  >
                    {selectedComplaint.priority}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass(
                      getEffectiveStatus(selectedComplaint)
                    )}`}
                  >
                    {getEffectiveStatus(selectedComplaint)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Building:</span>
                  <span>{selectedComplaint.building || "N/A"}</span>
                </div>
<div className="flex justify-between">
  <span className="font-semibold">Room:</span>
  <span>
    {selectedComplaint.roomNo && selectedComplaint.roomNo !== "N/A"
      ? selectedComplaint.roomNo
      : selectedComplaint.location && selectedComplaint.location !== "N/A"
      ? selectedComplaint.location
      : "N/A"}
  </span>
</div>
                <div className="flex justify-between">
                  <span className="font-semibold">Description:</span>
                  <span>{selectedComplaint.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Submitted By:</span>
                  <span>
                    {selectedComplaint.email || "N/A"}{" "}
                    {selectedComplaint.email && selectedComplaint.email.includes("@staff.com") ? "(Staff)" : "(Student)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Time Slot Booked:</span>
                  <span>{selectedComplaint.timeSlot || "N/A"}</span>
                </div>
              </div>
              {/* Modal Footer */}
              <div className="flex justify-end mt-6">
                <button
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
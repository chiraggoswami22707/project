"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  User,
  LogOut,
  Clock,
  CheckCircle,
  Settings,
  Eye,
  Edit,
  ChevronDown,
  Key,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ProfileCard from "@/components/ProfileCard";

import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { useRef } from "react";

function formatDateTimeFull(dateInput) {
  let date;
  if (!dateInput) return "N/A";
  if (typeof dateInput === "object" && dateInput !== null) {
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput.toDate === "function") {
      date = dateInput.toDate();
    } else if (typeof dateInput.seconds === "number") {
      date = new Date(dateInput.seconds * 1000);
    } else {
      date = new Date(dateInput);
    }
  } else if (typeof dateInput === "string" || typeof dateInput === "number") {
    date = new Date(dateInput);
  } else {
    return "N/A";
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).replace(",", "");
}

const categories = [
  { name: "All Categories", icon: "📋", desc: "View all complaints across all categories" },
  { name: "Cleaning", icon: "🧹", desc: "Cleaning requests for rooms, halls, bathrooms, or any common area" },
  { name: "Electrical", icon: "⚡", desc: "Issues related to lights, fuses, wiring, switches, sockets, and electrical failures" },
  { name: "Plumbing", icon: "🚰", desc: "Problems like leaks, broken taps, clogged pipes, water supply issues, or drainage" },
  { name: "Maintenance", icon: "🔧", desc: "General maintenance issues and repairs" },
  { name: "Lab/Server", icon: "💻", desc: "Lab equipment, server issues, and technical problems" },
  { name: "Security", icon: "🔒", desc: "Security-related issues and concerns" },
  { name: "Internet", icon: "🌐", desc: "Internet connectivity and network issues" },
  { name: "Parking", icon: "🚗", desc: "Parking-related complaints and issues" },
  { name: "Vehicle", icon: "🚙", desc: "Vehicle maintenance and transportation issues" },
  { name: "Other", icon: "❓", desc: "Any miscellaneous issue not fitting above categories" },
];

const priorities = ["All Priority", "High", "Medium", "Low", "Reopened"];
const statuses = ["All Status", "Pending", "In Progress", "Resolved", "Reopened"];

export default function MaintenanceDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [priority, setPriority] = useState("All Priority");
  const [dateFilter, setDateFilter] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [viewModal, setViewModal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [supervisorFilter, setSupervisorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [userData, setUserData] = useState(null);
  const [profileDropdown, setProfileDropdown] = useState(false);

  // New states for export modal and filters
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState(null);
  const [filterToDate, setFilterToDate] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterPriority, setFilterPriority] = useState("All Priority");

  // Handler to clear filters in export modal
  const handleClearFilters = () => {
    setFilterFromDate(null);
    setFilterToDate(null);
    setFilterCategory("All Categories");
    setFilterStatus("All Status");
    setFilterPriority("All Priority");
  };

  // Handler for export form submit
  const handleExportSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("Export filters:", {
        fromDate: filterFromDate,
        toDate: filterToDate,
        category: filterCategory,
        status: filterStatus,
        priority: filterPriority
      });

      // Helper function to parse date from dd-MM-yyyy to Date object
      function parseDateString(dateStr) {
        if (!dateStr) return null;
        if (typeof dateStr !== "string") return null;
        const parts = dateStr.split("-");
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is zero-based
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }

      // Parse dates correctly from UI format
      const fromDateParsed = parseDateString(filterFromDate);
      const toDateParsed = parseDateString(filterToDate);

      // First, get ALL complaints to debug
      const allComplaintsQuery = collection(db, "complaints");
      const allSnapshot = await getDocs(allComplaintsQuery);
      console.log("Total complaints in database:", allSnapshot.size);

      // Build query with filters
      let q = collection(db, "complaints");
      const constraints = [];

      // Apply category filter
      if (filterCategory !== "All Categories") {
        constraints.push(where("category", "==", filterCategory));
      }
      
      // Apply status filter
      if (filterStatus !== "All Status") {
        constraints.push(where("status", "==", filterStatus));
      }
      
      // Apply priority filter
      if (filterPriority !== "All Priority") {
        constraints.push(where("priority", "==", filterPriority));
      }

      // Apply date range filters
      if (fromDateParsed || toDateParsed) {
        if (fromDateParsed && toDateParsed) {
          // Both dates selected - range filter
          const fromDate = new Date(fromDateParsed);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(toDateParsed);
          toDate.setHours(23, 59, 59, 999);
          constraints.push(where("createdAt", ">=", Timestamp.fromDate(fromDate)));
          constraints.push(where("createdAt", "<=", Timestamp.fromDate(toDate)));
        } else if (fromDateParsed) {
          // Only from date selected
          const fromDate = new Date(fromDateParsed);
          fromDate.setHours(0, 0, 0, 0);
          constraints.push(where("createdAt", ">=", Timestamp.fromDate(fromDate)));
        } else if (toDateParsed) {
          // Only to date selected
          const toDate = new Date(toDateParsed);
          toDate.setHours(23, 59, 59, 999);
          constraints.push(where("createdAt", "<=", Timestamp.fromDate(toDate)));
        }
      }

      // Build the query with constraints
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const querySnapshot = await getDocs(q);
      console.log("Number of complaints after filtering:", querySnapshot.size);
      
      // Process the data for export
      const filteredData = querySnapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        
        // Convert Firestore timestamps to JavaScript Date objects
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          data.createdAt = data.createdAt.toDate();
        } else if (data.createdAt && data.createdAt.seconds) {
          data.createdAt = new Date(data.createdAt.seconds * 1000);
        }
        
        if (data.resolvedAt && typeof data.resolvedAt.toDate === 'function') {
          data.resolvedAt = data.resolvedAt.toDate();
        } else if (data.resolvedAt && data.resolvedAt.seconds) {
          data.resolvedAt = new Date(data.resolvedAt.seconds * 1000);
        }
        
        return data;
      });

      // Debug: Show sample dates
      if (filteredData.length > 0) {
        console.log("Sample complaint dates:", filteredData.slice(0, 3).map(c => ({
          id: c.id,
          createdAt: c.createdAt,
          formatted: formatDateTimeFull(c.createdAt)
        })));
      }

      // Prepare data for Excel export
      const wsData = [
        [
          "Complaint ID",
          "Submitted By",
          "Role",
          "Email",
          "Building Name",
          "Room / Location",
          "Complaint Category",
          "Complaint Details",
          "Priority",
          "Assigned Supervisor",
          "Status",
          "Date Submitted",
          "Preferred Time Slot",
          "Resolved Date"
        ],
        ...filteredData.map(c => [
          c.id || "",
          c.userName || c.user || "",
          c.role || "",
          c.email || "",
          c.building || "",
          c.location || "",
          c.category || "",
          c.description || "",
          c.priority || "",
          c.assigned || "",
          c.adminFinalStatus || c.status || "",
          c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "",
          c.preferredTimeSlot || "",
          c.resolvedAt ? new Date(c.resolvedAt).toISOString().slice(0, 10) : ""
        ])
      ];

      // Create worksheet and workbook
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set header row bold
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cell_address]) continue;
        if (!ws[cell_address].s) ws[cell_address].s = {};
        ws[cell_address].s.font = { bold: true };
      }

      // Auto width columns
      const colWidths = wsData[0].map((_, colIndex) => {
        return { wch: Math.max(...wsData.map(row => (row[colIndex] ? row[colIndex].toString().length : 10))) + 2 };
      });
      ws['!cols'] = colWidths;

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Maintenance Complaints");

      // Generate filename with filters
      let filename = "Maintenance_Complaints";
      if (filterCategory !== "All Categories") filename += `_${filterCategory}`;
      if (filterStatus !== "All Status") filename += `_${filterStatus}`;
      if (filterPriority !== "All Priority") filename += `_${filterPriority}`;
      if (filterFromDate) filename += `_from_${format(filterFromDate, 'yyyy-MM-dd')}`;
      if (filterToDate) filename += `_to_${format(filterToDate, 'yyyy-MM-dd')}`;
      filename += ".xlsx";

      // Write workbook and trigger download
      XLSX.writeFile(wb, filename);

      // Close modal after export
      setExportModalOpen(false);
      handleClearFilters();

      alert(`Exported ${filteredData.length} complaints successfully!`);

    } catch (error) {
      console.error("Error exporting complaints:", error);
      alert("Failed to export complaints. Please try again. Error: " + error.message);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    setUserName(auth.currentUser.displayName || auth.currentUser.email?.split("@")[0]);
    setUserEmail(auth.currentUser.email);
  }, [auth.currentUser]);

  useEffect(() => {
    const q = collection(db, "complaints");
    let initialLoad = true;
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Number of complaints fetched from Firestore:", data.length);
      // Log createdAt values for debugging
      data.forEach((comp, index) => {
        console.log(`Complaint ${index + 1} createdAt:`, comp.createdAt);
      });
      if (!initialLoad && data.length > complaints.length) {
        setNotification("New complaint submitted!");
        setTimeout(() => setNotification(null), 4000);
      }
      setComplaints(data.sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        const da = new Date(a.createdAt.seconds ? a.createdAt.seconds * 1000 : a.createdAt);
        const db_ = new Date(b.createdAt.seconds ? b.createdAt.seconds * 1000 : b.createdAt);
        return db_ - da;
      }));
      initialLoad = false;
    });
    return unsub;
  }, []);

  const filteredComplaints = complaints.filter(comp =>
    (search === "" || comp.subject?.toLowerCase().includes(search.toLowerCase()) || comp.description?.toLowerCase().includes(search.toLowerCase()) || comp.userName?.toLowerCase().includes(search.toLowerCase()))
    && (category === "All Categories" || comp.category === category)
    && (status === "All Status" || comp.status === status)
    && (priority === "All Priority" || comp.priority === priority || (priority === "Reopened" && comp.status === "Reopened"))
    && (dateFilter === "" || formatDateTimeFull(comp.createdAt).slice(0, 11) === formatDateTimeFull(dateFilter).slice(0, 11))
  );

  // Get supervisor complaints (complaints assigned to the logged-in supervisor)
  // Use adminFinalStatus if present, else fallback to status
  const getEffectiveStatus = (comp) => comp.adminFinalStatus || comp.status;

  // Get all complaints assigned to any supervisor (not just current user)
  const supervisorComplaints = complaints.filter(comp =>
    comp.assigned && comp.assigned.trim() !== ""
  );

  // Get supervisor complaints by category
  const getSupervisorComplaintsByCategory = (selectedCategory) => {
    if (selectedCategory === "All Categories") return supervisorComplaints;
    return supervisorComplaints.filter(comp => comp.category === selectedCategory);
  };

  // Apply filters in supervisor view
  const applySupervisorFilters = (complaintsList) => {
    let filtered = complaintsList;

    // Filter by supervisor name
    if (supervisorFilter.trim() !== "") {
      filtered = filtered.filter(comp =>
        comp.assigned && comp.assigned.toLowerCase().includes(supervisorFilter.toLowerCase())
      );
    }

    // Filter by admin final status or status
    if (statusFilter !== "All Status") {
      filtered = filtered.filter(comp => getEffectiveStatus(comp) === statusFilter);
    }

    return filtered;
  };

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const progress = complaints.filter((c) => c.status === "In Progress").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const reopened = complaints.filter((c) => c.status === "Reopened").length;

  const handleUpdateComplaint = async (id, updates) => {
    try {
      await updateDoc(doc(db, "complaints", id), updates);
      setUpdateModal(null);

      // Fetch updated complaint to sync with supervisor dashboard
      const docRef = doc(db, "complaints", id);
      const docSnap = await getDoc(docRef);
      let updatedComplaint = null;
      if (docSnap.exists()) {
        updatedComplaint = { id: docSnap.id, ...docSnap.data() };
      }

      if (updatedComplaint) {
        // Sync updated complaint with supervisor dashboard or other systems if needed
        // For now, just update local state
        setComplaints(prev => prev.map(comp => comp.id === id ? updatedComplaint : comp));
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeSuccess("");
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    if (!newPassword || newPassword.length < 6) {
      setPasswordChangeError("Password must be at least 6 characters long.");
      return;
    }
    if (!currentPassword) {
      setPasswordChangeError("Please enter your current password.");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordChangeSuccess("Password updated successfully!");
      setShowChangePassword(false);
    } catch (error) {
      setPasswordChangeError(error.message || "Failed to update password.");
    }
  };

  return (
    <div className="bg-[#f7f8fa] min-h-screen pb-10">
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-6 bg-white border-b shadow-sm relative">
        <div>
          <h1 className="font-bold text-2xl mb-1">Maintenance Dashboard</h1>
          <div className="text-sm text-gray-500">
            Graphic Era Hill University, Bhimtal
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div
              className="flex items-center gap-3 cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 shadow-md hover:scale-105 hover:shadow-2xl transition-all duration-200"
              onClick={() => setProfileDropdown((prev) => !prev)}
              style={{ border: "1px solid #e0e7ff" }}
            >
              <User className="w-6 h-6 text-blue-700" />
              <span className="font-semibold text-blue-700">{userName}</span>
              <ChevronDown className="w-5 h-5 text-blue-600" />
            </div>
            {profileDropdown && (
              <div className="absolute right-0 mt-2 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-2xl z-50 min-w-[180px] border border-blue-100"
                style={{ transform: "translateY(5px)", boxShadow: "0 2px 16px rgba(30,64,175,0.16)" }}>
                <button
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-blue-200/50 text-blue-700 text-left text-sm font-medium rounded-lg transition-all duration-150"
                  onClick={() => {
                    setShowChangePassword(true);
                    setProfileDropdown(false);
                  }}
                >
                  <Settings className="w-5 h-5" /> Change Password
                </button>
                <button
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-blue-200/50 text-blue-700 text-left text-sm font-medium rounded-lg transition-all duration-150"
                  onClick={() => {
                    signOut(auth).then(() => {
                      window.location.href = "/login";
                    });
                  }}
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            )}
          </div>
          <span className="hidden md:block text-xs text-gray-400">{userEmail}</span>
        </div>
        {notification && (
          <div className="absolute left-1/2 -translate-x-1/2 top-2 bg-green-100 text-green-900 px-6 py-2 rounded-xl shadow z-50 font-bold animate-bounce">
            {notification}
          </div>
        )}
      </div>

      {/* Export to Excel Button */}
      <div className="flex justify-end max-w-7xl mx-auto mt-4 px-6">
        <Button
          variant="outline"
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-blue-600 bg-blue-50 px-4 py-2 font-semibold text-blue-700 shadow hover:bg-blue-100 hover:text-blue-800 transition"
        >
          <PlusCircle className="h-5 w-5" />
          Export to Excel
        </Button>
      </div>

      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Complaints to Excel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExportSubmit}>
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <Calendar
                  mode="single"
                  selected={filterFromDate}
                  onSelect={setFilterFromDate}
                  placeholder="Select From Date"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <Calendar
                  mode="single"
                  selected={filterToDate}
                  onSelect={setFilterToDate}
                  placeholder="Select To Date"
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="rounded-xl"
              >
                Clear Filters
              </Button>
              <Button type="submit" className="rounded-xl">
                Export
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex justify-center mt-8">
        <div className="flex bg-[#ececec] rounded-2xl overflow-hidden w-[700px]">
          <button
            className={`flex-1 py-2 text-lg font-semibold transition-all ${activeTab === "Overview"
                ? "bg-white text-black shadow"
                : "text-gray-500"
              }`}
            onClick={() => setActiveTab("Overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 py-2 text-lg font-semibold transition-all ${activeTab === "AllComplaints"
                ? "bg-white text-black shadow"
                : "text-gray-500"
              }`}
            onClick={() => setActiveTab("AllComplaints")}
          >
            All Complaints
          </button>
          <button
            className={`flex-1 py-2 text-lg font-semibold transition-all ${activeTab === "Supervisors"
                ? "bg-white text-black shadow"
                : "text-gray-500"
              }`}
            onClick={() => setActiveTab("Supervisors")}
          >
            Supervisors
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "Overview" && (
        <div className="max-w-6xl mx-auto mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <ProfileCard
              userName={userName}
              userEmail={userEmail}
              userRole="Maintenance Staff"
              complaintsHandled={resolved}
              pendingComplaints={pending}
              inProgressComplaints={progress}
            />

            {/* Stats Card */}
            <Card className="p-8 lg:col-span-2">
              <div className="text-xl font-bold mb-2">Welcome, {userName}!</div>
              <div className="text-sm text-gray-500 mb-6">
                Manage and resolve maintenance requests from students and staff
              </div>
              <div className="grid grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-[#f7f8fa] flex flex-col items-center">
                  <span className="font-bold text-2xl">{total}</span>
                  <span className="text-gray-500">Total Complaints</span>
                  <Settings className="mt-2 text-gray-400" />
                </div>
                <div className="p-4 rounded-xl bg-[#f7f8fa] flex flex-col items-center">
                  <span className="font-bold text-2xl text-orange-500">{pending}</span>
                  <span className="text-gray-500">Pending</span>
                  <Clock className="mt-2 text-orange-400" />
                </div>
                <div className="p-4 rounded-xl bg-[#f7f8fa] flex flex-col items-center">
                  <span className="font-bold text-2xl text-blue-600">{progress}</span>
                  <span className="text-gray-500">In Progress</span>
                  <Clock className="mt-2 text-blue-500" />
                </div>
                <div className="p-4 rounded-xl bg-[#f7f8fa] flex flex-col items-center">
                  <span className="font-bold text-2xl text-green-600">{resolved}</span>
                  <span className="text-gray-500">Resolved</span>
                  <CheckCircle className="mt-2 text-green-500" />
                </div>
                <div className="p-4 rounded-xl bg-[#f7f8fa] flex flex-col items-center">
                  <span className="font-bold text-2xl text-violet-600">{reopened}</span>
                  <span className="text-gray-500">Reopened</span>
                  <Clock className="mt-2 text-violet-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Complaints */}
          <Card className="p-7">
            <div className="font-bold text-lg mb-4">Recent Complaints</div>
            <div className="space-y-3">
              {complaints.slice(0, 3).map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white rounded-xl px-5 py-4 shadow flex flex-col gap-1 hover:scale-[1.02] transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-base">{comp.subject}</div>
                  <span className={`px-3 py-1 rounded-full font-semibold text-xs ${comp.priority === "High" ? "bg-red-100 text-red-700" : comp.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : comp.priority === "Low" ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"}`}>
                    {comp.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full font-semibold text-xs ${getEffectiveStatus(comp) === "Pending" ? "bg-orange-100 text-orange-700" : getEffectiveStatus(comp) === "In Progress" ? "bg-blue-100 text-blue-700" : getEffectiveStatus(comp) === "Resolved" ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"}`}>
                    {getEffectiveStatus(comp)}
                  </span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" /> {comp.userName || comp.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="w-4 h-4" /> {comp.building}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {formatDateTimeFull(comp.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* All Complaints Tab */}
      {activeTab === "AllComplaints" && (
        <div className="max-w-5xl mx-auto mt-8 space-y-8">
          <Card className="p-6">
            <div className="font-bold mb-4 flex gap-2 items-center">
              <Settings className="w-5 h-5" />
              Filters
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div>
                <div className="font-medium text-sm mb-1">Search</div>
                <Input
                  placeholder="Search complaints..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Category</div>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="rounded-xl px-3 py-2 w-full bg-white border"
                >
                  {categories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Status</div>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="rounded-xl px-3 py-2 w-full bg-white border"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Priority</div>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="rounded-xl px-3 py-2 w-full bg-white border"
                >
                  {priorities.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-medium text-sm mb-1">Date</div>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="font-bold text-lg mb-4">
              All Complaints ({filteredComplaints.length})
            </div>
            <div className="space-y-5">
              {filteredComplaints.map((comp) => (
                <div
                  key={comp.id}
                  className="rounded-xl bg-white shadow px-5 py-4 flex flex-col gap-2 hover:scale-[1.02] transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-base">{comp.subject}</span>
                    <span className={`px-3 py-1 rounded-full font-semibold text-xs ${comp.priority === "High" ? "bg-red-100 text-red-700" : comp.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : comp.priority === "Low" ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"}`}>
                      {comp.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-semibold text-xs ${comp.status === "Pending" ? "bg-orange-100 text-orange-700" : comp.status === "In Progress" ? "bg-blue-100 text-blue-700" : comp.status === "Resolved" ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"}`}>
                      {comp.status}
                    </span>
                  </div>
                  <div className="text-gray-800 text-sm">{comp.description}</div>
                  <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" /> {comp.userName || comp.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Settings className="w-4 h-4" /> {comp.building}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {formatDateTimeFull(comp.createdAt)}
                    </span>
                  </div>
                  {comp.assigned && (
                    <div className="text-xs text-blue-700 mt-1">
                      Assigned to: {comp.assigned}
                    </div>
                  )}
                  <div className="flex gap-3 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex gap-2 items-center hover:scale-105 transition"
                      onClick={() => setViewModal(comp)}
                    >
                      <Eye className="w-4 h-4" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex gap-2 items-center hover:scale-105 transition"
                      onClick={() => setUpdateModal(comp)}
                    >
                      <Edit className="w-4 h-4" /> Update
                    </Button>
                  </div>
                </div>
              ))}
              {filteredComplaints.length === 0 && (
                <div className="text-center text-gray-400 text-base py-8">
                  No complaints found for selected filters.
                </div>
              )}

              {/* Add no complaints message for supervisor view */}
              {activeTab === "Supervisors" && selectedCategory && (() => {
                const categoryComplaints = getSupervisorComplaintsByCategory(selectedCategory);
                const filtered = applySupervisorFilters(categoryComplaints);
                if (filtered.length === 0) {
                  return (
                    <div className="text-center text-gray-400 text-base py-8">
                      No complaints available for this selection.
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </Card>
        </div>
      )}

      {/* Supervisors Tab */}
      {activeTab === "Supervisors" && (
        <div className="max-w-6xl mx-auto mt-8 space-y-8">
          {/* Category Cards */}
          {!selectedCategory && (
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Select a Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.filter(cat => cat.name !== "All Categories").map((category) => {
                  // Filter complaints for this category from all complaints, not just supervisorComplaints
                  const categoryComplaints = complaints.filter(comp => comp.category === category.name);
                  const assigned = categoryComplaints.filter(c => c.assigned).length;
                  const pending = categoryComplaints.filter(c => c.status === "Pending").length;
                  const progress = categoryComplaints.filter(c => c.status === "In Progress").length;
                  const resolved = categoryComplaints.filter(c => c.status === "Resolved").length;

                  return (
                    <Card
                      key={category.name}
                      className="p-4 shadow-3xl rounded-2xl cursor-pointer hover:scale-105 transition-all duration-200"
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{category.desc}</p>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Total Complaints:</span>
                          <span className="font-semibold">{categoryComplaints.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-600">Pending:</span>
                          <span>{pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">In Progress:</span>
                          <span>{progress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Resolved:</span>
                          <span>{resolved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Assigned:</span>
                          <span>{assigned}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Selected Category View */}
          {selectedCategory && (
            <div className="space-y-6">
              {/* Back Button and Filters */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    ← Back to Categories
                  </button>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {categories.find(cat => cat.name === selectedCategory)?.icon}
                    {selectedCategory} - Supervisor View
                  </h2>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="font-medium text-sm mb-1">Filter by Supervisor</div>
                    <Input
                      placeholder="Search supervisor..."
                      value={supervisorFilter}
                      onChange={(e) => setSupervisorFilter(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">Filter by Status</div>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="rounded-xl px-3 py-2 w-full bg-white border"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSupervisorFilter("");
                        setStatusFilter("All Status");
                      }}
                      className="rounded-xl"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Supervisors and Their Complaints */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Supervisors and Assigned Complaints</h3>

                {(() => {
                  const categoryComplaints = getSupervisorComplaintsByCategory(selectedCategory);

                  // Get unique supervisors for this category
                  const supervisors = [...new Set(categoryComplaints
                    .filter(comp => comp.assigned)
                    .map(comp => comp.assigned)
                  )].sort();

                  if (supervisors.length === 0) {
                    return (
                      <div className="text-center text-gray-400 py-8">
                        No supervisors assigned to {selectedCategory} complaints yet.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {supervisors.map((supervisor) => {
                        // Filter complaints for this supervisor
                  let supervisorComplaints = categoryComplaints.filter(
                    comp => comp.assigned && comp.assigned === supervisor
                  );

                  // Apply supervisor name filter
                  if (supervisorFilter && !supervisor.toLowerCase().includes(supervisorFilter.toLowerCase())) {
                    return null;
                  }

                  // Apply status filter
                  if (statusFilter !== "All Status") {
                    supervisorComplaints = supervisorComplaints.filter(
                      comp => (comp.adminFinalStatus || comp.status) === statusFilter
                    );
                  }

                        if (supervisorComplaints.length === 0) {
                          return null;
                        }

                        return (
                          <Card key={supervisor} className="p-4 shadow-3xl rounded-2xl">
                            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <User className="w-5 h-5" />
                              {supervisor}
                            </h4>
                            <div className="space-y-3">
                              {supervisorComplaints.map((comp) => (
                                <div key={comp.id} className="bg-white rounded-xl p-3 shadow">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium">{comp.subject}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      (comp.adminFinalStatus || comp.status) === "Pending" ? "bg-orange-100 text-orange-700" :
                                      (comp.adminFinalStatus || comp.status) === "In Progress" ? "bg-blue-100 text-blue-700" :
                                      (comp.adminFinalStatus || comp.status) === "Resolved" ? "bg-green-100 text-green-700" :
                                      (comp.adminFinalStatus || comp.status) === "Reopened" ? "bg-violet-100 text-violet-700" :
                                      "bg-gray-100 text-gray-700"
                                    }`}>
                                      {comp.adminFinalStatus || comp.status}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">{comp.description}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Created: {formatDateTimeFull(comp.createdAt)}
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => setViewModal(comp)}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => setUpdateModal(comp)}
                                    >
                                      Update
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* View Complaint Modal */}
      {viewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <Card className="w-full max-w-lg p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setViewModal(null)}
            />
            <h2 className="text-xl font-extrabold mb-4 text-blue-700 drop-shadow-lg">
              Complaint Details
            </h2>
            <div className="space-y-3">
              <p><strong>Subject:</strong> {viewModal.subject}</p>
              <p><strong>Category:</strong> {viewModal.category}</p>
              <p><strong>Priority:</strong>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${viewModal.priority === "High" ? "bg-red-100 text-red-700" :
                    viewModal.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                  }`}>
                  {viewModal.priority}
                </span>
              </p>
              <p><strong>Status:</strong>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getEffectiveStatus(viewModal) === "Pending" ? "bg-orange-100 text-orange-700" :
                  getEffectiveStatus(viewModal) === "In Progress" ? "bg-blue-100 text-blue-700" :
                    "bg-green-100 text-green-700"
                }`}>
                {getEffectiveStatus(viewModal)}
              </span>
              </p>
              <p><strong>Building:</strong> {viewModal.building}</p>
              <p><strong>Location:</strong> {viewModal.location}</p>
              <p><strong>Description:</strong> {viewModal.description}</p>
              <p><strong>Submitted by:</strong> {viewModal.userName || viewModal.user}</p>
              <p><strong>Submitted:</strong> {formatDateTimeFull(viewModal.createdAt)}</p>
              {viewModal.assigned && (
                <p><strong>Assigned to:</strong> {viewModal.assigned}</p>
              )}
            </div>
            <Button
              onClick={() => setViewModal(null)}
              className="mt-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 rounded-2xl font-bold shadow-lg"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Update Complaint Modal */}
      {updateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <Card className="w-full max-w-md p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setUpdateModal(null)}
            />
            <h2 className="text-xl font-extrabold mb-4 text-blue-700 drop-shadow-lg">
              Update Complaint Status
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updates = {
                status: formData.get("status"),
                assigned: formData.get("assigned") || null,
                notes: formData.get("notes") || ""
              };
              handleUpdateComplaint(updateModal.id, updates);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={updateModal.status}
                  className="w-full p-2 rounded-xl border"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign to Supervisor (optional)</label>
                <Input
                  name="assigned"
                  placeholder="Supervisor name"
                  defaultValue={updateModal.assigned || ""}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  name="notes"
                  placeholder="Add any notes..."
                  defaultValue={updateModal.notes || ""}
                  className="w-full p-2 rounded-xl border min-h-[80px]"
                />
              </div>
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setUpdateModal(null)}
                  className="rounded-xl font-semibold shadow hover:scale-105 hover:bg-blue-100 transition-all duration-150"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-bold shadow bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:scale-105 hover:from-blue-700 hover:to-blue-500 transition-all duration-150"
                >
                  Update
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

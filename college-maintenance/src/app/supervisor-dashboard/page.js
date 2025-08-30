"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, updatePassword } from "firebase/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  User,
  LogOut,
  FileText,
  ClipboardList,
  ChevronDown,
  Settings,
  Key,
  X,
  Calendar,
  MapPin,
  Clock,
  Info,
  Download,
  Filter,
  PlusCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import CategoryTabContent from "@/components/CategoryTabContent";

// Utility: Format date+time as "24 Aug 2025, 11:30 AM"
function formatDateTimeFull(dateInput) {
  if (!dateInput) return "N/A";
  let date;
  if (typeof dateInput === "object" && dateInput !== null) {
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput.toDate) {
      date = dateInput.toDate();
    } else if (dateInput.seconds !== undefined) {
      date = new Date(dateInput.seconds * 1000);
    }
  } else {
    date = new Date(dateInput);
  }
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(",", "");
}

// Utility: Format date only as "24 Aug 2025"
function formatDateOnly(dateInput) {
  if (!dateInput) return "N/A";
  let date;
  if (typeof dateInput === "object" && dateInput !== null) {
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput.toDate) {
      date = dateInput.toDate();
    } else if (dateInput.seconds !== undefined) {
      date = new Date(dateInput.seconds * 1000);
    }
  } else {
    date = new Date(dateInput);
  }
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(",", "");
}

const categories = [
  { name: "Cleaning", icon: "🧹", desc: "Cleaning requests for rooms, halls, bathrooms, or any common area." },
  { name: "Electrical", icon: "⚡", desc: "Issues related to lights, fuses, wiring, switches, sockets, and electrical failures." },
  { name: "Plumbing", icon: "🚰", desc: "Problems like leaks, broken taps, clogged pipes, water supply issues, or drainage." },
  { name: "Maintenance", icon: "🔧", desc: "General maintenance issues and repairs." },
  { name: "Lab/Server", icon: "💻", desc: "Lab equipment, server issues, and technical problems." },
  { name: "Others", icon: "❓", desc: "Any miscellaneous issue not fitting above categories." },
];

const statusOptions = ["All Status", "Pending", "In Progress", "Resolved", "Reopened"];

export default function SupervisorDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("Electrical");
  const [modalData, setModalData] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Filter states
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // AUTH: set user email and userName
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || user.email?.split("@")[0]);
        // Redirect if not supervisor
        if (!user.email.endsWith("@sup.com")) {
          window.location.href = "/login";
        }
      } else {
        setUserEmail("");
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch complaints assigned to this supervisor
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const q = query(collection(db, "complaints"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => {
          const complaintData = doc.data();
          return {
            id: doc.id,
            ...complaintData,
            createdAt: complaintData.createdAt && complaintData.createdAt.toDate
              ? complaintData.createdAt.toDate()
              : complaintData.createdAt || null,
          };
        });

        // Filter complaints assigned to this supervisor
        const supervisorComplaints = data.filter(comp =>
          comp.assigned && comp.assigned === userName
        );

        // Sort complaints by creation date (most recent first)
        const sortedData = supervisorComplaints.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB - dateA; // Descending order (newest first)
        });

        setComplaints(sortedData);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };
    fetchComplaints();
  }, [userName]);

  // Use adminFinalStatus if present, else fallback to status
  const getEffectiveStatus = (comp) => comp.adminFinalStatus || comp.status;

  // Get reporter type (student/staff)
  const getReporterType = (email) => {
    if (email?.endsWith("@gmail.com")) return "Student";
    if (email?.endsWith("@staff.com")) return "Staff";
    return "Unknown";
  };

  // Filter complaints for current tab
  const getFilteredComplaints = () => {
    let filtered = complaints.filter(comp => comp.category === activeTab && comp.assigned === userName);

    // Apply date range filter
    if (filterFromDate || filterToDate) {
      filtered = filtered.filter(comp => {
        if (!comp.createdAt) return false;
        const compDate = comp.createdAt instanceof Date ? comp.createdAt : new Date(comp.createdAt);
        const compTime = compDate.getTime();

        if (filterFromDate && filterToDate) {
          const fromDate = new Date(filterFromDate);
          const toDate = new Date(filterToDate);
          toDate.setHours(23, 59, 59, 999);
          return compTime >= fromDate.getTime() && compTime <= toDate.getTime();
        } else if (filterFromDate) {
          const fromDate = new Date(filterFromDate);
          return compTime >= fromDate.getTime();
        } else if (filterToDate) {
          const toDate = new Date(filterToDate);
          toDate.setHours(23, 59, 59, 999);
          return compTime <= toDate.getTime();
        }
        return true;
      });
    }

    // Apply status filter
    if (filterStatus !== "All Status") {
      filtered = filtered.filter(comp => getEffectiveStatus(comp) === filterStatus);
    }

    // Apply building filter
    if (filterBuilding) {
      filtered = filtered.filter(comp =>
        comp.building && comp.building.toLowerCase().includes(filterBuilding.toLowerCase())
      );
    }

    // Apply room filter
    if (filterRoom) {
      filtered = filtered.filter(comp =>
        comp.location && comp.location.toLowerCase().includes(filterRoom.toLowerCase())
      );
    }

    return filtered;
  };

  // Get complaint statistics for current category
  const getComplaintStats = () => {
    const categoryComplaints = complaints.filter(comp => comp.category === activeTab && comp.assigned === userName);
    return {
      total: categoryComplaints.length,
      resolved: categoryComplaints.filter(comp => getEffectiveStatus(comp) === "Resolved").length,
      pending: categoryComplaints.filter(comp => getEffectiveStatus(comp) === "Pending").length,
      inProgress: categoryComplaints.filter(comp => getEffectiveStatus(comp) === "In Progress").length,
      reopened: categoryComplaints.filter(comp => getEffectiveStatus(comp) === "Reopened").length,
    };
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterFromDate("");
    setFilterToDate("");
    setFilterStatus("All Status");
    setFilterBuilding("");
    setFilterRoom("");
  };

  // Export to Excel
  const exportToExcel = () => {
    const filteredData = getFilteredComplaints();

    const wsData = [
      ["Complaint ID", "Date Submitted", "Building Name", "Room Number", "Complaint Type", "Reporter Name", "Reporter Type", "Final Status", "Priority", "Description"],
      ...filteredData.map(comp => [
        comp.id || "",
        comp.createdAt ? formatDateOnly(comp.createdAt) : "N/A",
        comp.building || "",
        comp.location || "",
        comp.category || "",
        comp.userName || comp.user || "",
        getReporterType(comp.email),
        getEffectiveStatus(comp),
        comp.priority || "",
        comp.description || ""
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${activeTab} Complaints`);

    const filename = `${activeTab}_Complaints_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Update complaint status
  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const complaintRef = doc(db, "complaints", complaintId);
      await updateDoc(complaintRef, {
        status: newStatus,
      });

      // Update local state
      setComplaints(prev => prev.map(comp =>
        comp.id === complaintId ? { ...comp, status: newStatus } : comp
      ));
    } catch (error) {
      console.error("Error updating complaint status:", error);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeError("");
    setPasswordChangeSuccess("");
    setIsChangingPassword(true);

    // Validate current password
    if (!currentPassword) {
      setPasswordChangeError("Please enter your current password");
      setIsChangingPassword(false);
      return;
    }

    // Validate new passwords
    if (newPassword.length < 6) {
      setPasswordChangeError("New password must be at least 6 characters long");
      setIsChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError("New passwords do not match");
      setIsChangingPassword(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        setPasswordChangeSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Auto close modal after 2 seconds
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordChangeSuccess("");
        }, 2000);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordChangeError(error.message || "Failed to change password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // AUTH GUARD
  if (!userEmail.endsWith("@sup.com")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 shadow-3xl text-center text-xl text-red-700 font-bold bg-white/80 rounded-2xl">
          {/* Access Denied message removed */}
        </Card>
      </div>
    );
  }

  const filteredComplaints = getFilteredComplaints();
  const stats = getComplaintStats();

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-8 w-full max-w-7xl bg-white p-4 rounded-2xl shadow-3xl">
        <h1 className="text-3xl font-extrabold text-blue-700 drop-shadow-2xl">
          Graphic Era Hill University – Supervisor Dashboard
        </h1>
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
                <Key className="w-5 h-5" /> Change Password
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-blue-200/50 text-blue-700 text-left text-sm font-medium rounded-lg transition-all duration-150"
                onClick={() => {
                  setProfileDropdown(false);
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
      </div>

      {/* Category Tabs */}
      <div className="w-full max-w-7xl mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-start mb-6 bg-blue-100 rounded-2xl p-2 shadow-lg w-full overflow-x-auto">
            {categories.map((cat) => {
              const catComplaints = complaints.filter(comp => comp.category === cat.name && comp.assigned === userName);
              return (
                <TabsTrigger
                  key={cat.name}
                  value={cat.name}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-md font-bold transition shadow hover:scale-105 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-400 whitespace-nowrap"
                >
                  <span className="text-lg">{cat.icon}</span>
                  {cat.name}
                  <span className="ml-2 bg-blue-200 text-blue-800 px-2 rounded-full text-sm font-bold shadow-inner">
                    {catComplaints.length}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((cat) => {
            const catComplaints = complaints.filter(comp => comp.category === cat.name && comp.assigned === userName);
            const catStats = {
              total: catComplaints.length,
              resolved: catComplaints.filter(comp => getEffectiveStatus(comp) === "Resolved").length,
              pending: catComplaints.filter(comp => getEffectiveStatus(comp) === "Pending").length,
              inProgress: catComplaints.filter(comp => getEffectiveStatus(comp) === "In Progress").length,
              reopened: catComplaints.filter(comp => getEffectiveStatus(comp) === "Reopened").length,
            };
            return (
              <TabsContent key={cat.name} value={cat.name} className="w-full">
                <CategoryTabContent
                  category={cat}
                  complaints={catComplaints}
                  stats={catStats}
                  onUpdateStatus={updateComplaintStatus}
                  onViewDetails={setModalData}
                  onExport={exportToExcel}
                  onToggleFilters={() => setShowFilters(!showFilters)}
                  showFilters={showFilters}
                  filters={{
                    fromDate: filterFromDate,
                    toDate: filterToDate,
                    status: filterStatus,
                    building: filterBuilding,
                    room: filterRoom
                  }}
                  onFilterChange={{
                    setFromDate: setFilterFromDate,
                    setToDate: setFilterToDate,
                    setStatus: setFilterStatus,
                    setBuilding: setFilterBuilding,
                    setRoom: setFilterRoom
                  }}
                  onClearFilters={clearFilters}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Complaint Details Modal */}
      {modalData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-lg p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setModalData(null)}
            />
            <h2 className="text-2xl font-extrabold mb-4 text-blue-700 drop-shadow-lg">
              Complaint Details
            </h2>
            <div className="space-y-3">
              <p><strong>Complaint ID:</strong> {modalData.id}</p>
              <p><strong>Submitted By:</strong> {modalData.email}</p>
              <p><strong>Subject:</strong> {modalData.subject}</p>
              <p><strong>Category:</strong> {modalData.category}</p>
              <p><strong>Status:</strong>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${getEffectiveStatus(modalData) === "Pending"
                  ? "bg-orange-100 text-orange-700"
                  : getEffectiveStatus(modalData) === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : getEffectiveStatus(modalData) === "Resolved"
                      ? "bg-green-100 text-green-700"
                      : getEffectiveStatus(modalData) === "Reopened"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-gray-100 text-gray-700"
                  }`}>
                  {getEffectiveStatus(modalData)}
                </span>
              </p>
              <p><strong>Building:</strong> {modalData.building}</p>
              <p><strong>Location:</strong> {modalData.location}</p>
              <p><strong>Description:</strong> {modalData.description}</p>
              <p><strong>Submitted:</strong> {formatDateTimeFull(modalData.createdAt)}</p>
              {modalData.timeSlot && (
                <p><strong>Time Slot:</strong> {modalData.timeSlot}</p>
              )}
              <p><strong>Priority:</strong>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${modalData.priority === "High"
                  ? "bg-red-100 text-red-700"
                  : modalData.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : modalData.priority === "Low"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                  {modalData.priority}
                </span>
              </p>
            </div>
            <Button
              onClick={() => setModalData(null)}
              className="mt-6 bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 rounded-2xl font-bold shadow-lg"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-md p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => {
                setShowChangePassword(false);
                setPasswordChangeError("");
                setPasswordChangeSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            />
            <h2 className="text-2xl font-extrabold mb-6 text-blue-700 drop-shadow-lg text-center">
              Change Password
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordChangeError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {passwordChangeError}
                </div>
              )}

              {passwordChangeSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {passwordChangeSuccess}
                </div>
              )}

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 rounded-2xl font-bold shadow-lg py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

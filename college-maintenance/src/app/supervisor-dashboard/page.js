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
} from "lucide-react";

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

const categories = [
  { name: "Cleaning", icon: "🧹", desc: "Cleaning requests for rooms, halls, bathrooms, or any common area." },
  { name: "Electrical", icon: "⚡", desc: "Issues related to lights, fuses, wiring, switches, sockets, and electrical failures." },
  { name: "Plumbing", icon: "🚰", desc: "Problems like leaks, broken taps, clogged pipes, water supply issues, or drainage." },
  { name: "Maintenance", icon: "🔧", desc: "General maintenance issues and repairs." },
  { name: "Lab/Server", icon: "💻", desc: "Lab equipment, server issues, and technical problems." },
  { name: "Others", icon: "❓", desc: "Any miscellaneous issue not fitting above categories." },
];

export default function SupervisorDashboard() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [complaints, setComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [modalData, setModalData] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  // Fetch all complaints
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
        
        // Sort complaints by creation date (most recent first)
        const sortedData = data.sort((a, b) => {
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
  }, []);

  // Filter complaints by category
  const getComplaintsByCategory = (category) => {
    if (category === "All") return complaints;
    return complaints.filter(comp => comp.category === category);
  };

  // Filter complaints by role
  const getComplaintsByRole = (role) => {
    const categoryComplaints = getComplaintsByCategory(activeCategory);
    if (role === "all") return categoryComplaints;
    if (role === "student") return categoryComplaints.filter(comp => comp.email?.endsWith("@gmail.com"));
    if (role === "staff") return categoryComplaints.filter(comp => comp.email?.endsWith("@staff.com"));
    return categoryComplaints;
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
      
      // Sync with maintenance portal
      const complaint = complaints.find(c => c.id === complaintId);
      if (complaint) {
        await syncComplaintWithMaintenancePortal({ ...complaint, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating complaint status:", error);
    }
  };

  // Sync complaint with maintenance portal
  const syncComplaintWithMaintenancePortal = async (complaintData) => {
    try {
      // Replace the URL with the actual maintenance portal API endpoint
      const response = await fetch("http://localhost:3000/api/maintenance-portal/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        throw new Error("Failed to sync with Maintenance Portal");
      }

      const result = await response.json();
      console.log("Successfully synced with Maintenance Portal:", result);
    } catch (error) {
      console.error("Error syncing with Maintenance Portal:", error);
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

  const filteredComplaints = getComplaintsByRole(activeTab);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-10 w-full max-w-6xl bg-white p-4 rounded-2xl shadow-3xl">
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

      {/* Category Selection */}
      <div className="mb-8 w-full max-w-6xl">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">Select Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <Card
            onClick={() => setActiveCategory("All")}
            className={`cursor-pointer p-4 text-center shadow-3xl border-[2.5px] transition-all duration-200 hover:scale-[1.05] hover:shadow-3xl hover:bg-gradient-to-br hover:from-blue-100 hover:to-white ${
              activeCategory === "All"
                ? "border-blue-600 bg-blue-50 shadow-3xl"
                : "border-gray-200"
            }`}
            style={{
              borderRadius: "1rem",
              boxShadow: activeCategory === "All"
                ? "0 4px 24px 0 rgba(30,64,175,0.18)"
                : "0 2px 8px 0 rgba(30,64,175,0.09)",
            }}
          >
            <p className={`text-sm font-bold ${activeCategory === "All" ? "text-blue-700" : "text-gray-700"}`}>All Categories</p>
          </Card>
          {categories.map((cat) => (
            <Card
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`cursor-pointer p-4 text-center shadow-3xl border-[2.5px] transition-all duration-200 hover:scale-[1.05] hover:shadow-3xl hover:bg-gradient-to-br hover:from-blue-100 hover:to-white ${
                activeCategory === cat.name
                  ? "border-blue-600 bg-blue-50 shadow-3xl"
                  : "border-gray-200"
              }`}
              style={{
                borderRadius: "1rem",
                boxShadow: activeCategory === cat.name
                  ? "0 4px 24px 0 rgba(30,64,175,0.18)"
                  : "0 2px 8px 0 rgba(30,64,175,0.09)",
              }}
            >
              <div className="text-3xl mb-1 drop-shadow-lg">{cat.icon}</div>
              <p className={`text-sm font-bold ${activeCategory === cat.name ? "text-blue-700" : "text-gray-700"}`}>{cat.name}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: "calc(100vh - 300px)" }}>
        <Card className="p-8 shadow-3xl rounded-3xl w-full max-w-6xl mx-auto flex justify-center bg-gradient-to-b from-white via-blue-50 to-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
            <TabsList className="flex justify-center mb-8 bg-blue-100 rounded-2xl p-2 shadow-lg">
              <TabsTrigger
                value="all"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-400"
              >
                <FileText className="w-5 h-5" /> All Complaints
                <span className="ml-2 bg-blue-200 text-blue-800 px-2 rounded-full text-sm font-bold shadow-inner">
                  {getComplaintsByRole("all").length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="student"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-400"
              >
                <ClipboardList className="w-5 h-5" /> Student Complaints
                <span className="ml-2 bg-green-200 text-green-800 px-2 rounded-full text-sm font-bold shadow-inner">
                  {getComplaintsByRole("student").length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="staff"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-400"
              >
                <ClipboardList className="w-5 h-5" /> Staff Complaints
                <span className="ml-2 bg-purple-200 text-purple-800 px-2 rounded-full text-sm font-bold shadow-inner">
                  {getComplaintsByRole("staff").length}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* All Complaints Tab */}
            <TabsContent value="all" className="w-full">
              <ComplaintsList 
                complaints={filteredComplaints} 
                onUpdateStatus={updateComplaintStatus}
                onViewDetails={setModalData}
              />
            </TabsContent>

            {/* Student Complaints Tab */}
            <TabsContent value="student" className="w-full">
              <ComplaintsList 
                complaints={filteredComplaints} 
                onUpdateStatus={updateComplaintStatus}
                onViewDetails={setModalData}
              />
            </TabsContent>

            {/* Staff Complaints Tab */}
            <TabsContent value="staff" className="w-full">
              <ComplaintsList 
                complaints={filteredComplaints} 
                onUpdateStatus={updateComplaintStatus}
                onViewDetails={setModalData}
              />
            </TabsContent>
          </Tabs>
        </Card>
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
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${modalData.status === "Pending"
                  ? "bg-orange-100 text-orange-700"
                  : modalData.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                  }`}>
                  {modalData.status}
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
                    : "bg-green-100 text-green-700"
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

// Complaints List Component
function ComplaintsList({ complaints, onUpdateStatus, onViewDetails }) {
  if (complaints.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        No complaints found for the selected category and role.
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-y-auto space-y-4">
      {complaints.map((comp) => (
        <Card
          key={comp.id}
          className="p-5 shadow-3xl rounded-2xl hover:shadow-3xl hover:scale-[1.02] transition-transform duration-150 bg-gradient-to-br from-white via-blue-50 to-white border-2 border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-800 mb-2 drop-shadow">{comp.subject}</h3>
              <p className="text-sm text-gray-600 mb-2">{comp.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500 text-sm font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> {formatDateTimeFull(comp.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {comp.location}
                </span>
                {comp.timeSlot && (
                  <span className="flex items-center gap-1 text-blue-700 font-semibold">
                    <Clock className="w-4 h-4" /> {comp.timeSlot}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${comp.email?.endsWith("@gmail.com")
                  ? "bg-green-100 text-green-700"
                  : "bg-purple-100 text-purple-700"
                }`}>
                  {comp.email?.endsWith("@gmail.com") ? "Student" : "Staff"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 ml-4">
              {/* Status Dropdown */}
              <select
                value={comp.status || "Pending"}
                onChange={(e) => onUpdateStatus(comp.id, e.target.value)}
                className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${
                  comp.status === "Pending"
                    ? "bg-orange-100 text-orange-700 border-orange-300"
                    : comp.status === "In Progress"
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-green-100 text-green-700 border-green-300"
                }`}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
              
              <Button
                variant="outline"
                className="text-blue-600 border-blue-600 rounded-xl hover:bg-blue-100 hover:scale-105 transition-all duration-150 font-semibold shadow text-sm"
                onClick={() => onViewDetails(comp)}
              >
                <Info className="w-4 h-4 mr-1" /> Details
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

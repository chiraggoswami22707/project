  "use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  MapPin,
  User,
  LogOut,
  FileText,
  ClipboardList,
  X,
  Clock,
  Trash2,
  Repeat,
  Info,
  ChevronDown,
  Settings,
  Key,
  Bell,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import autoAssignPriority from "@/utils/autoAssignPriority";
import useRoomData from "@/lib/useRoomData";
import "tippy.js/dist/tippy.css";

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
  { name: "Electrical", icon: "⚡", desc: "Issues related to lights, fuses, wiring, switches, sockets, and electrical failures." },
  { name: "Plumbing", icon: "🚰", desc: "Problems like leaks, broken taps, clogged pipes, water supply issues, or drainage." },
  { name: "Cleaning", icon: "🧹", desc: "Cleaning requests for rooms, halls, bathrooms, or any common area." },
  { name: "Security", icon: "🛡️", desc: "Concerns related to guards, locks, lost keys, cameras, unauthorized access, safety." },
  { name: "Internet", icon: "🌐", desc: "Connectivity issues with Wi-Fi, LAN, internet speed, access, or technical problems." },
  { name: "Parking", icon: "🚗", desc: "Parking slot allocation, vehicle management, unauthorized parking, lot maintenance." },
  { name: "Vehicle", icon: "🚗", desc: "Campus vehicle maintenance, breakdowns, repairs, servicing, transport-related issues." },
  { name: "Other", icon: "❓", desc: "Any miscellaneous issue not fitting above categories; describe clearly." },
];

const keywords = {
  high: ["urgent", "immediate", "asap", "critical", "emergency"],
  medium: ["important", "needs attention", "moderate"],
  low: ["minor", "trivial", "not urgent"],
};

const notifyMaintenanceTeam = async (complaint) => {
  // Placeholder for notification logic
  console.log("Maintenance notified:", complaint);
};

export default function StaffDashboard() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [reopenedComplaints, setReopenedComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [modalData, setModalData] = useState(null);
  const [confirmationData, setConfirmationData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [reopenModal, setReopenModal] = useState({ open: false, complaint: null });
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [userRole, setUserRole] = useState("staff");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Use room data hook
  const { data: roomData, loading: roomLoading, error: roomError } = useRoomData();


  // Room selection state
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [buildingSearch, setBuildingSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Refs for dropdowns to detect outside clicks
  const buildingDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Close one dropdown when the other opens
  const toggleBuildingDropdown = () => {
    setShowBuildingDropdown((prev) => {
      if (!prev) setShowLocationDropdown(false);
      return !prev;
    });
  };

  const toggleLocationDropdown = () => {
    setShowLocationDropdown((prev) => {
      if (!prev) setShowBuildingDropdown(false);
      return !prev;
    });
  };

  // AUTH: set user email, userName, and role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || user.email?.split("@")[0]);
        if (user.email.endsWith("@staff.com")) {
          setUserRole("staff");
        } else {
          // Redirect non-staff users
          window.location.href = "/login";
        }
      } else {
        setUserEmail("");
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        buildingDropdownRef.current &&
        !buildingDropdownRef.current.contains(event.target)
      ) {
        setShowBuildingDropdown(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Debounce helper
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    return debouncedValue;
  }

  // Debounced search inputs
  const debouncedBuildingSearch = useDebounce(buildingSearch, 300);
  const debouncedLocationSearch = useDebounce(locationSearch, 300);

  // Fetch complaints by this staff member
  useEffect(() => {
    if (!userEmail) return;
    const fetchComplaints = async () => {
      const q = query(
        collection(db, "complaints"),
        where("email", "==", userEmail)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => {
        const complaintData = doc.data();
        return {
          id: doc.id,
          ...complaintData,
          createdAt:
            complaintData.createdAt && complaintData.createdAt.toDate
              ? complaintData.createdAt.toDate()
              : complaintData.createdAt || null,
          reopenedAt:
            complaintData.reopenedAt && complaintData.reopenedAt.toDate
              ? complaintData.reopenedAt.toDate()
              : complaintData.reopenedAt || null,
        };
      });
      
      // Sort complaints by creation date (most recent first)
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setComplaints(sortedData.filter((c) => c.status !== "Reopened"));
      
      // Sort reopened complaints by reopening date (most recent first)
      const sortedReopened = sortedData
        .filter((c) => c.status === "Reopened")
        .sort((a, b) => {
          const dateA = a.reopenedAt instanceof Date ? a.reopenedAt : new Date(a.reopenedAt);
          const dateB = b.reopenedAt instanceof Date ? b.reopenedAt : new Date(b.reopenedAt);
          return dateB - dateA; // Descending order (newest first)
        });
      
      setReopenedComplaints(sortedReopened);
    };
    fetchComplaints();
  }, [userEmail, confirmationData, deleteData, reopenModal]);

  // Real-time notifications for status changes
  useEffect(() => {
    if (!userEmail) return;
    
    const q = query(
      collection(db, "complaints"),
      where("email", "==", userEmail)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const complaint = { id: change.doc.id, ...change.doc.data() };
          const oldComplaint = complaints.find(c => c.id === complaint.id);
          
          if (oldComplaint && oldComplaint.status !== complaint.status) {
            // Add notification for status change
            setNotifications(prev => [
              {
                id: Date.now(),
                message: `Your complaint "${complaint.subject}" status changed to ${complaint.status}`,
                type: "status_change",
                timestamp: new Date(),
                read: false
              },
              ...prev
            ]);
          }
        }
      });
    });
    
    return () => unsubscribe();
  }, [userEmail, complaints]);

  // Complaint submission (without time slots)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const complaintData = {
      subject: formData.get("subject"),
      building: formData.get("building"),
      location: formData.get("location"),
      description: formData.get("description"),
      category: activeCategory,
      priority: autoAssignPriority(formData.get("description"), keywords),
      status: "Pending",
      createdAt: new Date().toISOString(),
      email: userEmail,
      userName: userName,
      userType: "staff" // Mark as staff complaint
    };

    // Validate building and location against room data if available
    if (roomData && !roomLoading && !roomError) {
      if (!roomData.buildings.includes(complaintData.building)) {
        alert("Invalid building/hostel name. Please select a valid building or hostel.");
        return;
      }
      const roomsInBuilding = roomData.roomsByBuilding[complaintData.building] || [];
      const locationValid = roomsInBuilding.some(
        (room) => room.roomNo === complaintData.location || room.fullName === complaintData.location
      );
      if (!locationValid) {
        alert("Invalid room/location. Please select a valid room in the selected building or hostel.");
        return;
      }
    }

    try {
      const docRef = await addDoc(collection(db, "complaints"), complaintData);

      const confirmationComplaint = {
        id: docRef.id,
        ...complaintData,
        createdAt: new Date(),
      };

      setComplaints((prev) => [confirmationComplaint, ...prev]);
      setConfirmationData(confirmationComplaint);
      
      // Add submission notification
      setNotifications(prev => [
        {
          id: Date.now(),
          message: `Complaint "${complaintData.subject}" submitted successfully`,
          type: "submission",
          timestamp: new Date(),
          read: false
        },
        ...prev
      ]);
      
      await notifyMaintenanceTeam(confirmationComplaint);
    } catch (err) {
      alert("Failed to submit complaint. " + err.message);
    }

    e.target.reset();
    setActiveCategory(null);
  };

  // Delete handling
  const handleDelete = async (comp) => {
    setDeleteConfirm(comp);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteDoc(doc(db, "complaints", deleteConfirm.id));
      setComplaints((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      setDeleteData(deleteConfirm);
      setDeleteConfirm(null);
    }
  };
  const cancelDelete = () => setDeleteConfirm(null);

  const showReopenModal = (comp) => {
    setReopenModal({ open: true, complaint: comp });
  };
  const closeReopenModal = () => setReopenModal({ open: false, complaint: null });

  const handleReopen = async (note) => {
    const comp = reopenModal.complaint;
    if (!comp) return;
    const complaintRef = doc(db, "complaints", comp.id);
    await updateDoc(complaintRef, {
      status: "Reopened",
      reopenedAt: serverTimestamp(),
      reopenedNote: note,
    });
    await notifyMaintenanceTeam({ ...comp, status: "Reopened", reopenedNote: note });
    closeReopenModal();
  };

  const handleViewDetails = (comp) => setModalData(comp);

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

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Room selection handlers
  const handleBuildingChange = (building) => {
    setSelectedBuilding(building);
    setSelectedLocation(""); // Reset location when building changes
    setShowBuildingDropdown(false);
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  // Filter buildings based on search
  const filteredBuildings = roomData && roomData.buildings
    ? roomData.buildings.filter(building =>
        building.toLowerCase().includes(debouncedBuildingSearch.toLowerCase())
      )
    : [];

  // Filter locations based on selected building and search
  const filteredLocations = selectedBuilding && roomData && roomData.roomsByBuilding[selectedBuilding]
    ? roomData.roomsByBuilding[selectedBuilding].filter(room =>
        room.roomNo.toLowerCase().includes(debouncedLocationSearch.toLowerCase()) ||
        room.fullName.toLowerCase().includes(debouncedLocationSearch.toLowerCase())
      )
    : [];

  // AUTH GUARD
  if (userRole !== "staff") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 shadow-3xl text-center text-xl text-red-700 font-bold bg-white/80 rounded-2xl">
          Access Denied: Staff dashboard is only available for staff members.
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-10 w-full max-w-6xl bg-white p-4 rounded-2xl shadow-3xl">
        <h1 className="text-3xl font-extrabold text-blue-700 drop-shadow-2xl">
          Graphic Era Hill University – Staff Dashboard
        </h1>
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="outline"
              className="relative rounded-xl hover:bg-blue-100 transition-all duration-150"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl z-50 w-80 max-h-96 overflow-y-auto border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold">Notifications</h3>
                  <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                    Clear All
                  </Button>
                </div>
                <div className="p-2">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No notifications</p>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTimeFull(notification.timestamp)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
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
            onClick={() =>
              signOut(auth).then(() => (window.location.href = "/login"))
            }
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <Card className="w-full max-w-sm p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setShowChangePassword(false)}
            />
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-blue-700 drop-shadow-lg">
              <Key className="w-6 h-6" /> Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <Input
                type="password"
                name="currentPassword"
                placeholder="Enter current password"
                required
                className="rounded-lg shadow-inner"
              />
              <Input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                required
                minLength={6}
                className="rounded-lg shadow-inner"
              />
              {passwordChangeError && (
                <div className="text-sm text-red-600">{passwordChangeError}</div>
              )}
              {passwordChangeSuccess && (
                <div className="text-sm text-green-600">{passwordChangeSuccess}</div>
              )}
              <div className="flex gap-4 justify-end mt-2">
                <Button variant="outline" onClick={() => setShowChangePassword(false)}
                  className="rounded-xl font-semibold shadow hover:scale-105 hover:bg-blue-100 transition-all duration-150">
                  Cancel
                </Button>
                <Button type="submit"
                  className="rounded-xl font-bold shadow bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:scale-105 hover:from-blue-700 hover:to-blue-500 transition-all duration-150">
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: "calc(100vh - 200px)" }}>
        <Card className="p-8 shadow-3xl rounded-3xl w-full max-w-5xl mx-auto flex justify-center bg-gradient-to-b from-white via-blue-50 to-white">
          <Tabs defaultValue="submit" className="w-full flex flex-col items-center">
            <TabsList className="flex justify-center mb-8 bg-blue-100 rounded-2xl p-2 shadow-lg">
              <TabsTrigger
                value="submit"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-400"
              >
                <FileText className="w-5 h-5" /> Submit Complaint
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-400"
              >
                <ClipboardList className="w-5 h-5" /> My Complaints
                <span className="ml-2 bg-blue-200 text-blue-800 px-2 rounded-full text-sm font-bold shadow-inner">{complaints.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="reopened"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-violet-500 hover:to-violet-400"
              >
                <Repeat className="w-5 h-5" /> Reopened Complaints
                <span className="ml-2 bg-violet-200 text-violet-800 px-2 rounded-full text-sm font-bold shadow-inner">{reopenedComplaints.length}</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Submit Complaint Form */}
            <TabsContent value="submit" className="w-full">
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-7 max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-4">
                  {categories.filter(cat => cat.name !== "Vehicle" && cat.name !== "Parking").map((cat) => (
                    <Card
                      key={cat.name}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`cursor-pointer p-7 text-center shadow-3xl border-[2.5px] transition-all duration-200 hover:scale-[1.08] hover:shadow-3xl hover:bg-gradient-to-br hover:from-blue-100 hover:to-white ${activeCategory === cat.name
                        ? "border-blue-600 bg-blue-50 shadow-3xl"
                        : "border-gray-200"
                        }`}
                      style={{
                        borderRadius: "2rem",
                        boxShadow: activeCategory === cat.name
                          ? "0 4px 24px 0 rgba(30,64,175,0.18)"
                          : "0 2px 8px 0 rgba(30,64,175,0.09)",
                        transform: activeCategory === cat.name ? "scale(1.08)" : "scale(1)"
                      }}
                    >
                      <div className="text-5xl mb-2 drop-shadow-lg">{cat.icon}</div>
                      <p className={`text-base font-bold mt-2 mb-2 ${activeCategory === cat.name ? "text-blue-700" : "text-gray-700"}`}>{cat.name}</p>
                      <p className="text-xs text-gray-500">{cat.desc}</p>
                    </Card>
                  ))}
                </div>
                <Input name="subject" placeholder="Subject" required className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150" />

                {/* Building Selection */}
                <div className="relative">
                  <div
                    className="w-full p-3 rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150 cursor-pointer flex justify-between items-center"
                    onClick={() => setShowBuildingDropdown(!showBuildingDropdown)}
                  >
                    <span className={selectedBuilding ? "text-gray-900" : "text-gray-500"}>
                      {selectedBuilding || "Select Building/Department"}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showBuildingDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  {showBuildingDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 max-h-60 overflow-y-auto">
                      <div className="p-2">
                <Input
                  placeholder="Search buildings..."
                  value={buildingSearch}
                  onChange={(e) => setBuildingSearch(e.target.value)}
                  className="mb-2 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Search buildings"
                />
                {buildingSearch && (
                  <button
                    aria-label="Clear building search"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBuildingSearch("");
                    }}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    &#x2715;
                  </button>
                )}
                {filteredBuildings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4" role="alert" aria-live="polite">No buildings found</p>
                ) : (
                  filteredBuildings.map((building) => (
                    <div
                      key={building}
                      className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors"
                      onClick={() => handleBuildingChange(building)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleBuildingChange(building);
                        }
                      }}
                      role="option"
                      aria-selected={selectedBuilding === building}
                    >
                      {building}
                    </div>
                  ))
                )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Selection */}
                <div className="relative">
                  <div
                    className={`w-full p-3 rounded-xl shadow-inner transition-all duration-150 cursor-pointer flex justify-between items-center ${
                      selectedBuilding ? 'bg-white/60 hover:bg-blue-50' : 'bg-gray-100 cursor-not-allowed'
                    }`}
                    onClick={() => selectedBuilding && setShowLocationDropdown(!showLocationDropdown)}
                  >
                    <span className={selectedLocation ? "text-gray-900" : "text-gray-500"}>
                      {selectedLocation || (selectedBuilding ? "Select Specific Location" : "Select building first")}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  {showLocationDropdown && selectedBuilding && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 max-h-60 overflow-y-auto">
                      <div className="p-2">
                <Input
                  placeholder="Search locations..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="mb-2 rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Search locations"
                />
                {locationSearch && (
                  <button
                    aria-label="Clear location search"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocationSearch("");
                    }}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    &#x2715;
                  </button>
                )}
                {filteredLocations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4" role="alert" aria-live="polite">No locations found</p>
                ) : (
                  filteredLocations.map((room) => (
                    <div
                      key={`${room.roomNo}-${room.fullName}`}
                      className="p-3 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors"
                      onClick={() => handleLocationChange(room.fullName)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleLocationChange(room.fullName);
                        }
                      }}
                      role="option"
                      aria-selected={selectedLocation === room.fullName}
                    >
                      <div className="font-medium">{room.fullName}</div>
                    </div>
                  ))
                )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hidden inputs for form submission */}
                <input type="hidden" name="building" value={selectedBuilding} />
                <input type="hidden" name="location" value={selectedLocation} />
                <Textarea
                  name="description"
                  placeholder="Detailed Description of the Issue"
                  required
                  className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150"
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 hover:scale-105 font-bold text-lg rounded-2xl shadow-lg transition-all duration-150"
                >
                  Submit Complaint
                </Button>
              </form>
            </TabsContent>
            
            {/* My Complaints List */}
            <TabsContent value="list" className="w-full">
              <div className="max-h-[500px] overflow-y-auto space-y-6">
                {complaints.map((comp) => (
                  <Card
                    key={comp.id}
                    className="p-5 shadow-3xl rounded-2xl hover:shadow-3xl hover:scale-[1.04] transition-transform duration-150 bg-gradient-to-br from-white via-blue-50 to-white border-2 border-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-blue-800 mb-2 drop-shadow">{comp.subject}</h3>
                        <p className="text-sm text-gray-600 mb-1">{comp.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {formatDateTimeFull(comp.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {comp.location}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-blue-700">
                          Staff Complaint
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-4 py-1 rounded-full text-sm font-bold shadow-inner ${comp.priority === "High"
                            ? "bg-red-100 text-red-700"
                            : comp.priority === "Medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                            }`}
                          title={`Priority: ${comp.priority}`}
                        >
                          {comp.priority} Priority
                        </span>
                        <span
                          className={`px-4 py-1 rounded-full text-sm font-bold ${comp.status === "Pending"
                            ? "bg-orange-100 text-orange-700"
                            : comp.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                            }`}
                        >
                          {comp.status}
                        </span>
                        {comp.status === "Resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-violet-600 border-violet-600 rounded-xl hover:bg-violet-100 hover:scale-105 transition-all duration-150 font-semibold shadow"
                            onClick={() => showReopenModal(comp)}
                          >
                            <Repeat className="w-4 h-4" /> Reopen Complaint
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl hover:bg-red-600 text-white hover:scale-105 transition-all duration-150 font-semibold shadow flex items-center gap-1"
                          onClick={() => handleDelete(comp)}
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-3 text-blue-600 border-blue-600 rounded-xl hover:bg-blue-100 hover:scale-105 transition-all duration-150 font-semibold shadow"
                      onClick={() => handleViewDetails(comp)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Reopened Complaints */}
            <TabsContent value="reopened" className="w-full">
              <div className="max-h-[500px] overflow-y-auto space-y-6">
                {reopenedComplaints.length === 0 && (
                  <div className="text-center text-gray-400 py-10">No reopened complaints yet.</div>
                )}
                {reopenedComplaints.map((comp) => (
                  <Card
                    key={comp.id}
                    className="p-5 shadow-3xl border-violet-600 border-2 rounded-2xl hover:shadow-3xl hover:scale-[1.04] transition-transform duration-150 bg-gradient-to-br from-white via-violet-50 to-white"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-violet-700 mb-2 drop-shadow">{comp.subject}</h3>
                        <p className="text-sm text-gray-600 mb-1">{comp.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {formatDateTimeFull(comp.createdAt)} (Original)
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat className="w-4 h-4" /> {formatDateTimeFull(comp.reopenedAt)} (Reopened)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {comp.location}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className={`px-4 py-1 rounded-full text-sm font-bold shadow-inner ${comp.status === "Reopened"
                            ? "bg-violet-100 text-violet-700"
                            : comp.status === "Resolved"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}>
                            {comp.status}
                          </span>
                        </div>
                        {comp.reopenedNote && (
                          <div className="mt-2 text-violet-700 text-sm flex items-start gap-2">
                            <Info className="w-4 h-4" />
                            <span>
                              <strong>Reopen Reason:</strong> {comp.reopenedNote}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-3 text-violet-600 border-violet-600 rounded-xl hover:bg-violet-100 hover:scale-105 transition-all duration-150 font-semibold shadow"
                      onClick={() => handleViewDetails(comp)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
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
              <p><strong>Subject:</strong> {modalData.subject}</p>
              <p><strong>Category:</strong> {modalData.category}</p>
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
              <p><strong>Status:</strong> 
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${modalData.status === "Pending"
                  ? "bg-orange-100 text-orange-700"
                  : modalData.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : modalData.status === "Resolved"
                      ? "bg-green-100 text-green-700"
                      : "bg-violet-100 text-violet-700"
                  }`}>
                  {modalData.status}
                </span>
              </p>
              <p><strong>Building:</strong> {modalData.building}</p>
              <p><strong>Location:</strong> {modalData.location}</p>
              <p><strong>Description:</strong> {modalData.description}</p>
              <p><strong>Submitted:</strong> {formatDateTimeFull(modalData.createdAt)}</p>
              {modalData.reopenedAt && (
                <p><strong>Reopened:</strong> {formatDateTimeFull(modalData.reopenedAt)}</p>
              )}
              {modalData.reopenedNote && (
                <p><strong>Reopen Reason:</strong> {modalData.reopenedNote}</p>
              )}
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

      {/* Confirmation Modal */}
      {confirmationData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-lg p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-green-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setConfirmationData(null)}
            />
            <h2 className="text-2xl font-extrabold mb-4 text-green-700 drop-shadow-lg">
              Complaint Submitted Successfully!
            </h2>
            <p className="mb-2"><strong>Subject:</strong> {confirmationData.subject}</p>
            <p className="mb-2"><strong>Category:</strong> {confirmationData.category}</p>
            <p className="mb-2"><strong>Priority:</strong> {confirmationData.priority}</p>
            <p className="mb-2"><strong>Building:</strong> {confirmationData.building}</p>
            <p className="mb-2"><strong>Location:</strong> {confirmationData.location}</p>
            <p className="mb-2">
              <strong>Status:</strong>{" "}
              <span className={`px-2 py-1 rounded-full ${confirmationData.status === "Resolved"
                ? "bg-green-100 text-green-700"
                : confirmationData.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-blue-100 text-blue-700"
                }`}>
                {confirmationData.status}
              </span>
            </p>
            <Button
              onClick={() => setConfirmationData(null)}
              className="mt-4 bg-gradient-to-r from-green-600 to-green-400 text-white hover:from-green-700 hover:to-green-500 rounded-2xl font-bold shadow-lg"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-md p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-red-50 to-white animate-scaleIn">
            <h2 className="text-xl font-extrabold mb-4 text-red-700 drop-shadow-lg">
              Confirm Deletion
            </h2>
            <p className="mb-4">Are you sure you want to delete the complaint "{deleteConfirm.subject}"?</p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={cancelDelete}
                className="rounded-xl font-semibold shadow hover:scale-105 hover:bg-gray-100 transition-all duration-150"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="rounded-xl font-bold shadow bg-gradient-to-r from-red-600 to-red-400 text-white hover:scale-105 hover:from-red-700 hover:to-red-500 transition-all duration-150"
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reopen Complaint Modal */}
      {reopenModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-md p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-violet-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={closeReopenModal}
            />
            <h2 className="text-xl font-extrabold mb-4 text-violet-700 drop-shadow-lg">
              Reopen Complaint
            </h2>
            <p className="mb-4">Please provide a reason for reopening "{reopenModal.complaint.subject}":</p>
            <Textarea
              placeholder="Reason for reopening..."
              className="mb-4 rounded-xl"
              id="reopenNote"
            />
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={closeReopenModal}
                className="rounded-xl font-semibold shadow hover:scale-105 hover:bg-violet-100 transition-all duration-150"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const note = document.getElementById('reopenNote').value;
                  handleReopen(note);
                }}
                className="rounded-xl font-bold shadow bg-gradient-to-r from-violet-600 to-violet-400 text-white hover:scale-105 hover:from-violet-700 hover:to-violet-500 transition-all duration-150"
              >
                Reopen
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

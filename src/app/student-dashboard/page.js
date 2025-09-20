"use client";

import { useState, useEffect } from "react";
import { db, auth, storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import autoAssignPriority from "@/utils/autoAssignPriority";
import "tippy.js/dist/tippy.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ProfileCard from "@/components/ProfileCard";
import useRoomData from "@/lib/useRoomData";

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
  }
  else {
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

// Predefined time slots with AM/PM format
const timeSlots = [
  "9-10 AM", "10-11 AM", "11-12 AM", "12-1 PM", "1-2 PM", "2-3 PM",
  "3-4 PM", "4-5 PM", "5-6 PM", "6-7 PM", "7-8 PM"
];

// Function to check if current time is within allowed submission slots
function isWithinSubmissionTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Define allowed slots as [startHour, startMin, endHour, endMin]
  const allowedSlots = [
    [9, 0, 10, 0], // 9-10 AM
    [10, 0, 11, 0], // 10-11 AM
    [11, 0, 12, 0], // 11-12 AM
    [12, 0, 13, 0], // 12-1 PM
    [13, 0, 14, 0], // 1-2 PM
    [15, 0, 16, 0], // 3-4 PM
    [18, 0, 19, 0], // 6-7 PM
    // Add more as needed
  ];

  return allowedSlots.some(([sh, sm, eh, em]) => {
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const current = currentHour * 60 + currentMinute;
    return current >= start && current < end;
  });
}

const highPriorityKeywords = ["urgent", "immediate", "asap", "critical", "emergency", "apark", "broken", "leak"];

const keywords = {
  high: ["urgent", "immediate", "asap", "critical", "emergency"],
  medium: ["important", "needs attention", "moderate"],
  low: ["minor", "trivial", "not urgent"],
};

// Added high priority keywords for detection in description input
const highPriorityKeywordSet = new Set([
  "fire", "spark", "hazard", "safety", "electricity",
  "urgent", "immediate", "asap", "critical", "emergency",
  "apark", "broken", "leak"
]);

const notifyMaintenanceTeam = async (complaint) => {
  // Placeholder for notification logic
  console.log("Maintenance notified:", complaint);
};

export default function StudentDashboard() {
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
  const [userRole, setUserRole] = useState(""); // "student" or "staff"
  const [slotDate, setSlotDate] = useState(null);
  const [slotTime, setSlotTime] = useState("");
  const [allBookedSlots, setAllBookedSlots] = useState([]);
  const [timeSlotError, setTimeSlotError] = useState("");
  const [userType, setUserType] = useState("student"); // Default to student

  // New states for dropdowns
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedRoomObject, setSelectedRoomObject] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // New state to track if complaint is high priority based on description input
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [description, setDescription] = useState("");

  // Use the custom hook to load room data
  const { data: roomData, loading: roomDataLoading, error: roomDataError } = useRoomData();

  // Fix fetch path for roomStore.json to public folder
  useEffect(() => {
    if (roomDataError) {
      console.error("Error loading room data:", roomDataError);
    }
  }, [roomDataError]);

  // AUTH: set user email, userName, and role (student/staff)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || user.email?.split("@")[0]);
        if (user.email.endsWith("@gmail.com")) {
          setUserRole("student");
          setUserType("student");
        } else if (user.email.endsWith("@staff.com")) {
          setUserRole("staff");
          setUserType("staff");
        } else {
          setUserRole("");
          setUserType("");
        }
      } else setUserEmail("");
    });
    return () => unsubscribe();
  }, []);

  // Get user data from localStorage for ProfileCard
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, []);

  // Fetch complaints by this user
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

  // Fetch all booked slots for students
  useEffect(() => {
    if (userRole !== "student") return;
    const fetchAllSlots = async () => {
      const q = query(collection(db, "complaints"));
      const querySnapshot = await getDocs(q);
      const slots = querySnapshot.docs
        .map((doc) => doc.data().timeSlot)
        .filter(Boolean)
        .map((ts) => {
          if (!ts) return null;
          const [date, time] = ts.split(" ");
          return { date, time };
        });
      setAllBookedSlots(slots.filter(Boolean));
    };
    fetchAllSlots();
  }, [userRole, confirmationData]);

  // Handle search input change
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = roomData.allRooms.filter(room =>
        room.building?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.labName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, roomData.allRooms]);

  // Handle suggestion click
  const handleSuggestionClick = (room) => {
    setSelectedBlock(room.building);
    setSelectedRoom(room.roomNo);
    setSelectedRoomObject(room);
    setSearchQuery("");
    setSuggestions([]);
    // Set rooms for the selected building
    setRooms(roomData.roomsByBuilding[room.building] || []);
  };

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Complaint submission
const handleSubmit = async (e) => {
  e.preventDefault();
  setTimeSlotError("");
  const formData = new FormData(e.target);

  if (!selectedRoomObject || !selectedRoomObject.building || !selectedRoomObject.roomNo) {
    alert("Please select a valid building and room.");
    return;
  }

  const descriptionText = formData.get("description")?.toLowerCase() || "";
  // Determine if high priority based on keywords
  const highPriorityDetected = Array.from(highPriorityKeywordSet).some(keyword =>
    descriptionText.includes(keyword)
  );

  const complaintData = {
    subject: formData.get("subject"),
    building: selectedRoomObject.building,
    roomNo: selectedRoomObject.roomNo,
    labName: selectedRoomObject.labName || "",
    location: formData.get("location"),
    description: formData.get("description"),
    category: activeCategory,
    priority: highPriorityDetected ? "High" : "Normal",
    status: "Pending",
    createdAt: serverTimestamp(),
    email: userEmail,
    userType: userType,
  };

  // Student time slot logic
  if (userRole === "student") {
    if (!highPriorityDetected) {
      // Check if current time is within allowed submission slots for normal complaints
      if (!isWithinSubmissionTime()) {
        setTimeSlotError("Complaints can only be submitted during allowed time slots: 9-10 AM, 10-11 AM, 11-12 AM, 12-1 PM, 1-2 PM, 3-4 PM, 6-7 PM.");
        return;
      }
      if (!slotDate || !slotTime) {
        setTimeSlotError("Please select date and time for your slot.");
        return;
      }
      const slotDateStr = formatLocalDate(slotDate); // "YYYY-MM-DD"
      const slotValue = `${slotDateStr} ${slotTime}`;
      // Check if slot is already booked
      const q = query(collection(db, "complaints"));
      const querySnapshot = await getDocs(q);
      const booked = querySnapshot.docs
        .map((doc) => doc.data().timeSlot)
        .filter(Boolean);
      if (booked.includes(slotValue)) {
        setTimeSlotError("This time slot is booked, please choose another.");
        return;
      }
      complaintData.timeSlot = slotValue;
    } else {
      // High priority complaints must select slot but bypass booking check
      if (!slotDate || !slotTime) {
        setTimeSlotError("Please select date and time for your slot.");
        return;
      }
      const slotDateStr = formatLocalDate(slotDate);
      const slotValue = `${slotDateStr} ${slotTime}`;
      complaintData.timeSlot = slotValue;
    }
  }

    try {
      // Upload photo if selected
      if (selectedFile) {
        const timestamp = Date.now();
        const fileRef = ref(storage, `complaintPhotos/${userEmail}/${timestamp}_${selectedFile.name}`);
        await uploadBytes(fileRef, selectedFile);
        const photoUrl = await getDownloadURL(fileRef);
        complaintData.photoUrl = photoUrl;
      }

      const docRef = await addDoc(collection(db, "complaints"), complaintData);

      const confirmationComplaint = {
        id: docRef.id,
        ...complaintData,
        createdAt: new Date(),
      };

      setComplaints((prev) => [confirmationComplaint, ...prev]);
      setConfirmationData(confirmationComplaint);
    } catch (err) {
      alert("Failed to submit complaint. " + err.message);
    }

    e.target.reset();
    setActiveCategory(null);
    setSlotDate(null);
    setSlotTime("");
    setSelectedBlock("");
    setSelectedRoom("");
    setSelectedRoomObject(null);
    setSearchQuery("");
    setSuggestions([]);
    setSelectedFile(null);
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

  // AUTH GUARD
  if (userRole !== "student" && userRole !== "staff" && userRole !== "") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 shadow-3xl text-center text-xl text-red-700 font-bold bg-white/80 rounded-2xl">
          {/* Access Denied message removed */}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-10 w-full max-w-6xl bg-white p-4 rounded-2xl shadow-3xl">
        <h1 className="text-3xl font-extrabold text-blue-700 drop-shadow-2xl">
          Graphic Era Hill University – Student/Staff Dashboard
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

      {/* Main Content Container */}
      <div className="w-full flex flex-col items-center">
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
                {/* Search Input */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search building, room, or lab"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150"
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                      {suggestions.map((room) => (
                        <li
                          key={`${room.building}-${room.roomNo}`}
                          onClick={() => handleSuggestionClick(room)}
                          className="p-2 hover:bg-blue-50 cursor-pointer"
                        >
                          {room.building} - {room.roomNo} - {room.labName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Building Dropdown */}
                <select
                  name="building"
                  value={selectedBlock}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedBlock(val);
                    setRooms(roomData.roomsByBuilding[val] || []);
                    setSelectedRoom("");
                    setSelectedRoomObject(null);
                  }}
                  className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150 p-3"
                  disabled={roomDataLoading || roomDataError}
                >
                  <option value="">Select Building</option>
                  {roomData.buildings.map((building, index) => (
                    <option key={`${building}-${index}`} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
                {/* Room Dropdown */}
                <select
                  name="room"
                  value={selectedRoom}
                  onChange={(e) => {
                    const roomNo = e.target.value;
                    setSelectedRoom(roomNo);
                    const room = rooms.find(r => r.roomNo === roomNo);
                    setSelectedRoomObject(room);
                  }}
                  className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150 p-3"
                  disabled={!rooms.length}
                >
                  <option value="">Select Room</option>
                  {rooms.map((room, index) => (
                    <option key={`${room.roomNo}-${index}`} value={room.roomNo}>
                      {room.fullName}
                    </option>
                  ))}
                </select>
                {/* Removed Specific Location input as per request */}
                <Textarea
                  name="description"
                  placeholder="Detailed Description"
                  required
                  className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150"
                  value={description}
                  onChange={(e) => {
                    const desc = e.target.value;
                    setDescription(desc);
                    const highPriorityDetected = Array.from(highPriorityKeywordSet).some(keyword =>
                      desc.toLowerCase().includes(keyword)
                    );
                    setIsHighPriority(highPriorityDetected);
                    if (highPriorityDetected) {
                      setTimeSlotError("");
                    }
                  }}
                />
                <div>
                  <label className="block text-blue-700 font-bold mb-2">Upload Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full p-3 rounded-xl border border-gray-300 shadow-inner"
                  />
                </div>
                {/* Student time slot PICKER (Date + Time) */}
                {userRole === "student" && (
                  <div>
                    <label className="block text-blue-700 font-bold mb-2">Select Date</label>
                    <DatePicker
                      selected={slotDate}
                      onChange={(date) => {
                        setSlotDate(date);
                        setTimeSlotError("");
                      }}
                      minDate={new Date()}
                      filterDate={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const maxDate = new Date(today);
                        // High-priority complaints can select dates up to 7 weeks (49 days)
                        // Normal complaints are limited to 7 days
                        const maxDays = isHighPriority ? 49 : 6;
                        maxDate.setDate(today.getDate() + maxDays);
                        return date >= today && date <= maxDate;
                      }}
                      className="w-full p-3 rounded-xl border border-gray-300 shadow-inner"
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Pick a date"
                      required
                    />
                    <label className="block text-blue-700 font-bold mb-2 mt-3">Select Time</label>
                    <select
                      value={slotTime}
                      onChange={e => {
                        setSlotTime(e.target.value);
                        setTimeSlotError("");
                      }}
                      className="w-full p-3 rounded-xl border border-gray-300 shadow-inner"
                      required
                    >
                      <option value="">Select a time slot</option>
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {timeSlotError && (
                      <div className="text-red-600 text-sm font-semibold mt-1">{timeSlotError}</div>
                    )}
                    {/* Slot availability info - only show for normal complaints */}
                    {!isHighPriority && slotDate && slotTime && allBookedSlots.some(
                      slot =>
                        slot.date === slotDate.toISOString().slice(0, 10) &&
                        slot.time === slotTime
                    ) && (
                        <div className="text-red-600 text-sm font-semibold mt-1">
                          This time slot is already booked. Please select another.
                        </div>
                      )}
                  </div>
                )}
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
                        {comp.timeSlot && (
                          <div className="flex items-center gap-1 text-blue-700 font-semibold text-sm mt-1">
                            <Clock className="w-4 h-4" /> Slot: {comp.timeSlot} (Booked)
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl hover:bg-red-600 text-white hover:scale-105 transition-all duration-150 font-semibold shadow flex items-center gap-1"
                            onClick={() => handleDelete(comp)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold shadow-inner ${comp.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : comp.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                              }`}
                            title={`Priority: ${comp.priority}`}
                          >
                            {comp.priority}
                          </span>
                        </div>
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
                        {comp.timeSlot && (
                          <div className="flex items-center gap-1 text-blue-700 font-semibold text-sm mt-1">
                            <Clock className="w-4 h-4" /> Slot: {comp.timeSlot} (Booked)
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-xl hover:bg-red-600 text-white hover:scale-105 transition-all duration-150 font-semibold shadow flex items-center gap-1"
                            onClick={() => handleDelete(comp)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-inner bg-violet-100 text-violet-700`}>
                            {comp.status}
                          </span>
                        </div>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50 p-4">
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
              <p><strong>Room:</strong> {modalData.roomNo || "N/A"}</p>
              <p><strong>Description:</strong> {modalData.description}</p>
              {modalData.photoUrl && (
                <div className="mt-4">
                  <strong>Uploaded Photo:</strong>
                  <img src={modalData.photoUrl} alt="Uploaded complaint" className="mt-2 max-w-full rounded-lg shadow-md" />
                </div>
              )}
              <p><strong>Submitted:</strong> {formatDateTimeFull(modalData.createdAt)}</p>
              {modalData.timeSlot && (
                <p><strong>Time Slot:</strong> {modalData.timeSlot} (Booked)</p>
              )}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-md p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-red-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={cancelDelete}
            />
            <h2 className="text-2xl font-extrabold mb-4 text-red-700 drop-shadow-lg flex items-center gap-2">
              <Trash2 className="w-6 h-6" /> Delete Complaint
            </h2>
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete this complaint? This action cannot be undone.
            </p>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">{deleteConfirm.subject}</p>
              <p className="text-sm text-gray-600 mt-1">{deleteConfirm.description}</p>
            </div>
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={cancelDelete}
                className="rounded-xl font-semibold shadow hover:scale-105 hover:bg-gray-100 transition-all duration-150"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="rounded-xl font-bold shadow bg-gradient-to-r from-red-600 to-red-400 text-white hover:scale-105 hover:from-red-700 hover:to-red-500 transition-all duration-150"
              >
                Delete Complaint
              </Button>
            </div>
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
            <p className="mb-2"><strong>Complaint ID:</strong> {confirmationData.id}</p>
            <p className="mb-2"><strong>Subject:</strong> {confirmationData.subject}</p>
            <p className="mb-2"><strong>Category:</strong> {confirmationData.category}</p>
            <p className="mb-2"><strong>Priority:</strong> {confirmationData.priority}</p>
            <p className="mb-2"><strong>Building:</strong> {confirmationData.building}</p>
            <p className="mb-2"><strong>Room:</strong> {confirmationData.roomNo || "N/A"}</p>
            <p className="mb-2"><strong>Description:</strong> {confirmationData.description}</p>
            {confirmationData.photoUrl && (
              <div className="mb-2">
                <strong>Uploaded Photo:</strong>
                <img src={confirmationData.photoUrl} alt="Uploaded complaint" className="mt-1 max-w-full rounded-lg shadow-md" />
              </div>
            )}
            {confirmationData.timeSlot && (
              <p className="mb-2"><strong>Time Slot:</strong> {confirmationData.timeSlot} (Booked)</p>
            )}
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
    </div>
  );
}
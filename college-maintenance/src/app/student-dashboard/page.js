"use client";

import { useState, useEffect } from "react";
import { db, storage, auth } from "@/firebase/config";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import autoAssignPriority from "@/utils/autoAssignPriority";

// Complaint Categories
const categories = [
  { name: "Electrical", icon: "⚡", desc: "Issues related to lights, fuses, wiring, switches, sockets, and electrical failures." },
  { name: "Plumbing", icon: "🚰", desc: "Problems like leaks, broken taps, clogged pipes, water supply issues, or drainage." },
  { name: "Cleaning", icon: "🧹", desc: "Cleaning requests for rooms, halls, bathrooms, or any common area." },
  { name: "Security", icon: "🛡️", desc: "Concerns related to guards, locks, lost keys, cameras, unauthorized access, safety." },
  { name: "Internet", icon: "🌐", desc: "Connectivity issues with Wi-Fi, LAN, internet speed, access, or technical problems." },
  { name: "Parking", icon: "🅿️", desc: "Parking slot allocation, vehicle management, unauthorized parking, lot maintenance." },
  { name: "Vehicle", icon: "🚗", desc: "Campus vehicle maintenance, breakdowns, repairs, servicing, transport-related issues." },
  { name: "Other", icon: "❓", desc: "Any miscellaneous issue not fitting above categories; describe clearly." },
];

// Keywords (your expanded version)
const keywords = {
  high: [
    "fire","short circuit","shock","bijli chali gayi","power outage","electrocution","danger","live wire","sparking","explosion","urgent","kaam nahi kar raha","down","faulty wiring","bijli ka fault","bijli ka khatra","immediate attention","emergency","switch board problem","circuit fuse","electricity ka issue","overload","sparking wire","light ja rahi hai","light nahi aa rahi","blackout","current leak","wire gir gaya","socket mein problem",
    "leak","burst pipe","flood","overflow","gas leak","contamination","paani nahi aa raha","blocked drain","sewage","piping ka leakage","piping burst","dangerous leak","water leakage","pipe crack","bathroom flood","toilet overflow","bathroom leak","urinal blocked","water pollution","pipe gir gaya","sewage spill","choked drain","emergency plumbing","paani leak se damage",
    "pest","insect","rodent","health hazard","filthy","spill","garbage overflow","gandagi","safai ki urgent problem","contamination","bimari ka risk","cockroach","mosquito","snake","rats","unhygienic","mold","strong smell","vomit","dangerous dirt","chemical spill","blocked dustbin","biohazard","waste pile",
    "break-in","fire hazard","fall","accident","structural damage","collapse","khatra","girne ka risk","tod-phod","railing broken","stairs damage","elevator problem","lock broken","open wiring","hole on floor","slippery","cracked wall","ceiling leak","building hazard","immediate fix",
    "spoiled food","unhygienic","contamination","vomit","food poisoning","expired food","unsafe","cockroach in food","dirty kitchen","fire in kitchen","kitchen accident",
    "room not available","no water","no electricity","bed bugs","theft","overcrowded","lock not working","fire hazard","urgent","no food","safety issue",
    "exam date clash","result not declared","paper leak","unfair evaluation","grade dispute","unfair marking","cheating","plagiarism","academic misconduct","suspension","unfair treatment","urgent",
    "projector not working","system crash","computer down","internet not working","lab equipment failure","smart board not responding","class cannot start","software crash","server down","printer jam","network down","UPS failure","electricity outage in lab","lab accident","machine breakdown","lab chemical spill","fume hood broken","immediate replacement required","classroom emergency","AC not working","fan stopped","roof leak","slippery floor","window broken",
    "WiFi down","slow LAN","e-learning portal down","login not working","portal down","database failure","VPN not working"
  ],
  medium: [
    "flickering","intermittent","voltage fluctuation","socket not working","slow internet","unstable connection","cable issue","router problem","internet down","speed kam","connection weak","light dim","fan slow","AC slow","charger issue","wifi disconnect","router restart","electricity kabhi aa rahi kabhi nahi","minor wiring problem","surge issue","connection unstable",
    "slow drain","dripping tap","minor leakage","low pressure","pipe repair","clogged sink","faucet issue","pipe leak","paani slow","tap ka problem","repair required","minor clog","shower problem","sink ka flow kam","bathroom dripping","flush problem","minor pipe crack","leak check","small leak","bathroom tap slow","minor clogging","water flow kam",
    "dust","stains","minor cleaning","trash","sweeping","spill cleaning","smell","dhool","thodi gandagi","minor cleaning required","paper garbage","floor cleaning","desk dust","table cleaning","corridor cleaning","water spill","minor smell","minor mop","minor sweep",
    "loose railing","damaged lock","minor crack","gate issue","security camera problem","door issue","thodi damage","minor fix","small crack","minor railing repair","minor lock issue","camera not working","small structural concern","gate repair","door alignment","window fix",
    "cold food","stale","less taste","slow service","minor complaint","menu issue","water refill problem","plate breakage","minor kitchen hygiene",
    "room sharing","noisy roommates","cleanliness issue","maintenance required","water supply irregular","power backup issue","minor repairs needed","AC not working","fan not working","bathroom issue",
    "attendance issue","timetable issue","syllabus mismatch","study material not provided","class cancellation","faculty not available","internal assessment issue","viva problem","project issue","minor academic concern",
    "slow internet","intermittent connectivity","minor software glitch","minor projector issue","printer low toner","lab equipment needs calibration","computer slow","minor network issue","minor setup problem","lab instrument issue","minor display issue","fan not working in classroom","air conditioning issue","attendance portal slow","minor timetable error","submission portal intermittent","minor database lag","faculty login issue","partial grade entry issue","minor student query backlog","assignment portal delay",
    "minor equipment calibration","lab tool misalignment","software update required","lab cleaning needed","minor instrument maintenance","temporary shortage of lab equipment",
    "minor lighting issue","minor fan issue","minor AC problem","whiteboard marker shortage","minor chair/desk repair","minor window issue","minor cleaning needed",
    "intermittent internet","minor network lag","system slow","minor software issue","VPN slow","minor login glitch","email delay","portal slow"
  ],
  low: [
    "light bulb","low speed","minor glitch","setup issue","cosmetic","replacement","upgrade","check","normal issue","minor problem","thik karne ka kaam","lamp change","plug fit","fan ka minor issue","switch thik karna","routine inspection","minor electricity fix",
    "replace tap","cleaning","routine check","minor repair","maintenance","cosmetic","general cleaning","thoda repair","minor maintenance","tap polish","routine plumbing","faucet replacement","minor shower fix","routine leak check","cosmetic pipe fix","normal water flow",
    "general cleaning","routine","maintenance","neatness","polish","organize","cosmetic","routine safai","normal cleaning","minor polish","furniture cleaning","cosmetic arrangement","minor organization","flower watering","decoration","routine mop","routine dusting",
    "painting","minor repair","routine maintenance","upgrade","cosmetic","chhota repair","normal maintenance","wall painting","minor touch-up","furniture repair","decoration","cosmetic fix","routine inspection","minor polish","minor upgrade",
    "tasty food","minor preferences","menu suggestion","routine cleaning","cosmetic arrangement","routine kitchen maintenance",
    "room decoration","minor furniture issue","routine maintenance","cosmetic arrangement","minor repairs",
    "study group formation","minor academic preferences","routine academic issues","routine submission","minor query",
    "routine lab maintenance","minor cosmetic repair","lab inventory update","furniture polishing","organizing lab shelves","minor lab cleaning","routine document upload","cosmetic portal display issue","minor timetable preference","minor report submission","non-critical academic portal issues",
    "routine lab maintenance","minor cosmetic repair","lab inventory update","furniture polishing","organizing lab shelves","minor lab cleaning",
    "painting","decoration","cosmetic arrangement","routine maintenance","minor furniture adjustment",
    "routine network maintenance","cosmetic system display","minor software update","minor portal adjustments","minor lab network issue"
  ]
};

function timeAgo(date) {
  if (!date) return "";
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const notifyMaintenanceTeam = async (complaint) => {
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || user.email?.split("@")[0]);
      } else setUserEmail("");
    });
    return () => unsubscribe();
  }, []);

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
      setComplaints(data.filter((c) => c.status !== "Reopened"));
      setReopenedComplaints(data.filter((c) => c.status === "Reopened"));
    };
    fetchComplaints();
  }, [userEmail, confirmationData, deleteData, reopenModal]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    let date;
    if (typeof timestamp === "object" && timestamp !== null) {
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp.seconds && timestamp.nanoseconds) {
        date = new Date(timestamp.seconds * 1000);
      }
    } else {
      date = new Date(timestamp);
    }
    if (!date || isNaN(date.getTime())) return "N/A";
    return date;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const description = formData.get("description");
    const priority = autoAssignPriority(description, keywords);

    const complaint = {
      subject: formData.get("subject"),
      priority,
      building: formData.get("building"),
      location: formData.get("location"),
      description,
      category: activeCategory,
      status: "Pending",
      createdAt: serverTimestamp(),
      email: userEmail,
    };

    const file = formData.get("image");
    if (file && file.size > 0) {
      const storageRef = ref(storage, `complaints/${file.name}`);
      await uploadBytes(storageRef, file);
      complaint.imageUrl = await getDownloadURL(storageRef);
    }

    const docRef = await addDoc(collection(db, "complaints"), complaint);

    const confirmationComplaint = {
      id: docRef.id,
      ...complaint,
      createdAt: new Date(),
      imageUrl: complaint.imageUrl || null,
    };

    setComplaints((prev) => [
      confirmationComplaint,
      ...prev,
    ]);

    setConfirmationData(confirmationComplaint);

    e.target.reset();
    setActiveCategory(null);
  };

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

  // --- UI ---
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      {/* 3D Navbar */}
      <div className="flex justify-between items-center mb-10 w-full max-w-6xl bg-white p-4 rounded-2xl shadow-3xl" style={{
        boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)"
      }}>
        <h1 className="text-3xl font-extrabold text-blue-700 drop-shadow-2xl" style={{
          letterSpacing: "1px",
          textShadow: "2px 2px 8px rgba(30,64,175,0.08)"
        }}>
          Grafigrah Hill University – Student Portal
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

      {/* Change Password Modal with re-authentication */}
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

      {/* TABS IN CENTER */}
      <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: "calc(100vh - 200px)" }}>
        <Card className="p-8 shadow-3xl rounded-3xl w-full max-w-5xl mx-auto flex justify-center bg-gradient-to-b from-white via-blue-50 to-white" style={{
          boxShadow: "0 12px 48px rgba(30,64,175,0.13), 0 4px 8px rgba(30,64,175,0.09)"
        }}>
          <Tabs defaultValue="submit" className="w-full flex flex-col items-center">
            <TabsList className="flex justify-center mb-8 bg-blue-100 rounded-2xl p-2 shadow-lg" style={{ boxShadow: "0 2px 12px rgba(30,64,175,0.10)" }}>
              <TabsTrigger
                value="submit"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-400"
                style={{ boxShadow: "0 2px 8px rgba(30,64,175,0.10)" }}
              >
                <FileText className="w-5 h-5" /> Submit Complaint
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-400"
                style={{ boxShadow: "0 2px 8px rgba(30,64,175,0.10)" }}
              >
                <ClipboardList className="w-5 h-5" /> My Complaints
                <span className="ml-2 bg-blue-200 text-blue-800 px-2 rounded-full text-sm font-bold shadow-inner">{complaints.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="reopened"
                className="flex items-center gap-2 px-7 py-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white text-lg font-bold transition shadow hover:scale-110 hover:bg-gradient-to-r hover:from-violet-500 hover:to-violet-400"
                style={{ boxShadow: "0 2px 8px rgba(124,58,237,0.10)" }}
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
                  {categories.map((cat) => (
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
                <Input name="building" placeholder="Property/Building" required className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150" />
                <Input name="location" placeholder="Specific Location" required className="rounded-xl shadow-inner bg-white/60 hover:bg-blue-50 transition-all duration-150" />
                <Textarea
                  name="description"
                  placeholder="Detailed Description"
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
            {/* Complaint List */}
            <TabsContent value="list" className="w-full">
              <div className="max-h-[500px] overflow-y-auto space-y-6">
                {complaints.map((comp) => (
                  <Card
                    key={comp.id}
                    className="p-5 shadow-3xl rounded-2xl hover:shadow-3xl hover:scale-[1.04] transition-transform duration-150 bg-gradient-to-br from-white via-blue-50 to-white border-2 border-gray-100"
                    style={{ boxShadow: "0 2px 16px rgba(30,64,175,0.12)" }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-blue-800 mb-2 drop-shadow">{comp.subject}</h3>
                        <p className="text-sm text-gray-600 mb-1">{comp.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />{" "}
                            {timeAgo(formatDateTime(comp.createdAt))}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {comp.location}
                          </span>
                        </div>
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
            {/* Reopened Complaints Section */}
            <TabsContent value="reopened" className="w-full">
              <div className="max-h-[500px] overflow-y-auto space-y-6">
                {reopenedComplaints.length === 0 && (
                  <div className="text-center text-gray-400 py-10">No reopened complaints yet.</div>
                )}
                {reopenedComplaints.map((comp) => (
                  <Card
                    key={comp.id}
                    className="p-5 shadow-3xl border-violet-600 border-2 rounded-2xl hover:shadow-3xl hover:scale-[1.04] transition-transform duration-150 bg-gradient-to-br from-white via-violet-50 to-white"
                    style={{ boxShadow: "0 2px 16px rgba(124,58,237,0.14)" }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-violet-700 mb-2 drop-shadow">{comp.subject}</h3>
                        <p className="text-sm text-gray-600 mb-1">{comp.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />{" "}
                            {timeAgo(formatDateTime(comp.createdAt))} (Original)
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat className="w-4 h-4" />{" "}
                            {timeAgo(formatDateTime(comp.reopenedAt))} (Reopened)
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
                      <div className="flex flex-col items-end gap-2">
                        {comp.imageUrl && (
                          <img
                            src={comp.imageUrl}
                            alt="Complaint"
                            className="rounded-lg max-h-40 w-40 object-cover shadow"
                          />
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

      {/* Complaint Submit Confirmation Modal */}
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
            <p className="mb-2">
              <strong>Subject:</strong> {confirmationData.subject}
            </p>
            <p className="mb-2">
              <strong>Category:</strong> {confirmationData.category}
            </p>
            <p className="mb-2">
              <strong>Priority:</strong> {confirmationData.priority}
            </p>
            <p className="mb-2">
              <strong>Building:</strong> {confirmationData.building}
            </p>
            <p className="mb-2">
              <strong>Location:</strong> {confirmationData.location}
            </p>
            <p className="mb-2">
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-full ${confirmationData.status === "Resolved"
                  ? "bg-green-100 text-green-700"
                  : confirmationData.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {confirmationData.status}
              </span>
            </p>
            <p className="mb-2">
              <strong>Description:</strong> {confirmationData.description}
            </p>
            <p className="mb-2 text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Submitted at:{" "}
              {timeAgo(formatDateTime(confirmationData.createdAt))}
            </p>
            {confirmationData.imageUrl && (
              <img
                src={confirmationData.imageUrl}
                alt="Complaint"
                className="mt-3 rounded-lg max-h-60 w-full object-cover shadow"
              />
            )}
          </Card>
        </div>
      )}

      {/* Complaint Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-md p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-red-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={cancelDelete}
            />
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-8 h-8 text-red-700" />
              <h2 className="text-xl font-extrabold text-red-700 drop-shadow-lg">
                Delete Complaint?
              </h2>
            </div>
            <p className="mb-2 text-base text-gray-700">
              Are you sure you want to delete this complaint? This action cannot be undone.
            </p>
            <div className="mb-4">
              <strong>Subject:</strong> {deleteConfirm.subject}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                className="border-gray-400 rounded-xl font-semibold shadow hover:scale-105 hover:bg-red-100 transition-all duration-150"
                onClick={cancelDelete}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex items-center gap-1 rounded-xl font-bold shadow hover:bg-red-600 hover:scale-105 transition-all duration-150"
                onClick={confirmDelete}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Complaint Delete Notification Modal */}
      {deleteData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-lg p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-red-100 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setDeleteData(null)}
            />
            <h2 className="text-2xl font-extrabold mb-4 text-red-700 flex items-center gap-2 drop-shadow-lg">
              <Trash2 className="w-7 h-7 text-red-700" /> Complaint Deleted!
            </h2>
            <p className="mb-2">
              <strong>Subject:</strong> {deleteData.subject}
            </p>
            <p className="mb-2">
              <strong>Category:</strong> {deleteData.category}
            </p>
            <p className="mb-2">
              <strong>Priority:</strong> {deleteData.priority}
            </p>
            <p className="mb-2">
              <strong>Building:</strong> {deleteData.building}
            </p>
            <p className="mb-2">
              <strong>Location:</strong> {deleteData.location}
            </p>
            <p className="mb-2">
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-full ${deleteData.status === "Resolved"
                  ? "bg-green-100 text-green-700"
                  : deleteData.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {deleteData.status}
              </span>
            </p>
            <p className="mb-2">
              <strong>Description:</strong> {deleteData.description}
            </p>
            <p className="mb-2 text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Submitted at:{" "}
              {timeAgo(formatDateTime(deleteData.createdAt))}
            </p>
            {deleteData.imageUrl && (
              <img
                src={deleteData.imageUrl}
                alt="Complaint"
                className="mt-3 rounded-lg max-h-60 w-full object-cover shadow"
              />
            )}
          </Card>
        </div>
      )}

      {/* Reopen Modal */}
      {reopenModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-md p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-violet-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={closeReopenModal}
            />
            <h2 className="text-xl font-extrabold text-violet-700 mb-2 flex items-center gap-2 drop-shadow-lg">
              <Repeat className="w-6 h-6" /> Reopen Complaint
            </h2>
            <p className="mb-2 text-gray-700">
              Please provide a reason (note) for reopening this complaint:
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const note = e.target.reopenNote.value;
                await handleReopen(note);
              }}
              className="flex flex-col gap-4"
            >
              <Textarea
                name="reopenNote"
                required
                placeholder="Describe why you want to reopen..."
                className="min-h-[80px] rounded-xl shadow-inner bg-white/60 hover:bg-violet-50 transition-all duration-150"
              />
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={closeReopenModal}
                  className="rounded-xl font-semibold shadow hover:scale-105 hover:bg-violet-100 transition-all duration-150">
                  Cancel
                </Button>
                <Button variant="default" type="submit"
                  className="bg-gradient-to-r from-violet-600 to-violet-400 text-white rounded-xl font-bold shadow hover:scale-105 hover:from-violet-700 hover:to-violet-500 transition-all duration-150">
                  Confirm Reopen
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Complaint Details Modal */}
      {modalData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-lg p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setModalData(null)}
            />
            <h2 className="text-2xl font-extrabold mb-4">{modalData.subject}</h2>
            <p className="mb-2">
              <strong>Category:</strong> {modalData.category}
            </p>
            <p className="mb-2">
              <strong>Priority:</strong> {modalData.priority}
            </p>
            <p className="mb-2">
              <strong>Building:</strong> {modalData.building}
            </p>
            <p className="mb-2">
              <strong>Location:</strong> {modalData.location}
            </p>
            <p className="mb-2">
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-full ${modalData.status === "Resolved"
                  ? "bg-green-100 text-green-700"
                  : modalData.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-700"
                    : modalData.status === "Reopened"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-red-100 text-red-700"
                  }`}
              >
                {modalData.status}
              </span>
            </p>
            <p className="mb-2">
              <strong>Description:</strong> {modalData.description}
            </p>
            <p className="mb-2 text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Submitted at:{" "}
              {timeAgo(formatDateTime(modalData.createdAt))}
            </p>
            {modalData.reopenedAt && (
              <p className="mb-2 text-violet-700 flex items-center gap-2">
                <Repeat className="w-4 h-4" /> Reopened at: {timeAgo(formatDateTime(modalData.reopenedAt))}
              </p>
            )}
            {modalData.reopenedNote && (
              <div className="mb-2 text-violet-700 flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>
                  <strong>Reopen Reason:</strong> {modalData.reopenedNote}
                </span>
              </div>
            )}
            {modalData.imageUrl && (
              <img
                src={modalData.imageUrl}
                alt="Complaint"
                className="mt-3 rounded-lg max-h-60 w-full object-cover shadow"
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
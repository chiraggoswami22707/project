"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/firebase/config";
import {
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import ProfileCard from "@/components/ProfileCard";
import CategoryCard from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  User,
  LogOut,
  Settings,
  Key,
  X,
  ChevronDown,
} from "lucide-react";

// --- CATEGORY DATA ---
const categories = [
  { name: "Electrical", icon: "⚡", color: "yellow", desc: "Issues related to electrical systems, wiring, and power supply." },
  { name: "Plumbing", icon: "🔧", color: "blue", desc: "Problems with water pipes, faucets, and drainage." },
  { name: "Cleaning", icon: "🧹", color: "green", desc: "Maintenance and cleaning services for facilities." },
  { name: "Security", icon: "🛡", color: "red", desc: "Concerns about safety, access control, and surveillance." },
  { name: "Internet", icon: "📶", color: "purple", desc: "Network connectivity and Wi-Fi related issues." },
  { name: "Parking", icon: "🚗", color: "orange", desc: "Parking space availability and vehicle-related problems." },
  { name: "Other", icon: "🖥", color: "gray", desc: "Miscellaneous complaints not covered by other categories." },
];

// --- UTILITIES ---
const getEffectiveStatus = (comp) => comp.adminFinalStatus || comp.status;

export default function SupervisorDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");

  const router = useRouter();

  // --- AUTH GUARD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        setUserName(user.displayName || user.email?.split("@")[0]);
        if (!user.email.endsWith("@sup.com")) window.location.href = "/login";
      } else {
        setUserEmail("");
        setUserName("");
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  // --- REALTIME FETCH ALL COMPLAINTS ---
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
      // Deduplicate complaints by id to prevent duplicates
      const uniqueComplaints = data.filter((comp, index, self) =>
        index === self.findIndex((c) => c.id === comp.id)
      );
      setComplaints(uniqueComplaints);
    });
    return () => unsubscribe();
  }, []);

  // --- CATEGORY STATS ---
  function getCategoryStats(categoryName) {
    const catComplaints = complaints.filter(
      (comp) => comp.category === categoryName
    );
    return {
      total: catComplaints.length,
      pending: catComplaints.filter(c => getEffectiveStatus(c) === "Pending").length,
      inProgress: catComplaints.filter(c => getEffectiveStatus(c) === "In Progress").length,
      resolved: catComplaints.filter(c => getEffectiveStatus(c) === "Resolved").length,
      reopened: catComplaints.filter(c => getEffectiveStatus(c) === "Reopened").length,
    };
  }

  // --- CHANGE PASSWORD HANDLER ---
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

  // --- MAIN UI ---
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
              (comp) => comp.category === cat.name
            );
            return (
              <CategoryCard
                key={cat.name}
                category={cat}
                stats={stats}
                complaints={catComplaints}
            onClick={() => router.push(`/supervisor/${encodeURIComponent(cat.name)}`)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
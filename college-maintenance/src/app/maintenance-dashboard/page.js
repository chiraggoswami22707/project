"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
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
import autoAssignPriority from "@/utils/autoAssignPriority";

// FIXED: Robust date formatting
function formatDateTimeFull(dateInput) {
  let date;
  if (!dateInput) return "N/A";
  // Firestore Timestamp (object with seconds)
  if (typeof dateInput === "object" && dateInput !== null) {
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput.toDate === "function") {
      date = dateInput.toDate();
    } else if (typeof dateInput.seconds === "number") {
      date = new Date(dateInput.seconds * 1000);
    } else {
      // Try to coerce other objects
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
  "All Categories",
  "Electrical",
  "Plumbing",
  "Cleaning",
  "Security",
  "Internet",
  "Parking",
  "Vehicle",
  "Other",
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
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [viewModal, setViewModal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [notification, setNotification] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

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
      if (!initialLoad && data.length > complaints.length) {
        setNotification("New complaint submitted!");
        setTimeout(() => setNotification(null), 4000);
      }
      setComplaints(data.sort((a, b) => {
        // If createdAt is missing, show at end
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

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const progress = complaints.filter((c) => c.status === "In Progress").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const reopened = complaints.filter((c) => c.status === "Reopened").length;

  const handleUpdateComplaint = async (id, updates) => {
    await updateDoc(doc(db, "complaints", id), updates);
    setUpdateModal(null);
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
                  onClick={() =>
                    signOut(auth)
                  }
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

      {/* Tabs */}
      <div className="flex justify-center mt-8">
        <div className="flex bg-[#ececec] rounded-2xl overflow-hidden w-[560px]">
          <button
            className={`flex-1 py-2 text-lg font-semibold transition-all ${
              activeTab === "Overview"
                ? "bg-white text-black shadow"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("Overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 py-2 text-lg font-semibold transition-all ${
              activeTab === "AllComplaints"
                ? "bg-white text-black shadow"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("AllComplaints")}
          >
            All Complaints
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "Overview" && (
        <div className="max-w-4xl mx-auto mt-8 space-y-8">
          <Card className="p-8">
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
                    <span className={`px-3 py-1 rounded-full font-semibold text-xs ${comp.status === "Pending" ? "bg-orange-100 text-orange-700" : comp.status === "In Progress" ? "bg-blue-100 text-blue-700" : comp.status === "Resolved" ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"}`}>
                      {comp.status}
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
                    <option key={cat} value={cat}>{cat}</option>
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
            </div>
          </Card>
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
            <h2 className="text-2xl font-extrabold mb-4">{viewModal.subject}</h2>
            <p className="mb-2"><strong>Category:</strong> {viewModal.category}</p>
            <p className="mb-2"><strong>Priority:</strong> {viewModal.priority}</p>
            <p className="mb-2"><strong>Status:</strong> {viewModal.status}</p>
            <p className="mb-2"><strong>Building:</strong> {viewModal.building}</p>
            <p className="mb-2"><strong>Location:</strong> {viewModal.location}</p>
            <p className="mb-2"><strong>User:</strong> {viewModal.userName || viewModal.user}</p>
            <p className="mb-2"><strong>Description:</strong> {viewModal.description}</p>
            <p className="mb-2 text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Submitted at: {formatDateTimeFull(viewModal.createdAt)}
            </p>
            {viewModal.assigned && (
              <div className="mb-2 text-blue-700">
                <strong>Assigned to:</strong> {viewModal.assigned}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Update Complaint Modal */}
      {updateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <Card className="w-full max-w-lg p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-violet-50 to-white animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setUpdateModal(null)}
            />
            <h2 className="text-2xl font-extrabold mb-4">
              Update Complaint
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const status = e.target.status.value;
                const priority = e.target.priority.value;
                const assigned = e.target.assigned.value;
                await handleUpdateComplaint(updateModal.id, {
                  status,
                  priority,
                  assigned,
                });
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="font-semibold">Status</label>
                <select
                  name="status"
                  defaultValue={updateModal.status}
                  className="rounded-xl px-3 py-2 w-full bg-white border"
                >
                  {statuses.filter(s => s !== "All Status").map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold">Priority</label>
                <select
                  name="priority"
                  defaultValue={updateModal.priority}
                  className="rounded-xl px-3 py-2 w-full bg-white border"
                >
                  {priorities.filter(p => p !== "All Priority").map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold">Assigned To (optional)</label>
                <Input
                  name="assigned"
                  defaultValue={updateModal.assigned || ""}
                  className="rounded-xl"
                  placeholder="Enter staff name"
                />
              </div>
              <div className="flex gap-4 justify-end mt-2">
                <Button
                  variant="outline"
                  onClick={() => setUpdateModal(null)}
                  className="rounded-xl font-semibold shadow hover:scale-105 hover:bg-violet-100 transition-all duration-150"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-bold shadow bg-gradient-to-r from-violet-600 to-violet-400 text-white hover:scale-105 hover:from-violet-700 hover:to-violet-500 transition-all duration-150"
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
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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  MapPin,
  Bell,
  User,
  LogOut,
  FileText,
  ClipboardList,
  X,
  Clock,
} from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

// Complaint Categories
const categories = [
  { name: "Electrical", icon: "⚡", desc: "Lights, fuses, wiring issues" },
  { name: "Plumbing", icon: "🚰", desc: "Leaks, taps, pipes" },
  { name: "Cleaning", icon: "🧹", desc: "Rooms, halls, common areas" },
  { name: "Security", icon: "🛡️", desc: "Guards, locks, surveillance" },
  { name: "Internet", icon: "🌐", desc: "Wi-Fi, LAN, connectivity issues" },
  { name: "Parking", icon: "🅿️", desc: "Slots, vehicle management" },
  { name: "Vehicle", icon: "🚗", desc: "Maintenance, repairs" },
  { name: "Other", icon: "❓", desc: "Miscellaneous issues" },
];

export default function StudentDashboard() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [modalData, setModalData] = useState(null);

  // Track user login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserEmail(user.email);
      else setUserEmail("");
    });
    return () => unsubscribe();
  }, []);

  // Fetch complaints for logged-in user
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
        // Fix for createdAt: convert Firestore Timestamp to JS Date if necessary
        return {
          id: doc.id,
          ...complaintData,
          createdAt:
            complaintData.createdAt && complaintData.createdAt.toDate
              ? complaintData.createdAt.toDate()
              : complaintData.createdAt || null,
        };
      });
      setComplaints(data);
    };
    fetchComplaints();
  }, [userEmail]);

  // Fix: formatDateTime handles both Firestore Timestamp and JS Date
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    let date;
    if (typeof timestamp === "object" && timestamp !== null) {
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp.toDate) {
        date = timestamp.toDate();
      } else if (timestamp.seconds && timestamp.nanoseconds) {
        // Handle Firestore Timestamp as plain object
        date = new Date(timestamp.seconds * 1000);
      }
    } else {
      // Try to parse string/number
      date = new Date(timestamp);
    }
    if (!date || isNaN(date.getTime())) return "N/A";
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Submit complaint
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const complaint = {
      subject: formData.get("subject"),
      priority: formData.get("priority"),
      building: formData.get("building"),
      location: formData.get("location"),
      description: formData.get("description"),
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

    // Add JS Date for UI so no error on render
    setComplaints((prev) => [
      {
        id: docRef.id,
        ...complaint,
        createdAt: new Date(), // serverTimestamp is only on backend, set actual JS date for UI
      },
    ...prev,
    ]);

    setNotifications((prev) => [
      {
        id: Date.now(),
        text: `Complaint "${complaint.subject}" submitted!`,
        timestamp: new Date(),
      },
      ...prev,
    ]);

    e.target.reset();
    setActiveCategory(null);
  };

  // Delete complaint
  const handleDelete = async (comp) => {
    if (confirm("Are you sure you want to delete this complaint?")) {
      await deleteDoc(doc(db, "complaints", comp.id));
      setComplaints((prev) => prev.filter((c) => c.id !== comp.id));
      setNotifications((prev) => [
        {
          id: Date.now(),
          text: `Complaint "${comp.subject}" deleted!`,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }
  };

  // Reopen complaint
  const handleReopen = async (comp) => {
    await addDoc(collection(db, "complaints"), {
      ...comp,
      subject: comp.subject + " (Reopened)",
      status: "Pending",
      createdAt: serverTimestamp(),
      email: userEmail,
    });
    setNotifications((prev) => [
      {
        id: Date.now(),
        text: `Complaint "${comp.subject}" reopened!`,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  const handleViewDetails = (comp) => setModalData(comp);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-50 to-white p-6">
      {/* Navbar */}
      <div className="flex justify-between items-center mb-10 w-full max-w-6xl bg-white p-4 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-gray-600">
          Graphic Era Hill University – Student Portal
        </h1>

        <div className="flex items-center gap-4 relative">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-gray-100 transition-transform hover:scale-110"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {notifications.length > 0 && (
              <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-white shadow-2xl rounded-lg p-3 z-50 animate-slideDown">
                <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
                {notifications.map((note) => (
                  <div
                    key={note.id}
                    className="flex justify-between items-center mb-2 p-2 bg-blue-50 rounded hover:bg-blue-100 transition-shadow"
                  >
                    <div>
                      <p>{note.text}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(note.timestamp)}
                      </p>
                    </div>
                    <X
                      className="w-4 h-4 cursor-pointer"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.filter((n) => n.id !== note.id)
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-700 flex items-center gap-1">
            <User className="w-5 h-5" /> {userEmail || "Not logged in"}
          </div>

          <Button
            variant="destructive"
            className="flex items-center gap-2 rounded-xl hover:scale-105 transition-transform"
            onClick={() =>
              signOut(auth).then(() => (window.location.href = "/login"))
            }
          >
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-6 shadow-2xl w-full max-w-5xl mx-auto">
        <Tabs defaultValue="submit" className="w-full">
          <TabsList className="flex justify-center mb-6 bg-blue-100 rounded-xl p-2">
            <TabsTrigger
              value="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-lg font-semibold transition shadow hover:scale-105"
            >
              <FileText className="w-5 h-5" /> Submit Complaint
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white text-lg font-semibold transition shadow hover:scale-105"
            >
              <ClipboardList className="w-5 h-5" /> My Complaints
              <span className="ml-2 bg-blue-200 text-blue-800 px-2 rounded-full text-sm font-medium">
                {complaints.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Submit Complaint Form */}
          <TabsContent value="submit">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-5 max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <Tippy key={cat.name} content={cat.desc} delay={200}>
                    <Card
                      onClick={() => setActiveCategory(cat.name)}
                      className={`cursor-pointer p-6 text-center shadow-lg border-2 transition-transform hover:scale-105 hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-50 ${
                        activeCategory === cat.name
                          ? "border-blue-600 bg-blue-50 shadow-2xl"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="text-4xl">{cat.icon}</div>
                      <p className="text-sm font-semibold mt-2">{cat.name}</p>
                    </Card>
                  </Tippy>
                ))}
              </div>

              <Input name="subject" placeholder="Subject" required />
              <select
                name="priority"
                className="border rounded-lg p-2"
                required
              >
                <option value="">Select Priority</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <Input name="building" placeholder="Property/Building" required />
              <Input name="location" placeholder="Specific Location" required />
              <Textarea
                name="description"
                placeholder="Detailed Description"
                required
              />
              <Input type="file" name="image" />
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-transform hover:scale-105"
              >
                Submit Complaint
              </Button>
            </form>
          </TabsContent>

          {/* Complaint List */}
          <TabsContent value="list">
            <div className="max-h-[500px] overflow-y-auto space-y-4">
              {complaints.map((comp) => (
                <Card
                  key={comp.id}
                  className="p-4 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-transform"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{comp.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {comp.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />{" "}
                          {formatDateTime(comp.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {comp.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          comp.status === "Resolved"
                            ? "bg-green-100 text-green-700"
                            : comp.status === "In Progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {comp.status}
                      </span>
                      {comp.status === "Resolved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:scale-105 transition-transform"
                          onClick={() => handleReopen(comp)}
                        >
                          Reopen
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="hover:bg-red-600 text-white hover:scale-105 transition-transform"
                        onClick={() => handleDelete(comp)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="mt-3 text-blue-600 border-blue-600 hover:bg-blue-50 hover:scale-105 transition-transform"
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

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-lg p-6 relative shadow-2xl animate-scaleIn">
            <X
              className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600 transition"
              onClick={() => setModalData(null)}
            />
            <h2 className="text-2xl font-bold mb-4">{modalData.subject}</h2>
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
                className={`px-2 py-1 rounded-full ${
                  modalData.status === "Resolved"
                    ? "bg-green-100 text-green-700"
                    : modalData.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-700"
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
              {formatDateTime(modalData.createdAt)}
            </p>
            {modalData.imageUrl && (
              <img
                src={modalData.imageUrl}
                alt="Complaint"
                className="mt-3 rounded-lg max-h-60 w-full object-cover shadow-lg"
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
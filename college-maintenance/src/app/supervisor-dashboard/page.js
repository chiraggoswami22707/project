"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebase/config";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, X } from "lucide-react";
import autoAssignPriority from "@/utils/autoAssignPriority";

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

export default function SupervisorDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const now = new Date();
        const sevenWeeksAgo = new Date(now.getTime() - 7 * 7 * 24 * 60 * 60 * 1000); // 7 weeks in milliseconds

        // Query all complaints (no 7 weeks limit)
        const q = query(collection(db, "complaints"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        // Separate high priority, overdue, and others
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

        // Mark high priority complaints based on description keywords
        const highPriority = data
          .filter((comp) => autoAssignPriority(comp.description) === "High")
          .sort((a, b) => b.createdAt - a.createdAt); // Newest first

        const overdue = data
          .filter(
            (comp) =>
              comp.status === "Pending" &&
              comp.createdAt <= sevenDaysAgo &&
              autoAssignPriority(comp.description) !== "High"
          )
          .sort((a, b) => a.createdAt - b.createdAt); // Oldest overdue first

        const others = data
          .filter(
            (comp) =>
              !(
                comp.status === "Pending" &&
                comp.createdAt <= sevenDaysAgo
              ) &&
              autoAssignPriority(comp.description) !== "High"
          )
          .sort((a, b) => b.createdAt - a.createdAt); // Newest first

        // Combine: high priority first, then overdue, then others
        setComplaints([...highPriority, ...overdue, ...others]);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-6 drop-shadow-lg">
          Supervisor Dashboard
        </h1>
        <div className="grid gap-4">
          {complaints.map((complaint) => {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const isOverdue = complaint.status === "Pending" && complaint.createdAt <= sevenDaysAgo;
            const isHighPriority = autoAssignPriority(complaint.description) === "High";

            return (
              <Card
                key={complaint.id}
                className={`p-5 shadow-3xl rounded-2xl hover:shadow-3xl transition-transform duration-150 ${
                  isHighPriority
                    ? "border-orange-500 bg-orange-50 border-2"
                    : isOverdue
                    ? "border-red-500 bg-red-50 border-2"
                    : "border-gray-200 bg-gradient-to-br from-white via-blue-50 to-white"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-800 mb-2 drop-shadow">
                      {complaint.subject}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {formatDateTimeFull(complaint.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {complaint.building} - {complaint.roomNo || complaint.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" /> {complaint.email}
                      </span>
                    </div>
                    {isHighPriority && (
                      <Badge variant="destructive" className="mt-2">
                        High Priority
                      </Badge>
                    )}
                    {isOverdue && (
                      <Badge variant="destructive" className="mt-2">
                        Overdue (Pending {'>'} 7 days)
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        complaint.status === "Resolved"
                          ? "default"
                          : complaint.status === "In Progress"
                          ? "secondary"
                          : "outline"
                      }
                      className="mb-2"
                    >
                      {complaint.status}
                    </Badge>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedComplaint(complaint)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-100"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <Card className="w-full max-w-lg p-6 relative shadow-3xl rounded-2xl bg-gradient-to-b from-white via-blue-50 to-white">
              <X
                className="absolute top-4 right-4 w-6 h-6 cursor-pointer text-gray-600 hover:text-red-600"
                onClick={() => setSelectedComplaint(null)}
              />
              <h2 className="text-2xl font-extrabold mb-4 text-blue-700">
                Complaint Details
              </h2>
              <div className="space-y-3">
                <p><strong>Subject:</strong> {selectedComplaint.subject}</p>
                <p><strong>Description:</strong> {selectedComplaint.description}</p>
                <p><strong>Status:</strong> {selectedComplaint.status}</p>
                <p><strong>Building:</strong> {selectedComplaint.building}</p>
                <p><strong>Room:</strong> {selectedComplaint.roomNo || selectedComplaint.location}</p>
                <p><strong>Submitted:</strong> {formatDateTimeFull(selectedComplaint.createdAt)}</p>
                <p><strong>Email:</strong> {selectedComplaint.email}</p>
                {selectedComplaint.photoUrl && (
                  <div>
                    <strong>Photo:</strong>
                    <img src={selectedComplaint.photoUrl} alt="Complaint" className="mt-2 max-w-full rounded-lg" />
                  </div>
                )}
              </div>
              <Button
                onClick={() => setSelectedComplaint(null)}
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

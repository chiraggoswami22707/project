"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/firebase/config";
import {
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ProfileCard from "@/components/ProfileCard";
import CategoryCard from "@/components/CategoryCard";

// --- CATEGORY DATA ---
const categories = [
  { name: "Electrical", icon: "⚡", color: "yellow", desc: "Issues related to electrical systems, wiring, and power supply." },
  { name: "Plumbing", icon: "🔧", color: "blue", desc: "Problems with water pipes, faucets, and drainage." },
  { name: "Cleaning", icon: "🧹", color: "green", desc: "Maintenance and cleaning services for facilities." },
  { name: "Security", icon: "🛡️", color: "red", desc: "Concerns about safety, access control, and surveillance." },
  { name: "Internet", icon: "📶", color: "purple", desc: "Network connectivity and Wi-Fi related issues." },
  { name: "Parking", icon: "🚗", color: "orange", desc: "Parking space availability and vehicle-related problems." },
  { name: "Other", icon: "🖥️", color: "gray", desc: "Miscellaneous complaints not covered by other categories." },
];

// --- UTILITIES ---
const getEffectiveStatus = (comp) => comp.adminFinalStatus || comp.status;

export default function SupervisorDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  const router = useRouter();

  // --- AUTH GUARD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        if (!user.email.endsWith("@sup.com")) window.location.href = "/login";
      } else {
        setUserEmail("");
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
      setComplaints(data);
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

  // --- MAIN UI ---
  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      <div className="w-full max-w-7xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700">
          Graphic Era Hill University – Supervisor Dashboard
        </h1>
      </div>
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
}
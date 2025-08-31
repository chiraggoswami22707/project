"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { auth } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import ProfileCard from "@/components/ProfileCard";
import ComplaintList from "@/components/ComplaintList";

export default function CategoryPage() {
  const { category } = useParams();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
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

  if (!userEmail) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-blue-100 to-white p-6">
      <div className="w-full max-w-7xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 capitalize">
          Graphic Era Hill University – {category} Complaints
        </h1>
      </div>
      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <ProfileCard name="Supervisor Name" role="Supervisor" email={userEmail} />
        </div>
        <div className="md:w-3/4">
          <ComplaintList category={category} userEmail={userEmail} />
        </div>
      </div>
    </div>
  );
}

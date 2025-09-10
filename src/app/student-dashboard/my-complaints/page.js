"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "complaints"),
      where("userId", "==", auth.currentUser?.uid || "guest"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setComplaints(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📂 My Complaints</h1>

      {complaints.length === 0 ? (
        <p>No complaints found.</p>
      ) : (
        <ul className="space-y-4">
          {complaints.map((c) => (
            <li
              key={c.id}
              className="bg-white shadow p-4 rounded-lg border hover:shadow-md"
            >
              <Link href={`/my-complaints/${c.id}`}>
                <div>
                  <h2 className="font-semibold text-lg">{c.subject}</h2>
                  <p className="text-gray-600">{c.category} • {c.priority}</p>
                  <p className="text-sm text-gray-400">
                    {c.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

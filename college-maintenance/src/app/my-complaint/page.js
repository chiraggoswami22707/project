"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "complaints"),
          where("userId", "==", user.uid) // ✅ sirf current user ki complaints
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComplaints(data);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  if (loading) return <p>Loading complaints...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Complaints</h1>
      {complaints.length === 0 ? (
        <p>No complaints found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Subject</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Priority</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id}>
                <td className="border p-2">{c.subject}</td>
                <td className="border p-2">{c.category}</td>
                <td className="border p-2">{c.priority}</td>
                <td className="border p-2">{c.status || "Pending"}</td>
                <td className="border p-2">
                  {c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleString() : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

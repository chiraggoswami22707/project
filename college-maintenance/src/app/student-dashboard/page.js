"use client";

import { useState } from "react";
import { db, storage } from "@/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const categories = [
  { name: "Electrical", desc: "Power outages, faulty wiring, lighting issues", icon: "⚡" },
  { name: "General Maintenance", desc: "Repairs, cleaning, facility maintenance", icon: "🛠" },
  { name: "Security", desc: "Safety concerns, access issues, security", icon: "🛡" },
  { name: "Internet", desc: "WiFi issues, network connectivity problems", icon: "🌐" },
  { name: "Cable", desc: "Cable TV, network cabling, wiring issues", icon: "📺" },
  { name: "Parking", desc: "Parking issues, vehicle access problems", icon: "🅿" },
  { name: "Vehicle", desc: "Transport services, vehicle maintenance", icon: "🚗" },
  { name: "Other", desc: "Issues not covered above", icon: "❓" },
];

export default function StudentDashboard() {
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    property: "",
    location: "",
    description: "",
    priority: "Medium Priority",
    files: [],
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, files: Array.from(files) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      let fileUrls = [];

      if (formData.files.length > 0) {
        for (const file of formData.files) {
          const storageRef = ref(storage, `complaints/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          fileUrls.push(url);
        }
      }

      await addDoc(collection(db, "complaints"), {
        category: formData.category,
        subject: formData.subject,
        property: formData.property,
        location: formData.location,
        description: formData.description,
        priority: formData.priority,
        fileUrls: fileUrls,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      alert("✅ Complaint submitted successfully!");
      setFormData({
        category: "",
        subject: "",
        property: "",
        location: "",
        description: "",
        priority: "Medium Priority",
        files: [],
      });
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error submitting complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-purple-700 mb-6">
          Submit Complaint
        </h1>

        {/* Categories */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📌 Complaint Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setFormData({ ...formData, category: cat.name })}
                className={`cursor-pointer p-4 rounded-lg border hover:shadow-lg transition ${
                  formData.category === cat.name
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200"
                }`}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Complaint Details Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-700">
            📝 Complaint Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="p-3 border rounded-lg w-full"
            />
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="p-3 border rounded-lg w-full"
            >
              <option>High Priority</option>
              <option>Medium Priority</option>
              <option>Low Priority</option>
            </select>
          </div>

          <input
            type="text"
            name="property"
            placeholder="Property / Building (e.g., Hostel A, Library)"
            value={formData.property}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg w-full"
          />

          <input
            type="text"
            name="location"
            placeholder="Specific Location (e.g., Room 101, Parking Area B)"
            value={formData.location}
            onChange={handleChange}
            className="p-3 border rounded-lg w-full"
          />

          <textarea
            name="description"
            placeholder="Detailed Description"
            value={formData.description}
            onChange={handleChange}
            required
            className="p-3 border rounded-lg w-full"
            rows="4"
          />

          <input
            type="file"
            name="files"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="p-3 border rounded-lg w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            {loading ? "Submitting..." : "🚀 Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
}

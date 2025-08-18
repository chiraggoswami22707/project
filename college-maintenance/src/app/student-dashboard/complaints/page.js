"use client";

import { useState } from "react";
import { auth, db, storage } from "@/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ComplaintForm() {
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    property: "",
    priority: "Medium Priority",
    location: "",
    description: "",
    file: null,
  });
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Submit complaint
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      alert("❌ Please login before submitting a complaint.");
      return;
    }

    setLoading(true);

    try {
      let fileUrl = null;

      // ✅ Upload file if exists
      if (formData.file) {
        const storageRef = ref(storage, `complaints/${Date.now()}_${formData.file.name}`);
        await uploadBytes(storageRef, formData.file);
        fileUrl = await getDownloadURL(storageRef);
      }

      // ✅ Save complaint in Firestore
      await addDoc(collection(db, "complaints"), {
        userId: auth.currentUser.uid,   // ✅ store user ID
        category: formData.category,
        subject: formData.subject,
        property: formData.property,
        priority: formData.priority,
        location: formData.location,
        description: formData.description,
        fileUrl: fileUrl,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      alert("✅ Complaint submitted successfully!");

      // Reset form
      setFormData({
        category: "",
        subject: "",
        property: "",
        priority: "Medium Priority",
        location: "",
        description: "",
        file: null,
      });
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("❌ Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Submit Complaint</h2>

      <input
        type="text"
        name="subject"
        placeholder="Subject"
        value={formData.subject}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded mb-3"
      />

      <input
        type="text"
        name="property"
        placeholder="Property/Building"
        value={formData.property}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded mb-3"
      />

      <input
        type="text"
        name="location"
        placeholder="Specific Location"
        value={formData.location}
        onChange={handleChange}
        className="w-full p-2 border rounded mb-3"
      />

      <textarea
        name="description"
        placeholder="Detailed Description"
        value={formData.description}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded mb-3"
      />

      <input
        type="file"
        name="file"
        accept="image/*"
        onChange={handleChange}
        className="w-full p-2 border rounded mb-3"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white p-3 rounded-lg"
      >
        {loading ? "Submitting..." : "Submit Complaint"}
      </button>
    </form>
  );
}

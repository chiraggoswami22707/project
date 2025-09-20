"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import Image from "next/image";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student"); // default
  const [category, setCategory] = useState(""); // for supervisors
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Supervisor categories
  const supervisorCategories = [
    "Cleaning",
    "Electrical", 
    "Plumbing",
    "Maintenance",
    "Lab/Server"
  ];

  // Email validation for roles
  const validateSignup = () => {
    if (!email || !password) {
      setError("Email and Password are required.");
      return false;
    }
    if (role === "student") {
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
        setError("Please login with your official Student Gmail ending with @gmail.com");
        return false;
      }
    }
    if (role === "staff") {
      if (!/^[a-zA-Z0-9._%+-]+@staff\.com$/.test(email)) {
        setError("Please login with your official Staff ID ending with @staff.com");
        return false;
      }
    }
    if (role === "supervisor") {
      if (!/^[a-zA-Z0-9._%+-]+@sup\.com$/.test(email)) {
        setError("Please login with your official Supervisor ID ending with @sup.com");
        return false;
      }
    }
    // For maintenance, no email pattern required
    setError("");
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;
    
    // Additional validation for supervisor category
    if (role === "supervisor" && !category) {
      setError("Please select a category for supervisor role.");
      return;
    }
    
    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Prepare user data for Firestore
      const userData = {
        email,
        role,
        name: name.trim(),
        createdAt: new Date().toISOString()
      };
      
      // Add category for supervisors
      if (role === "supervisor") {
        userData.category = category;
      }
      
      await setDoc(doc(db, "users", userCred.user.uid), userData);

      alert("Signup successful! Please login.");
      // Staff and student both go to the same dashboard after login, but signup redirects to login
      router.push("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Fixed Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/geu-campus.jpg"
          alt="Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <form
          onSubmit={handleSignup}
          className="flex flex-col gap-5 bg-white/50 p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-xs sm:max-w-sm border border-gray-200"
        >
          <div className="flex justify-center mb-4">
            <Image
              src="https://www.italcoholic.in/wp-content/uploads/2017/01/geu.png"
              alt="University Logo"
              width={200}
              height={100}
              className="w-full max-w-xs h-auto"
              priority
            />
          </div>

          {/* Name Input */}
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Role Selection */}
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setCategory(""); // Reset category when role changes
            }}
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="supervisor">Supervisor</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {/* Supervisor Category Selection */}
          {role === "supervisor" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {supervisorCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          <input
            type="email"
            placeholder={
              role === "student"
                ? "Student Email (ending with @gmail.com)"
                : role === "staff"
                ? "Staff Email (ending with @staff.com)"
                : role === "supervisor"
                ? "Supervisor Email (ending with @sup.com)"
                : "Maintenance Email"
            }
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <div className="text-red-600 text-sm text-center font-semibold">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
              isLoading ? "bg-blue-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Processing..." : "SIGN UP"}
          </button>

          <div className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
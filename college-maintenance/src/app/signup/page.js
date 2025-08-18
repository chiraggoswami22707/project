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
  const [role, setRole] = useState("student");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        role,
      });

      alert("Signup successful!");
      router.push("/login");
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 h-full">
        <Image
          src="/images/college-bg.jpeg"
          alt="College Background"
          fill
          style={{ objectFit: "cover" }}
          className="opacity-90"
          priority
        />
      </div>

      {/* Signup Form */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <form
          onSubmit={handleSignup}
          className="flex flex-col gap-6 bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">Create Account</h2>
            <p className="text-gray-600">Sign up to continue</p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-gray-700 font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-gray-700 font-medium">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="role" className="text-gray-700 font-medium">Select Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student/Staff</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`p-3 rounded-lg text-white font-medium transition-colors ${
              isLoading
                ? "bg-blue-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>

          <p className="text-center text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
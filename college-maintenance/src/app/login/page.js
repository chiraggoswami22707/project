"use client";
import { useState } from "react";
import { auth, db } from "@/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";  // Added import for getDoc
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.data()?.role || "student";  // Fallback to student if role not found

      if (role === "maintenance") {
        router.push("/maintenance-dashboard");
      } else {
        router.push("/student-dashboard");
      }
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        alert("User not found. Please sign up.");
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password.");
      } else {
        alert(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Image - Now more visible */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/college-bg.jpeg"
          alt="College Background"
          fill
          style={{ objectFit: "cover" }}
          className="opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-red bg-opacity-20"></div>
      </div>
      
      {/* Login Form - Now with better contrast */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-4 bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h2>
            <p className="text-black-600">Login to your account</p>
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
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
          
          <p className="text-center text-gray-600">
            Don't have an account?{" "}
            <a 
              href="/signup" 
              className="text-blue-600 hover:text-blue-800 underline transition-colors"
            >
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
    // ye delete krna h thik hbhbdhgdfhdvfdfdgvhdbfhdfdhfvhds
  );
}
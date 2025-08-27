"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

const MAINTENANCE_KEY = "gehuservice@04";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(null);
  const [key, setKey] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // captcha generator
  const generateCaptcha = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let text = "";
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(text);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (captchaInput !== captcha) {
        alert("Captcha incorrect!");
        generateCaptcha();
        setIsLoading(false);
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const docSnap = await getDoc(doc(db, "users", userCred.user.uid));

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setRole(userData.role);

        if (userData.role === "maintenance") {
          if (key !== MAINTENANCE_KEY) {
            alert("Invalid Maintenance Key!");
            setIsLoading(false);
            return;
          }
          router.push("/maintenance-dashboard");
        } else if (userData.role === "student" || userData.role === "staff") {
          router.push("/student-dashboard");
        } else {
          router.push("/");
        }
      } else {
        alert("No user data found!");
      }
    } catch (error) {
      alert(error.message);
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

      <div className="flex items-center justify-end min-h-screen px-6">
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-5 bg-white/50 p-8 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200"
        >
          <div className="flex justify-center mb-4">
            <Image
              src="https://www.italcoholic.in/wp-content/uploads/2017/01/geu.png"
              alt="University Logo"
              width={450}
              height={80}
              priority
            />
          </div>

          <input
            type="email"
            placeholder="Email"
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

          {role === "maintenance" && (
            <input
              type="password"
              placeholder="Enter Maintenance Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <div className="flex items-center gap-3">
            <div className="bg-gray-200 text-lg font-bold tracking-widest px-4 py-2 rounded">
              {captcha}
            </div>
            <button
              type="button"
              onClick={generateCaptcha}
              className="text-sm text-blue-600"
            >
              Refresh
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter Captcha"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            required
            className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${isLoading
                ? "bg-blue-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {isLoading ? "Processing..." : "LOGIN"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-blue-600 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
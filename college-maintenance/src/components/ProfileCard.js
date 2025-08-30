"use client";

import { Card } from "@/components/ui/card";
import { User, Mail, Shield, Briefcase, Wrench, GraduationCap } from "lucide-react";

export default function ProfileCard({ user }) {
  if (!user) return null;

  const getRoleIcon = (role) => {
    switch (role) {
      case "student":
        return <GraduationCap className="w-5 h-5" />;
      case "staff":
        return <Briefcase className="w-5 h-5" />;
      case "supervisor":
        return <Shield className="w-5 h-5" />;
      case "maintenance":
        return <Wrench className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "student":
        return "Student";
      case "staff":
        return "Staff Member";
      case "supervisor":
        return "Supervisor";
      case "maintenance":
        return "Maintenance Staff";
      default:
        return role;
    }
  };

  return (
    <Card className="w-80 p-6 shadow-2xl rounded-2xl bg-gradient-to-br from-white via-blue-50 to-white border-2 border-blue-100 fixed left-6 top-6 z-40">
      <div className="flex flex-col items-center text-center">
        {/* User Avatar */}
        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <User className="w-10 h-10 text-white" />
        </div>

        {/* User Name */}
        <h2 className="text-xl font-bold text-blue-800 mb-2">
          {user.name || user.email?.split('@')[0]}
        </h2>

        {/* Role with Icon */}
        <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-blue-100 rounded-full">
          {getRoleIcon(user.role)}
          <span className="font-semibold text-blue-700">
            {getRoleDisplayName(user.role)}
          </span>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Mail className="w-4 h-4" />
          <span className="text-sm">{user.email}</span>
        </div>

        {/* Supervisor Category (if applicable) */}
        {user.role === "supervisor" && user.category && (
          <div className="w-full bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
            <h3 className="font-semibold text-purple-800 text-sm mb-1">Supervisor Category</h3>
            <p className="text-purple-700 font-medium">{user.category}</p>
          </div>
        )}

        {/* Additional Info for Other Roles */}
        {user.role !== "supervisor" && (
          <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
            <h3 className="font-semibold text-blue-800 text-sm mb-1">User Information</h3>
            <p className="text-blue-700 text-sm">
              {user.role === "student" && "Student ID: " + (user.email?.split('@')[0] || 'N/A')}
              {user.role === "staff" && "Staff Member - Graphic Era University"}
              {user.role === "maintenance" && "Maintenance Department"}
            </p>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Online</span>
        </div>
      </div>
    </Card>
  );
}

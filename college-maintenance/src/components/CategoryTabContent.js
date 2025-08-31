import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Download,
  Filter,
  X,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

function CategoryTabContent({
  category,
  complaints,
  stats,
  onUpdateStatus,
  onViewDetails,
  onExport,
  onToggleFilters,
  showFilters,
  filters,
  onFilterChange,
  onClearFilters
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange[key](value);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "Pending":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case "Reopened":
        return <RotateCcw className="w-4 h-4 text-violet-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-700 border-green-300";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Pending":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "Reopened":
        return "bg-violet-100 text-violet-700 border-violet-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getReporterType = (email) => {
    if (email?.endsWith("@gmail.com")) return "Student";
    if (email?.endsWith("@staff.com")) return "Staff";
    return "Unknown";
  };

  const formatDateTimeFull = (dateInput) => {
    if (!dateInput) return "N/A";
    let date;
    if (typeof dateInput === "object" && dateInput !== null) {
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (dateInput.toDate) {
        date = dateInput.toDate();
      } else if (dateInput.seconds !== undefined) {
        date = new Date(dateInput.seconds * 1000);
      }
    } else {
      date = new Date(dateInput);
    }
    if (!date || isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", "");
  };

  const formatDateOnly = (dateInput) => {
    if (!dateInput) return "N/A";
    let date;
    if (typeof dateInput === "object" && dateInput !== null) {
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (dateInput.toDate) {
        date = dateInput.toDate();
      } else if (dateInput.seconds !== undefined) {
        date = new Date(dateInput.seconds * 1000);
      }
    } else {
      date = new Date(dateInput);
    }
    if (!date || isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).replace(",", "");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Complaints</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="text-blue-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Resolved</p>
              <p className="text-2xl font-bold text-green-800">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Pending</p>
              <p className="text-2xl font-bold text-orange-800">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">In Progress</p>
              <p className="text-2xl font-bold text-blue-800">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onToggleFilters}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
          <Button
            onClick={onExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <Input
                type="date"
                value={localFilters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <Input
                type="date"
                value={localFilters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="All Status">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Building</label>
              <Input
                placeholder="Search building..."
                value={localFilters.building}
                onChange={(e) => handleFilterChange("building", e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-2">Room</label>
              <Input
                placeholder="Search room..."
                value={localFilters.room}
                onChange={(e) => handleFilterChange("room", e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Complaints Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Complaint ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Building Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Complaint Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reporter Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reporter Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Final Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    No complaints available for this supervisor or filter selection.
                  </td>
                </tr>
              ) : (
                complaints.map((comp) => (
                  <tr key={comp.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{comp.id.slice(-8)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateOnly(comp.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{comp.building || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{comp.location || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{comp.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{comp.userName || comp.user || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getReporterType(comp.email)}</td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(comp.adminFinalStatus || comp.status)}`}>
                        {getStatusIcon(comp.adminFinalStatus || comp.status)}
                        {comp.adminFinalStatus || comp.status}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewDetails(comp)}
                          className="text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateStatus(comp.id, comp.status)}
                          className="text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default CategoryTabContent;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Filter,
  X,
} from "lucide-react";

function CategoryTabContent({
  category,
  complaints,
  stats,
  onUpdateStatus,
  onViewDetails,
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

  const statusColors = {
    Pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    "In Progress": { bg: "bg-blue-100", text: "text-blue-800" },
    Resolved: { bg: "bg-green-100", text: "text-green-800" },
    Reopened: { bg: "bg-violet-100", text: "text-violet-800" },
  };

  const priorityColors = {
    High: { bg: "bg-red-100", text: "text-red-800" },
    Medium: { bg: "bg-yellow-100", text: "text-yellow-800" },
    Low: { bg: "bg-green-100", text: "text-green-800" },
  };

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleFilters}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-100 transition"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category?.name || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              >
                <option>{category?.name || "Select Category"}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
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
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={filters.priority || "All Priority"}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="All Priority">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={filters.fromDate || ""}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Complaints Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {complaints.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No complaints available for this supervisor or filter selection.
          </p>
        ) : (
          complaints.map((comp) => (
            <Card key={comp.id} className="p-6 rounded-2xl shadow-md bg-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{comp.subject || "No Subject"}</h3>
                  <p className="text-xs text-gray-500">ID: {comp.id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[comp.status]?.bg} ${statusColors[comp.status]?.text}`}>
                    {comp.status}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[comp.priority]?.bg} ${priorityColors[comp.priority]?.text}`}>
                    {comp.priority}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{comp.description || "No description provided."}</p>
              <div className="flex flex-col gap-1 text-xs text-gray-600 mb-4">
                <div><strong>Location:</strong> {comp.building || "N/A"} - {comp.location || "N/A"}</div>
                <div><strong>Date:</strong> {comp.createdAt ? new Date(comp.createdAt).toLocaleDateString("en-GB") : "N/A"}</div>
                <div><strong>Time Slot:</strong> {comp.timeSlot || "N/A"}</div>
              </div>
              <select
                value={comp.status}
                onChange={(e) => onUpdateStatus(comp.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="Pending">Mark as Pending</option>
                <option value="In Progress">Mark as In Progress</option>
                <option value="Resolved">Mark as Resolved</option>
                <option value="Reopened">Mark as Reopened</option>
              </select>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CategoryTabContent;

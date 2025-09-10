import React from 'react';

const CategoryCard = ({ category, stats, complaints, onClick, isSelected }) => {
  return (
    <div
      className={`rounded-2xl p-6 flex flex-col cursor-pointer transition-all shadow-xl ${
        isSelected ? 'shadow-2xl ring-4 ring-blue-400' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{category.icon}</span>
        <span className="text-xl font-bold">{category.name}</span>
      </div>
      <p className="text-gray-600 mb-4 text-sm">{category.desc}</p>
      <div className="text-gray-500 mb-4">{stats.total} complaints</div>
      <div className="mb-2 flex flex-wrap gap-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
          Pending: {stats.pending}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
          In Progress: {stats.inProgress}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
          Resolved: {stats.resolved}
        </span>
        {stats.reopened > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700">
            Reopened: {stats.reopened}
          </span>
        )}
      </div>
      {/* Show recent complaints preview */}
      {/* Removed complaints preview and "+N more" to show complaints only inside tab on click */}
      {/* {complaints.slice(0, 2).map((comp) => (
        <div key={comp.id} className="mt-2 p-3 rounded-lg bg-blue-50 text-sm">
          <div className="font-semibold">{comp.subject}</div>
          <div className="text-xs text-gray-600">{new Date(comp.createdAt).toLocaleDateString()}</div>
          <div className="flex gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded ${getStatusClass(comp)}`}>
              {comp.adminFinalStatus || comp.status}
            </span>
            <span className={`px-2 py-0.5 rounded ${getPriorityClass(comp.priority)}`}>
              {comp.priority}
            </span>
          </div>
        </div>
      ))}
      {complaints.length > 2 && (
        <div className="mt-1 text-xs text-blue-600">+{complaints.length - 2} more...</div>
      )} */}
    </div>
  );
};

function getStatusClass(comp) {
  const status = comp.adminFinalStatus || comp.status;
  if (status === "Pending") return "bg-yellow-100 text-yellow-700";
  if (status === "In Progress") return "bg-blue-100 text-blue-700";
  if (status === "Resolved") return "bg-green-100 text-green-700";
  if (status === "Reopened") return "bg-violet-100 text-violet-700";
  return "bg-gray-100 text-gray-700";
}

function getPriorityClass(priority) {
  if (priority === "High") return "bg-orange-100 text-orange-700";
  if (priority === "Medium") return "bg-yellow-100 text-yellow-700";
  if (priority === "Low") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

export default CategoryCard;

import React from 'react';

const ProfileCard = ({ name, role, email }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center">
      <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
        {name.charAt(0).toUpperCase()}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{name}</h3>
      <p className="text-gray-600 mb-2">{role}</p>
      <p className="text-sm text-gray-500">{email}</p>
    </div>
  );
};

export default ProfileCard;

import React from 'react';
import { X, CheckCircle } from 'lucide-react';

const GraduateSuccessModal = ({ isOpen, onClose, studentName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-900 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-4"><CheckCircle size={36} /></div>
          <h3 className="text-xl font-bold text-white mb-2">Graduation Confirmed</h3>
          <p className="text-gray-400 mb-6">{studentName} has been successfully graduated.</p>
          <button onClick={onClose} className="py-3 px-6 rounded-2xl bg-white text-black font-bold hover:bg-gray-100">OK</button>
        </div>
      </div>
    </div>
  );
};

export default GraduateSuccessModal;

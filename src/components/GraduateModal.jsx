import React from 'react';
import { X, GraduationCap } from 'lucide-react';

const GraduateModal = ({ isOpen, onClose, onConfirm, studentName, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-400 mb-4"><GraduationCap size={36} /></div>
          <h3 className="text-xl font-bold text-white mb-2">Graduate Student</h3>
          <p className="text-gray-400 mb-6">Are you sure you want to mark <span className="font-bold text-white">{studentName}</span> as graduated? This will update their enrollment status.</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-white/10 text-white/80 hover:bg-white/5">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 disabled:opacity-60">{loading ? 'Processing...' : 'Confirm Graduate'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraduateModal;

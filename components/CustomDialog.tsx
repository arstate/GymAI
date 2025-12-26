import React from 'react';
import { AlertCircle, HelpCircle, X } from 'lucide-react';

interface CustomDialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const CustomDialog: React.FC<CustomDialogProps> = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
        <div className={`p-6 text-center ${type === 'alert' ? 'pb-2' : ''}`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${type === 'alert' ? 'bg-orange-100 text-orange-600' : 'bg-primary-100 text-primary-600'}`}>
            {type === 'alert' ? <AlertCircle className="w-8 h-8" /> : <HelpCircle className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="p-4 bg-gray-50 flex gap-3">
          {type === 'confirm' && (
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition"
            >
              Batal
            </button>
          )}
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 text-white font-bold rounded-xl shadow-lg transition ${type === 'alert' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-100'}`}
          >
            {type === 'alert' ? 'OK, Mengerti' : 'Ya, Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDialog;
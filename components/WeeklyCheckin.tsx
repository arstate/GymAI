import React, { useState } from 'react';
import { WeeklyFeedback } from '../types';
import { Scale, Activity, ThumbsUp, ThumbsDown, Minus, ChevronRight } from 'lucide-react';

interface Props {
  weekCompleted: number;
  onSubmit: (feedback: WeeklyFeedback) => void;
  isLoading: boolean;
}

const WeeklyCheckin: React.FC<Props> = ({ weekCompleted, onSubmit, isLoading }) => {
  const [weight, setWeight] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState<'Too Easy' | 'Just Right' | 'Too Hard'>('Just Right');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (weight) {
      onSubmit({
        weekCompleted,
        currentWeight: Number(weight),
        difficultyRating: difficulty,
        notes
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Minggu {weekCompleted} Selesai! 🎉</h2>
          <p className="text-gray-500 mt-2">Hebat! Mari update data tubuhmu agar jadwal minggu depan lebih akurat.</p>
        </div>

        <div className="space-y-6">
          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4" /> Berat Badan Sekarang (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-lg font-semibold"
              placeholder="Contoh: 64.5"
            />
          </div>

          {/* Difficulty Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Bagaimana latihan minggu ini?</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDifficulty('Too Easy')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${difficulty === 'Too Easy' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}
              >
                <ThumbsUp className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Terlalu Mudah</span>
              </button>
              <button
                onClick={() => setDifficulty('Just Right')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${difficulty === 'Just Right' ? 'bg-green-50 border-green-500 text-green-700' : 'hover:bg-gray-50'}`}
              >
                <Minus className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Pas / Cocok</span>
              </button>
              <button
                onClick={() => setDifficulty('Too Hard')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${difficulty === 'Too Hard' ? 'bg-red-50 border-red-500 text-red-700' : 'hover:bg-gray-50'}`}
              >
                <ThumbsDown className="w-6 h-6 mb-1" />
                <span className="text-xs font-bold">Terlalu Berat</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Ada keluhan atau cedera baru?</label>
             <textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm h-24 resize-none"
               placeholder="Tidak ada (kosongkan) atau jelaskan jika ada sakit di bagian tertentu..."
             />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!weight || isLoading}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? "Membuat Jadwal Baru..." : (
              <>
                Buat Jadwal Minggu Depan <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCheckin;
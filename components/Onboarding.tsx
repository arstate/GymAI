import React, { useState } from 'react';
import { UserProfile, Gender, Goal, Equipment } from '../types';
import { Activity, Dumbbell, HeartPulse, User, ChevronRight, Check } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
  isLoading: boolean;
}

const Onboarding: React.FC<Props> = ({ onComplete, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    equipment: [],
    isSmoker: false,
    medicalHistory: '',
    healthCheckStatus: 'Sehat'
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    // Basic validation could go here
    onComplete(formData as UserProfile);
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEquipment = (eq: Equipment) => {
    const current = formData.equipment || [];
    if (current.includes(eq)) {
      updateField('equipment', current.filter(e => e !== eq));
    } else {
      if (eq === Equipment.NONE) {
        updateField('equipment', [Equipment.NONE]);
      } else {
        const withoutNone = current.filter(e => e !== Equipment.NONE);
        updateField('equipment', [...withoutNone, eq]);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl mt-10">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {step === 1 && "Data Diri"}
            {step === 2 && "Tujuan & Alat"}
            {step === 3 && "Kesehatan & Gaya Hidup"}
          </h2>
          <span className="text-sm font-medium text-primary-600">Langkah {step}/3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary-500 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Budi Santoso"
                  value={formData.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usia</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.age || ''}
                onChange={e => updateField('age', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => updateField('gender', Gender.MALE)}
              className={`p-4 border rounded-xl cursor-pointer text-center transition ${formData.gender === Gender.MALE ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              <span className="text-2xl block mb-2">👨</span>
              Laki-laki
            </div>
            <div 
              onClick={() => updateField('gender', Gender.FEMALE)}
              className={`p-4 border rounded-xl cursor-pointer text-center transition ${formData.gender === Gender.FEMALE ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'hover:bg-gray-50'}`}
            >
              <span className="text-2xl block mb-2">👩</span>
              Perempuan
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tinggi (cm)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="170"
                value={formData.height || ''}
                onChange={e => updateField('height', parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="65"
                value={formData.weight || ''}
                onChange={e => updateField('weight', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Tujuan Utama
            </label>
            <div className="grid grid-cols-1 gap-3">
              {Object.values(Goal).map((goal) => (
                <div 
                  key={goal}
                  onClick={() => updateField('goal', goal)}
                  className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition ${formData.goal === goal ? 'border-primary-500 bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}`}
                >
                  <span>{goal}</span>
                  {formData.goal === goal && <Check className="w-5 h-5" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Peralatan yang Dimiliki
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(Equipment).map((eq) => (
                <div 
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition ${formData.equipment?.includes(eq) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}`}
                >
                  <span className="text-sm">{eq}</span>
                  {formData.equipment?.includes(eq) && <Check className="w-4 h-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-fade-in">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-500" /> Riwayat Penyakit / Cedera
            </label>
            <textarea 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
              placeholder="Contoh: Asma ringan, nyeri lutut kiri, atau 'Tidak ada'."
              value={formData.medicalHistory}
              onChange={e => updateField('medicalHistory', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi Kesehatan Saat Ini</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Contoh: Merasa bugar, Sering lelah, Sakit punggung"
              value={formData.healthCheckStatus}
              onChange={e => updateField('healthCheckStatus', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input 
              type="checkbox" 
              id="smoker"
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              checked={formData.isSmoker}
              onChange={e => updateField('isSmoker', e.target.checked)}
            />
            <label htmlFor="smoker" className="text-gray-700 select-none">Saya merokok aktif</label>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <button 
            onClick={handleBack}
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            disabled={isLoading}
          >
            Kembali
          </button>
        ) : <div></div>}

        {step < 3 ? (
          <button 
            onClick={handleNext}
            disabled={!formData.name || !formData.age || !formData.height || !formData.weight || !formData.gender}
            className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition shadow-lg shadow-primary-200 disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menganalisa Tubuh...
              </>
            ) : "Buat Rencana Latihan"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
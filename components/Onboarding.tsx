
import React, { useState } from 'react';
import { UserProfile, Gender, Goal, Equipment, DietBudget } from '../types';
import { Activity, Dumbbell, HeartPulse, User, ChevronRight, Check, DollarSign, Wallet, CreditCard, Target, Edit3, Ruler, TrendingDown } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
  isLoading: boolean;
}

const Onboarding: React.FC<Props> = ({ onComplete, isLoading }) => {
  const [step, setStep] = useState(1);
  const [customGoal, setCustomGoal] = useState('');
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    equipment: [],
    isSmoker: false,
    medicalHistory: '',
    healthCheckStatus: 'Sehat',
    dietBudget: DietBudget.MEDIUM,
    goal: undefined,
    weeklyTargetKg: 0.5 // Default target mingguan yang sehat
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    const finalData = { ...formData };
    if (formData.goal === Goal.CUSTOM) {
      finalData.goal = customGoal || 'Tujuan Khusus';
    }
    onComplete(finalData as UserProfile);
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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-xl mt-4 md:mt-10 overflow-y-auto max-h-[90vh]">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            {step === 1 && "Data Diri & Target"}
            {step === 2 && "Tujuan Utama"}
            {step === 3 && "Peralatan Gym"}
            {step === 4 && "Budget Makanan"}
            {step === 5 && "Kesehatan"}
          </h2>
          <span className="text-sm font-medium text-primary-600">Langkah {step}/5</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="min-h-[350px]">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                    placeholder="Budi Santoso"
                    value={formData.name || ''}
                    onChange={e => updateField('name', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Usia</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                  placeholder="Thn"
                  value={formData.age || ''}
                  onChange={e => updateField('age', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => updateField('gender', Gender.MALE)}
                className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center ${formData.gender === Gender.MALE ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
              >
                <span className="text-2xl md:text-3xl mb-1 md:mb-2">👨</span>
                <span className="font-bold text-sm">Laki-laki</span>
              </button>
              <button 
                onClick={() => updateField('gender', Gender.FEMALE)}
                className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center ${formData.gender === Gender.FEMALE ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
              >
                <span className="text-2xl md:text-3xl mb-1 md:mb-2">👩</span>
                <span className="font-bold text-sm">Perempuan</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                    <Ruler className="w-4 h-4" /> Tinggi (cm)
                  </label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                    placeholder="170"
                    value={formData.height || ''}
                    onChange={e => updateField('height', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">BB Sekarang (kg)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                    placeholder="79"
                    value={formData.weight || ''}
                    onChange={e => updateField('weight', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary-50/50 p-4 rounded-[2rem] border border-primary-100">
                <div>
                  <label className="block text-xs font-bold text-primary-500 uppercase mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Target BB Akhir (kg)
                  </label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 border-2 border-primary-200 bg-white rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition font-bold text-primary-700"
                    placeholder="70"
                    value={formData.targetWeight || ''}
                    onChange={e => updateField('targetWeight', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary-500 uppercase mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Target Per Minggu (kg)
                  </label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-primary-200 bg-white rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition font-bold text-primary-700"
                    value={formData.weeklyTargetKg || 0.5}
                    onChange={e => updateField('weeklyTargetKg', parseFloat(e.target.value))}
                  >
                    <option value={0.25}>0.25 kg (Sangat Santai)</option>
                    <option value={0.5}>0.5 kg (Direkomendasikan)</option>
                    <option value={0.75}>0.75 kg (Agresif)</option>
                    <option value={1.0}>1.0 kg (Sangat Agresif)</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1 ml-1">*Laju penurunan/kenaikan BB mingguan</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-gray-500 text-sm mb-4">Pilih satu atau buat tujuan kustom Anda sendiri.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
              {Object.values(Goal).map((goal) => (
                <button 
                  key={goal}
                  onClick={() => updateField('goal', goal)}
                  className={`w-full p-4 border-2 rounded-2xl flex items-center justify-between transition-all ${formData.goal === goal ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-50 bg-gray-50 text-gray-600 hover:border-gray-200'}`}
                >
                  <span className="font-bold text-sm text-left">{goal}</span>
                  {formData.goal === goal && <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2"><Check className="w-4 h-4 text-white" /></div>}
                </button>
              ))}
            </div>
            
            {formData.goal === Goal.CUSTOM && (
              <div className="mt-4 animate-slide-up">
                <label className="block text-xs font-bold text-primary-600 uppercase mb-2 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Ketik Tujuan Khusus Anda
                </label>
                <input 
                  type="text"
                  className="w-full px-4 py-4 border-2 border-primary-300 bg-white rounded-2xl shadow-inner focus:ring-4 focus:ring-primary-100 outline-none transition"
                  placeholder="Contoh: Turun 5kg dalam sebulan..."
                  value={customGoal}
                  onChange={e => setCustomGoal(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-gray-500 text-sm mb-4">Pilih alat yang Anda miliki atau bisa Anda akses.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(Equipment).map((eq) => (
                <button 
                  key={eq}
                  onClick={() => toggleEquipment(eq)}
                  className={`p-4 border-2 rounded-2xl flex items-center justify-between transition-all ${formData.equipment?.includes(eq) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-50 bg-gray-50 text-gray-600 hover:border-gray-200'}`}
                >
                  <span className="text-sm font-bold text-left">{eq}</span>
                  {formData.equipment?.includes(eq) && <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 ml-2"><Check className="w-3 h-3 text-white" /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={() => updateField('dietBudget', DietBudget.CHEAP)}
                className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${formData.dietBudget === DietBudget.CHEAP ? 'border-primary-500 bg-primary-50' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
              >
                <div className={`p-3 rounded-xl ${formData.dietBudget === DietBudget.CHEAP ? 'bg-primary-500 text-white' : 'bg-white text-gray-400'}`}><Wallet className="w-6 h-6" /></div>
                <div className="text-center">
                   <h4 className={`font-bold text-sm ${formData.dietBudget === DietBudget.CHEAP ? 'text-primary-700' : 'text-gray-700'}`}>Hemat</h4>
                   <p className="text-[10px] text-gray-400">Telur, Tempe, Tahu.</p>
                </div>
              </button>
              
              <button 
                onClick={() => updateField('dietBudget', DietBudget.MEDIUM)}
                className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${formData.dietBudget === DietBudget.MEDIUM ? 'border-primary-500 bg-primary-50' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
              >
                <div className={`p-3 rounded-xl ${formData.dietBudget === DietBudget.MEDIUM ? 'bg-primary-500 text-white' : 'bg-white text-gray-400'}`}><CreditCard className="w-6 h-6" /></div>
                <div className="text-center">
                   <h4 className={`font-bold text-sm ${formData.dietBudget === DietBudget.MEDIUM ? 'text-primary-700' : 'text-gray-700'}`}>Sedang</h4>
                   <p className="text-[10px] text-gray-400">Dada ayam, Buah.</p>
                </div>
              </button>

              <button 
                onClick={() => updateField('dietBudget', DietBudget.EXPENSIVE)}
                className={`p-5 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${formData.dietBudget === DietBudget.EXPENSIVE ? 'border-primary-500 bg-primary-50' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
              >
                <div className={`p-3 rounded-xl ${formData.dietBudget === DietBudget.EXPENSIVE ? 'bg-primary-500 text-white' : 'bg-white text-gray-400'}`}><DollarSign className="w-6 h-6" /></div>
                <div className="text-center">
                   <h4 className={`font-bold text-sm ${formData.dietBudget === DietBudget.EXPENSIVE ? 'text-primary-700' : 'text-gray-700'}`}>Premium</h4>
                   <p className="text-[10px] text-gray-400">Daging merah, Salmon.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-500" /> Riwayat Medis (Opsional)
              </label>
              <textarea 
                className="w-full px-4 py-3 border border-gray-100 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none h-20 resize-none transition"
                placeholder="Ada cedera atau penyakit tertentu?"
                value={formData.medicalHistory}
                onChange={e => updateField('medicalHistory', e.target.value)}
              />
            </div>

            <button 
              onClick={() => updateField('isSmoker', !formData.isSmoker)}
              className={`w-full p-4 border-2 rounded-2xl flex items-center gap-3 transition-all ${formData.isSmoker ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-gray-50 bg-gray-50 text-gray-500'}`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center border ${formData.isSmoker ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                {formData.isSmoker && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="font-medium text-sm">Saya perokok aktif</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between gap-4">
        {step > 1 ? (
          <button 
            onClick={handleBack}
            className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition"
            disabled={isLoading}
          >
            Kembali
          </button>
        ) : <div className="flex-1"></div>}

        {step < 5 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 && (!formData.name || !formData.age || !formData.height || !formData.weight || !formData.targetWeight || !formData.gender)}
            className="flex-1 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Lanjut <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={isLoading || (formData.goal === Goal.CUSTOM && !customGoal)}
            className="flex-1 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition shadow-xl shadow-primary-200 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Menganalisa...
              </>
            ) : "Buat Jadwal"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

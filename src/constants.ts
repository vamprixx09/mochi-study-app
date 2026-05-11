export interface ProfileTemplate {
  id: string;
  name: string;
  isPremium: boolean;
  borderColor: string;
  bgClass: string;
  icon?: string;
  description: string;
}

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  // FREE TEMPLATES (7)
  { id: 'free_1', name: 'Soft Cream', isPremium: false, borderColor: 'border-mochi-cream', bgClass: 'bg-mochi-cream/20', description: 'Classic Mochi vibe.' },
  { id: 'free_2', name: 'Lavender Blush', isPremium: false, borderColor: 'border-mochi-lavender', bgClass: 'bg-mochi-lavender/10', description: 'Gentle purple tones.' },
  { id: 'free_3', name: 'Mint Dream', isPremium: false, borderColor: 'border-mochi-mint', bgClass: 'bg-mochi-mint/10', description: 'Fresh and clean.' },
  { id: 'free_4', name: 'Sakura Petal', isPremium: false, borderColor: 'border-pink-200', bgClass: 'bg-pink-50', description: 'Springtime blossoms.' },
  { id: 'free_5', name: 'Sky High', isPremium: false, borderColor: 'border-blue-200', bgClass: 'bg-blue-50', description: 'Clear blue skies.' },
  { id: 'free_6', name: 'Peach Fuzz', isPremium: false, borderColor: 'border-orange-200', bgClass: 'bg-orange-50', description: 'Warm and fuzzy.' },
  { id: 'free_7', name: 'Simple Slate', isPremium: false, borderColor: 'border-gray-200', bgClass: 'bg-gray-50', description: 'Minimalist style.' },

  // PREMIUM TEMPLATES (20+)
  { id: 'pro_1', name: '✨ Magical Girl', isPremium: true, borderColor: 'border-pink-400 border-double', bgClass: 'bg-gradient-to-br from-pink-100 to-purple-100 shadow-pink-100 shadow-lg', description: 'Sparkly and powerful!' },
  { id: 'pro_2', name: '🍡 Mochi Master', isPremium: true, borderColor: 'border-mochi-pink border-4 border-dashed', bgClass: 'bg-white shadow-xl', description: 'For true mochi lovers.' },
  { id: 'pro_3', name: '🌙 Night Owl', isPremium: true, borderColor: 'border-indigo-400', bgClass: 'bg-slate-900 border-2 shadow-indigo-500/20 shadow-xl', description: 'Study into the deep night.' },
  { id: 'pro_4', name: '🍓 Berry Sweet', isPremium: true, borderColor: 'border-red-300', bgClass: 'bg-red-50 ring-4 ring-red-100 ring-offset-2', description: 'Sweet as a strawberry.' },
  { id: 'pro_5', name: '☁️ Cloud Nine', isPremium: true, borderColor: 'border-blue-100', bgClass: 'bg-white rounded-[2rem] border-4 shadow-inner', description: 'Floating on clouds.' },
  { id: 'pro_6', name: '🌿 Zen Garden', isPremium: true, borderColor: 'border-green-800/20', bgClass: 'bg-green-50/50 backdrop-blur-md border-t-4 border-green-400', description: 'Peaceful study space.' },
  { id: 'pro_7', name: '🎀 Princess Core', isPremium: true, borderColor: 'border-pink-300 border-4 border-dotted', bgClass: 'bg-pink-100/30', description: 'Royal aesthetics.' },
  { id: 'pro_8', name: '👾 Cyber Kawaii', isPremium: true, borderColor: 'border-cyan-400 border-2 shadow-[0_0_15px_rgba(34,211,238,0.5)]', bgClass: 'bg-black/90', description: 'Y2K glitch vibes.' },
  { id: 'pro_9', name: '🧸 Teddy Hug', isPremium: true, borderColor: 'border-amber-900/10', bgClass: 'bg-amber-100/50 rounded-full', description: 'Soft and cuddly.' },
  { id: 'pro_10', name: '☀️ Golden Hour', isPremium: true, borderColor: 'border-yellow-400', bgClass: 'bg-gradient-to-t from-orange-100 to-yellow-50', description: 'That perfect glow.' },
  { id: 'pro_11', name: '🌊 Ocean Wave', isPremium: true, borderColor: 'border-blue-400', bgClass: 'bg-gradient-to-b from-blue-50 to-cyan-50', description: 'Calm like the sea.' },
  { id: 'pro_12', name: '🍫 Choco Latte', isPremium: true, borderColor: 'border-amber-800', bgClass: 'bg-amber-50 shadow-md', description: 'Rich and cozy.' },
  { id: 'pro_13', name: '🦋 Butterfly', isPremium: true, borderColor: 'border-purple-300 border-x-4', bgClass: 'bg-white', description: 'Elegant transformation.' },
  { id: 'pro_14', name: '🛸 Space Cadet', isPremium: true, borderColor: 'border-slate-400 border-4 border-double', bgClass: 'bg-slate-800', description: 'Out of this world.' },
  { id: 'pro_15', name: '🧚 Fairy Dust', isPremium: true, borderColor: 'border-lime-200', bgClass: 'bg-lime-50/80 shadow-[0_0_10px_rgba(190,242,100,0.4)]', description: 'Magical forest feel.' },
  { id: 'pro_16', name: '🍮 Pudding Paws', isPremium: true, borderColor: 'border-yellow-200', bgClass: 'bg-yellow-50/90 border-b-8 border-yellow-100', description: 'Squishy and sweet.' },
  { id: 'pro_17', name: '🎨 Artist Studio', isPremium: true, borderColor: 'border-indigo-200 border-t-8', bgClass: 'bg-white', description: 'Canvas for your mind.' },
  { id: 'pro_18', name: '💎 Diamond Life', isPremium: true, borderColor: 'border-white', bgClass: 'bg-gradient-to-r from-blue-100 via-white to-pink-100 shadow-xl', description: 'Shine bright.' },
  { id: 'pro_19', name: '🍯 Honey Jar', isPremium: true, borderColor: 'border-yellow-600', bgClass: 'bg-yellow-50 ring-2 ring-yellow-400 shadow-inner', description: 'Sweetest focus.' },
  { id: 'pro_20', name: '🍀 Lucky Green', isPremium: true, borderColor: 'border-emerald-400', bgClass: 'bg-emerald-50', description: 'Good luck for exams!' },
  { id: 'pro_21', name: '🖤 Emo Kawaii', isPremium: true, borderColor: 'border-black border-4', bgClass: 'bg-gray-100 shadow-2xl', description: 'Dark but cute.' },
  { id: 'pro_22', name: '🍭 Candy Pop', isPremium: true, borderColor: 'border-pink-400 border-t-4 border-b-4', bgClass: 'bg-pink-50', description: 'Sugar rush focus.' },
];

import { Home, MessageSquare, BookOpen, Calendar, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { getTranslation } from "../lib/translations";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: string;
}

export const Navigation = ({ activeTab, setActiveTab, language }: NavigationProps) => {
  const t = (key: string) => getTranslation(language, key);

  const tabs = [
    { id: 'home', icon: Home, label: t('home'), color: 'bg-mochi-pink' },
    { id: 'ai', icon: MessageSquare, label: t('ai'), color: 'bg-mochi-lavender' },
    { id: 'flashcards', icon: BookOpen, label: t('flashcards'), color: 'bg-mochi-mint' },
    { id: 'planner', icon: Calendar, label: t('planner'), color: 'bg-mochi-blue' },
    { id: 'profile', icon: () => <span className="text-xl leading-none">ᯓᡣ𐭩</span>, label: t('profile'), color: 'bg-mochi-peach' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2">
      <div className="max-w-md mx-auto glass rounded-3xl flex justify-between items-center px-2 py-2 shadow-xl border-white/40">
        {tabs.map((tab) => {
          const Icon = tab.icon as any;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300",
                isActive ? "text-gray-800" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={cn("absolute inset-0 rounded-2xl opacity-40", tab.color)}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
              >
                {tab.id === 'profile' ? (
                  <Icon />
                ) : (
                  <Icon className={cn("w-6 h-6 z-10", isActive && "text-gray-800")} strokeWidth={isActive ? 2.5 : 2} />
                )}
              </motion.div>
              <span className={cn("text-[10px] mt-0.5 font-medium z-10", isActive ? "opacity-100" : "opacity-0")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

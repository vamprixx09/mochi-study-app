import { motion } from "motion/react";

export const MochiMascot = ({ size = "md", className = "", onClick }: { size?: "sm" | "md" | "lg", className?: string, onClick?: () => void }) => {
  const sizes = {
    sm: "w-16 h-12",
    md: "w-24 h-18",
    lg: "w-32 h-24"
  };

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 1.1 }}
      className={`relative ${sizes[size]} animate-mochi ${className} ${onClick ? 'cursor-pointer' : ''}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Mochi Body (Image) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <img 
          src="https://drive.google.com/uc?export=download&id=1QskuwmZXGoTYGqicXnZkj29qjA_hKKg7" 
          alt="Mochi Mascot" 
          className="w-full h-full object-contain drop-shadow-md"
        />
      </div>
      
      {/* Small Sparkles */}
      <motion.div 
        className="absolute -top-2 -right-2 text-xs"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
      >
        ✨
      </motion.div>
      <motion.div 
        className="absolute -bottom-1 -left-1 text-[10px]"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
      >
        🫧
      </motion.div>
    </motion.div>
  );
};

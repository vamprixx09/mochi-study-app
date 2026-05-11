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
      {/* Mochi Body */}
      <div className="absolute inset-0 bg-white rounded-[50%_50%_40%_40%] shadow-inner flex items-center justify-center overflow-hidden border-b-4 border-gray-100">
        {/* Blush */}
        <div className="absolute left-2 bottom-3 w-4 h-2 bg-pink-100 rounded-full blur-[1px]"></div>
        <div className="absolute right-2 bottom-3 w-4 h-2 bg-pink-100 rounded-full blur-[1px]"></div>
        
        {/* Eyes */}
        <div className="flex gap-4 mb-2">
          <motion.div 
            className="w-2 h-2 bg-gray-800 rounded-full relative"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 0.2] }}
          >
            <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
          </motion.div>
          <motion.div 
            className="w-2 h-2 bg-gray-800 rounded-full relative"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ repeat: Infinity, duration: 3, times: [0.1, 0.2, 0.3] }}
          >
            <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
          </motion.div>
        </div>
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

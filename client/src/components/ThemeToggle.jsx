import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
        theme === "dark"
          ? "bg-[#111] border-[#222] text-[#888] hover:text-white hover:bg-[#1a1a1a]"
          : "bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 shadow-sm"
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
      </motion.div>
    </button>
  );
}

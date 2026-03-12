import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi } from "lucide-react";

const AppLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 4000;
    const intervalTime = 40;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-24 w-24 rounded-full bg-[#e11d48]/10"
          />

          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            className="absolute h-32 w-32 rounded-full border border-[#e11d48]/20"
          />

          <div className="relative z-10 rounded-3xl vodacom-gradient p-4 shadow-xl">
            <Wifi className="h-8 w-8 text-white" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-6 text-xl font-extrabold tracking-tight text-foreground"
        >
          sConnecty
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          A preparar a melhor experiência...
        </motion.p>

        <div className="mt-6 w-56">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Carregando
            </span>
            <span className="text-sm font-bold text-[#e11d48]">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full vodacom-gradient"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLoader;
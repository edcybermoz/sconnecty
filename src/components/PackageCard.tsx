import { motion } from 'framer-motion';
import { Zap, Star } from 'lucide-react';
import { InternetPackage, formatMZN } from '@/lib/store';

interface PackageCardProps {
  pkg: InternetPackage;
  onBuy: (pkg: InternetPackage) => void;
  index: number;
}

const PackageCard = ({ pkg, onBuy, index }: PackageCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`relative rounded-2xl border-2 p-6 transition-all hover:scale-[1.02] hover:shadow-xl cursor-pointer ${
        pkg.popular
          ? 'border-primary bg-card shadow-lg'
          : 'border-border bg-card hover:border-primary/40'
      }`}
      onClick={() => onBuy(pkg)}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="vodacom-gradient text-primary-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3" /> Popular
          </span>
        </div>
      )}

      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl vodacom-gradient mb-3">
          <Zap className="h-7 w-7 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="text-2xl font-extrabold text-gradient">{pkg.data}</p>
          <p className="text-xs text-muted-foreground">{pkg.validity}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-foreground">{formatMZN(pkg.price)}</p>
          <button
            className="mt-2 vodacom-gradient text-primary-foreground text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onBuy(pkg);
            }}
          >
            Comprar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PackageCard;

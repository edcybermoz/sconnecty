import { motion } from 'framer-motion';
import {
  Zap,
  Star,
  Wifi,
  Clock,
  TrendingUp,
  CheckCircle,
  Music,
  Gift,
  Tv,
} from 'lucide-react';
import { formatMZN } from '@/lib/store';
import type { InternetPackage } from '@/lib/types';

interface PackageCardProps {
  pkg: InternetPackage;
  onBuy: (pkg: InternetPackage) => void;
  index: number;
}

function parseDataToGB(data?: string): number | null {
  if (!data) return null;

  const normalized = data.toUpperCase().replace(/\s+/g, '').replace(',', '.');

  // MB: "2.200MB", "12.100MB", "2200MB"
  const mbMatch = normalized.match(/(\d+(\.\d+)?)MB/);
  if (mbMatch) {
    const mbRaw = mbMatch[1].replace(/\./g, '');
    const mb = Number(mbRaw);
    if (!mb || Number.isNaN(mb)) return null;
    return mb / 1024;
  }

  // GB: "10.2GB"
  const gbMatch = normalized.match(/(\d+(\.\d+)?)GB/);
  if (gbMatch) {
    const gb = Number(gbMatch[1]);
    if (!gb || Number.isNaN(gb)) return null;
    return gb;
  }

  return null;
}

function providerLabel(provider?: InternetPackage['provider']) {
  if (!provider) return '';
  if (provider === 'AppleMusic') return 'Apple Music';
  if (provider === 'AppleGiftCard') return 'Apple';
  return provider;
}

function categoryLabel(cat: InternetPackage['category']) {
  switch (cat) {
    case 'diario': return 'Diário';
    case 'mensal': return 'Mensal';
    case 'chamadas': return 'Chamadas';
    case 'streaming': return 'Streaming';
    case 'giftcards': return 'Cartões';
    default: return 'Pacote';
  }
}

const PackageCard = ({ pkg, onBuy, index }: PackageCardProps) => {
  const Provider = providerLabel(pkg.provider);
  const Category = categoryLabel(pkg.category);

  const getCategoryIcon = () => {
    switch (pkg.category) {
      case 'diario':
        return <Wifi className="h-6 w-6 text-primary-foreground" />;
      case 'mensal':
        return <TrendingUp className="h-6 w-6 text-primary-foreground" />;
      case 'chamadas':
        return <Clock className="h-6 w-6 text-primary-foreground" />;
      case 'streaming':
        return pkg.provider === 'Netflix'
          ? <Tv className="h-6 w-6 text-primary-foreground" />
          : <Music className="h-6 w-6 text-primary-foreground" />;
      case 'giftcards':
        return <Gift className="h-6 w-6 text-primary-foreground" />;
      default:
        return <Zap className="h-6 w-6 text-primary-foreground" />;
    }
  };

  // Métrica principal e secundária
  const metricMain =
    pkg.category === 'giftcards'
      ? (pkg.notes ?? 'Código Digital')
      : pkg.category === 'streaming'
        ? (pkg.validity ?? 'Ativação rápida')
        : (pkg.data ?? '');

  const metricSub =
    pkg.category === 'giftcards'
      ? (Provider || 'Entrega digital')
      : pkg.category === 'streaming'
        ? (Provider ? `${Provider}${pkg.validity ? ` • ${pkg.validity}` : ''}` : (pkg.validity ?? ''))
        : (pkg.validity ?? '');

  // MT/GB só para pacotes com data
  const gb = parseDataToGB(pkg.data);
  const showPricePerGB =
    (pkg.category === 'diario' || pkg.category === 'mensal' || pkg.category === 'chamadas') && !!gb;
  const pricePerGB = showPricePerGB && gb ? Math.round(pkg.price / gb) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.32 }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className={`group relative rounded-3xl border bg-card shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden ${
        pkg.popular ? 'border-primary/40' : 'border-border'
      }`}
      onClick={() => onBuy(pkg)}
    >
      {/* Header do card (sem absolute) */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Popular (se existir) */}
          <div className="min-w-0">
            {pkg.popular && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full vodacom-gradient text-primary-foreground shadow-sm">
                <Star className="h-3 w-3 fill-current" />
                Popular
              </span>
            )}
          </div>

          {/* Right: Tags (provider + categoria) */}
          <div className="flex items-center gap-2 max-w-[60%] overflow-hidden">
            {Provider && (
              <span className="shrink min-w-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border bg-background text-foreground truncate">
                {Provider}
              </span>
            )}
            <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/15">
              {Category}
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6 pt-5 flex flex-col min-h-[320px]">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl vodacom-gradient flex items-center justify-center shadow-sm">
            {getCategoryIcon()}
          </div>

          <h3 className="mt-4 text-[17px] font-extrabold text-foreground tracking-tight line-clamp-1">
            {pkg.name}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2 min-h-[40px]">
            {pkg.description}
          </p>

          {pkg.notes && (
            <p className="mt-2 text-xs text-muted-foreground/90 line-clamp-1">
              {pkg.notes}
            </p>
          )}
        </div>

        {/* Trust row */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            Ativação
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            Suporte
          </span>
        </div>

        <div className="mt-5 border-t border-border" />

        {/* Bottom */}
        <div className="pt-5 mt-auto">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xl font-extrabold text-gradient leading-none truncate">
                {metricMain || '—'}
              </div>

              <div className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1 max-w-full overflow-hidden">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{metricSub || '—'}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xl font-extrabold text-foreground leading-none">
                {formatMZN(pkg.price)}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-2 vodacom-gradient text-primary-foreground text-sm font-extrabold px-5 py-2.5 rounded-2xl hover:opacity-95 transition-opacity shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onBuy(pkg);
                }}
              >
                Comprar
              </motion.button>
            </div>
          </div>

          {pricePerGB !== null && (
            <div className="mt-3 text-[11px] text-muted-foreground/70">
              ~{pricePerGB} MT/GB
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PackageCard;
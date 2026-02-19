import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Signal, Phone } from 'lucide-react';
import Header from '@/components/Header';
import PackageCard from '@/components/PackageCard';
import CheckoutModal from '@/components/CheckoutModal';
import { internetPackages, InternetPackage } from '@/lib/store';
import heroBg from '@/assets/hero-bg.jpg';

const categories = [
{ key: 'diario' as const, title: 'Diário | 24h', icon: Wifi },
{ key: 'mensal' as const, title: 'Mensal | 30 Dias', icon: Signal },
{ key: 'chamadas' as const, title: 'Chamadas Ilimitadas & SMSs', icon: Phone }];


const Index = () => {
  const [selectedPkg, setSelectedPkg] = useState<InternetPackage | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }} />

        <div className="absolute inset-0 vodacom-gradient-dark opacity-80" />
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-black text-primary-foreground leading-tight mb-4">
              ROCKVILLE
              <br />
              <span className="text-primary-foreground/80">Internet & Chamadas Ilimitadas</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-md mx-auto mb-8">
              Escolha o seu pacote de dados ou chamadas Vodacom e fique conectado!
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-primary-foreground/60 text-sm">Activação imediata • Paga Fácil • M-Pesa • E-Mola</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Packages by category */}
      {categories.map((cat) => {const pkgs = internetPackages.filter((p) => p.category === cat.key);
        return (
          <section key={cat.key} className="container mx-auto px-4 py-10 md:py-14">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl vodacom-gradient flex items-center justify-center">
                <cat.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">{cat.title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {pkgs.map((pkg, i) =>
              <PackageCard key={pkg.id} pkg={pkg} onBuy={setSelectedPkg} index={i} />
              )}
            </div>
          </section>);

      })}

      {/* Footer */}
      <footer className="vodacom-gradient-dark text-primary-foreground/70 text-center py-6 text-sm">
        <p className="font-semibold text-primary-foreground">© 2026 ROCKVILLE— Revendedor Autorizado Vodacom Moçambique</p>
        <p className="mt-1">WhatsApp: +258 85 600 1899 | +258 86 281 5574</p>
        <p className="mt-1 text-primary-foreground/50">Paga Fácil | M-Pesa | E-Mola</p>
      </footer>

      {/* Checkout Modal */}
      {selectedPkg &&
      <CheckoutModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
      }
    </div>);

};

export default Index;
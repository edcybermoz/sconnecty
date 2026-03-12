import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi,
  Signal,
  Phone,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Music,
  Gift,
  Search,
  Filter
} from 'lucide-react';

import Header from '@/components/Header';
import PackageCard from '@/components/PackageCard';
import CheckoutModal from '@/components/CheckoutModal';
import { internetPackages } from '@/lib/store';
import type { InternetPackage } from '@/lib/types';
import heroBg from '@/assets/hero-bg.jpg';

const categories = [
  { key: 'diario' as const, title: 'Diário', subtitle: '24h', icon: Wifi, description: 'Internet rápida para o dia a dia' },
  { key: 'mensal' as const, title: 'Mensal', subtitle: '30 dias', icon: Signal, description: 'Pacotes para o mês inteiro' },
  { key: 'chamadas' as const, title: 'Chamadas', subtitle: 'Ilimitadas', icon: Phone, description: 'Fale à vontade com quem quiser' },
  { key: 'streaming' as const, title: 'Streaming', subtitle: 'Spotify/Netflix', icon: Music, description: 'Assinaturas e entretenimento' },
  { key: 'giftcards' as const, title: 'Cartões', subtitle: 'Google/Apple', icon: Gift, description: 'Códigos digitais para apps e serviços' }
];

const DEFAULT_VISIBLE_PER_SECTION = 4;

const Index = () => {
  const [selectedPkg, setSelectedPkg] = useState<InternetPackage | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]['key'] | 'todas'>('todas');
  const [queryText, setQueryText] = useState('');

  const stats = [
    { label: 'Pacotes', value: internetPackages.length, icon: Zap },
    { label: 'Ativação', value: '24/7', icon: Shield },
  ];

  const scrollToPackages = () => {
    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSection = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const packagesByCategory = useMemo(() => {
    const map = new Map<string, InternetPackage[]>();
    for (const cat of categories) map.set(cat.key, []);
    for (const p of internetPackages) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, []);

  const filteredPackagesByCategory = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const result = new Map<string, InternetPackage[]>();

    for (const cat of categories) {
      const list = packagesByCategory.get(cat.key) ?? [];
      const filtered = !q
        ? list
        : list.filter((p) => {
            const hay = `${p.name} ${p.description ?? ''} ${p.data ?? ''} ${p.validity ?? ''} ${p.provider ?? ''}`.toLowerCase();
            return hay.includes(q);
          });
      result.set(cat.key, filtered);
    }

    return result;
  }, [packagesByCategory, queryText]);

  const totalVisibleCount = useMemo(() => {
    let count = 0;
    for (const cat of categories) count += (filteredPackagesByCategory.get(cat.key) ?? []).length;
    return count;
  }, [filteredPackagesByCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/65 to-background" />

        <div className="relative container mx-auto px-4 pt-14 pb-10 md:pt-20 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
              sConnecty
              <span className="block text-vodacom-red">Internet • Chamadas • Streaming</span>
            </h1>

            <p className="mt-4 text-white/80 text-base md:text-lg max-w-2xl">
              Selecione o pacote ideal e ative em minutos. Pagamento por M-Pesa, E-Mola ou pagar depois — suporte no WhatsApp.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={scrollToPackages}
                className="vodacom-gradient text-white font-bold px-7 py-3 rounded-xl hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                Ver Pacotes
                <ChevronDown className="h-4 w-4" />
              </button>

              <a
                href="https://wa.me/258856001899"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-7 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                WhatsApp
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-white/60 text-sm">
              <span className="px-3 py-1 bg-white/5 rounded-full">✓ M-Pesa</span>
              <span className="px-3 py-1 bg-white/5 rounded-full">✓ E-Mola</span>
              <span className="px-3 py-1 bg-white/5 rounded-full">✓ Ativação imediata</span>
            </div>
          </motion.div>

          <div className="mt-10" id="packages">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card/90 backdrop-blur rounded-3xl border border-border shadow-xl"
            >
              <div className="p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Pesquisar pacotes (ex: 22.200MB, chamadas, netflix...)"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Mostrando <span className="font-semibold">{totalVisibleCount}</span> resultados
                  </p>
                </div>

                <div className="flex gap-3">
                  {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                        <div className="w-10 h-10 rounded-xl vodacom-gradient flex items-center justify-center">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="leading-tight">
                          <div className="text-lg font-extrabold text-foreground">{s.value}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 md:px-5 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveCategory('todas')}
                    className={`px-4 py-2 rounded-2xl border text-sm font-semibold transition-colors inline-flex items-center gap-2 ${
                      activeCategory === 'todas'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    Todas
                  </button>

                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const count = (filteredPackagesByCategory.get(cat.key) ?? []).length;

                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-4 py-2 rounded-2xl border text-sm font-semibold transition-colors inline-flex items-center gap-2 ${
                          activeCategory === cat.key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {cat.title}
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-foreground/5 text-foreground">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-14">
        {categories
          .filter((cat) => activeCategory === 'todas' || cat.key === activeCategory)
          .map((cat) => {
            const pkgs = filteredPackagesByCategory.get(cat.key) ?? [];
            const Icon = cat.icon;

            if (pkgs.length === 0) return null;

            const isExpanded = !!expanded[cat.key];
            const hasMore = pkgs.length > DEFAULT_VISIBLE_PER_SECTION;
            const visiblePkgs = isExpanded ? pkgs : pkgs.slice(0, DEFAULT_VISIBLE_PER_SECTION);

            return (
              <section key={cat.key} className="py-8 md:py-10">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35 }}
                  className="flex items-end justify-between gap-3 mb-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl vodacom-gradient flex items-center justify-center shadow-sm">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                          {cat.title}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          • {cat.subtitle}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    </div>
                  </div>

                  {hasMore && (
                    <button
                      onClick={() => toggleSection(cat.key)}
                      className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-border bg-card hover:bg-muted transition-colors text-sm font-semibold"
                    >
                      {isExpanded ? (
                        <>Ver menos <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Ver mais <ChevronDown className="h-4 w-4" /></>
                      )}
                    </button>
                  )}
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {visiblePkgs.map((pkg, i) => (
                    <PackageCard key={pkg.id} pkg={pkg} onBuy={setSelectedPkg} index={i} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-5 flex flex-col sm:hidden gap-2">
                    <button
                      onClick={() => toggleSection(cat.key)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-border bg-card hover:bg-muted transition-colors text-sm font-semibold"
                    >
                      {isExpanded ? (
                        <>Ver menos <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Ver mais <ChevronDown className="h-4 w-4" /></>
                      )}
                    </button>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground text-center">
                        Mostrando {DEFAULT_VISIBLE_PER_SECTION} de {pkgs.length}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-10 border-t border-border" />
              </section>
            );
          })}
      </div>

      <section className="container mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg"
        >
          <div className="p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                Precisa de ajuda para escolher?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Fale com um consultor no WhatsApp e receba recomendação do pacote ideal para o seu uso.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/258856001899"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-7 py-3 rounded-2xl transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  Falar no WhatsApp
                </a>

                <button
                  onClick={scrollToPackages}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl border border-border bg-background hover:bg-muted transition-colors font-bold"
                >
                  Ver Pacotes
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="vodacom-gradient rounded-3xl p-6 md:p-8 text-white">
              <div className="text-sm text-white/80">Garantias</div>
              <ul className="mt-3 space-y-2 font-semibold">
                <li>✓ Ativação imediata</li>
                <li>✓ Suporte no WhatsApp</li>
                <li>✓ Pagamento M-Pesa / E-Mola / Depois</li>
                <li>✓ Referência sConnecty para rastreio do pedido</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </section>

<footer className="border-t border-border bg-card/80 backdrop-blur-sm">
  <div className="container mx-auto px-4 py-10">
    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
      <div className="text-center md:text-left">
        <div className="flex items-center justify-center gap-3 md:justify-start">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">
              sConnecty
            </h3>
            <p className="text-sm text-muted-foreground">
              Internet • Chamadas • Streaming
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Contactos</p>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>+258 85 600 1899</p>
          <p>+258 86 281 5574</p>
        </div>
      </div>

      <div className="text-center md:text-right">
        <p className="text-sm font-semibold text-foreground">Pagamentos</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-end">
          <span className="rounded-full bg-vodacom-red/10 px-3 py-1 text-xs font-semibold text-vodacom-red">
            Paga Fácil
          </span>
          <span className="rounded-full bg-vodacom-red/10 px-3 py-1 text-xs font-semibold text-vodacom-red">
            M-Pesa
          </span>
          <span className="rounded-full bg-vodacom-red/10 px-3 py-1 text-xs font-semibold text-vodacom-red">
            E-Mola
          </span>
        </div>
      </div>
    </div>

    <div className="mt-8 border-t border-border pt-4 text-center">
      <p className="text-sm text-muted-foreground">
        © 2026 sConnecty. Todos os direitos reservados.
      </p>
    </div>
  </div>
</footer>

      {selectedPkg && (
        <CheckoutModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
        />
      )}
    </div>
  );
};

export default Index;
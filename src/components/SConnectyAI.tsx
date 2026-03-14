import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Sparkles,
  Wallet,
  Phone,
  Wifi,
  Gift,
  Music,
  ArrowRight,
  CheckCircle2,
  User,
} from 'lucide-react';
import type { InternetPackage } from '@/lib/types';

type Category = InternetPackage['category'];

type Props = {
  packages: InternetPackage[];
  onSelectPackage?: (pkg: InternetPackage) => void;
  whatsappNumber?: string;
};

type BudgetBand = 'low' | 'mid' | 'high' | null;
type NeedType = Category | 'all' | null;
type IntentType =
  | 'cheap'
  | 'best'
  | 'popular'
  | 'budget'
  | 'streaming'
  | 'calls'
  | 'giftcards'
  | 'internet'
  | 'general';

type AssistantState = {
  need: NeedType;
  budgetBand: BudgetBand;
  days: number | null;
  query: string;
  intent: IntentType;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendations?: InternetPackage[];
};

const money = (value: number) => `${value.toLocaleString('pt-MZ')} MT`;

const quickPrompts = [
  'Quero internet barata',
  'Tenho 300 MT',
  'Quero o melhor pacote mensal',
  'Preciso Netflix',
  'Quero chamadas',
  'Mostra os mais vendidos',
  'Quero um gift card',
];

const categoryMeta: Record<Category, { label: string; icon: React.ReactNode }> = {
  diario: { label: 'Internet diária', icon: <Wifi className="h-4 w-4" /> },
  mensal: { label: 'Internet mensal', icon: <Wifi className="h-4 w-4" /> },
  chamadas: { label: 'Chamadas', icon: <Phone className="h-4 w-4" /> },
  streaming: { label: 'Streaming', icon: <Music className="h-4 w-4" /> },
  giftcards: { label: 'Gift Cards', icon: <Gift className="h-4 w-4" /> },
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractBudget(text: string): number | null {
  const normalized = text.replace(/\./g, '').replace(/,/g, '.');
  const match = normalized.match(/(\d{2,5})/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function detectNeed(text: string): NeedType {
  const t = normalizeText(text);

  if (t.includes('netflix') || t.includes('spotify') || t.includes('streaming') || t.includes('apple music')) return 'streaming';
  if (t.includes('gift') || t.includes('cartao') || t.includes('google play') || t.includes('apple gift')) return 'giftcards';
  if (t.includes('chamada') || t.includes('ligar') || t.includes('sms')) return 'chamadas';
  if (t.includes('mensal') || t.includes('30 dias') || t.includes('mes')) return 'mensal';
  if (t.includes('diario') || t.includes('24h') || t.includes('1 dia')) return 'diario';
  if (t.includes('internet') || t.includes('dados')) return 'all';

  return null;
}

function detectBudgetBand(text: string): BudgetBand {
  const n = extractBudget(text);
  if (n === null) return null;
  if (n <= 300) return 'low';
  if (n <= 800) return 'mid';
  return 'high';
}

function detectDays(text: string): number | null {
  const t = normalizeText(text);
  if (t.includes('24h') || t.includes('1 dia')) return 1;
  if (t.includes('7 dias')) return 7;
  if (t.includes('15 dias')) return 15;
  if (t.includes('30 dias') || t.includes('1 mes')) return 30;
  return null;
}

function detectIntent(text: string): IntentType {
  const t = normalizeText(text);

  if (t.includes('barato') || t.includes('economico') || t.includes('mais barato')) return 'cheap';
  if (t.includes('melhor') || t.includes('recomenda') || t.includes('top')) return 'best';
  if (t.includes('popular') || t.includes('mais vendido') || t.includes('mais vendidos')) return 'popular';
  if (t.includes('orcamento') || /\d+/.test(t) || t.includes('tenho')) return 'budget';
  if (t.includes('netflix') || t.includes('spotify') || t.includes('streaming')) return 'streaming';
  if (t.includes('chamada') || t.includes('ligar')) return 'calls';
  if (t.includes('gift') || t.includes('cartao')) return 'giftcards';
  if (t.includes('internet') || t.includes('dados')) return 'internet';

  return 'general';
}

function scorePackage(pkg: InternetPackage, state: AssistantState, rawBudget: number | null) {
  let score = 0;

  if (state.need && state.need !== 'all') {
    if (pkg.category === state.need) score += 7;
  } else if (state.need === 'all') {
    if (pkg.category === 'diario' || pkg.category === 'mensal') score += 5;
  }

  if (state.days !== null) {
    if (state.days <= 1 && pkg.category === 'diario') score += 4;
    if (state.days >= 30 && (pkg.category === 'mensal' || pkg.category === 'streaming' || pkg.category === 'chamadas')) score += 4;
  }

  if (state.budgetBand === 'low' && pkg.price <= 300) score += 5;
  if (state.budgetBand === 'mid' && pkg.price > 300 && pkg.price <= 800) score += 5;
  if (state.budgetBand === 'high' && pkg.price > 800) score += 5;

  if (rawBudget !== null) {
    const diff = Math.abs(pkg.price - rawBudget);
    score += Math.max(0, 7 - diff / 100);

    if (pkg.price <= rawBudget) score += 3;
    if (pkg.price > rawBudget) score -= 1;
  }

  if (state.intent === 'cheap') {
    score += Math.max(0, 5 - pkg.price / 150);
  }

  if (state.intent === 'popular' && pkg.popular) {
    score += 5;
  }

  if (state.intent === 'best') {
    score += pkg.popular ? 3 : 1;
    if (pkg.price >= 300) score += 1;
  }

  if (pkg.popular) score += 1.5;

  return score;
}

function buildRecommendation(packages: InternetPackage[], state: AssistantState) {
  const rawBudget = extractBudget(state.query);

  return [...packages]
    .map((pkg) => ({ pkg, score: scorePackage(pkg, state, rawBudget) }))
    .sort((a, b) => b.score - a.score || a.pkg.price - b.pkg.price)
    .map((x) => x.pkg)
    .slice(0, 3);
}

function buildAssistantReply(state: AssistantState, recs: InternetPackage[]) {
  if (!state.query.trim()) {
    return {
      text: 'Olá. Posso recomendar pacotes por orçamento, duração, internet, chamadas, streaming e gift cards.',
      cta: 'Escolhe uma sugestão rápida abaixo.',
    };
  }

  if (!recs.length) {
    return {
      text: 'Não encontrei uma opção exata para o teu pedido, mas posso sugerir alternativas próximas.',
      cta: 'Tenta indicar orçamento, duração ou tipo de serviço.',
    };
  }

  const budget = extractBudget(state.query);
  const first = recs[0];
  const reasons: string[] = [];

  if (state.need && state.need !== 'all') {
    reasons.push(categoryMeta[state.need].label.toLowerCase());
  }

  if (budget !== null) {
    reasons.push(`orçamento de ${money(budget)}`);
  }

  if (state.days) {
    reasons.push(`${state.days} dia${state.days > 1 ? 's' : ''}`);
  }

  let intro = `A melhor opção para ti agora é ${first.name} por ${money(first.price)}.`;
  if (reasons.length) {
    intro += ` Baseei-me em ${reasons.join(', ')}.`;
  }

  let cta = 'Também selecionei mais opções próximas para comparares.';
  if (state.intent === 'cheap') cta = 'Priorizei opções mais económicas.';
  if (state.intent === 'popular') cta = 'Priorizei pacotes populares e fáceis de escolher.';
  if (state.intent === 'best') cta = 'Priorizei as opções mais fortes e relevantes.';

  return { text: intro, cta };
}

export default function SConnectyAI({
  packages,
  onSelectPackage,
  whatsappNumber = '258856001899',
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [state, setState] = useState<AssistantState>({
    need: null,
    budgetBand: null,
    days: null,
    query: '',
    intent: 'general',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Olá. Sou a sConnecty AI. Posso ajudar-te a encontrar o melhor pacote por preço, duração ou necessidade.',
    },
  ]);

  const recommendations = useMemo(() => {
    if (!state.query.trim()) return packages.filter((p) => p.popular).slice(0, 3);
    return buildRecommendation(packages, state);
  }, [packages, state]);

  const insight = useMemo(() => {
    const reply = buildAssistantReply(state, recommendations);
    return reply;
  }, [state, recommendations]);

  const submitQuery = (value?: string) => {
    const q = (value ?? input).trim();
    if (!q) return;

    const nextState: AssistantState = {
      need: detectNeed(q),
      budgetBand: detectBudgetBand(q),
      days: detectDays(q),
      query: q,
      intent: detectIntent(q),
    };

    const recs = buildRecommendation(packages, nextState);
    const reply = buildAssistantReply(nextState, recs);

    setState(nextState);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: q,
      },
      {
        id: `assistant-${Date.now() + 1}`,
        role: 'assistant',
        text: `${reply.text} ${reply.cta}`,
        recommendations: recs,
      },
    ]);

    setInput('');
  };

  const openWhatsApp = (pkg?: InternetPackage) => {
    const text = pkg
      ? `Olá, quero ajuda com o produto ${pkg.name} (${money(pkg.price)}).`
      : `Olá, quero ajuda para escolher um pacote no sConnecty.`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-white shadow-2xl vodacom-gradient"
      >
        <div className="rounded-xl bg-white/15 p-2">
          <Bot className="h-5 w-5" />
        </div>

        <div className="hidden text-left sm:block">
          <div className="text-sm font-extrabold leading-none">sConnecty AI</div>
          <div className="mt-1 text-[11px] text-white/80">Assistente inteligente</div>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/40"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="glass-card fixed bottom-5 right-5 z-50 w-[95vw] max-w-[430px] overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-2xl"
            >
              <div className="vodacom-gradient p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/15 p-2.5">
                      <Sparkles className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold leading-none">sConnecty AI</h3>
                      <p className="mt-2 text-sm text-white/80">
                        Recomenda pacotes, serviços digitais e ajuda na escolha certa.
                      </p>
                    </div>
                  </div>

                  <button onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-2 hover:bg-white/15">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <MessageCircle className="h-4 w-4" />
                    Análise atual
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {insight.text} {insight.cta}
                  </p>
                </div>

                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-2xl p-4 ${
                        msg.role === 'assistant'
                          ? 'border border-slate-200 bg-white'
                          : 'ml-8 bg-slate-900 text-white'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                        {msg.role === 'assistant' ? (
                          <>
                            <Bot className="h-4 w-4" />
                            Assistente
                          </>
                        ) : (
                          <>
                            <User className="h-4 w-4" />
                            Tu
                          </>
                        )}
                      </div>

                      <p className={`text-sm leading-6 ${msg.role === 'assistant' ? 'text-slate-700' : 'text-white'}`}>
                        {msg.text}
                      </p>

                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {msg.recommendations.map((pkg) => (
                            <div key={pkg.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                                    {categoryMeta[pkg.category].icon}
                                    {categoryMeta[pkg.category].label}
                                  </div>

                                  <h4 className="mt-2 font-extrabold text-slate-900">{pkg.name}</h4>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {pkg.description || 'Opção recomendada com base no teu pedido.'}
                                  </p>
                                </div>

                                {pkg.popular && (
                                  <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-700">
                                    Popular
                                  </span>
                                )}
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-lg font-extrabold text-slate-900">{money(pkg.price)}</div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {pkg.data || pkg.validity || pkg.notes || 'Disponível agora'}
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openWhatsApp(pkg)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    WhatsApp
                                  </button>

                                  <button
                                    onClick={() => onSelectPackage?.(pkg)}
                                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold text-white vodacom-gradient"
                                  >
                                    Escolher
                                    <ArrowRight className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sugestões rápidas
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((item) => (
                      <button
                        key={item}
                        onClick={() => submitQuery(item)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    O que esta IA faz
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-emerald-900 sm:grid-cols-2">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                      <Wallet className="h-4 w-4" />
                      Recomenda por orçamento
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                      <Wifi className="h-4 w-4" />
                      Filtra internet e duração
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                      <Music className="h-4 w-4" />
                      Sugere streaming
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
                      <Gift className="h-4 w-4" />
                      Ajuda com gift cards
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitQuery()}
                    placeholder="Ex: tenho 500 MT e quero internet para 30 dias"
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />

                  <button
                    onClick={() => submitQuery()}
                    className="rounded-2xl p-3 text-white shadow-md vodacom-gradient"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
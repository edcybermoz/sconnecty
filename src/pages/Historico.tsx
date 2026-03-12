import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Calendar,
  Clock,
  Tag,
  Printer,
  FileDown,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Download,
  Smartphone,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  DollarSign,
  Wifi,
  X,
  LogIn,
  type LucideIcon,
} from 'lucide-react';

import Header from '@/components/Header';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { Order, PaymentMethod } from '@/lib/types';
import {
  getOrdersByPhone,
  formatMZN,
  formatDate,
  validatePhoneNumber,
  cleanPhoneNumber,
  formatPhoneNumber,
  getPaymentNumber,
} from '@/lib/store';

type OrderStatus = Order['status'];

type StatusConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
};

type PaymentConfig = {
  label: string;
  color: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pendente: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
  },
  confirmado: {
    label: 'Confirmado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
};

const PAYMENT_CONFIG: Record<NonNullable<PaymentMethod>, PaymentConfig> = {
  mpesa: { label: 'M-Pesa', color: 'bg-green-100 text-green-700' },
  emola: { label: 'E-Mola', color: 'bg-yellow-100 text-yellow-700' },
  later: { label: 'Pagar Depois', color: 'bg-blue-100 text-blue-700' },
};

const LS_PHONE_KEY = 'sconnecty_user_phone';

type Stats = {
  total: number;
  totalValue: number;
  confirmed: number;
  pending: number;
};

const Historico = () => {
  const [userPhone, setUserPhone] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    totalValue: 0,
    confirmed: 0,
    pending: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem(LS_PHONE_KEY);

    if (saved && validatePhoneNumber(saved)) {
      setUserPhone(saved);
      setShowLogin(false);
    } else {
      setShowLogin(true);
      setLoading(false);
    }
  }, []);

  const loadOrders = async (phoneClean: string) => {
    try {
      setLoading(true);

      const data = await getOrdersByPhone(phoneClean);

      const sorted = [...data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setOrders(sorted);

      const confirmed = sorted.filter((o) => o.status === 'confirmado').length;
      const pending = sorted.filter((o) => o.status === 'pendente').length;
      const totalValue = sorted
        .filter((o) => o.status === 'confirmado')
        .reduce((sum, o) => sum + (o.price || 0), 0);

      setStats({
        total: sorted.length,
        totalValue,
        confirmed,
        pending,
      });
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setOrders([]);
      setFilteredOrders([]);
      setStats({
        total: 0,
        totalValue: 0,
        confirmed: 0,
        pending: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userPhone) {
      void loadOrders(userPhone);
    }
  }, [userPhone]);

  useEffect(() => {
    let filtered = [...orders];

    if (filter !== 'all') {
      filtered = filtered.filter((order) => order.status === filter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      filtered = filtered.filter((order) => {
        const reference = order.reference?.toLowerCase() ?? '';
        const customerName = order.customerName?.toLowerCase() ?? '';
        const customerPhone = order.customerPhone ?? '';
        const packageName = order.packageName?.toLowerCase() ?? '';

        return (
          reference.includes(term) ||
          customerName.includes(term) ||
          customerPhone.includes(term) ||
          packageName.includes(term)
        );
      });
    }

    setFilteredOrders(filtered);
  }, [filter, searchTerm, orders]);

  const getPaymentBadge = (method?: PaymentMethod) => {
    if (!method) return null;

    const config = PAYMENT_CONFIG[method];
    if (!config) return null;

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentLabel = (method?: PaymentMethod) => {
    if (!method) return 'Não especificado';
    return PAYMENT_CONFIG[method]?.label ?? 'Não especificado';
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const paymentMethod = getPaymentLabel(order.paymentMethod);

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprovativo - ${order.reference}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { color: #ed1c24; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { color: #666; font-size: 14px; }
            .content { border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px dashed #eee; gap: 16px; }
            .label { color: #666; font-weight: normal; }
            .value { font-weight: bold; color: #333; text-align: right; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">sConnecty</div>
            <div class="subtitle">Comprovativo de compra</div>
          </div>

          <div class="content">
            <div class="row"><span class="label">Referência:</span><span class="value">${order.reference}</span></div>
            <div class="row"><span class="label">Cliente:</span><span class="value">${order.customerName || 'N/A'}</span></div>
            <div class="row"><span class="label">Telefone:</span><span class="value">${order.customerPhone || 'N/A'}</span></div>
            <div class="row"><span class="label">Produto:</span><span class="value">${order.packageName || 'N/A'}</span></div>
            <div class="row"><span class="label">Valor:</span><span class="value">${formatMZN(order.price || 0)}</span></div>
            <div class="row"><span class="label">Data:</span><span class="value">${formatDate(order.date)}</span></div>
            <div class="row"><span class="label">Pagamento:</span><span class="value">${paymentMethod}</span></div>

            <div class="row">
              <span class="label">Status:</span>
              <span class="value">
                <span class="status" style="background: ${
                  order.status === 'confirmado'
                    ? '#d4edda'
                    : order.status === 'pendente'
                    ? '#fff3cd'
                    : '#f8d7da'
                }; color: ${
                  order.status === 'confirmado'
                    ? '#155724'
                    : order.status === 'pendente'
                    ? '#856404'
                    : '#721c24'
                }">
                  ${order.status.toUpperCase()}
                </span>
              </span>
            </div>
          </div>

          <div class="footer">
            <p>Para mais informações, contacte +258 85 600 1899</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPDF = (order: Order) => {
    const doc = new jsPDF();
    const paymentMethod = getPaymentLabel(order.paymentMethod);

    doc.setFillColor(237, 28, 36);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('sConnecty', 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprovativo de compra', 105, 33, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhes', 105, 55, { align: 'center' });

    autoTable(doc, {
      startY: 65,
      head: [['Campo', 'Valor']],
      body: [
        ['Referência', order.reference ?? 'N/A'],
        ['Cliente', order.customerName || 'N/A'],
        ['Telefone', order.customerPhone || 'N/A'],
        ['Produto', order.packageName || 'N/A'],
        ['Valor', formatMZN(order.price || 0)],
        ['Data', formatDate(order.date)],
        ['Método Pagamento', paymentMethod],
        ['Status', order.status.toUpperCase()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [237, 28, 36] },
      styles: { fontSize: 10 },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150;

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Para mais informações, contacte +258 85 600 1899',
      105,
      finalY + 20,
      { align: 'center' }
    );

    doc.save(`compra_${order.reference}.pdf`);
  };

  const handleDownloadAllPDF = () => {
    const doc = new jsPDF();

    doc.setFillColor(237, 28, 36);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('sConnecty', 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Histórico de compras', 105, 33, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo', 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Telefone: ${formatPhoneNumber(userPhone)}`, 20, 63);
    doc.text(`Total: ${stats.total}`, 20, 70);
    doc.text(`Confirmadas: ${stats.confirmed}`, 20, 77);
    doc.text(`Pendentes: ${stats.pending}`, 20, 84);
    doc.text(`Valor total: ${formatMZN(stats.totalValue)}`, 20, 91);

    autoTable(doc, {
      startY: 105,
      head: [['Referência', 'Cliente', 'Produto', 'Valor', 'Data', 'Status']],
      body: filteredOrders.map((order) => [
        order.reference ?? 'N/A',
        order.customerName || 'N/A',
        order.packageName || 'N/A',
        formatMZN(order.price || 0),
        formatDate(order.date),
        order.status.toUpperCase(),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [237, 28, 36] },
      styles: { fontSize: 8 },
    });

    doc.save('historico_compras.pdf');
  };

  const PhoneLoginModal = () => {
    const [phoneInput, setPhoneInput] = useState('');
    const [err, setErr] = useState('');

    const onLogin = () => {
      const cleaned = cleanPhoneNumber(phoneInput);

      if (!cleaned || !validatePhoneNumber(cleaned)) {
        setErr('Número inválido. Use 84/85/86/87 + 7 dígitos (ex: 84 123 4567)');
        return;
      }

      localStorage.setItem(LS_PHONE_KEY, cleaned);
      setUserPhone(cleaned);
      setShowLogin(false);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden"
        >
          <div className="vodacom-gradient p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-extrabold">Ver meu histórico</h2>
                <p className="text-white/80 text-sm mt-1">
                  Informe o número para carregar as suas compras.
                </p>
              </div>

              <button
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
                onClick={() => setShowLogin(false)}
                aria-label="Fechar"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Seu número</label>

              <div className="mt-2 relative">
                <Smartphone className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setErr('');
                  }}
                  placeholder="84 123 4567"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30"
                  inputMode="numeric"
                />
              </div>

              {err && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {err}
                </p>
              )}
            </div>

            <button
              onClick={onLogin}
              className="w-full vodacom-gradient text-white font-extrabold py-3 rounded-2xl inline-flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
              type="button"
            >
              <LogIn className="h-5 w-5" />
              Entrar
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Pagamentos: M-Pesa {getPaymentNumber('mpesa')} • E-Mola {getPaymentNumber('emola')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <History className="h-8 w-8 text-primary" />
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold text-foreground">
                    Meu Histórico de Compras
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {userPhone
                      ? `Telefone: ${formatPhoneNumber(userPhone)}`
                      : 'Entre com o seu número para ver o histórico'}
                  </p>
                </div>
              </div>

              {userPhone && (
                <button
                  onClick={() => {
                    localStorage.removeItem(LS_PHONE_KEY);
                    setUserPhone('');
                    setOrders([]);
                    setFilteredOrders([]);
                    setStats({
                      total: 0,
                      totalValue: 0,
                      confirmed: 0,
                      pending: 0,
                    });
                    setShowLogin(true);
                  }}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-semibold"
                  type="button"
                >
                  Trocar número
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Package} label="Total" value={stats.total.toString()} color="bg-blue-500" />
              <StatCard icon={CheckCircle} label="Confirmadas" value={stats.confirmed.toString()} color="bg-green-500" />
              <StatCard icon={AlertCircle} label="Pendentes" value={stats.pending.toString()} color="bg-yellow-500" />
              <StatCard icon={DollarSign} label="Valor Total" value={formatMZN(stats.totalValue)} color="bg-purple-500" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por referência, pacote, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={!userPhone}
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <select
                  className="pl-10 pr-8 py-2 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
                  disabled={!userPhone}
                >
                  <option value="all">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              </div>

              {filteredOrders.length > 0 && (
                <button
                  onClick={handleDownloadAllPDF}
                  className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
                  title="Exportar todos"
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              )}
            </div>
          </div>

          {!userPhone ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-12 text-center border border-border"
            >
              <Smartphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-foreground mb-2">
                Entre com o seu número para ver o histórico
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="mt-2 vodacom-gradient text-white font-extrabold px-6 py-3 rounded-2xl"
                type="button"
              >
                Informar número
              </button>
            </motion.div>
          ) : loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-4">Carregando histórico...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-12 text-center border-2 border-dashed border-muted"
            >
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-medium text-foreground mb-2">
                Nenhuma compra encontrada
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filter !== 'all'
                  ? 'Tente ajustar os filtros para ver mais resultados'
                  : 'Você ainda não realizou nenhuma compra com este número'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredOrders.map((order, index) => {
                  const StatusIcon = STATUS_CONFIG[order.status].icon;
                  const formattedDate = formatDate(order.date).split(' ');
                  const datePart = formattedDate[0] ?? '';
                  const timePart = formattedDate[1] ?? '';

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-mono bg-primary/5 px-3 py-1 rounded-full text-primary font-semibold">
                              {order.reference}
                            </span>

                            <span
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[order.status].color}`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {STATUS_CONFIG[order.status].label}
                            </span>

                            {getPaymentBadge(order.paymentMethod)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {order.customerName || 'Cliente não informado'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <span>{order.customerPhone || 'Telefone não informado'}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{order.packageName}</span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{datePart}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{timePart}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row lg:flex-col items-center lg:items-end gap-4 lg:gap-2">
                          <span className="text-2xl font-extrabold text-primary">
                            {formatMZN(order.price || 0)}
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePrint(order)}
                              className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                              title="Imprimir comprovativo"
                              type="button"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDownloadPDF(order)}
                              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                              title="Baixar PDF"
                              type="button"
                            >
                              <FileDown className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                              title="Ver detalhes"
                              type="button"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div className="text-right text-sm text-muted-foreground">
                Mostrando {filteredOrders.length} compras
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onPrint={handlePrint}
            onDownload={handleDownloadPDF}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{showLogin && <PhoneLoginModal />}</AnimatePresence>

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
    </>
  );
};

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
};

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-xl p-4 shadow-sm border border-border"
  >
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-2`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <p className="text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </motion.div>
);

type OrderDetailsModalProps = {
  order: Order;
  onClose: () => void;
  onPrint: (order: Order) => void;
  onDownload: (order: Order) => void;
};

const OrderDetailsModal = ({
  order,
  onClose,
  onPrint,
  onDownload,
}: OrderDetailsModalProps) => {
  const StatusIcon = STATUS_CONFIG[order.status].icon;
  const paymentMethod = order.paymentMethod
    ? PAYMENT_CONFIG[order.paymentMethod]?.label ?? 'Não especificado'
    : 'Não especificado';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="bg-card rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="vodacom-gradient p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Detalhes da Compra</h2>
              <p className="text-white/80 text-sm mt-1">{order.reference}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <span className="text-muted-foreground">Status</span>
            <span
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${STATUS_CONFIG[order.status].color}`}
            >
              <StatusIcon className="h-4 w-4" />
              {STATUS_CONFIG[order.status].label}
            </span>
          </div>

          <DetailRow icon={User} label="Cliente" value={order.customerName || 'Não informado'} />
          <DetailRow icon={Smartphone} label="Telefone" value={order.customerPhone || 'Não informado'} />
          <DetailRow icon={Tag} label="Produto" value={order.packageName || 'Não informado'} />
          <DetailRow icon={DollarSign} label="Valor" value={formatMZN(order.price || 0)} />
          <DetailRow icon={Smartphone} label="Pagamento" value={paymentMethod} />
          <DetailRow icon={Calendar} label="Data" value={formatDate(order.date)} />

          <div className="flex gap-2 pt-4 border-t border-border">
            <button
              onClick={() => {
                onPrint(order);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:bg-muted transition-colors"
              type="button"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>

            <button
              onClick={() => {
                onDownload(order);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl vodacom-gradient text-white hover:opacity-90 transition-opacity"
              type="button"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

type DetailRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

const DetailRow = ({ icon: Icon, label, value }: DetailRowProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-sm font-medium text-foreground text-right">{value}</span>
  </div>
);

export default Historico;
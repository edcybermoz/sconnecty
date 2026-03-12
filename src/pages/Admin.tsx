import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Package, Clock, CheckCircle, XCircle, Trash2,
  RefreshCw, Edit3, DollarSign, AlertTriangle, Search,
  ArrowUpDown, EyeOff, Eye, X, Smartphone, User, Tag,
  LogOut, Copy, Calendar, Filter, Download
} from 'lucide-react';

import Header from '@/components/Header';
import {
  getOrders,
  updateOrder,
  deleteOrder,
  formatMZN,
  confirmPayment,
  cancelOrder,
  markAsPending,
  getOrderStats,
  formatDate,
  validatePhoneNumber,
  cleanPhoneNumber,
  getPaymentMethodLabel
} from '@/lib/store';
import type { Order, OrderStats, PaymentMethod } from '@/lib/types';

const ADMIN_PIN = '0698';

// sessão admin
const ADMIN_SESSION_KEY = 'rockville_admin_session';
const SESSION_HOURS = 24;

type DatePreset = 'all' | 'today' | '7d' | '30d';

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);

  const [filter, setFilter] = useState<'todos' | 'pendente' | 'confirmado' | 'cancelado'>('todos');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [sortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showStats, setShowStats] = useState(true);

  // ============================
  // Sessão persistente
  // ============================
  useEffect(() => {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return;

    try {
      const { expiresAt } = JSON.parse(raw);
      if (typeof expiresAt === 'number' && Date.now() < expiresAt) {
        setAuthenticated(true);
      } else {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, []);

  const saveSession = () => {
    const hours = remember ? SESSION_HOURS : 2;
    const expiresAt = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ expiresAt }));
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthenticated(false);
    setPin('');
  };

  // ============================
  // Carregar pedidos
  // ============================
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(sorted);

      const orderStats = await getOrderStats();
      setStats(orderStats);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) loadOrders();
  }, [authenticated]);

  // ============================
  // Login admin
  // ============================
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      saveSession();
    } else {
      alert('PIN incorreto');
    }
  };

  // ============================
  // Ações
  // ============================
  const handleQuickAction = async (id: string, action: 'confirm' | 'cancel' | 'pending') => {
    try {
      switch (action) {
        case 'confirm':
          await confirmPayment(id);
          break;
        case 'cancel':
          await cancelOrder(id);
          break;
        case 'pending':
          await markAsPending(id);
          break;
      }
      await loadOrders();
    } catch (err) {
      console.error('Erro na ação rápida:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id);
      setDeleteConfirm(null);
      await loadOrders();
    } catch (err) {
      console.error('Erro ao deletar pedido:', err);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const cleanedPhone = cleanPhoneNumber(editingOrder.customerPhone);
    if (!validatePhoneNumber(cleanedPhone)) {
      alert('Número de telefone inválido');
      return;
    }

    try {
      await updateOrder(editingOrder.id, {
        customerName: editingOrder.customerName,
        customerPhone: cleanedPhone, // ✅ salva limpo
        status: editingOrder.status,
      });
      setEditingOrder(null);
      await loadOrders();
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
    }
  };

  // ============================
  // Filtros (status + pagamento + data + search)
  // ============================
  const withinPreset = (iso: string) => {
    if (datePreset === 'all') return true;

    const d = new Date(iso);
    const now = new Date();
    const start = new Date(now);

    if (datePreset === 'today') {
      start.setHours(0, 0, 0, 0);
      return d >= start && d <= now;
    }

    if (datePreset === '7d') {
      start.setDate(now.getDate() - 7);
      return d >= start && d <= now;
    }

    if (datePreset === '30d') {
      start.setDate(now.getDate() - 30);
      return d >= start && d <= now;
    }

    return true;
  };

  const filteredAndSorted = useMemo(() => {
    return orders
      .filter(o => filter === 'todos' || o.status === filter)
      .filter(o => paymentFilter === 'all' || (o.paymentMethod ?? null) === paymentFilter)
      .filter(o => withinPreset(o.date))
      .filter(o =>
        searchTerm === '' ||
        o.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone?.includes(searchTerm) ||
        o.packageName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'desc'
            ? new Date(b.date).getTime() - new Date(a.date).getTime()
            : new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'price') {
          return sortOrder === 'desc'
            ? (b.price || 0) - (a.price || 0)
            : (a.price || 0) - (b.price || 0);
        }
        return 0;
      });
  }, [orders, filter, paymentFilter, datePreset, searchTerm, sortBy, sortOrder]);

  const statusBadge = (status: Order['status']) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmado: 'bg-green-100 text-green-800 border-green-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      cancelado: 'Cancelado',
    };
    return (
      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const exportCSV = () => {
    const header = ['Referencia', 'Cliente', 'Telefone', 'Pacote', 'Valor', 'Data', 'Status', 'Pagamento'];
    const rows = filteredAndSorted.map(o => [
      o.reference ?? '',
      o.customerName ?? '',
      o.customerPhone ?? '',
      o.packageName ?? '',
      String(o.price ?? 0),
      o.date ?? '',
      o.status ?? '',
      o.paymentMethod ?? '',
    ]);

    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_admin_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================
  // UI: Login
  // ============================
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl shadow-xl p-8 w-full max-w-sm border border-border"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl vodacom-gradient mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Iniciar sessão</h2>
              <p className="text-sm text-muted-foreground mt-1">Área administrativa</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="• • • •"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Manter sessão (24h)
              </label>

              <button
                type="submit"
                className="w-full vodacom-gradient text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Entrar
              </button>
            </form>
          </motion.div>
        </div>

        <footer className="bg-card border-t border-border py-8 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <p className="font-semibold text-foreground">© 2026 ROCKVILLE — Moçambique</p>
            <p className="mt-2 text-muted-foreground">WhatsApp: +258 85 600 1899 | +258 86 281 5574</p>
            <p className="mt-1 text-muted-foreground/70 text-sm">Paga Fácil | M-Pesa | E-Mola</p>
          </div>
        </footer>
      </div>
    );
  }

  // ============================
  // UI: Admin Panel
  // ============================
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Top */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-sm text-muted-foreground">Gestão de pedidos e pagamentos</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              title={showStats ? 'Ocultar estatísticas' : 'Mostrar estatísticas'}
            >
              {showStats ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>

            <button
              onClick={loadOrders}
              className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              title="Ordenar por data"
            >
              <ArrowUpDown className="h-5 w-5" />
            </button>

            <button
              onClick={exportCSV}
              disabled={filteredAndSorted.length === 0}
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              title="Exportar CSV"
            >
              <Download className="h-5 w-5" />
            </button>

            <button
              onClick={logout}
              className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
              title="Terminar sessão"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total" value={stats.total.toString()} icon={Package} color="bg-blue-500" />
            <StatCard label="Pendentes" value={stats.pending.toString()} icon={Clock} color="bg-yellow-500" />
            <StatCard label="Confirmados" value={stats.completed.toString()} icon={CheckCircle} color="bg-green-500" />
            <StatCard label="Cancelados" value={stats.cancelled.toString()} icon={XCircle} color="bg-red-500" />
            <StatCard label="Receita" value={formatMZN(stats.totalValue)} icon={DollarSign} color="bg-emerald-500" />
            <StatCard label="Ticket Médio" value={formatMZN(stats.averageOrderValue)} icon={DollarSign} color="bg-purple-500" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por referência, cliente, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Date preset */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                className="bg-transparent text-sm outline-none"
              >
                <option value="all">Todas datas</option>
                <option value="today">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
            </div>

            {/* Payment filter */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={paymentFilter ?? 'all'}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="bg-transparent text-sm outline-none"
              >
                <option value="all">Todos pagamentos</option>
                <option value="mpesa">M-Pesa</option>
                <option value="emola">E-Mola</option>
                <option value="later">Pagar Depois</option>
                <option value="">Não especificado</option>
              </select>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {(['todos', 'pendente', 'confirmado', 'cancelado'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                  filter === f ? 'vodacom-gradient text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
                }`}
              >
                {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando pedidos...</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Nenhum pedido encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou buscar por outro termo</p>
            </div>
          ) : (
            filteredAndSorted.map(order => (
              <OrderRow
                key={order.id}
                order={order}
                onQuickAction={handleQuickAction}
                onEdit={setEditingOrder}
                onDelete={setDeleteConfirm}
                onView={setViewOrder}
                statusBadge={statusBadge}
                getPaymentMethodDisplay={(m?: PaymentMethod | null) => (m ? getPaymentMethodLabel(m) : '—')}
                onCopy={copy}
              />
            ))
          )}
        </div>

        {filteredAndSorted.length > 0 && (
          <div className="mt-6 text-right text-sm text-muted-foreground">
            Mostrando {filteredAndSorted.length} de {orders.length} pedidos
          </div>
        )}

        {/* Modais */}
        <AnimatePresence>
          {deleteConfirm && (
            <Modal
              title="Confirmar Exclusão"
              onClose={() => setDeleteConfirm(null)}
              onConfirm={() => handleDelete(deleteConfirm)}
              confirmText="Excluir"
              cancelText="Cancelar"
              icon={AlertTriangle}
              iconColor="text-destructive"
            >
              <p className="text-center text-foreground">
                Tem certeza que deseja excluir este pedido?
                <br />
                <span className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</span>
              </p>
            </Modal>
          )}

          {editingOrder && (
            <EditModal
              order={editingOrder}
              onClose={() => setEditingOrder(null)}
              onSave={handleEditSave}
              onChange={setEditingOrder}
            />
          )}

          {viewOrder && (
            <ViewModal
              order={viewOrder}
              onClose={() => setViewOrder(null)}
              statusBadge={statusBadge}
              paymentLabel={(m?: PaymentMethod | null) => (m ? getPaymentMethodLabel(m) : '—')}
              onCopy={copy}
            />
          )}
        </AnimatePresence>
      </div>

      <footer className="bg-card border-t border-border py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold text-foreground">© 2026 ROCKVILLE</p>
          <p className="mt-2 text-muted-foreground">WhatsApp: +258 85 600 1899 | +258 86 281 5574</p>
          <p className="mt-1 text-muted-foreground/70 text-sm">Paga Fácil | M-Pesa | E-Mola</p>
        </div>
      </footer>
    </div>
  );
};

// ============================
// Components
// ============================
const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-2`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <p className="text-xl font-extrabold text-foreground truncate">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </motion.div>
);

const OrderRow = ({ order, onQuickAction, onEdit, onDelete, onView, statusBadge, getPaymentMethodDisplay, onCopy }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-extrabold text-gradient">{order.reference || '—'}</span>
          {statusBadge(order.status)}
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {getPaymentMethodDisplay(order.paymentMethod)}
          </span>
        </div>

        <p className="text-sm text-foreground font-semibold">{order.customerName || '—'}</p>
        <p className="text-xs text-muted-foreground">
          {order.customerPhone || '—'} • {order.packageName || '—'}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>

        <div className="mt-2 flex flex-wrap gap-2">
          <SmallAction onClick={() => onCopy(order.reference)} icon={Copy} title="Copiar referência" />
          <SmallAction onClick={() => onCopy(order.customerPhone)} icon={Smartphone} title="Copiar telefone" />
          <SmallAction onClick={() => onView(order)} icon={Eye} title="Ver detalhes" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-extrabold text-foreground">{formatMZN(order.price || 0)}</span>

        <div className="flex items-center gap-1">
          {order.status === 'pendente' && (
            <>
              <ActionButton onClick={() => onQuickAction(order.id, 'confirm')} icon={CheckCircle} color="green" title="Confirmar pagamento" />
              <ActionButton onClick={() => onQuickAction(order.id, 'cancel')} icon={XCircle} color="red" title="Cancelar pedido" />
            </>
          )}
          {order.status === 'confirmado' && (
            <ActionButton onClick={() => onQuickAction(order.id, 'pending')} icon={Clock} color="yellow" title="Reverter para pendente" />
          )}
          {order.status === 'cancelado' && (
            <ActionButton onClick={() => onQuickAction(order.id, 'pending')} icon={RefreshCw} color="blue" title="Reativar pedido" />
          )}
        </div>

        <ActionButton onClick={() => onEdit(order)} icon={Edit3} color="blue" title="Editar pedido" />
        <ActionButton onClick={() => onDelete(order.id)} icon={Trash2} color="red" title="Excluir pedido" />
      </div>
    </div>
  </motion.div>
);

const SmallAction = ({ onClick, icon: Icon, title }: any) => (
  <button onClick={onClick} title={title} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-xl border border-border hover:bg-muted transition-colors">
    <Icon className="h-4 w-4 text-muted-foreground" />
    <span className="text-muted-foreground">{title}</span>
  </button>
);

const ActionButton = ({ onClick, icon: Icon, color, title }: any) => {
  const colors = {
    green: 'bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white',
    red: 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white',
    yellow: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white',
    blue: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white',
  };
  return (
    <button onClick={onClick} className={`p-2 rounded-xl transition-colors ${colors[color]}`} title={title}>
      <Icon className="h-4 w-4" />
    </button>
  );
};

const Modal = ({ title, onClose, onConfirm, confirmText, cancelText, icon: Icon, iconColor, children }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="bg-card rounded-3xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
      {Icon && <Icon className={`mx-auto mb-4 h-12 w-12 ${iconColor}`} />}
      <h3 className="text-lg font-bold text-foreground text-center mb-4">{title}</h3>
      {children}
      <div className="flex gap-2 justify-center mt-6">
        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors">
          {cancelText || 'Cancelar'}
        </button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
          {confirmText || 'Confirmar'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const ViewModal = ({ order, onClose, statusBadge, paymentLabel, onCopy }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="bg-card rounded-3xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Detalhes</h2>
          <p className="text-sm text-muted-foreground">{order.reference}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {statusBadge(order.status)}
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {paymentLabel(order.paymentMethod)}
        </span>
      </div>

      <div className="space-y-3">
        <Detail icon={User} label="Cliente" value={order.customerName || '—'} />
        <Detail icon={Smartphone} label="Telefone" value={order.customerPhone || '—'} />
        <Detail icon={Tag} label="Produto" value={order.packageName || '—'} />
        <Detail icon={DollarSign} label="Valor" value={formatMZN(order.price || 0)} />
        <Detail icon={Clock} label="Data" value={formatDate(order.date)} />
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={() => onCopy(order.reference)} className="flex-1 px-4 py-3 rounded-2xl border border-border hover:bg-muted transition-colors font-semibold inline-flex items-center justify-center gap-2">
          <Copy className="h-4 w-4" />
          Copiar ref
        </button>
        <button onClick={() => onCopy(order.customerPhone)} className="flex-1 px-4 py-3 rounded-2xl vodacom-gradient text-white font-extrabold inline-flex items-center justify-center gap-2">
          <Smartphone className="h-4 w-4" />
          Copiar tel
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const Detail = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-sm font-semibold text-foreground text-right">{value}</span>
  </div>
);

const EditModal = ({ order, onClose, onSave, onChange }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <motion.form initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} onSubmit={onSave} className="bg-card rounded-3xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">Editar Pedido</h2>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Nome do Cliente</label>
          <input
            type="text"
            value={order.customerName}
            onChange={e => onChange({ ...order, customerName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
          <input
            type="tel"
            value={order.customerPhone}
            onChange={e => onChange({ ...order, customerPhone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">Formato: 84/85 + 7 dígitos</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Status</label>
          <select
            value={order.status}
            onChange={e => onChange({ ...order, status: e.target.value as Order['status'] })}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 rounded-xl vodacom-gradient text-white font-extrabold hover:opacity-90 transition-opacity">
          Salvar
        </button>
      </div>
    </motion.form>
  </motion.div>
);

export default Admin;
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Package, Clock, CheckCircle, XCircle, Trash2, RefreshCw, Edit3, X, DollarSign, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import { getOrders, updateOrder, deleteOrder, clearAllOrders, formatMZN, Order } from '@/lib/store';

const ADMIN_PIN = '1234';

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'confirmado' | 'cancelado'>('todos');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const loadOrders = () => setOrders(getOrders());

  useEffect(() => {
    if (authenticated) loadOrders();
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) setAuthenticated(true);
  };

  const handleStatus = (id: string, status: Order['status']) => {
    updateOrder(id, { status });
    loadOrders();
  };

  const handleDelete = (id: string) => {
    deleteOrder(id);
    setDeleteConfirm(null);
    loadOrders();
  };

  const handleClearAll = () => {
    clearAllOrders();
    setClearConfirm(false);
    loadOrders();
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrder(editingOrder.id, {
      customerName: editingOrder.customerName,
      customerPhone: editingOrder.customerPhone,
      status: editingOrder.status,
    });
    setEditingOrder(null);
    loadOrders();
  };

  const filtered = filter === 'todos' ? orders : orders.filter((o) => o.status === filter);
  const totalRevenue = orders.filter(o => o.status === 'confirmado').reduce((sum, o) => sum + o.price, 0);

  const statusBadge = (status: Order['status']) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-3xl shadow-xl p-8 w-full max-w-sm"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl vodacom-gradient mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Admin</h2>
              <p className="text-sm text-muted-foreground mt-1">Insira o PIN de acesso</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                className="w-full vodacom-gradient text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Entrar
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: orders.length.toString(), icon: Package, color: 'vodacom-gradient' },
            { label: 'Pendentes', value: orders.filter((o) => o.status === 'pendente').length.toString(), icon: Clock, color: 'bg-yellow-500' },
            { label: 'Confirmados', value: orders.filter((o) => o.status === 'confirmado').length.toString(), icon: CheckCircle, color: 'bg-success' },
            { label: 'Cancelados', value: orders.filter((o) => o.status === 'cancelado').length.toString(), icon: XCircle, color: 'bg-destructive' },
            { label: 'Receita', value: formatMZN(totalRevenue), icon: DollarSign, color: 'bg-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-2xl p-4 shadow-sm border border-border">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="text-xl font-extrabold text-foreground truncate">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter + Actions */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button onClick={loadOrders} className="p-2 rounded-xl bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          {(['todos', 'pendente', 'confirmado', 'cancelado'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                filter === f
                  ? 'vodacom-gradient text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {orders.length > 0 && (
            <button
              onClick={() => setClearConfirm(true)}
              className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Nenhuma encomenda encontrada</p>
            </div>
          ) : (
            filtered.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-extrabold text-gradient">{order.reference}</span>
                      {statusBadge(order.status)}
                    </div>
                    <p className="text-sm text-foreground font-semibold">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerPhone} • {order.packageName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.date).toLocaleString('pt-MZ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-foreground">{formatMZN(order.price)}</span>
                    {order.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => handleStatus(order.id, 'confirmado')}
                          className="p-2 rounded-xl bg-success/10 text-success hover:bg-success hover:text-success-foreground transition-colors"
                          title="Confirmar"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleStatus(order.id, 'cancelado')}
                          className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          title="Cancelar"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setEditingOrder({ ...order })}
                      className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(order.id)}
                      className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setEditingOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="vodacom-gradient p-5 text-primary-foreground relative">
                <button onClick={() => setEditingOrder(null)} className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground">
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-bold">Editar Encomenda</h2>
                <p className="text-sm text-primary-foreground/80">{editingOrder.reference}</p>
              </div>
              <form onSubmit={handleEditSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.customerName}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Telefone</label>
                  <input
                    type="tel"
                    required
                    value={editingOrder.customerPhone}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1">Status</label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as Order['status'] })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 bg-muted text-foreground font-semibold py-3 rounded-xl hover:bg-muted/80"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 vodacom-gradient text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Excluir Encomenda?</h3>
              <p className="text-sm text-muted-foreground mb-6">Esta acção não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-muted text-foreground font-semibold py-3 rounded-xl hover:bg-muted/80">Cancelar</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-destructive text-destructive-foreground font-bold py-3 rounded-xl hover:opacity-90">Excluir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All Confirm */}
      <AnimatePresence>
        {clearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Limpar Todas as Encomendas?</h3>
              <p className="text-sm text-muted-foreground mb-6">Todas as {orders.length} encomendas serão apagadas permanentemente.</p>
              <div className="flex gap-3">
                <button onClick={() => setClearConfirm(false)} className="flex-1 bg-muted text-foreground font-semibold py-3 rounded-xl hover:bg-muted/80">Cancelar</button>
                <button onClick={handleClearAll} className="flex-1 bg-destructive text-destructive-foreground font-bold py-3 rounded-xl hover:opacity-90">Limpar Tudo</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;

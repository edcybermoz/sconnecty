// src/lib/store.ts
import { collection, addDoc, doc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import type { InternetPackage, Order, PaymentMethod, OrderStatus, OrderStats } from "./types";

// --------------------------
// Pacotes de Internet
// --------------------------
export const internetPackages: InternetPackage[] = [
  // ✅ Diário
  { id: 'daily-2200', name: 'Diário 2.200MB', data: '2.200MB', validity: '24h', price: 58, description: 'Internet rápida por 24 horas', category: 'diario' },
  { id: 'daily-3300', name: 'Diário 3.300MB', data: '3.300MB', validity: '24h', price: 87, description: 'Navegue o dia todo com conforto', category: 'diario' },
  { id: 'daily-4400', name: 'Diário 4.400MB', data: '4.400MB', validity: '24h', price: 116, popular: true, description: 'Mais dados para o seu dia', category: 'diario' },
  { id: 'daily-8800', name: 'Diário 8.800MB', data: '8.800MB', validity: '24h', price: 232, description: 'Pacote diário reforçado', category: 'diario' },
  { id: 'daily-12200', name: 'Diário 12.200MB', data: '12.200MB', validity: '24h', price: 348, description: 'Máximo de dados diário', category: 'diario' },

  // ✅ Mensal
  { id: 'monthly-12100', name: 'Mensal 12.100MB', data: '12.100MB', validity: '30 dias', price: 438, description: 'Internet para o mês inteiro', category: 'mensal' },
  { id: 'monthly-22200', name: 'Mensal 22.200MB', data: '22.200MB', validity: '30 dias', price: 748, popular: true, description: 'O mais vendido do mês', category: 'mensal' },
  { id: 'monthly-42300', name: 'Mensal 42.300MB', data: '42.300MB', validity: '30 dias', price: 1388, description: 'Para quem precisa de muito mais', category: 'mensal' },
  { id: 'monthly-67400', name: 'Mensal 67.400MB', data: '67.400MB', validity: '30 dias', price: 2038, description: 'Pacote premium sem limites', category: 'mensal' },

  // ✅ Chamadas
  { id: 'calls-10gb', name: 'Chamadas + 10.2GB', data: '10.2GB', validity: '30 dias', price: 460, description: 'Chamadas + SMSs ilimitadas + 10.2GB', category: 'chamadas' },
  { id: 'calls-13gb', name: 'Chamadas + 13.2GB', data: '13.2GB', validity: '30 dias', price: 560, popular: true, description: 'Chamadas + SMSs ilimitadas + 13.2GB', category: 'chamadas' },
  { id: 'calls-19gb', name: 'Chamadas + 19.2GB', data: '19.2GB', validity: '30 dias', price: 760, description: 'Chamadas + SMSs ilimitadas + 19.2GB', category: 'chamadas' },
  { id: 'calls-31gb', name: 'Chamadas + 31.2GB', data: '31.2GB', validity: '30 dias', price: 1150, description: 'Chamadas + SMSs ilimitadas + 31.2GB', category: 'chamadas' },

  // ✅ Streaming (troca os preços)
  { id: 'spotify-1m', name: 'Spotify Premium — 1 Mês', validity: '30 dias', price: 0, description: 'Sem anúncios • Premium', category: 'streaming', provider: 'Spotify', notes: 'Ativação rápida' },
  { id: 'netflix-1m', name: 'Netflix — 1 Mês', validity: '30 dias', price: 0, description: 'Plano conforme disponibilidade', category: 'streaming', provider: 'Netflix', notes: 'Ativação rápida' },
  { id: 'applemusic-1m', name: 'Apple Music — 1 Mês', validity: '30 dias', price: 0, description: 'Músicas ilimitadas', category: 'streaming', provider: 'AppleMusic', notes: 'Ativação rápida' },

  // ✅ Gift Cards
  { id: 'gplay-100', name: 'Google Play — 100 MT', price: 100, description: 'Cartão digital para apps e jogos', category: 'giftcards', provider: 'GooglePlay', notes: 'Código digital' },
  { id: 'gplay-250', name: 'Google Play — 250 MT', price: 250, description: 'Cartão digital para apps e jogos', category: 'giftcards', provider: 'GooglePlay', notes: 'Código digital' },
  { id: 'apple-250', name: 'Apple Gift Card — 250 MT', price: 250, description: 'App Store • iCloud • Apple Services', category: 'giftcards', provider: 'AppleGiftCard', notes: 'Código digital' },
];

// --------------------------
// ✅ Constantes para status (em português)
// --------------------------
export const ORDER_STATUS = {
  PENDING: 'pendente',
  COMPLETED: 'confirmado',
  CANCELLED: 'cancelado'
} as const;

// --------------------------
// ✅ Constantes para métodos de pagamento
// --------------------------
export const PAYMENT_METHODS = {
  MPESA: 'mpesa',
  EMOLA: 'emola',
  LATER: 'later'
} as const;

// --------------------------
// Referência aleatória
// --------------------------
export function generateReference(): string {
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `rockville#${num}`;
}

// --------------------------
// Firestore Orders Collection
// --------------------------
const ordersCol = collection(db, "orders");

export async function saveOrder(order: Omit<Order, 'id'>): Promise<Order> {
  const orderWithTimestamps = {
    ...order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const docRef = await addDoc(ordersCol, orderWithTimestamps);
  return { ...orderWithTimestamps, id: docRef.id } as Order;
}

export async function getOrders(): Promise<Order[]> {
  const snapshot = await getDocs(ordersCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

// --------------------------
// ✅ Funções de busca
// --------------------------
export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const q = query(ordersCol, where("customerPhone", "==", phone), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
  const q = query(ordersCol, where("status", "==", status), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getOrdersByPaymentMethod(method: PaymentMethod): Promise<Order[]> {
  const q = query(ordersCol, where("paymentMethod", "==", method), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getOrderByReference(reference: string): Promise<Order | null> {
  const q = query(ordersCol, where("reference", "==", reference), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Order;
}

// --------------------------
// ✅ Funções de atualização
// --------------------------
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const docRef = doc(db, "orders", orderId);
  await updateDoc(docRef, { 
    status,
    updatedAt: new Date().toISOString() 
  });
}

export async function updateOrderPaymentMethod(orderId: string, paymentMethod: PaymentMethod): Promise<void> {
  const docRef = doc(db, "orders", orderId);
  await updateDoc(docRef, { 
    paymentMethod,
    updatedAt: new Date().toISOString() 
  });
}

export async function updateOrder(
  orderId: string, 
  data: Partial<Pick<Order, 'customerName' | 'customerPhone' | 'status' | 'paymentMethod'>>
): Promise<void> {
  const docRef = doc(db, "orders", orderId);
  await updateDoc(docRef, { 
    ...data,
    updatedAt: new Date().toISOString() 
  });
}

// ✅ Funções de ação rápida
export async function confirmPayment(orderId: string): Promise<void> {
  await updateOrderStatus(orderId, ORDER_STATUS.COMPLETED);
}

export async function cancelOrder(orderId: string): Promise<void> {
  await updateOrderStatus(orderId, ORDER_STATUS.CANCELLED);
}

export async function markAsPending(orderId: string): Promise<void> {
  await updateOrderStatus(orderId, ORDER_STATUS.PENDING);
}

export async function deleteOrder(orderId: string): Promise<void> {
  const docRef = doc(db, "orders", orderId);
  await deleteDoc(docRef);
}

// --------------------------
// ✅ Utilitários de telefone
// --------------------------
export function validatePhoneNumber(phone: string): boolean {
  // Remove espaços e caracteres especiais
  const cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  
  // Valida números moçambicanos (84/85 + 7 dígitos)
  const regex = /^[8][4-7]\d{7}$/;
  return regex.test(cleaned);
}

export function formatPhoneNumber(phone: string): string {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  
  // Formata número para exibição: 84 123 4567
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function cleanPhoneNumber(phone: string): string {
  // Remove espaços e caracteres especiais, mantém apenas números
  return phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
}

// --------------------------
// ✅ Utilitários de pagamento
// --------------------------
export function getPaymentNumber(method: 'mpesa' | 'emola'): string {
  const numbers = {
    mpesa: '85 600 1899', 
    emola: '86 281 5574'  
  };
  return numbers[method];
}

export function getPaymentMethodLabel(method?: PaymentMethod | null): string {
  if (!method) return 'Não especificado';
  
  const labels = {
    [PAYMENT_METHODS.MPESA]: 'M-Pesa',
    [PAYMENT_METHODS.EMOLA]: 'E-Mola',
    [PAYMENT_METHODS.LATER]: 'Pagar Depois'
  };
  return labels[method] || method;
}

// --------------------------
// ✅ Formatação
// --------------------------
export function formatMZN(value: number): string {
  return `${value.toLocaleString('pt-MZ')} MT`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// --------------------------
// ✅ WhatsApp / SMS
// --------------------------
export function sendWhatsApp(order: Order): void {
  const statusEmoji = order.status === ORDER_STATUS.COMPLETED ? '✅' : '⏳';
  const statusText = order.status === ORDER_STATUS.COMPLETED ? 'Confirmado' : 'Pendente';
  const paymentMethodText = getPaymentMethodLabel(order.paymentMethod);
  
  const message = encodeURIComponent(
    `🛒 *Compra Rockville Internet*\n\n` +
    `📋 *Referência:* ${order.reference}\n` +
    `📦 *Pacote:* ${order.packageName}\n` +
    `👤 *Cliente:* ${order.customerName}\n` +
    `📱 *Telefone:* ${order.customerPhone}\n` +
    `💰 *Valor:* ${formatMZN(order.price)}\n` +
    `📅 *Data:* ${formatDate(order.date)}\n` +
    `💳 *Pagamento:* ${paymentMethodText}\n` +
    `📊 *Status:* ${statusText} ${statusEmoji}`
  );
  window.open(`https://wa.me/258856001899?text=${message}`, '_blank');
}

export function sendPaymentConfirmationWhatsApp(order: Order): void {
  const paymentMethodText = getPaymentMethodLabel(order.paymentMethod);
  
  const message = encodeURIComponent(
    `✅ *Pagamento Confirmado - Rockville Internet*\n\n` +
    `📋 *Referência:* ${order.reference}\n` +
    `📦 *Pacote:* ${order.packageName}\n` +
    `👤 *Cliente:* ${order.customerName}\n` +
    `💰 *Valor:* ${formatMZN(order.price)}\n` +
    `💳 *Método:* ${paymentMethodText}\n` +
    `📅 *Data:* ${formatDate(order.date)}\n\n` +
    `O seu pagamento foi confirmado com sucesso! 🎉\n` +
    `Em breve receberá o pacote no seu telefone.`
  );
  window.open(`https://wa.me/${order.customerPhone}?text=${message}`, '_blank');
}

export function sendSMS(order: Order): void {
  const statusText = order.status === ORDER_STATUS.COMPLETED ? 'CONFIRMADO' : 'PENDENTE';
  const paymentMethodText = order.paymentMethod 
    ? (order.paymentMethod === 'mpesa' ? 'MPESA' : order.paymentMethod === 'emola' ? 'EMOLA' : 'DEPOIS')
    : 'N/E';
  
  const message = encodeURIComponent(
    `Rockville - Ref:${order.reference} | ${order.packageName} | ${order.customerName} | ${order.customerPhone} | ${formatMZN(order.price)} | Pag:${paymentMethodText} | Status:${statusText}`
  );
  window.open(`sms:+258856001899?body=${message}`, '_blank');
}

// --------------------------
// ✅ Estatísticas
// --------------------------
export async function getOrderStats(): Promise<OrderStats> {
  const orders = await getOrders();
  
  const total = orders.length;
  
  // Filtrar por status
  const pending = orders.filter(o => o.status === ORDER_STATUS.PENDING).length;
  const completed = orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length;
  const cancelled = orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length;
  
  // Calcular valor total (apenas pedidos confirmados)
  const totalValue = orders
    .filter(o => o.status === ORDER_STATUS.COMPLETED)
    .reduce((sum, order) => sum + (order.price || 0), 0);
  
  // Valor médio por pedido confirmado
  const averageOrderValue = completed > 0 
    ? totalValue / completed 
    : 0;
  
  // Agrupar por método de pagamento (contagem)
  const byPaymentMethod = orders.reduce((acc, order) => {
    const method = order.paymentMethod || 'nao_especificado';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Agrupar por método de pagamento (valor) - apenas confirmados
  const valueByPaymentMethod = orders
    .filter(o => o.status === ORDER_STATUS.COMPLETED)
    .reduce((acc, order) => {
      const method = order.paymentMethod || 'nao_especificado';
      acc[method] = (acc[method] || 0) + (order.price || 0);
      return acc;
    }, {} as Record<string, number>);
  
  // Agrupar por status
  const byStatus = {
    [ORDER_STATUS.PENDING]: pending,
    [ORDER_STATUS.COMPLETED]: completed,
    [ORDER_STATUS.CANCELLED]: cancelled
  };
  
  // Calcular taxas
  const conversionRate = total > 0 
    ? ((completed / total) * 100).toFixed(1) 
    : '0';
  
  const pendingRate = total > 0 
    ? ((pending / total) * 100).toFixed(1) 
    : '0';
  
  const cancelledRate = total > 0 
    ? ((cancelled / total) * 100).toFixed(1) 
    : '0';
  
  // Estatísticas diárias (últimos 30 dias)
  const last30Days = [...Array(30)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();
  
  const dailyStats = last30Days.map(date => {
    const dayOrders = orders.filter(o => 
      o.date?.startsWith(date) && o.status === ORDER_STATUS.COMPLETED
    );
    return {
      date,
      count: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.price || 0), 0)
    };
  });
  
  // Pacotes mais vendidos
  const packageStats = orders
    .filter(o => o.status === ORDER_STATUS.COMPLETED)
    .reduce((acc, order) => {
      const name = order.packageName || 'Desconhecido';
      if (!acc[name]) {
        acc[name] = { count: 0, revenue: 0 };
      }
      acc[name].count += 1;
      acc[name].revenue += order.price || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);
  
  const topPackages = Object.entries(packageStats)
    .map(([packageName, stats]) => ({
      packageName,
      count: stats.count,
      revenue: stats.revenue
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    total,
    totalValue,
    pending,
    completed,
    cancelled,
    byPaymentMethod,
    valueByPaymentMethod,
    byStatus,
    averageOrderValue,
    summary: {
      totalOrders: total,
      totalRevenue: totalValue,
      averageOrderValue,
      conversionRate,
      pendingRate,
      cancelledRate,
    },
    dailyStats,
    topPackages,
  };
}

// Versão simplificada para cards rápidos
export async function getOrderStatsSummary() {
  const orders = await getOrders();
  
  const total = orders.length;
  const pending = orders.filter(o => o.status === ORDER_STATUS.PENDING).length;
  const completed = orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length;
  const cancelled = orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length;
  
  const totalRevenue = orders
    .filter(o => o.status === ORDER_STATUS.COMPLETED)
    .reduce((sum, order) => sum + (order.price || 0), 0);
  
  const conversionRate = total > 0 
    ? ((completed / total) * 100).toFixed(1) 
    : '0';
  
  const averageTicket = completed > 0 
    ? totalRevenue / completed 
    : 0;
  
  return {
    totalOrders: total,
    totalRevenue,
    pendingOrders: pending,
    completedOrders: completed,
    cancelledOrders: cancelled,
    conversionRate,
    averageTicket,
  };
}
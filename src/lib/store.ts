export interface InternetPackage {
  id: string;
  name: string;
  data: string;
  validity: string;
  price: number;
  popular?: boolean;
  description: string;
  category: 'diario' | 'mensal' | 'chamadas';
}

export interface Order {
  id: string;
  reference: string;
  packageId: string;
  packageName: string;
  customerName: string;
  customerPhone: string;
  price: number;
  date: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

export const internetPackages: InternetPackage[] = [
  // Diários (24h)
  {
    id: 'daily-2200',
    name: 'Diário 2.200MB',
    data: '2.200MB',
    validity: '24h',
    price: 58,
    description: 'Internet rápida por 24 horas',
    category: 'diario',
  },
  {
    id: 'daily-3300',
    name: 'Diário 3.300MB',
    data: '3.300MB',
    validity: '24h',
    price: 87,
    description: 'Navegue o dia todo com conforto',
    category: 'diario',
  },
  {
    id: 'daily-4400',
    name: 'Diário 4.400MB',
    data: '4.400MB',
    validity: '24h',
    price: 116,
    popular: true,
    description: 'Mais dados para o seu dia',
    category: 'diario',
  },
  {
    id: 'daily-8800',
    name: 'Diário 8.800MB',
    data: '8.800MB',
    validity: '24h',
    price: 232,
    description: 'Pacote diário reforçado',
    category: 'diario',
  },
  {
    id: 'daily-12200',
    name: 'Diário 12.200MB',
    data: '12.200MB',
    validity: '24h',
    price: 348,
    description: 'Máximo de dados diário',
    category: 'diario',
  },
  // Mensais (30 dias)
  {
    id: 'monthly-12100',
    name: 'Mensal 12.100MB',
    data: '12.100MB',
    validity: '30 dias',
    price: 438,
    description: 'Internet para o mês inteiro',
    category: 'mensal',
  },
  {
    id: 'monthly-22200',
    name: 'Mensal 22.200MB',
    data: '22.200MB',
    validity: '30 dias',
    price: 748,
    popular: true,
    description: 'O mais vendido do mês',
    category: 'mensal',
  },
  {
    id: 'monthly-42300',
    name: 'Mensal 42.300MB',
    data: '42.300MB',
    validity: '30 dias',
    price: 1388,
    description: 'Para quem precisa de muito mais',
    category: 'mensal',
  },
  {
    id: 'monthly-67400',
    name: 'Mensal 67.400MB',
    data: '67.400MB',
    validity: '30 dias',
    price: 2038,
    description: 'Pacote premium sem limites',
    category: 'mensal',
  },
  // Chamadas Ilimitadas & SMSs
  {
    id: 'calls-10gb',
    name: 'Chamadas + 10.2GB',
    data: '10.2GB',
    validity: '30 dias',
    price: 460,
    description: 'Chamadas + SMSs ilimitadas + 10.2GB',
    category: 'chamadas',
  },
  {
    id: 'calls-13gb',
    name: 'Chamadas + 13.2GB',
    data: '13.2GB',
    validity: '30 dias',
    price: 560,
    popular: true,
    description: 'Chamadas + SMSs ilimitadas + 13.2GB',
    category: 'chamadas',
  },
  {
    id: 'calls-19gb',
    name: 'Chamadas + 19.2GB',
    data: '19.2GB',
    validity: '30 dias',
    price: 760,
    description: 'Chamadas + SMSs ilimitadas + 19.2GB',
    category: 'chamadas',
  },
  {
    id: 'calls-31gb',
    name: 'Chamadas + 31.2GB',
    data: '31.2GB',
    validity: '30 dias',
    price: 1150,
    description: 'Chamadas + SMSs ilimitadas + 31.2GB',
    category: 'chamadas',
  },
];

export function generateReference(): string {
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `rockville#${num}`;
}

export function getOrders(): Order[] {
  const data = localStorage.getItem('rockville_orders');
  return data ? JSON.parse(data) : [];
}

export function saveOrder(order: Order): void {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem('rockville_orders', JSON.stringify(orders));
}

export function updateOrderStatus(orderId: string, status: Order['status']): void {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = status;
    localStorage.setItem('rockville_orders', JSON.stringify(orders));
  }
}

export function updateOrder(orderId: string, data: Partial<Pick<Order, 'customerName' | 'customerPhone' | 'status'>>): void {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...data };
    localStorage.setItem('rockville_orders', JSON.stringify(orders));
  }
}

export function deleteOrder(orderId: string): void {
  const orders = getOrders().filter(o => o.id !== orderId);
  localStorage.setItem('rockville_orders', JSON.stringify(orders));
}

export function clearAllOrders(): void {
  localStorage.setItem('rockville_orders', JSON.stringify([]));
}

export function formatMZN(value: number): string {
  return `${value.toLocaleString('pt-MZ')} MT`;
}

export function sendWhatsApp(order: Order): void {
  const message = encodeURIComponent(
    `🛒 *Nova Compra - Rockville Internet*\n\n` +
    `📋 *Referência:* ${order.reference}\n` +
    `📦 *Pacote:* ${order.packageName}\n` +
    `👤 *Cliente:* ${order.customerName}\n` +
    `📱 *Telefone:* ${order.customerPhone}\n` +
    `💰 *Valor:* ${formatMZN(order.price)}\n` +
    `📅 *Data:* ${new Date(order.date).toLocaleString('pt-MZ')}\n\n` +
    `Status: Pendente ⏳`
  );
  window.open(`https://wa.me/258856001899?text=${message}`, '_blank');
}

export function sendSMS(order: Order): void {
  const message = encodeURIComponent(
    `Rockville - Ref: ${order.reference} | ${order.packageName} | ${order.customerName} | ${order.customerPhone} | ${formatMZN(order.price)}`
  );
  window.open(`sms:+258856001899?body=${message}`, '_blank');
}

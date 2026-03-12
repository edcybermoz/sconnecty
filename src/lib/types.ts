// src/lib/types.ts

export interface InternetPackage {
  id: string;
  name: string;

  // ✅ opcional (streaming/giftcards podem não ter)
  data?: string;
  validity?: string;

  price: number;
  popular?: boolean;
  description: string;

  // ✅ novas categorias
  category: 'diario' | 'mensal' | 'chamadas' | 'streaming' | 'giftcards';

  // ✅ extra para streaming/cartões
  provider?: 'Vodacom' | 'Netflix' | 'Spotify' | 'AppleMusic' | 'GooglePlay' | 'AppleGiftCard';
  notes?: string;
}

export type PaymentMethod = 'mpesa' | 'emola' | 'later' | null;

export type OrderStatus = 'pendente' | 'confirmado' | 'cancelado';

export interface Order {
  id: string;
  reference: string;
  packageId: string;
  packageName: string;
  customerName: string;
  customerPhone: string;
  price: number;
  date: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStats {
  total: number;
  totalValue: number;
  pending: number;
  completed: number;
  cancelled: number;
  byPaymentMethod: Record<string, number>;
  valueByPaymentMethod: Record<string, number>;
  byStatus: Record<OrderStatus, number>;
  averageOrderValue: number;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    conversionRate: string;
    pendingRate: string;
    cancelledRate: string;
  };
  dailyStats?: { date: string; count: number; revenue: number }[];
  monthlyStats?: { month: string; count: number; revenue: number }[];
  topPackages?: { packageName: string; count: number; revenue: number }[];
}

export interface OrderStatsSummary {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  conversionRate: string;
  averageTicket: number;
}

export interface StatsFilters {
  startDate?: string;
  endDate?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pendente: 'yellow',
  confirmado: 'green',
  cancelado: 'red'
};

export const ORDER_STATUS_ICONS: Record<OrderStatus, string> = {
  pendente: 'Clock',
  confirmado: 'CheckCircle',
  cancelado: 'XCircle'
};

export const PAYMENT_METHOD_LABELS: Record<NonNullable<PaymentMethod>, string> = {
  mpesa: 'M-Pesa',
  emola: 'E-Mola',
  later: 'Pagar Depois'
};

export const PAYMENT_METHOD_COLORS: Record<NonNullable<PaymentMethod>, string> = {
  mpesa: 'green',
  emola: 'yellow',
  later: 'blue'
};

export const PAYMENT_METHOD_ICONS: Record<NonNullable<PaymentMethod>, string> = {
  mpesa: 'Smartphone',
  emola: 'Smartphone',
  later: 'Clock'
};

export function isOrder(obj: any): obj is Order {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.reference === 'string' &&
    typeof obj.packageId === 'string' &&
    typeof obj.customerName === 'string' &&
    typeof obj.price === 'number' &&
    ['pendente', 'confirmado', 'cancelado'].includes(obj.status)
  );
}

export function isValidOrderStatus(status: string): status is OrderStatus {
  return ['pendente', 'confirmado', 'cancelado'].includes(status);
}

export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return method === null || ['mpesa', 'emola', 'later'].includes(method);
}
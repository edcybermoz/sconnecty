import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Calendar, Clock, Tag, Printer, FileDown } from 'lucide-react';
import { getOrders, formatMZN } from '@/lib/store';
import jsPDF from 'jspdf';
import Header from '@/components/Header';

interface Order {
  id: string;
  reference: string;
  packageName: string;
  price: number;
  date: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

const Historico = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const stored = getOrders();
    setOrders(stored.reverse());
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  const handlePrint = (order: Order) => {
    const { date, time } = formatDate(order.date);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>Comprovativo</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h2>ROCKVILLE MZ</h2><hr/>
          <p><strong>Referência:</strong> ${order.reference}</p>
          <p><strong>Pacote:</strong> ${order.packageName}</p>
          <p><strong>Valor:</strong> ${formatMZN(order.price)}</p>
          <p><strong>Data:</strong> ${date}</p>
          <p><strong>Hora:</strong> ${time}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = (order: Order) => {
    const { date, time } = formatDate(order.date);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('ROCKVILLE MZ', 20, 20);

    doc.setFontSize(12);
    doc.text(`Referência: ${order.reference}`, 20, 40);
    doc.text(`Pacote: ${order.packageName}`, 20, 50);
    doc.text(`Valor: ${formatMZN(order.price)}`, 20, 60);
    doc.text(`Data: ${date}`, 20, 70);
    doc.text(`Hora: ${time}`, 20, 80);
    doc.text(`Status: ${order.status}`, 20, 90);

    doc.save(`compra_${order.reference}.pdf`);
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background py-10 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-3 mb-8">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Meu Histórico de Compras</h1>
          </div>

          {orders.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow">
              <p className="text-muted-foreground">Ainda não existem compras registadas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => {
                const { date, time } = formatDate(order.date);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl p-6 shadow"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">

                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Referência</p>
                        <p className="text-lg font-bold text-gradient">{order.reference}</p>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                          <Tag className="h-4 w-4" /> {order.packageName}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{date}</div>
                          <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{time}</div>
                        </div>
                      </div>

                      <div className="text-right space-y-3">
                        <p className="text-xl font-extrabold text-primary">{formatMZN(order.price)}</p>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handlePrint(order)}
                            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80"
                          >
                            <Printer className="h-4 w-4" /> Imprimir
                          </button>

                          <button
                            onClick={() => handleDownloadPDF(order)}
                            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg vodacom-gradient text-white hover:opacity-90"
                          >
                            <FileDown className="h-4 w-4" /> PDF
                          </button>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="vodacom-gradient-dark text-primary-foreground/70 text-center py-6 text-sm">
        <p className="font-semibold text-primary-foreground">© 2026 ROCKVILLE— Revendedor Autorizado Vodacom Moçambique</p>
        <p className="mt-1">WhatsApp: +258 85 600 1899 | +258 86 281 5574</p>
        <p className="mt-1 text-primary-foreground/50">Paga Fácil | M-Pesa | E-Mola</p>
      </footer>
    </>
  );
};

export default Historico;

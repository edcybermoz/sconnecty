import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Phone, CheckCircle } from 'lucide-react';
import { InternetPackage, formatMZN, generateReference, saveOrder, sendWhatsApp, sendSMS } from '@/lib/store';

interface CheckoutModalProps {
  pkg: InternetPackage;
  onClose: () => void;
}

const CheckoutModal = ({ pkg, onClose }: CheckoutModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [reference, setReference] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const ref = generateReference();

    const order = {
      id: Date.now().toString(),
      reference: ref,
      packageId: pkg.id,
      packageName: pkg.name,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      price: pkg.price,
      date: new Date().toISOString(),
      status: 'pendente' as const,
    };

    saveOrder(order);
    setCreatedOrder(order);
    setReference(ref);
    setStep('success');
  };

  const handleSendSMS = () => {
    if (!createdOrder) return;
    sendSMS(createdOrder);
  };

  const handleSendWhatsApp = () => {
    if (!createdOrder) return;
    sendWhatsApp(createdOrder);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="vodacom-gradient p-6 text-primary-foreground relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold">
              {step === 'form' ? 'Comprar Pacote' : 'Compra Registada!'}
            </h2>

            <p className="text-sm text-primary-foreground/80 mt-1">
              {pkg.name} — {pkg.data} por {formatMZN(pkg.price)}
            </p>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">
                  Número de Telefone
                </label>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="84/85/86/87..."
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="bg-muted rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pacote</span>
                  <span className="font-semibold text-foreground">{pkg.name}</span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Dados</span>
                  <span className="font-semibold text-foreground">{pkg.data}</span>
                </div>

                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Validade</span>
                  <span className="font-semibold text-foreground">{pkg.validity}</span>
                </div>

                <div className="flex justify-between mt-3 pt-3 border-t border-border">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-extrabold text-xl text-gradient">
                    {formatMZN(pkg.price)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full vodacom-gradient text-primary-foreground font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 animate-pulse-glow"
              >
                <Send className="h-5 w-5" />
                Confirmar Compra
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Depois poderá escolher como deseja receber a confirmação
              </p>
            </form>
          ) : (
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
              </div>

              <div>
                <p className="text-lg font-bold text-foreground">
                  Compra Registada!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua referência:
                </p>
                <p className="text-2xl font-extrabold text-gradient mt-1">
                  {reference}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSendSMS}
                  className="flex-1 bg-muted text-foreground font-semibold py-3 rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Enviar por SMS
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 vodacom-gradient text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Enviar por WhatsApp
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Escolha como deseja receber a confirmação.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutModal;

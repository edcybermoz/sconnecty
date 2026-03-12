import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  MessageSquare,
  Phone,
  CheckCircle,
  Smartphone,
  CreditCard,
  Copy,
  AlertCircle,
  Mail
} from 'lucide-react';

import type { InternetPackage, Order, PaymentMethod } from '@/lib/types';
import {
  formatMZN,
  generateReference,
  saveOrder,
  sendWhatsApp,
  sendSMS,
  confirmPayment,
  ORDER_STATUS,
  getPaymentNumber,
  validatePhoneNumber,
  formatPhoneNumber,
  cleanPhoneNumber,
  formatDate,
} from '@/lib/store';

interface CheckoutModalProps {
  pkg: InternetPackage;
  onClose: () => void;
}

const CheckoutModal = ({ pkg, onClose }: CheckoutModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('later');
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  const [reference, setReference] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const needsExtraInfo = useMemo(
    () => pkg.category === 'streaming' || pkg.category === 'giftcards',
    [pkg.category]
  );

  const extraLabel = useMemo(() => {
    if (pkg.category === 'streaming') return 'Email/Conta para ativação';
    if (pkg.category === 'giftcards') return 'Email/WhatsApp para envio do código';
    return 'Informação adicional';
  }, [pkg.category]);

  const providerLabel = useMemo(() => {
    if (!pkg.provider) return '';
    if (pkg.provider === 'AppleMusic') return 'Apple Music';
    if (pkg.provider === 'AppleGiftCard') return 'Apple';
    return pkg.provider;
  }, [pkg.provider]);

  const modalTitle = useMemo(() => {
    if (step === 'payment') return 'Instruções de Pagamento';
    if (step === 'success') return 'Pedido Registado!';
    return pkg.category === 'streaming' || pkg.category === 'giftcards'
      ? 'Finalizar Pedido'
      : 'Comprar Pacote';
  }, [step, pkg.category]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const cleaned = cleanPhoneNumber(value);

    if (cleaned && !validatePhoneNumber(cleaned)) {
      setPhoneError('Número inválido. Use 84/85/86/87 + 7 dígitos (ex: 84 123 4567)');
    } else {
      setPhoneError('');
    }
  };

  const handleCopyNumber = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar número:', error);
    }
  };

  const getPaymentInstructions = (method: PaymentMethod) => {
    if (method !== 'mpesa' && method !== 'emola') return null;

    const number = getPaymentNumber(method);

    if (method === 'mpesa') {
      return {
        title: 'Pagar com M-Pesa',
        number,
        steps: [
          'Acesse o menu M-Pesa no seu telefone',
          'Selecione "Enviar Dinheiro"',
          `Digite o número: ${number}`,
          `Digite o valor: ${formatMZN(pkg.price)}`,
          'Digite o seu PIN M-Pesa',
          'Confirme a transação',
          'Guarde o SMS de confirmação'
        ]
      };
    }

    return {
      title: 'Pagar com E-Mola',
      number,
      steps: [
        'Acesse o menu E-Mola no seu telefone',
        'Selecione "Transferir"',
        `Digite o número: ${number}`,
        `Digite o valor: ${formatMZN(pkg.price)}`,
        'Digite o seu PIN E-Mola',
        'Confirme a transação',
        'Guarde o SMS de confirmação'
      ]
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Por favor, informe o seu nome');
      return;
    }

    const cleanedPhone = cleanPhoneNumber(phone);

    if (!cleanedPhone || !validatePhoneNumber(cleanedPhone)) {
      setPhoneError('Número de telefone inválido');
      return;
    }

    if (needsExtraInfo && !extraInfo.trim()) {
      alert(`Por favor, informe: ${extraLabel}`);
      return;
    }

    setLoading(true);

    try {
      const ref = generateReference();

      const orderData: Omit<Order, 'id'> = {
        reference: ref,
        packageId: pkg.id,
        packageName: pkg.name,
        customerName: name.trim(),
        customerPhone: cleanedPhone,
        price: pkg.price,
        date: new Date().toISOString(),
        status: ORDER_STATUS.PENDING,
        paymentMethod: paymentMethod === 'later' ? null : paymentMethod,
      };

      if (needsExtraInfo) {
        (orderData as any).extraInfo = extraInfo.trim();
        (orderData as any).provider = pkg.provider ?? null;
        (orderData as any).category = pkg.category;
      }

      const savedOrder = await saveOrder(orderData);
      setCreatedOrder(savedOrder);
      setReference(ref);

      if (paymentMethod === 'later') setStep('success');
      else setStep('payment');
    } catch (error) {
      console.error('Erro Firestore:', error);
      alert('Erro ao salvar pedido. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirmed = async () => {
    if (!createdOrder) return;

    try {
      await confirmPayment(createdOrder.id);
      setCreatedOrder({ ...createdOrder, status: ORDER_STATUS.COMPLETED });
      setStep('success');
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento. Tente novamente.');
    }
  };

  const handleSendSMS = () => {
    if (!createdOrder) return;
    sendSMS(createdOrder);
  };

  const handleSendWhatsApp = () => {
    if (!createdOrder) return;
    sendWhatsApp(createdOrder);
  };

  const headerSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (providerLabel) parts.push(providerLabel);
    if (pkg.data) parts.push(pkg.data);
    if (pkg.validity) parts.push(pkg.validity);
    return parts.join(' • ');
  }, [providerLabel, pkg.data, pkg.validity]);

  const formattedPhonePreview = useMemo(() => {
    const cleaned = cleanPhoneNumber(phone);
    return cleaned.length === 9 ? formatPhoneNumber(cleaned) : phone;
  }, [phone]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-vodacom-red p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold">{modalTitle}</h2>

            <p className="text-sm text-white/80 mt-1">
              {pkg.name}
              {headerSubtitle ? ` — ${headerSubtitle}` : ''}
            </p>
          </div>

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vodacom-red/20 focus:border-vodacom-red transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Número de Telefone
                </label>
                <input
                  type="tel"
                  required
                  maxLength={15}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="84 123 4567"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    phoneError ? 'border-red-500' : 'border-gray-200'
                  } bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                    phoneError ? 'focus:ring-red-500/20' : 'focus:ring-vodacom-red/20'
                  } transition-all`}
                />

                {!phoneError && cleanPhoneNumber(phone).length === 9 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Será usado: <span className="font-semibold">{formattedPhonePreview}</span>
                  </p>
                )}

                {phoneError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {phoneError}
                  </p>
                )}
              </div>

              {needsExtraInfo && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {extraLabel}
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={extraInfo}
                      onChange={(e) => setExtraInfo(e.target.value)}
                      placeholder={
                        pkg.category === 'streaming'
                          ? 'ex: email@gmail.com'
                          : 'ex: email@gmail.com / 84xxxxxxx'
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-vodacom-red/20 focus:border-vodacom-red transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {pkg.category === 'giftcards'
                      ? 'Enviaremos o código digital para este contacto.'
                      : 'Usaremos esta informação para ativação do serviço.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'mpesa'
                        ? 'border-vodacom-red bg-vodacom-red-light'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Smartphone className={`h-5 w-5 ${paymentMethod === 'mpesa' ? 'text-vodacom-red' : 'text-gray-500'}`} />
                    <span className={`text-xs font-medium ${paymentMethod === 'mpesa' ? 'text-vodacom-red' : 'text-gray-600'}`}>
                      M-Pesa
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('emola')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'emola'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Smartphone className={`h-5 w-5 ${paymentMethod === 'emola' ? 'text-yellow-600' : 'text-gray-500'}`} />
                    <span className={`text-xs font-medium ${paymentMethod === 'emola' ? 'text-yellow-600' : 'text-gray-600'}`}>
                      E-Mola
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('later')}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === 'later'
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <CreditCard className={`h-5 w-5 ${paymentMethod === 'later' ? 'text-gray-600' : 'text-gray-500'}`} />
                    <span className={`text-xs font-medium ${paymentMethod === 'later' ? 'text-gray-600' : 'text-gray-600'}`}>
                      Depois
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Produto</span>
                  <span className="font-semibold text-gray-900">{pkg.name}</span>
                </div>

                {pkg.data && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Dados</span>
                    <span className="font-semibold text-gray-900">{pkg.data}</span>
                  </div>
                )}

                {pkg.validity && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Validade</span>
                    <span className="font-semibold text-gray-900">{pkg.validity}</span>
                  </div>
                )}

                {providerLabel && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Serviço</span>
                    <span className="font-semibold text-gray-900">{providerLabel}</span>
                  </div>
                )}

                <div className="flex justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-xl text-vodacom-red">
                    {formatMZN(pkg.price)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!phoneError}
                className="w-full bg-vodacom-red hover:bg-vodacom-red-dark text-white font-bold py-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
              >
                <Send className="h-5 w-5" />
                {loading ? 'Processando...' : 'Continuar'}
              </button>
            </form>
          )}

          {step === 'payment' && paymentMethod !== 'later' && paymentMethod !== null && (
            <div className="p-6 space-y-4">
              {(() => {
                const instructions = getPaymentInstructions(paymentMethod);
                if (!instructions) return null;

                return (
                  <>
                    <div className="bg-vodacom-red-light border border-vodacom-red/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-vodacom-red">{instructions.title}</span>
                        <span className="text-2xl font-bold text-vodacom-red">{formatMZN(pkg.price)}</span>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-vodacom-red/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Número para pagamento</p>
                            <p className="text-lg font-bold text-gray-800">{instructions.number}</p>
                          </div>
                          <button
                            onClick={() => handleCopyNumber(instructions.number)}
                            className="p-2 hover:bg-vodacom-red-light rounded-lg transition-colors relative"
                          >
                            <Copy className="h-5 w-5 text-vodacom-red" />
                            {copied && (
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                Copiado!
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="font-semibold text-gray-900 mb-3">Passos para pagamento:</p>
                      <ol className="space-y-2">
                        {instructions.steps.map((s, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex gap-2">
                            <span className="font-bold text-vodacom-red">{idx + 1}.</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 font-medium mb-2 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Após o pagamento:
                      </p>
                      <p className="text-sm text-yellow-700">
                        Guarde o SMS de confirmação e clique em <b>Já paguei</b>.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handlePaymentConfirmed}
                        className="flex-1 bg-vodacom-red hover:bg-vodacom-red-dark text-white font-semibold py-3 rounded-xl transition-colors"
                      >
                        Já paguei
                      </button>
                      <button
                        onClick={handleSendWhatsApp}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="h-5 w-5" />
                        Dúvidas?
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {step === 'success' && (
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div>
                <p className="text-lg font-bold text-gray-900">
                  {paymentMethod === 'later' ? 'Pedido registado!' : 'Pagamento confirmado!'}
                </p>

                <p className="text-sm text-gray-500 mt-1">Sua referência:</p>
                <p className="text-2xl font-extrabold text-vodacom-red mt-1">{reference}</p>

                <p className="text-xs text-gray-500 mt-2">
                  Status:{' '}
                  {createdOrder?.status === ORDER_STATUS.COMPLETED ? '✅ Confirmado' : '⏳ Pendente'}
                </p>

                {createdOrder && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(createdOrder.date)}
                  </p>
                )}
              </div>

              {paymentMethod === 'later' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    Faça o pagamento para um dos números abaixo:
                  </p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                      <span className="font-medium text-gray-700">
                        <span className="text-vodacom-red">M-Pesa:</span> {getPaymentNumber('mpesa')}
                      </span>
                      <button
                        onClick={() => handleCopyNumber(getPaymentNumber('mpesa'))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="h-4 w-4 text-vodacom-red" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2 rounded-lg">
                      <span className="font-medium text-gray-700">
                        <span className="text-yellow-600">E-Mola:</span> {getPaymentNumber('emola')}
                      </span>
                      <button
                        onClick={() => handleCopyNumber(getPaymentNumber('emola'))}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Copy className="h-4 w-4 text-yellow-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSendSMS}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="h-5 w-5" />
                  SMS
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp
                </button>
              </div>

              <p className="text-xs text-gray-400">
                Escolha como deseja receber a confirmação
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
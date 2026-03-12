import { useEffect, useMemo, useState } from 'react';
import { NavLink } from './NavLink';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, History, Menu, X, Clock, ChevronRight, LogIn } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const links = useMemo(
    () => [
      { to: '/', label: 'Pacotes', icon: Wifi },
      { to: '/historico', label: 'Histórico', icon: History },
      { to: '/admin', label: 'Iniciar sessão', icon: LogIn },
    ],
    []
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  const headerClass = isMobile
    ? 'bg-gradient-to-r from-[#e11d48] via-[#b1122f] to-[#7f1026] border-b border-white/10 shadow-md'
    : scrolled
    ? 'bg-[rgba(177,18,47,0.96)] backdrop-blur-md border-b border-white/10 shadow-lg'
    : 'bg-gradient-to-r from-[#e11d48] via-[#b1122f] to-[#7f1026] border-b border-white/10';

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${headerClass}`}>
        <div className={`container mx-auto px-4 ${scrolled ? 'py-2' : 'py-3'} transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-3 group" end>
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="rounded-2xl bg-white/15 p-2.5 group-hover:bg-white/20 transition-colors shadow-sm"
              >
                <Wifi className="h-6 w-6 text-white" />
              </motion.div>

              <div className="leading-tight">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-extrabold tracking-tight text-white">sConnecty</span>
                </div>

                <span className="hidden sm:block text-[11px] text-white/70">
                  Internet • Chamadas • Streaming
                </span>
              </div>
            </NavLink>

            <nav className="hidden md:flex items-center gap-2">
              {links.map((link) => (
                <div key={link.to} className="relative">
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
                    activeClassName="text-white"
                    inactiveClassName="text-white/80 hover:text-white"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>

                  {(location.pathname === link.to || (link.to === '/' && isHome)) && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute left-3 right-3 -bottom-1 h-[2px] rounded-full bg-white/80"
                    />
                  )}
                </div>
              ))}

              <a
                href="https://wa.me/258856001899"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-white/20"
              >
                Atendimento
                <ChevronRight className="h-4 w-4" />
              </a>
            </nav>

            <button
              className="rounded-xl bg-white/15 p-2.5 text-white shadow-sm transition-colors hover:bg-white/20 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setOpen(false)}
              />

              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="fixed top-0 right-0 z-50 flex h-full w-[320px] max-w-[85vw] flex-col bg-[#990f2e] shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/15 p-2.5">
                      <Wifi className="h-5 w-5 text-white" />
                    </div>
                    <div className="leading-tight">
                      <div className="font-extrabold text-white">sConnecty</div>
                      <div className="text-xs text-white/70">Atendimento 24/7</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-white/10 p-2 text-white transition-colors hover:bg-white/15"
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-3">
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
                      activeClassName="bg-white/18 text-white"
                      inactiveClassName="text-white/85 hover:bg-white/10 hover:text-white"
                      onClick={() => setOpen(false)}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </NavLink>
                  ))}

                  <a
                    href="https://wa.me/258856001899"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-between rounded-2xl bg-white/15 px-4 py-3 font-extrabold text-white transition-colors hover:bg-white/20"
                  >
                    WhatsApp
                    <ChevronRight className="h-5 w-5" />
                  </a>
                </div>

                <div className="mt-auto border-t border-white/10 p-5">
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <Clock className="h-4 w-4" />
                    Atendimento 24/7
                  </div>
                  <div className="mt-3 text-center text-xs text-white/50">© 2026 sConnecty MZ</div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </header>

      {isHome && (
        <motion.div
          className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.8, delay: 0.15 }}
        />
      )}
    </>
  );
};

export default Header;
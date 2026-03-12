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

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-vodacom-red/95 backdrop-blur border-b border-white/10' : 'vodacom-gradient'
        }`}
      >
        <div className={`container mx-auto px-4 ${scrolled ? 'py-2' : 'py-3'} transition-all`}>
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
                  <span className="text-lg font-extrabold tracking-tight text-white">
                    {scrolled && isMobile ? 'sConnecty' : 'sConnecty'}
                  </span>
                  <span className="text-xs font-semibold text-white/70">MZ</span>
                </div>

                <span className="text-[11px] text-white/70 hidden sm:block">
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
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 relative"
                    activeClassName="text-white"
                    inactiveClassName="text-white/80 hover:text-white"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>

                  {(location.pathname === link.to || (link.to === '/' && isHome)) ? (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute left-3 right-3 -bottom-1 h-[2px] bg-white/80 rounded-full"
                    />
                  ) : null}
                </div>
              ))}

              <a
                href="https://wa.me/258856001899"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-sm font-extrabold transition-colors inline-flex items-center gap-2"
              >
                Atendimento
                <ChevronRight className="h-4 w-4" />
              </a>
            </nav>

            <button
              className="md:hidden text-white p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
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
                className="fixed top-0 right-0 z-50 h-full w-[320px] max-w-[85vw] bg-vodacom-red shadow-2xl md:hidden flex flex-col"
              >
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/15 p-2.5">
                      <Wifi className="h-5 w-5 text-white" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-white font-extrabold">sConnecty</div>
                      <div className="text-white/70 text-xs">Atendimento 24/7</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-white"
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
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors"
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
                    className="mt-2 flex items-center justify-between px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/20 transition-colors text-white font-extrabold"
                  >
                    WhatsApp
                    <ChevronRight className="h-5 w-5" />
                  </a>
                </div>

                <div className="mt-auto p-5 border-t border-white/10">
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Clock className="h-4 w-4" />
                    Atendimento 24/7
                  </div>
                  <div className="mt-3 text-center text-white/50 text-xs">
                    © 2026 sConnecty MZ
                  </div>
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
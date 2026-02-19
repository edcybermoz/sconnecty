import { Wifi, Menu, X, History } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/historico', label: 'Meu Histórico', icon: History }
  ];

  return (
    <header className="sticky top-0 z-50 vodacom-gradient shadow-lg">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        
        <Link to="/" className="flex items-center gap-2">
          <div className="rounded-full bg-primary-foreground/20 p-2">
            <Wifi className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-primary-foreground">
              ROCKVILLE
            </span>
            <span className="ml-1 text-xs font-medium text-primary-foreground/70">
              MZ
            </span>
          </div>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                location.pathname === l.to
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-primary-foreground p-2"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden vodacom-gradient-dark"
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`block px-6 py-3 text-sm font-semibold border-t border-primary-foreground/10 ${
                  location.pathname === l.to
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'text-primary-foreground/70'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

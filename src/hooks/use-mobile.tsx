import * as React from "react";

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// Hook para detectar se é tablet
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      return width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
    };
    
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsTablet(checkTablet());
    };
    
    mql.addEventListener("change", onChange);
    setIsTablet(checkTablet());
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

// Hook para detectar se é desktop
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`);
    const onChange = () => {
      setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isDesktop;
}

// Hook unificado que retorna o tipo de dispositivo
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setDeviceType('mobile');
      } else if (width < TABLET_BREAKPOINT) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

// Hook para usar no Header (exemplo prático)
export function useResponsiveHeader() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const deviceType = useDeviceType();

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    deviceType,
    // Utilitários para o header
    showMobileMenu: isMobile,
    showCompactLogo: isMobile || isTablet,
    showFullContactInfo: !isMobile && !isTablet,
    menuAnimation: isMobile ? 'slide' : 'fade',
  };
}
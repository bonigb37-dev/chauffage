'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import FirewoodLoader from './FirewoodLoader';

type ActionLoadingContextType = {
  isLoading: boolean;
  message: string;
  triggerLoading: (durationMs?: number, customMessage?: string) => void;
  stopLoading: () => void;
};

const ActionLoadingContext = createContext<ActionLoadingContextType>({
  isLoading: false,
  message: 'Chargement en cours…',
  triggerLoading: () => {},
  stopLoading: () => {},
});

export const useActionLoading = () => useContext(ActionLoadingContext);

export function ActionLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Chargement en cours…');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopLoading = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const triggerLoading = useCallback((durationMs: number = 1800, customMessage?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(customMessage || 'Chargement en cours…');
    setIsLoading(true);

    timerRef.current = setTimeout(() => {
      setIsLoading(false);
      timerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    // 1. Transactional Form Submissions (High-value actions: Order, Quote, Contact, Payment Proof)
    const handleGlobalSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;

      // Skip if explicitly disabled
      if (form.getAttribute('data-no-loading') === 'true') return;

      // Do not trigger loading if standard HTML5 validation fails
      if (form.checkValidity && !form.checkValidity()) return;

      const explicitMsg = form.getAttribute('data-loading');
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

      let msg = '';
      if (explicitMsg) {
        msg = explicitMsg === 'true' ? 'Traitement de votre demande…' : explicitMsg;
      } else if (pathname.includes('/commande')) {
        msg = 'Sécurisation et enregistrement de votre commande…';
      } else if (pathname.includes('/devis')) {
        msg = 'Préparation et transmission de votre devis…';
      } else if (pathname.includes('/contact')) {
        msg = 'Envoi de votre message au service client…';
      } else if (form.querySelector('input[type="file"]') || pathname.includes('succes')) {
        msg = 'Téléversement et vérification du justificatif…';
      } else if (pathname.includes('/compte')) {
        msg = 'Vérification de vos identifiants…';
      }

      if (msg) {
        triggerLoading(1800, msg);
      }
    };

    // 2. Explicit Opt-In clicks ONLY (elements tagged with data-loading)
    const handleOptInClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const trigger = target.closest<HTMLElement>('[data-loading]');
      // Skip forms (handled by submit event) or elements explicitly disabled
      if (!trigger || trigger.tagName === 'FORM' || trigger.getAttribute('data-no-loading') === 'true') {
        return;
      }

      const explicitMsg = trigger.getAttribute('data-loading');
      const msg = explicitMsg && explicitMsg !== 'true' ? explicitMsg : 'Traitement en cours…';
      triggerLoading(1800, msg);
    };

    document.addEventListener('submit', handleGlobalSubmit, { capture: true });
    document.addEventListener('click', handleOptInClick, { capture: true });

    return () => {
      document.removeEventListener('submit', handleGlobalSubmit, { capture: true });
      document.removeEventListener('click', handleOptInClick, { capture: true });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerLoading]);

  return (
    <ActionLoadingContext.Provider value={{ isLoading, message, triggerLoading, stopLoading }}>
      {children}

      {/* Global Liquid Glass FirewoodLoader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-stone-900/30 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300">
          {/* Liquid Glass Card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/75 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-2xl max-w-sm w-full text-center">
            {/* Glossy diagonal highlight */}
            <div className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-white/60 blur-xl" />

            <FirewoodLoader message={message} />
          </div>
        </div>
      )}
    </ActionLoadingContext.Provider>
  );
}

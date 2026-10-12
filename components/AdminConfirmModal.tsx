'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';

export type ConfirmVariant = 'role' | 'warning' | 'danger' | 'success' | 'info';

export interface AdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  requireMatchText?: string;
  requireMatchPlaceholder?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function AdminConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'warning',
  isLoading = false,
  requireMatchText,
  requireMatchPlaceholder,
  onConfirm,
  onClose,
}: AdminConfirmModalProps) {
  const [matchInput, setMatchInput] = useState('');

  // Reset match input whenever dialog opens/closes
  useEffect(() => {
    if (isOpen) setMatchInput('');
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isMatchValid = !requireMatchText || matchInput.trim() === requireMatchText.trim();

  // Variant styling helpers
  const getIcon = () => {
    switch (variant) {
      case 'role':
        return <ShieldCheck size={26} className="text-[#FF8533]" strokeWidth={2.2} />;
      case 'danger':
        return <Trash2 size={26} className="text-rose-400" strokeWidth={2.2} />;
      case 'success':
        return <CheckCircle2 size={26} className="text-emerald-400" strokeWidth={2.2} />;
      case 'warning':
      default:
        return <AlertTriangle size={26} className="text-amber-400" strokeWidth={2.2} />;
    }
  };

  const getHaloBg = () => {
    switch (variant) {
      case 'role':
        return 'bg-[#FF6B00]/15 border-[#FF6B00]/30 shadow-[0_0_24px_rgba(255,107,0,0.25)]';
      case 'danger':
        return 'bg-rose-500/15 border-rose-500/30 shadow-[0_0_24px_rgba(244,63,94,0.25)]';
      case 'success':
        return 'bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_24px_rgba(16,185,129,0.25)]';
      case 'warning':
      default:
        return 'bg-amber-500/15 border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.25)]';
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'role':
        return 'bg-gradient-to-r from-[#FF6B00] to-[#E65A00] hover:brightness-110 text-white shadow-md shadow-orange-500/30 focus:ring-orange-500/50';
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white shadow-md shadow-rose-600/30 focus:ring-rose-500/50';
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-md shadow-emerald-600/30 focus:ring-emerald-500/50';
      case 'warning':
      default:
        return 'bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white shadow-md shadow-amber-600/30 focus:ring-amber-500/50';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#131b24] text-white border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-150 select-none">
        {/* Subtle Ambient Radial Highlight Glow at Top */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full blur-3xl pointer-events-none opacity-20 ${
            variant === 'danger'
              ? 'bg-rose-500'
              : variant === 'success'
              ? 'bg-emerald-500'
              : 'bg-[#FF6B00]'
          }`}
        />

        {/* Top Header Row with Icon and Close Button */}
        <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 transition-transform ${getHaloBg()}`}
          >
            {getIcon()}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-hidden disabled:opacity-40"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Body */}
        <div className="space-y-2 relative z-10">
          <h3
            id="confirm-dialog-title"
            className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug"
          >
            {title}
          </h3>

          <div className="text-sm text-zinc-300 leading-relaxed font-normal">
            {description}
          </div>
        </div>

        {/* Optional Typed Confirmation (Replaces window.prompt) */}
        {requireMatchText && (
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2 relative z-10">
            <p className="text-xs font-semibold text-zinc-300">
              Pour valider, tapez précisément{' '}
              <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                {requireMatchText}
              </span>{' '}
              ci-dessous :
            </p>
            <input
              type="text"
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={requireMatchPlaceholder || requireMatchText}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white placeholder-zinc-500 text-sm font-mono focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isMatchValid && !isLoading) {
                  e.preventDefault();
                  void onConfirm();
                }
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3 relative z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-zinc-300 hover:text-white transition active:scale-[0.98] focus:outline-hidden disabled:opacity-40"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={!isMatchValid || isLoading}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-hidden focus:ring-2 disabled:opacity-40 disabled:cursor-not-allowed ${getConfirmButtonClasses()}`}
          >
            {isLoading && <LoaderCircle size={15} className="animate-spin text-white" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

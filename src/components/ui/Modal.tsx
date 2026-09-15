"use client";
import { useEffect, useRef, type ReactNode } from "react";
export default function Modal({ children, onClose, busy = false, labelledBy }: { children: ReactNode; onClose: () => void; busy?: boolean; labelledBy: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={labelledBy} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="fixed inset-0 m-auto max-h-[94svh] w-[calc(100%-2rem)] max-w-xl overflow-visible rounded-2xl bg-transparent p-0 text-stone-900 backdrop:bg-stone-950/40">{children}</dialog>;
}

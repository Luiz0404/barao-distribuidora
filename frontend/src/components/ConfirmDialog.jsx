import React from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ConfirmDialog({
  title = "Tem certeza?",
  description = "Esta ação não pode ser desfeita.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  testid = "confirm",
  destructive = true,
  children,
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="bg-[var(--surface)] border border-[var(--line-gold)] text-white max-w-md" data-testid={`${testid}-dialog`}>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl gold-text">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60 leading-relaxed">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            data-testid={`${testid}-cancel`}
            className="rounded-full bg-transparent border border-white/15 text-white hover:bg-white/5 hover:text-white"
          >{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            data-testid={`${testid}-confirm`}
            className={destructive
              ? "rounded-full bg-gradient-to-b from-[#ff4747] to-[#c81f1f] hover:brightness-110 text-white font-semibold"
              : "rounded-full btn-gold-glow font-semibold"}
          >{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

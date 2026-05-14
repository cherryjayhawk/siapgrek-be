"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export default function Snackbar({
  open,
  message,
  type = "success",
  onClose,
}: Props) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div
        className={`
        px-5 py-3
        rounded-xl
        text-white
        shadow-xl
        ${
          type === "success"
            ? "bg-green-500"
            : "bg-red-500"
        }
      `}
      >
        {message}
      </div>
    </div>
  );
}
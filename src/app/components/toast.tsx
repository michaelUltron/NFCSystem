import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastProps = {
  type: "success" | "error";
  message: string;
  onClose: () => void;
};

export function Toast({ type, message, onClose }: ToastProps) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm w-[calc(100%-2rem)]">
      <div
        className={`rounded-xl shadow-lg border p-4 flex items-start gap-3 ${
          isSuccess
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        )}

        <div className="flex-1 text-sm">{message}</div>

        <button
          type="button"
          onClick={onClose}
          className="opacity-70 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
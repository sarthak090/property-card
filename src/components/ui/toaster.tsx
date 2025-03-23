
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="bg-[#151923] border border-white/10 text-white shadow-lg">
            <div className="grid gap-1">
              {title && <ToastTitle className="text-[#9b87f5] font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-gray-300">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-white hover:bg-gray-700 hover:text-white" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

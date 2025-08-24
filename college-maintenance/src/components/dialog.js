"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({ children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <DialogPrimitive.Content
        {...props}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-lg"
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-3 text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export const DialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
)

export const DialogTitle = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
)

export const DialogDescription = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
)

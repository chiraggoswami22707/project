"use client"

import * as React from "react"
// Removed import of '@radix-ui/react-dialog' to fix build error due to missing dependency
// import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

// Fallback simple dialog components to replace Radix UI dialog components

export const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export const DialogContent = ({ children, className, ...props }) => (
  <div {...props} className={className}>
    {children}
  </div>
)

export const DialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
)

export const DialogTitle = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
)

export const DialogDescription = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
)

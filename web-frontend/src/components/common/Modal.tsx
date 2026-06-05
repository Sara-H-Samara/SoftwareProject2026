import { Fragment, type ReactNode } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  /** Max width class — defaults to max-w-lg */
  maxWidth?: string
  /** Hide the default close (X) button */
  hideCloseButton?: boolean
}

/**
 * Accessible modal dialog using Headless UI.
 * Handles focus trapping, Escape key dismissal, and backdrop click.
 * Uses Tailwind's animate utilities for smooth open/close transitions.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  hideCloseButton = false,
}: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel
                className={`w-full ${maxWidth} glass-card p-6 shadow-2xl shadow-black/50`}
              >
                {/* Header */}
                {(title || !hideCloseButton) && (
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-white">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-sm text-gray-400">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {!hideCloseButton && (
                      <button
                        onClick={onClose}
                        className="ml-4 p-1.5 text-gray-500 hover:text-white rounded-lg
                                   hover:bg-surface transition-colors focus-ring"
                        aria-label="Close modal"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

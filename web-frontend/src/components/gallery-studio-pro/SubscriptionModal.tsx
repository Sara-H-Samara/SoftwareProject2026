import { useEffect, useRef, useState } from 'react'
import { XMarkIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionModalProps {
  isOpen:      boolean
  onClose:     () => void
  onSubscribe: (planId: 'monthly' | 'yearly') => Promise<void> | void
}

// ─── Plans ────────────────────────────────────────────────────────────────────

const MONTHLY_PRICE = 9.99

const PLANS = [
  {
    id:       'monthly' as const,
    name:     'Monthly',
    price:    MONTHLY_PRICE,
    period:   '/month',
    savings:  null,
    features: [
      'Unlimited gallery designs',
      'All wall materials & textures',
      'All floor types & patterns',
      'Advanced lighting system',
      'Priority support',
    ],
  },
  {
    id:       'yearly' as const,
    name:     'Yearly',
    price:    +(MONTHLY_PRICE * 12 * 0.84).toFixed(2),  // 16% off
    period:   '/year',
    // Derive savings from monthly price — no hardcoded string
    savings:  `Save ${Math.round((1 - 0.84) * 100)}% vs monthly`,
    popular:  true,
    features: [
      'Everything in Monthly',
      'Early access to new features',
      'Custom domain support',
      'Dedicated onboarding call',
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubscriptionModal({
  isOpen,
  onClose,
  onSubscribe,
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // ── Close on Escape ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // ── Focus close button on open (basic focus trap entry) ─────────────────
  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  // ── Prevent body scroll while open ──────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubscribe = async (planId: 'monthly' | 'yearly') => {
    if (loading) return
    setLoading(planId)
    try {
      await onSubscribe(planId)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="sub-modal-title" className="text-lg font-bold text-stone-800">
                Upgrade to Pro
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">Unlock all gallery design features</p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-5 transition-all
                  ${plan.popular
                    ? 'border-purple-500 bg-purple-50/30'
                    : 'border-stone-200'
                  }`}
              >
                {/* Best value badge */}
                {plan.popular && (
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">
                    Best Value
                  </span>
                )}

                {/* Price */}
                <div className="mb-4">
                  <h3 className="text-base font-bold text-stone-800">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-3xl font-bold text-stone-900">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-stone-500">{plan.period}</span>
                  </div>
                  {/* Savings shown only when present — derived from price, not hardcoded */}
                  {plan.savings && (
                    <p className="text-xs font-semibold text-emerald-600 mt-1">
                      {plan.savings}
                      {' '}· ${(MONTHLY_PRICE * 12 - plan.price).toFixed(2)} cheaper/yr
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                      <CheckIcon className="w-4 h-4 text-purple-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA button with loading state */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 shadow-md shadow-purple-200'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    `Start ${plan.name} Plan`
                  )}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-stone-400 mt-5">
            Cancel anytime · No commitment · Secured by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
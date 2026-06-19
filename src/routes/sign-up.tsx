import { Bell, CheckCircle2, ChevronRight, Compass, MapPin, Shield, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { StateCard } from '#/components/route-state'
import { authClient } from '#/lib/auth-client'
import { APP_NAME, APP_TAGLINE } from '#/lib/config'
import { getViewerSnapshot } from '#/server/auth.functions'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

type OnboardingStep = 'welcome' | 'notifications' | 'location' | 'account'
type PermissionState = 'idle' | 'granted' | 'denied' | 'unsupported'

const stepOrder: OnboardingStep[] = ['welcome', 'notifications', 'location', 'account']

export const Route = createFileRoute('/sign-up')({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const viewer = await getViewerSnapshot()
    if (viewer) {
      throw redirect({ to: '/feed' })
    }
  },
  component: SignUpRoute,
})

function SignUpRoute() {
  const search = Route.useSearch()
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [notificationState, setNotificationState] = useState<PermissionState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported'
    }
    return window.Notification.permission === 'granted'
      ? 'granted'
      : window.Notification.permission === 'denied'
        ? 'denied'
        : 'idle'
  })
  const [locationState, setLocationState] = useState<PermissionState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stepIndex = stepOrder.indexOf(step)
  const progress = ((stepIndex + 1) / stepOrder.length) * 100

  const canContinue = useMemo(() => {
    if (step === 'welcome') return true
    if (step === 'notifications') return notificationState !== 'idle'
    if (step === 'location') return locationState !== 'idle'
    return false
  }, [locationState, notificationState, step])

  async function requestNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationState('unsupported')
      return
    }

    const result = await window.Notification.requestPermission()
    setNotificationState(result === 'granted' ? 'granted' : 'denied')
  }

  async function requestLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationState('unsupported')
      return
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationState('granted')
          resolve()
        },
        () => {
          setLocationState('denied')
          resolve()
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      )
    })
  }

  function goNext() {
    const nextIndex = Math.min(stepIndex + 1, stepOrder.length - 1)
    setStep(stepOrder[nextIndex]!)
  }

  function goBack() {
    const previousIndex = Math.max(stepIndex - 1, 0)
    setStep(stepOrder[previousIndex]!)
  }

  async function onSubmit(formData: FormData) {
    setError(null)
    setIsSubmitting(true)

    const result = await authClient.signUp.email({
      email: String(formData.get('email') || ''),
      password: String(formData.get('password') || ''),
      name: String(formData.get('displayName') || ''),
      username: String(formData.get('username') || ''),
      callbackURL: search.redirect || '/feed',
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error.message || 'Unable to create your account.')
      return
    }

    await router.navigate({ to: search.redirect || '/feed' })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1118] text-[#f6f1e8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(207,177,118,0.24),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(53,101,212,0.24),transparent_26%),linear-gradient(180deg,#11161f_0%,#0a0e15_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-[rgba(207,177,118,0.28)] bg-[rgba(255,255,255,0.06)] text-[12px] font-semibold uppercase tracking-[0.34em] text-[#f0d7aa] shadow-[0_16px_36px_rgba(0,0,0,0.28)]">
              GS
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#bfa77a]">
                {APP_NAME}
              </p>
              <p className="text-sm text-[#ddd3c1]">{APP_TAGLINE}</p>
            </div>
          </div>

          <Link
            to="/sign-in"
            search={{ redirect: search.redirect }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#f6f1e8] transition hover:bg-white/10"
          >
            Sign in
          </Link>
        </div>

        <div className="mb-6 rounded-full border border-white/10 bg-white/5 p-1">
          <div
            className="h-2 rounded-full bg-[linear-gradient(90deg,#3565d4,#cfb176)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#bfa77a]">
                Collector onboarding
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                Join GameSeal like a premium app, not a plain form.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-[#d5ccbc]">
                We’ll walk through the permissions that power live moment context, then create
                your account and drop you straight into the main experience.
              </p>

              <div className="mt-8 space-y-3">
                <FeatureRow
                  icon={Sparkles}
                  title="Animated onboarding"
                  body="A proper multi-screen first run instead of exposing the full product before account setup."
                />
                <FeatureRow
                  icon={Bell}
                  title="Notification prompt"
                  body="Ask for score, friend, and collection activity permissions in context."
                />
                <FeatureRow
                  icon={MapPin}
                  title="Location prompt"
                  body="Enable venue-aware features before collectors start minting live moments."
                />
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[rgba(207,177,118,0.16)] bg-[rgba(255,255,255,0.04)] p-5">
              <p className="text-sm font-semibold text-white">Landing screen lockout</p>
              <p className="mt-2 text-sm leading-6 text-[#cfc3ae]">
                Feed, mint, vault, and settings navigation stay hidden here so onboarding feels
                intentionally gated until account creation is complete.
              </p>
            </div>
          </section>

          <section className="flex flex-col rounded-[2rem] border border-[rgba(207,177,118,0.18)] bg-[linear-gradient(180deg,rgba(22,27,36,0.94),rgba(13,17,24,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#bfa77a]">
                  Step {stepIndex + 1} of {stepOrder.length}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {step === 'welcome'
                    ? 'Brand intro'
                    : step === 'notifications'
                      ? 'Notifications'
                      : step === 'location'
                        ? 'Location access'
                        : 'Create your account'}
                </p>
              </div>

              {stepIndex > 0 ? (
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#e5dbca] transition hover:bg-white/10"
                  onClick={goBack}
                >
                  Back
                </button>
              ) : null}
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div
                className="h-full transition-transform duration-500"
                style={{ transform: `translateX(-${stepIndex * 100}%)` }}
              >
                <div className="flex h-full">
                  <OnboardingCard
                    title="Collect the best parts of being there"
                    body="GameSeal turns your sports photos into interactive collectible slabs with story, seat, and venue context built in."
                    icon={Sparkles}
                  >
                    <div className="grid gap-3 sm:grid-cols-3">
                      <StatTile label="Experience" value="Premium" />
                      <StatTile label="Moments" value="Live" />
                      <StatTile label="Setup" value="Fast" />
                    </div>
                  </OnboardingCard>

                  <OnboardingCard
                    title="Stay in the loop"
                    body="Notifications power friend activity, collection updates, and live moment prompts while the app stays lightweight."
                    icon={Bell}
                  >
                    <PermissionStatus state={notificationState} />
                    <div className="mt-5 flex gap-3">
                      <button type="button" className="gs-button-primary" onClick={() => void requestNotifications()}>
                        Allow notifications
                      </button>
                      <button
                        type="button"
                        className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#e5dbca] transition hover:bg-white/10"
                        onClick={() => setNotificationState('denied')}
                      >
                        Not now
                      </button>
                    </div>
                  </OnboardingCard>

                  <OnboardingCard
                    title="Make venue features smarter"
                    body="Location helps GameSeal recognize where you captured a moment and improves venue-aware experiences later in the app."
                    icon={Compass}
                  >
                    <PermissionStatus state={locationState} />
                    <div className="mt-5 flex gap-3">
                      <button type="button" className="gs-button-primary" onClick={() => void requestLocation()}>
                        Enable location
                      </button>
                      <button
                        type="button"
                        className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#e5dbca] transition hover:bg-white/10"
                        onClick={() => setLocationState('denied')}
                      >
                        Skip for now
                      </button>
                    </div>
                  </OnboardingCard>

                  <OnboardingCard
                    title="Create your collector profile"
                    body="This creates the auth account and matching GameSeal profile, then sends you directly into the main app."
                    icon={Shield}
                  >
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault()
                        void onSubmit(new FormData(event.currentTarget))
                      }}
                    >
                      <label className="gs-form-label-dark block space-y-2 text-sm">
                        <span>Display name</span>
                        <input required className="gs-field-dark gs-field" name="displayName" type="text" />
                      </label>
                      <label className="gs-form-label-dark block space-y-2 text-sm">
                        <span>Username</span>
                        <input required className="gs-field-dark gs-field" name="username" type="text" />
                      </label>
                      <label className="gs-form-label-dark block space-y-2 text-sm">
                        <span>Email</span>
                        <input required className="gs-field-dark gs-field" name="email" type="email" />
                      </label>
                      <label className="gs-form-label-dark block space-y-2 text-sm">
                        <span>Password</span>
                        <input
                          required
                          minLength={8}
                          className="gs-field-dark gs-field"
                          name="password"
                          type="password"
                        />
                      </label>

                      {error ? (
                        <StateCard
                          title="Sign-up failed"
                          message={error}
                          tone="danger"
                          appearance="collectible"
                        />
                      ) : null}

                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-[1rem] bg-[linear-gradient(180deg,#e3c990,#cfb176)] px-4 py-3 text-sm font-semibold text-[#231a11] transition hover:bg-[linear-gradient(180deg,#edd7aa,#d4b97f)] disabled:opacity-60"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating account...' : 'Create account and enter GameSeal'}
                      </button>
                    </form>
                  </OnboardingCard>
                </div>
              </div>
            </div>

            {step !== 'account' ? (
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <p className="text-sm text-[#cfc3ae]">
                  {step === 'welcome'
                    ? 'Start the onboarding flow.'
                    : 'You can allow or skip access and continue.'}
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11161f] transition hover:bg-[#f3ead8] disabled:opacity-50"
                  disabled={!canContinue}
                  onClick={goNext}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3 rounded-[1.25rem] border border-white/8 bg-white/5 p-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-[rgba(207,177,118,0.22)] bg-[rgba(207,177,118,0.1)] text-[#f0d7aa]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#cfc3ae]">{body}</p>
      </div>
    </div>
  )
}

function OnboardingCard({
  title,
  body,
  children,
  icon: Icon,
}: {
  title: string
  body: string
  children: React.ReactNode
  icon: typeof Sparkles
}) {
  return (
    <div className="w-full shrink-0">
      <div className="h-full rounded-[1.8rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[rgba(207,177,118,0.24)] bg-[rgba(207,177,118,0.1)] text-[#f0d7aa]">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white">{title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#d5ccbc]">{body}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-[rgba(255,255,255,0.04)] p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[#bfa77a]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function PermissionStatus({ state }: { state: PermissionState }) {
  const copy =
    state === 'granted'
      ? 'Access granted. You are ready to keep moving.'
      : state === 'denied'
        ? 'Access skipped or denied. You can still continue.'
        : state === 'unsupported'
          ? 'This device does not support that permission prompt.'
          : 'We have not asked for permission yet.'

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2">
        <CheckCircle2
          className={`h-4 w-4 ${
            state === 'granted'
              ? 'text-[#7ee7ad]'
              : state === 'denied'
                ? 'text-[#f2c08f]'
                : 'text-[#8ea1c7]'
          }`}
        />
        <p className="text-sm font-medium text-white">
          {state === 'granted'
            ? 'Granted'
            : state === 'denied'
              ? 'Skipped'
              : state === 'unsupported'
                ? 'Unsupported'
                : 'Pending'}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#d5ccbc]">{copy}</p>
    </div>
  )
}

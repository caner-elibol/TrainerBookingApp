"use client";

import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { extractErrorMessage } from "@/lib/api-error";
import Alert from "@/components/ui/Alert";
import Logo from "@/components/Logo";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { PHONE_INVALID_MESSAGE, formatPhone, isCompletePhone, normalizePhone } from "@/lib/phone";
import { usePhoneInput } from "@/components/ui/PhoneInput";

type Step = "phone" | "otp" | "register";
type Role = "Trainer" | "Client";

async function requestOtp(phone: string) {
  const res = await fetch("/api/auth/otp/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

async function verifyOtp(phone: string, code: string, fullName?: string, role?: Role) {
  const res = await fetch("/api/auth/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      code,
      fullName: fullName ?? null,
      role: role ? (role === "Trainer" ? 1 : 2) : null,
    }),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

const STEP_COPY: Record<Step, { title: string; description: string }> = {
  phone: {
    title: "Hoş geldin",
    description: "Telefon numaranla giriş yap, antrenman yolculuğuna kaldığın yerden devam et.",
  },
  otp: {
    title: "Doğrulama Kodu",
    description: "",
  },
  register: {
    title: "Hesabını Oluştur",
    description: "Bu numara ilk kez giriş yapıyor. Hesabını oluşturmak için birkaç bilgi daha gerekiyor.",
  },
};

const HERO_IMAGE_URL = "/login.jpg";

const glassInputClass =
  "w-full rounded-2xl bg-transparent p-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none";

function PhoneAuthFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const sessionExpired = searchParams.get("sessionExpired") === "1";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("Client");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const phoneInputProps = usePhoneInput(phone, setPhone);

  async function afterLogin() {
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();

    if (redirectTo && redirectTo.startsWith("/")) {
      router.push(redirectTo);
    } else {
      router.push(session.user?.role === "Trainer" ? "/dashboard" : "/");
    }
    router.refresh();
  }

  async function handlePhoneSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(PHONE_INVALID_MESSAGE);
      return;
    }
    setPhone(normalized);
    setPending(true);

    const { ok, data } = await requestOtp(normalized);
    setPending(false);

    if (!ok) {
      setError(extractErrorMessage(data));
      return;
    }

    setStep("otp");
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const { ok, data } = await verifyOtp(phone, code);
    setPending(false);

    if (!ok) {
      setError(extractErrorMessage(data));
      return;
    }

    if (data?.requiresRegistration) {
      setStep("register");
      return;
    }

    await afterLogin();
  }

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const { ok, data } = await verifyOtp(phone, code, fullName, role);
    setPending(false);

    if (!ok) {
      setError(extractErrorMessage(data));
      return;
    }

    if (redirectTo && redirectTo.startsWith("/")) {
      router.push(redirectTo);
    } else {
      router.push(role === "Trainer" ? "/onboarding" : "/");
    }
    router.refresh();
  }

  return (
    <main className="flex min-h-[100dvh] w-full flex-col bg-surface md:flex-row">
      <section className="flex flex-1 items-center justify-center p-8">
        <div key={step} className="flex w-full max-w-md flex-col gap-6">
          <Animated delay={0}>
            <Logo />
          </Animated>

          <Animated as="h1" delay={100} className="text-4xl leading-tight font-light tracking-tighter text-ink md:text-5xl">
            {STEP_COPY[step].title}
          </Animated>

          <Animated as="p" delay={200} className="text-ink-secondary">
            {step === "otp" ? (
              <>
                <span className="font-medium text-ink">{formatPhone(phone)}</span> numarasına gönderilen 6 haneli kodu gir.
              </>
            ) : (
              STEP_COPY[step].description
            )}
          </Animated>

          {sessionExpired && step === "phone" && (
            <Animated delay={250}>
              <Alert variant="warning" className="rounded-2xl">
                Oturumun sona erdi. Lütfen tekrar giriş yap.
              </Alert>
            </Animated>
          )}

          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <Animated delay={300}>
                <AuthLabel htmlFor="phone-input">Telefon Numarası</AuthLabel>
                <GlassInputWrapper>
                  <div className="flex items-center">
                    <span className="pl-4 text-sm text-ink-secondary" aria-hidden="true">
                      +90
                    </span>
                    <input
                      id="phone-input"
                      {...phoneInputProps}
                      required
                      autoFocus
                      className={cn(glassInputClass, "pl-2 tracking-wide")}
                    />
                  </div>
                </GlassInputWrapper>
              </Animated>

              {error && (
                <Alert variant="error" className="rounded-2xl">
                  {error}
                </Alert>
              )}

              <Animated delay={400}>
                <PrimaryButton pending={pending} disabled={!isCompletePhone(phone)}>
                  {pending ? "Kod gönderiliyor…" : "Kod Gönder"}
                </PrimaryButton>
              </Animated>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <Animated delay={300}>
                <AuthLabel htmlFor="otp-input">Doğrulama Kodu</AuthLabel>
                <GlassInputWrapper>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    required
                    autoFocus
                    className={cn(glassInputClass, "tracking-[0.5em]")}
                  />
                </GlassInputWrapper>
              </Animated>

              {error && (
                <Alert variant="error" className="rounded-2xl">
                  {error}
                </Alert>
              )}

              <Animated delay={400}>
                <PrimaryButton pending={pending}>{pending ? "Doğrulanıyor…" : "Doğrula"}</PrimaryButton>
              </Animated>

              <Animated as="p" delay={500} className="text-center text-sm text-ink-secondary">
                Numara yanlış mı?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setPhone(formatPhone(phone));
                    setCode("");
                    setError(null);
                  }}
                  className="font-medium text-ink transition-colors hover:underline"
                >
                  Numarayı değiştir
                </button>
              </Animated>
            </form>
          )}

          {step === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <Animated delay={300}>
                <span className="text-sm font-medium text-ink-secondary">Rolün</span>
                <div role="radiogroup" aria-label="Rolün" className="mt-1 grid grid-cols-2 gap-2">
                  {(["Client", "Trainer"] as Role[]).map((option) => (
                    <label
                      key={option}
                      className={cn(
                        "cursor-pointer rounded-2xl border p-4 text-center text-sm font-medium transition-colors",
                        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink/20",
                        role === option
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border-default bg-ink/5 text-ink hover:bg-subtle",
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option}
                        checked={role === option}
                        onChange={() => setRole(option)}
                        className="peer sr-only"
                      />
                      {option === "Trainer" ? "Eğitmenim" : "Danışanım"}
                    </label>
                  ))}
                </div>
              </Animated>

              <Animated delay={400}>
                <AuthLabel htmlFor="register-full-name">Ad Soyad</AuthLabel>
                <GlassInputWrapper>
                  <input
                    id="register-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adını ve soyadını gir"
                    required
                    autoComplete="name"
                    autoFocus
                    className={glassInputClass}
                  />
                </GlassInputWrapper>
              </Animated>

              {error && (
                <Alert variant="error" className="rounded-2xl">
                  {error}
                </Alert>
              )}

              <Animated delay={500}>
                <PrimaryButton pending={pending}>
                  {pending ? "Hesap oluşturuluyor…" : "Hesabı Oluştur"}
                </PrimaryButton>
              </Animated>
            </form>
          )}
        </div>
      </section>

      <section className="relative hidden flex-1 p-4 md:block" aria-hidden="true">
        <div
          className="auth-slide-right absolute inset-4 rounded-3xl bg-cover bg-center"
          style={{ animationDelay: "300ms", backgroundImage: `url(${HERO_IMAGE_URL}), linear-gradient(135deg, #262626, #0a0a0a)` }}
        />
        <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center px-8">
          <div
            className="auth-card flex w-72 items-start gap-3 rounded-3xl border border-white/20 bg-white/75 p-5 backdrop-blur-xl"
            style={{ animationDelay: "1000ms" }}
          >
            <Logo showWordmark={false} markSize={40} />
            <div className="text-sm leading-snug">
              <p className="font-medium text-ink">CoreFit</p>
              <p className="text-ink-secondary">Daha güçlü yarınlar</p>
              <p className="mt-1 text-ink/80">Seansların, paketlerin ve ilerlemen tek bir yerde.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Animated({
  as: Tag = "div",
  delay,
  className,
  children,
}: {
  as?: "div" | "h1" | "p";
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("auth-animate", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

function AuthLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink-secondary">
      {children}
    </label>
  );
}

function GlassInputWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 rounded-2xl border border-border-default bg-ink/5 backdrop-blur-sm transition-colors focus-within:border-ink/40 focus-within:bg-surface">
      {children}
    </div>
  );
}

function PrimaryButton({
  pending,
  disabled = false,
  children,
}: {
  pending: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Spinner size={16} />}
      {children}
    </button>
  );
}

export default function PhoneAuthForm() {
  return (
    <Suspense>
      <PhoneAuthFormInner />
    </Suspense>
  );
}

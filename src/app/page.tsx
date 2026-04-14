import { QuotaCalculator } from "@/components/quota-calculator";
import { Shield, Clock, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CalculatorSection />
        <TrustSection />
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-foreground" />
          <span className="text-sm font-semibold tracking-tight">
            QuotaCalc
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#calculator" className="hover:text-foreground transition-colors">
            Calculator
          </a>
          <a href="#trust" className="hover:text-foreground transition-colors">
            Why Us
          </a>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,var(--color-muted)_0%,transparent_100%)]" />
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 sm:pt-32 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-md border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-sm bg-foreground/40" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-sm bg-foreground" />
          </span>
          Trusted by 200+ Malaysian businesses
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Streamline Your
          <br />
          <span className="text-muted-foreground">
            Foreign Worker Quota
          </span>
          <br />& Compliance
        </h1>
        <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Instantly calculate your approved foreign worker headcount across F&B,
          Manufacturing, Construction, Agriculture & Cleaning industries.
          Get a tailored compliance strategy in minutes.
        </p>
        <div className="mt-8">
          <a
            href="#calculator"
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Calculate Your Quota
          </a>
        </div>
      </div>
    </section>
  );
}

function CalculatorSection() {
  return (
    <section id="calculator" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <QuotaCalculator />
      </div>
    </section>
  );
}

function TrustSection() {
  const features = [
    {
      icon: Shield,
      title: "Regulatory Compliant",
      description:
        "Calculations based on latest MOHR, Immigration & CIDB guidelines for each sector.",
    },
    {
      icon: Clock,
      title: "Instant Results",
      description:
        "Get your estimated quota in seconds — no waiting, no lengthy consultations needed.",
    },
    {
      icon: BarChart3,
      title: "Data-Driven Strategy",
      description:
        "Receive a detailed compliance roadmap tailored to your industry and business scale.",
    },
  ];

  return (
    <section id="trust" className="border-t py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why Businesses Trust QuotaCalc
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enterprise-grade compliance tools, simplified.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border p-6 space-y-3"
            >
              <f.icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-md bg-foreground" />
              <span className="font-semibold text-foreground">QuotaCalc</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Malaysia&apos;s trusted foreign worker quota calculator and
              compliance advisory platform.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
              Contact
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>WhatsApp: +60 12-345 6789</li>
              <li>Email: hello@quotacalc.my</li>
              <li>Kuala Lumpur, Malaysia</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">
              Links
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <a href="#calculator" className="hover:text-foreground transition-colors">
                  Quota Calculator
                </a>
              </li>
              <li>
                <a href="#trust" className="hover:text-foreground transition-colors">
                  Why Us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} QuotaCalc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

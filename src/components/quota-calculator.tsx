"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UtensilsCrossed,
  Factory,
  HardHat,
  Wheat,
  SprayCan,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { AnimatedCounter } from "@/components/animated-counter";

import {
  industries,
  fnbSchema,
  manufacturingSchema,
  constructionSchema,
  agricultureSchema,
  cleaningSchema,
  leadSchema,
  type IndustryId,
  type LeadData,
} from "@/lib/schemas";
import { calculateQuota, type CalculationInput } from "@/lib/calculator";
import { submitLead } from "@/app/actions";
import { cn } from "@/lib/utils";

const iconMap = {
  UtensilsCrossed,
  Factory,
  HardHat,
  Wheat,
  SprayCan,
} as const;

const schemaMap = {
  fnb: fnbSchema,
  manufacturing: manufacturingSchema,
  construction: constructionSchema,
  agriculture: agricultureSchema,
  cleaning: cleaningSchema,
} as const;

type Step = "industry" | "calculate" | "result" | "lead" | "success";

function getOrCreateDeviceId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const key = "quota_calc_device_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, generated);
  return generated;
}

export function QuotaCalculator() {
  const [step, setStep] = useState<Step>("industry");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | null>(
    null
  );
  const [calcData, setCalcData] = useState<CalculationInput | null>(null);
  const [quota, setQuota] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleSelectIndustry(id: IndustryId) {
    setSelectedIndustry(id);
    setStep("calculate");
  }

  function handleCalculate(data: CalculationInput) {
    const result = calculateQuota(selectedIndustry!, data);
    setCalcData(data);
    setQuota(result);
    setStep("result");
  }

  function handleGetQuotation() {
    setStep("lead");
  }

  function handleSubmitLead(data: LeadData) {
    startTransition(async () => {
      const result = await submitLead({
        industry: selectedIndustry!,
        calculationData: calcData as unknown as Record<string, unknown>,
        estimatedQuota: quota,
        deviceId: getOrCreateDeviceId(),
        ...data,
      });
      if (result.success) {
        setStep("success");
        toast("Submission received! We'll contact you shortly.", "success");
      } else {
        const msg =
          (result.error as Record<string, string[]>)?._form?.[0] ||
          "Submission failed. Please try again.";
        toast(msg, "error");
      }
    });
  }

  function handleReset() {
    setStep("industry");
    setSelectedIndustry(null);
    setCalcData(null);
    setQuota(0);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-8">
        {(["industry", "calculate", "result", "lead"] as const).map(
          (s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-8 rounded-md transition-colors duration-300",
                  step === s || getStepIndex(step) > idx
                    ? "bg-foreground"
                    : "bg-muted"
                )}
              />
              {idx < 3 && <div className="w-1" />}
            </div>
          )
        )}
      </div>

      <div className="relative">
        {step === "industry" && (
          <IndustrySelector onSelect={handleSelectIndustry} />
        )}
        {step === "calculate" && selectedIndustry && (
          <CalculatorForm
            industry={selectedIndustry}
            onCalculate={handleCalculate}
            onBack={() => setStep("industry")}
          />
        )}
        {step === "result" && (
          <QuotaResult
            industry={selectedIndustry!}
            quota={quota}
            onContinue={handleGetQuotation}
            onRecalculate={() => setStep("calculate")}
          />
        )}
        {step === "lead" && (
          <LeadForm
            onSubmit={handleSubmitLead}
            isPending={isPending}
            onBack={() => setStep("result")}
          />
        )}
        {step === "success" && <SuccessState onReset={handleReset} />}
      </div>
    </div>
  );
}

function getStepIndex(step: Step): number {
  const map: Record<Step, number> = {
    industry: 0,
    calculate: 1,
    result: 2,
    lead: 3,
    success: 4,
  };
  return map[step];
}

/* ---------- Industry Selector ---------- */

function IndustrySelector({
  onSelect,
}: {
  onSelect: (id: IndustryId) => void;
}) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Select Your Industry
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose your business sector to calculate your foreign worker quota
          entitlement.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {industries.map((ind) => {
          const Icon = iconMap[ind.icon];
          return (
            <button
              key={ind.id}
              onClick={() => onSelect(ind.id)}
              className="group flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-all hover:border-foreground/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <span className="text-sm font-medium">{ind.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Calculator Forms ---------- */

function CalculatorForm({
  industry,
  onCalculate,
  onBack,
}: {
  industry: IndustryId;
  onCalculate: (data: CalculationInput) => void;
  onBack: () => void;
}) {
  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {industries.find((i) => i.id === industry)?.label} — Quota
            Calculator
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {industry === "fnb" && <FnbForm onSubmit={onCalculate} />}
        {industry === "manufacturing" && (
          <ManufacturingForm onSubmit={onCalculate} />
        )}
        {industry === "construction" && (
          <ConstructionForm onSubmit={onCalculate} />
        )}
        {industry === "agriculture" && (
          <AgricultureForm onSubmit={onCalculate} />
        )}
        {industry === "cleaning" && <CleaningForm onSubmit={onCalculate} />}
      </CardContent>
    </Card>
  );
}

function FnbForm({ onSubmit }: { onSubmit: (d: CalculationInput) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaMap.fnb),
    defaultValues: { localStaffCount: undefined as unknown as number },
  });
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="localStaffCount">Local Full-Time Staff Count</Label>
        <Input
          id="localStaffCount"
          type="number"
          placeholder="e.g. 15"
          {...register("localStaffCount", { valueAsNumber: true })}
        />
        {errors.localStaffCount && (
          <p className="text-sm text-destructive">
            {errors.localStaffCount.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full">
        Calculate Quota <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

function ManufacturingForm({
  onSubmit,
}: {
  onSubmit: (d: CalculationInput) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaMap.manufacturing),
  });
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4">
      <div className="space-y-2">
        <Label>Factory Scale</Label>
        <Select
          onValueChange={(v) => setValue("factoryScale", v as "sme" | "mnc")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select factory scale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sme">SME (Small & Medium)</SelectItem>
            <SelectItem value="mnc">MNC (Multinational)</SelectItem>
          </SelectContent>
        </Select>
        {errors.factoryScale && (
          <p className="text-sm text-destructive">
            {errors.factoryScale.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="exportPercentage">Export Percentage (%)</Label>
        <Input
          id="exportPercentage"
          type="number"
          placeholder="e.g. 60"
          {...register("exportPercentage", { valueAsNumber: true })}
        />
        {errors.exportPercentage && (
          <p className="text-sm text-destructive">
            {errors.exportPercentage.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full">
        Calculate Quota <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

function ConstructionForm({
  onSubmit,
}: {
  onSubmit: (d: CalculationInput) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaMap.construction),
    defaultValues: { cidbRegistered: false },
  });
  const cidb = watch("cidbRegistered");
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="projectValue">Total Project Value (RM)</Label>
        <Input
          id="projectValue"
          type="number"
          placeholder="e.g. 5000000"
          {...register("projectValue", { valueAsNumber: true })}
        />
        {errors.projectValue && (
          <p className="text-sm text-destructive">
            {errors.projectValue.message}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="cidb" className="cursor-pointer">
          CIDB Registered
        </Label>
        <Switch
          id="cidb"
          checked={cidb}
          onCheckedChange={(v) => setValue("cidbRegistered", !!v)}
        />
      </div>
      <Button type="submit" className="w-full">
        Calculate Quota <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

function AgricultureForm({
  onSubmit,
}: {
  onSubmit: (d: CalculationInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaMap.agriculture),
    defaultValues: { landSize: undefined as unknown as number },
  });
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="landSize">Land Size (Acres)</Label>
        <Input
          id="landSize"
          type="number"
          placeholder="e.g. 100"
          {...register("landSize", { valueAsNumber: true })}
        />
        {errors.landSize && (
          <p className="text-sm text-destructive">
            {errors.landSize.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full">
        Calculate Quota <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

function CleaningForm({
  onSubmit,
}: {
  onSubmit: (d: CalculationInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schemaMap.cleaning),
    defaultValues: { contractValue: undefined as unknown as number },
  });
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contractValue">Annual Contract Value (RM)</Label>
        <Input
          id="contractValue"
          type="number"
          placeholder="e.g. 500000"
          {...register("contractValue", { valueAsNumber: true })}
        />
        {errors.contractValue && (
          <p className="text-sm text-destructive">
            {errors.contractValue.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full">
        Calculate Quota <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

/* ---------- Result Display ---------- */

function QuotaResult({
  industry,
  quota,
  onContinue,
  onRecalculate,
}: {
  industry: IndustryId;
  quota: number;
  onContinue: () => void;
  onRecalculate: () => void;
}) {
  const label = industries.find((i) => i.id === industry)?.label;
  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardContent className="pt-6 text-center space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
            {label} — Estimated Quota
          </p>
          <AnimatedCounter
            value={quota}
            className="text-6xl font-bold tracking-tighter tabular-nums block"
          />
          <p className="text-sm text-muted-foreground">
            Foreign workers approved
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onContinue} size="lg" className="w-full">
            Get Full Compliance Strategy & Quotation
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            onClick={onRecalculate}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            Recalculate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Lead Form ---------- */

function LeadForm({
  onSubmit,
  isPending,
  onBack,
}: {
  onSubmit: (data: LeadData) => void;
  isPending: boolean;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadData>({
    resolver: zodResolver(leadSchema),
  });

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Get Your Quotation</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Our compliance specialists will prepare a detailed strategy for your
          business.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Acme Sdn Bhd"
              {...register("companyName")}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              placeholder="Ahmad bin Abdullah"
              {...register("contactPerson")}
            />
            {errors.contactPerson && (
              <p className="text-sm text-destructive">
                {errors.contactPerson.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number</Label>
            <Input
              id="whatsapp"
              placeholder="0123456789"
              {...register("whatsapp")}
            />
            {errors.whatsapp && (
              <p className="text-sm text-destructive">
                {errors.whatsapp.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Get Full Compliance Strategy & Quotation"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------- Success ---------- */

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="animate-in fade-in-0 scale-in-95 duration-500">
      <CardContent className="pt-8 pb-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold">Submission Received</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Our compliance team will contact you via WhatsApp within 24 hours
            with a detailed strategy and quotation.
          </p>
        </div>
        <Button variant="outline" onClick={onReset}>
          Calculate Again
        </Button>
      </CardContent>
    </Card>
  );
}

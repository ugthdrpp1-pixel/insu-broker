'use client';

import { useState, useTransition, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { calculatePremium, type PremiumBreakdown } from '@/lib/premium-calculator';
import { formatCurrency, cn } from '@/lib/utils';
import { Calculator, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Product = { id: string; name: string; type: string };
type Plan = { id: string; productId: string; name: string; minSum: number; maxSum?: number | null; basePremium?: number | null };
type Customer = any;

export function PremiumCalculator({
  locale,
  products,
  plans,
  initialCustomer,
  initialPlan,
  initialCalc,
}: {
  locale: string;
  products: Product[];
  plans: Plan[];
  initialCustomer: Customer | null;
  initialPlan: { id: string; productId: string } | null;
  initialCalc: PremiumBreakdown | null;
}) {
  const [productId, setProductId] = useState(initialPlan?.productId ?? products[0]?.id ?? '');
  const [planId, setPlanId] = useState(initialPlan?.id ?? plans[0]?.id ?? '');
  const [age, setAge] = useState<number>(() => {
    if (initialCustomer?.dateOfBirth) {
      return Math.floor((Date.now() - new Date(initialCustomer.dateOfBirth).getTime()) / (365.25 * 86400000));
    }
    return 30;
  });
  const [gender, setGender] = useState(initialCustomer?.gender ?? 'MALE');
  const [occupation, setOccupation] = useState(initialCustomer?.occupation ?? '');
  const [sumInsured, setSumInsured] = useState<number>(plans.find((p) => p.id === planId)?.minSum ?? 100000);
  const [coverageTerm, setCoverageTerm] = useState(1);
  const [paymentFreq, setPaymentFreq] = useState('ANNUAL');
  const [calc, setCalc] = useState<PremiumBreakdown | null>(initialCalc);
  const [isPending, startTransition] = useTransition();

  const filteredPlans = useMemo(() => plans.filter((p) => p.productId === productId), [plans, productId]);
  const plan = plans.find((p) => p.id === planId);

  async function recompute() {
    if (!plan) return;
    startTransition(async () => {
      const r = await calculatePremium({
        productType: products.find((p) => p.id === productId)?.type ?? 'LIFE',
        planId,
        age,
        gender,
        occupation,
        sumInsured,
        coverageTerm,
        paymentFreq,
      });
      setCalc(r);
    });
  }

  function reset() {
    setProductId(products[0]?.id ?? '');
    setPlanId(plans[0]?.id ?? '');
    setAge(30);
    setGender('MALE');
    setOccupation('');
    setSumInsured(plans[0]?.minSum ?? 100000);
    setCoverageTerm(1);
    setPaymentFreq('ANNUAL');
    setCalc(null);
  }

  function pickPlan(id: string) {
    setPlanId(id);
    const p = plans.find((x) => x.id === id);
    if (p) setSumInsured(p.minSum);
  }

  return (
    <Card className="p-6 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          {locale === 'th' ? 'เครื่องคำนวณเบี้ย' : 'Premium Calculator'}
        </h3>
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3 w-3 inline mr-1" />{locale === 'th' ? 'รีเซ็ต' : 'Reset'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label>{locale === 'th' ? 'ประเภท' : 'Product'}</Label>
          <Select value={productId} onChange={(e) => { setProductId(e.target.value); setPlanId(plans.find((p) => p.productId === e.target.value)?.id ?? ''); }}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{locale === 'th' ? 'แผน' : 'Plan'}</Label>
          <Select value={planId} onChange={(e) => pickPlan(e.target.value)}>
            {filteredPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>อายุ</Label>
            <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} min={1} max={120} />
          </div>
          <div className="space-y-2">
            <Label>เพศ</Label>
            <Select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="MALE">ชาย</option>
              <option value="FEMALE">หญิง</option>
              <option value="OTHER">อื่นๆ</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>อาชีพ</Label>
          <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Engineer, Doctor, ..." />
        </div>

        <div className="space-y-2">
          <Label>ทุนประกัน (บาท)</Label>
          <Input
            type="number"
            value={sumInsured}
            onChange={(e) => setSumInsured(Number(e.target.value))}
            min={0}
            step={1000}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label>ระยะเวลา (ปี)</Label>
            <Input type="number" value={coverageTerm} onChange={(e) => setCoverageTerm(Number(e.target.value))} min={1} max={30} />
          </div>
          <div className="space-y-2">
            <Label>ความถี่ชำระ</Label>
            <Select value={paymentFreq} onChange={(e) => setPaymentFreq(e.target.value)}>
              <option value="ANNUAL">รายปี</option>
              <option value="SEMI_ANNUAL">ราย 6 เดือน</option>
              <option value="QUARTERLY">ราย 3 เดือน</option>
              <option value="MONTHLY">รายเดือน</option>
            </Select>
          </div>
        </div>

        <Button type="button" onClick={recompute} disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
          {locale === 'th' ? 'คำนวณเบี้ย' : 'Calculate'}
        </Button>
      </div>

      {calc && (
        <div className="mt-6 space-y-3 border-t pt-4">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-xs text-muted-foreground">{locale === 'th' ? 'เบี้ยประกันรวม' : 'Total Premium'}</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(calc.total, locale)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatCurrency(calc.monthlyEquivalent, locale)}/{locale === 'th' ? 'เดือน' : 'month'}
            </p>
          </div>
          <div className="space-y-1.5 text-xs">
            {calc.explanationTh.slice(0, locale === 'th' ? 7 : 7).map((line, i) => (
              <div key={i} className="flex justify-between gap-2 py-1 border-b border-dashed">
                <span className="text-muted-foreground">{locale === 'th' ? line : calc.explanationEn[i]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded bg-muted/50 p-2">
              <p className="text-muted-foreground">Age Loading</p>
              <p className="font-semibold">×{calc.ageLoading.toFixed(2)}</p>
            </div>
            <div className="rounded bg-muted/50 p-2">
              <p className="text-muted-foreground">Gender</p>
              <p className="font-semibold">×{calc.genderLoading.toFixed(2)}</p>
            </div>
            <div className="rounded bg-muted/50 p-2">
              <p className="text-muted-foreground">Occupation</p>
              <p className="font-semibold">×{calc.occupationLoading.toFixed(2)}</p>
            </div>
            <div className="rounded bg-muted/50 p-2">
              <p className="text-muted-foreground">Term Adj.</p>
              <p className="font-semibold">×{calc.termAdjustment.toFixed(2)}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-2">
            {locale === 'th' ? 'อัตรานี้เป็นการประมาณการ โปรดตรวจสอบกับเงื่อนไขจริง' : 'Estimate only; subject to actual underwriting.'}
          </p>
        </div>
      )}
    </Card>
  );
}

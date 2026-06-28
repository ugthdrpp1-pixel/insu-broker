import { db } from './db';

export interface PremiumInputs {
  productType: string;
  planId: string;
  age: number;
  gender: string;
  occupation?: string;
  sumInsured: number;
  coverageTerm: number;
  paymentFreq?: string;
}

export interface PremiumBreakdown {
  basePremium: number;
  ageLoading: number;
  genderLoading: number;
  occupationLoading: number;
  sumInsuredMultiplier: number;
  termAdjustment: number;
  frequencyAdjustment: number;
  fees: number;
  total: number;
  monthlyEquivalent: number;
  explanationTh: string[];
  explanationEn: string[];
}

const PRODUCT_FACTORS: Record<string, { base: number; insuranceCoeff: number; feeRate: number }> = {
  LIFE: { base: 1500, insuranceCoeff: 0.0032, feeRate: 0.04 },
  HEALTH: { base: 3200, insuranceCoeff: 0.0028, feeRate: 0.05 },
  MOTOR: { base: 1200, insuranceCoeff: 0.024, feeRate: 0.05 },   // ~2.4% of sum insured / yr
  PA: { base: 250, insuranceCoeff: 0.0012, feeRate: 0.06 },
  PROPERTY: { base: 600, insuranceCoeff: 0.0018, feeRate: 0.06 },
};

export async function calculatePremium(input: PremiumInputs): Promise<PremiumBreakdown> {
  const plan = await db.insurancePlan.findUnique({
    where: { id: input.planId },
    include: { product: true, rateCards: true },
  });

  if (!plan) throw new Error('Plan not found');

  const factors = PRODUCT_FACTORS[plan.product.type] ?? PRODUCT_FACTORS.LIFE;

  // Find applicable rate card for age
  const rate = plan.rateCards.find(
    (r) => input.age >= r.minAge && input.age <= r.maxAge,
  );
  const ageLoading = rate ? rate.baseRate / 100 : 0.5;

  // Gender loading
  const genderLoading = input.gender === 'MALE' ? 1.15 : input.gender === 'FEMALE' ? 1.0 : 1.05;

  // Occupation loading
  let occupationLoading = 1.0;
  const occ = (input.occupation ?? '').toLowerCase();
  if (occ.includes('driver') || occ.includes('รถ') || occ.includes('construction') || occ.includes('ก่อสร้าง')) {
    occupationLoading = 1.3;
  } else if (occ.includes('doctor') || occ.includes('engineer') || occ.includes('teacher') || occ.includes('หมอ') || occ.includes('วิศว') || occ.includes('ครู')) {
    occupationLoading = 0.95;
  }

  // base
  const basePremium = (plan.basePremium ?? factors.base) + input.sumInsured * factors.insuranceCoeff;

  // sum-insured scaling
  const sumInsuredMultiplier = Math.max(1.0, Math.min(2.5, input.sumInsured / 500000));

  // term adjustment
  const termAdjustment = input.coverageTerm >= 10 ? 0.85 : input.coverageTerm >= 5 ? 0.92 : 1.0;

  // payment freq
  const freq = (input.paymentFreq ?? 'ANNUAL').toUpperCase();
  const freqMap: Record<string, number> = {
    ANNUAL: 1.0,
    SEMI_ANNUAL: 1.05,
    QUARTERLY: 1.08,
    MONTHLY: 1.12,
  };
  const frequencyAdjustment = freqMap[freq] ?? 1.0;

  const subTotal = basePremium * ageLoading * genderLoading * occupationLoading * sumInsuredMultiplier * termAdjustment;
  const fees = subTotal * factors.feeRate;
  const total = subTotal + fees;

  const divisor: Record<string, number> = { ANNUAL: 1, SEMI_ANNUAL: 2, QUARTERLY: 4, MONTHLY: 12 };
  const monthlyEquivalent = total / (divisor[freq] ?? 1) / 12;

  return {
    basePremium: Math.round(basePremium * 100) / 100,
    ageLoading,
    genderLoading,
    occupationLoading,
    sumInsuredMultiplier: Math.round(sumInsuredMultiplier * 100) / 100,
    termAdjustment,
    frequencyAdjustment,
    fees: Math.round(fees * 100) / 100,
    total: Math.round(total * 100) / 100,
    monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
    explanationTh: [
      `เบี้ยพื้นฐาน ${basePremium.toFixed(0)} บาท`,
      `ค่าปรับตามอายุ (${input.age} ปี) x${ageLoading.toFixed(2)}`,
      `ค่าปรับเพศ x${genderLoading.toFixed(2)}`,
      `ค่าปรับอาชีพ x${occupationLoading.toFixed(2)}`,
      `ค่าปรับทุนประกัน x${sumInsuredMultiplier.toFixed(2)}`,
      `ค่าปรับระยะเวลา x${termAdjustment.toFixed(2)}`,
      `ค่าธรรมเนียม ${fees.toFixed(0)} บาท`,
    ],
    explanationEn: [
      `Base premium ${basePremium.toFixed(0)} THB`,
      `Age loading (${input.age} years) x${ageLoading.toFixed(2)}`,
      `Gender factor x${genderLoading.toFixed(2)}`,
      `Occupation factor x${occupationLoading.toFixed(2)}`,
      `Sum insured multiplier x${sumInsuredMultiplier.toFixed(2)}`,
      `Term adjustment x${termAdjustment.toFixed(2)}`,
      `Admin fees ${fees.toFixed(0)} THB`,
    ],
  };
}

export const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  ANNUAL: 1,
  SEMI_ANNUAL: 2,
  QUARTERLY: 4,
  MONTHLY: 12,
};

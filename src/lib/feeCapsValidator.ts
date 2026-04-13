/**
 * Sprint 6: Fee Caps Validator
 * Enforces Ohio ORC §147.08 statutory fee caps.
 * Called by PricingCalculator and admin fee override panels.
 */

export interface FeeCapResult {
  isCompliant: boolean;
  cappedAmount: number;
  originalAmount: number;
  capApplied: string | null;
  warning: string | null;
}

const OHIO_CAPS = {
  inPersonPerAct: 5.00,    // ORC §147.08
  ronPerAct: 30.00,        // ORC §147.63
  techFee: 10.00,          // RON technology fee
  certifiedCopy: 5.00,     // Per copy
};

/**
 * Validate a per-act fee against Ohio statutory caps.
 */
export function validateActFee(amount: number, isRon: boolean): FeeCapResult {
  const cap = isRon ? OHIO_CAPS.ronPerAct : OHIO_CAPS.inPersonPerAct;
  const capLabel = isRon ? "RON $30/act (ORC §147.63)" : "In-person $5/act (ORC §147.08)";

  if (amount > cap) {
    return {
      isCompliant: false,
      cappedAmount: cap,
      originalAmount: amount,
      capApplied: capLabel,
      warning: `Fee of $${amount.toFixed(2)} exceeds Ohio statutory cap of $${cap.toFixed(2)} per notarial act.`,
    };
  }

  return {
    isCompliant: true,
    cappedAmount: amount,
    originalAmount: amount,
    capApplied: null,
    warning: null,
  };
}

/**
 * Validate a tech fee for RON sessions.
 */
export function validateTechFee(amount: number): FeeCapResult {
  if (amount > OHIO_CAPS.techFee) {
    return {
      isCompliant: false,
      cappedAmount: OHIO_CAPS.techFee,
      originalAmount: amount,
      capApplied: "RON tech fee $10 cap",
      warning: `Tech fee of $${amount.toFixed(2)} exceeds Ohio statutory cap of $${OHIO_CAPS.techFee.toFixed(2)}.`,
    };
  }
  return { isCompliant: true, cappedAmount: amount, originalAmount: amount, capApplied: null, warning: null };
}

/**
 * Validate total session fee (all acts combined).
 */
export function validateSessionTotal(
  totalActFees: number,
  actCount: number,
  isRon: boolean,
  techFee: number = 0
): FeeCapResult {
  const capPerAct = isRon ? OHIO_CAPS.ronPerAct : OHIO_CAPS.inPersonPerAct;
  const maxTotal = actCount * capPerAct + (isRon ? OHIO_CAPS.techFee : 0);

  const actualTotal = totalActFees + techFee;

  if (actualTotal > maxTotal) {
    return {
      isCompliant: false,
      cappedAmount: maxTotal,
      originalAmount: actualTotal,
      capApplied: `${actCount} acts × $${capPerAct}${isRon ? " + $10 tech" : ""} = $${maxTotal.toFixed(2)} max`,
      warning: `Total fees of $${actualTotal.toFixed(2)} exceed the statutory maximum of $${maxTotal.toFixed(2)}.`,
    };
  }

  return { isCompliant: true, cappedAmount: actualTotal, originalAmount: actualTotal, capApplied: null, warning: null };
}

export { OHIO_CAPS };

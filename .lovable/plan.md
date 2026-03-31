

# Plan: Fix Pricing Engine Integration and Booking Intake

## Problems Found

1. **BookAppointment.tsx has its own inline pricing** (lines 169-191) that duplicates and diverges from `pricingEngine.ts`. Missing: volume discounts, signer count, apostille fees.
2. **FeeCalculator.tsx also has inline pricing** — doesn't use `pricingEngine.ts` either. Missing: volume discounts, travel waiver for < 5 miles.
3. **Signer count collected but never priced** — more signers means more notarizations but `signerCount` isn't factored into any price calculation.
4. **No apostille option in booking intake** — only available in the standalone Fee Calculator.
5. **Rush pricing uses hardcoded $50/$100** in BookAppointment and ReviewStep instead of reading from `platform_settings` (rush_fee setting is $35).
6. **Stripe payment not triggered at booking** — user completes booking but is never prompted to pay. Payment only available manually in client portal.

## Changes

### 1. Add `signerCount` to pricing engine (`src/lib/pricingEngine.ts`)
- Add `signerCount` to `PricingInput` (default 1)
- Multiply notarization fees by signer count (each signer = separate notarial act per Ohio law)
- Update line item label to reflect signers × docs

### 2. Replace inline pricing in BookAppointment with `calculatePrice()` (`src/pages/BookAppointment.tsx`)
- Import `calculatePrice`, `parseSettings` from pricingEngine
- Replace the `useEffect` on lines 169-191 with a call to `calculatePrice()` using all collected inputs
- Pass `urgencyLevel` through as `isRush` flag
- Add apostille toggle to intake (new state `needsApostille`)
- Pass `signerCount` into the pricing input

### 3. Replace inline pricing in FeeCalculator with `calculatePrice()` (`src/pages/FeeCalculator.tsx`)
- Import and use `calculatePrice`, `parseSettings`
- Add signer count input
- Remove duplicate math; use returned `lineItems` and `total`

### 4. Add missing intake fields to booking step 2 (`src/pages/BookAppointment.tsx` + `BookingIntakeFields.tsx`)
- Add "Needs Apostille?" toggle for authentication/notarization categories
- Already has document count and signer count — just ensure they feed into pricing

### 5. Fix rush pricing in ReviewStep (`src/pages/booking/BookingReviewStep.tsx`)
- Remove hardcoded $50/$100 for rush/same-day
- Use `pricingSettings.rush_fee` value and display correctly
- The rush fee should already be included in `estimatedPrice` from the engine

### 6. Stripe payment prompt after booking confirmation
- On the confirmation page (`AppointmentConfirmation.tsx`), show the PaymentForm component with the estimated price pre-filled and appointmentId linked
- This gives users the option to pay immediately after booking

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/pricingEngine.ts` | Add `signerCount` to input, multiply notarization fees by signers |
| `src/pages/BookAppointment.tsx` | Use `calculatePrice()`, add apostille toggle, pass all inputs |
| `src/pages/FeeCalculator.tsx` | Use `calculatePrice()`, add signer count field |
| `src/pages/booking/BookingReviewStep.tsx` | Remove hardcoded rush amounts, use engine output |
| `src/pages/booking/BookingIntakeFields.tsx` | Add apostille toggle for notarization categories |
| `src/pages/AppointmentConfirmation.tsx` | Add optional Stripe payment section |


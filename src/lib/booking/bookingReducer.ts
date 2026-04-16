/**
 * Sprint C (C-01): Booking flow reducer
 * Consolidates 50+ useState calls in BookAppointment.tsx into a single
 * predictable state machine. Existing component can migrate incrementally.
 */

export type BookingStep =
  | "service"
  | "datetime"
  | "details"
  | "addons"
  | "review"
  | "payment"
  | "confirmation";

export interface BookingState {
  step: BookingStep;
  // Service selection
  serviceType: string;
  notarizationType: "in_person" | "remote_online" | "mobile" | "";
  // Date/time
  scheduledDate: string;
  scheduledTime: string;
  slotReservationId: string | null;
  // Signer details
  signerName: string;
  signerEmail: string;
  signerPhone: string;
  signerAddress: string;
  signerCount: number;
  // Document
  documentType: string;
  documentDescription: string;
  // Add-ons
  selectedAddons: string[];
  // Pricing
  basePrice: number;
  addonsTotal: number;
  travelFee: number;
  totalPrice: number;
  // Consents
  consents: Record<string, { granted: boolean; timestamp: string }>;
  consentsValid: boolean;
  // Submission
  submitting: boolean;
  error: string | null;
  confirmationNumber: string | null;
}

export const INITIAL_BOOKING_STATE: BookingState = {
  step: "service",
  serviceType: "",
  notarizationType: "",
  scheduledDate: "",
  scheduledTime: "",
  slotReservationId: null,
  signerName: "",
  signerEmail: "",
  signerPhone: "",
  signerAddress: "",
  signerCount: 1,
  documentType: "",
  documentDescription: "",
  selectedAddons: [],
  basePrice: 0,
  addonsTotal: 0,
  travelFee: 0,
  totalPrice: 0,
  consents: {},
  consentsValid: false,
  submitting: false,
  error: null,
  confirmationNumber: null,
};

export type BookingAction =
  | { type: "SET_STEP"; step: BookingStep }
  | { type: "SET_SERVICE"; serviceType: string; notarizationType: BookingState["notarizationType"]; basePrice: number }
  | { type: "SET_DATETIME"; date: string; time: string; reservationId?: string }
  | { type: "SET_SIGNER"; payload: Partial<Pick<BookingState, "signerName" | "signerEmail" | "signerPhone" | "signerAddress" | "signerCount">> }
  | { type: "SET_DOCUMENT"; documentType: string; documentDescription: string }
  | { type: "TOGGLE_ADDON"; addonId: string; price: number }
  | { type: "SET_TRAVEL_FEE"; travelFee: number }
  | { type: "SET_CONSENTS"; consents: BookingState["consents"]; valid: boolean }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; confirmationNumber: string }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "RESET" };

function recalcTotal(s: BookingState): BookingState {
  return { ...s, totalPrice: s.basePrice + s.addonsTotal + s.travelFee };
}

export function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step, error: null };

    case "SET_SERVICE":
      return recalcTotal({
        ...state,
        serviceType: action.serviceType,
        notarizationType: action.notarizationType,
        basePrice: action.basePrice,
      });

    case "SET_DATETIME":
      return {
        ...state,
        scheduledDate: action.date,
        scheduledTime: action.time,
        slotReservationId: action.reservationId ?? state.slotReservationId,
      };

    case "SET_SIGNER":
      return { ...state, ...action.payload };

    case "SET_DOCUMENT":
      return {
        ...state,
        documentType: action.documentType,
        documentDescription: action.documentDescription,
      };

    case "TOGGLE_ADDON": {
      const has = state.selectedAddons.includes(action.addonId);
      const selectedAddons = has
        ? state.selectedAddons.filter((a) => a !== action.addonId)
        : [...state.selectedAddons, action.addonId];
      const addonsTotal = state.addonsTotal + (has ? -action.price : action.price);
      return recalcTotal({ ...state, selectedAddons, addonsTotal });
    }

    case "SET_TRAVEL_FEE":
      return recalcTotal({ ...state, travelFee: action.travelFee });

    case "SET_CONSENTS":
      return { ...state, consents: action.consents, consentsValid: action.valid };

    case "SUBMIT_START":
      return { ...state, submitting: true, error: null };

    case "SUBMIT_SUCCESS":
      return {
        ...state,
        submitting: false,
        confirmationNumber: action.confirmationNumber,
        step: "confirmation",
      };

    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.error };

    case "RESET":
      return INITIAL_BOOKING_STATE;

    default:
      return state;
  }
}

/** Step ordering for navigation */
export const BOOKING_STEPS: BookingStep[] = [
  "service",
  "datetime",
  "details",
  "addons",
  "review",
  "payment",
  "confirmation",
];

export function nextStep(current: BookingStep): BookingStep {
  const idx = BOOKING_STEPS.indexOf(current);
  return BOOKING_STEPS[Math.min(idx + 1, BOOKING_STEPS.length - 1)];
}

export function prevStep(current: BookingStep): BookingStep {
  const idx = BOOKING_STEPS.indexOf(current);
  return BOOKING_STEPS[Math.max(idx - 1, 0)];
}

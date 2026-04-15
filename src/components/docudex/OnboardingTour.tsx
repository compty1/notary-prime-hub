/**
 * P5-006: Interactive onboarding tour (8 steps + contextual tooltips)
 */
import { useState, useEffect } from "react";
import { Joyride, STATUS } from "react-joyride";
import type { Step } from "react-joyride";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="element-sidebar"]',
    content: "Add text, shapes, images, tables, signatures, and QR codes to your document.",
    title: "Element Toolbar",
    placement: "right",
  },
  {
    target: '[data-tour="canvas"]',
    content: "This is your canvas. Click to select elements, drag to move them, and use handles to resize.",
    title: "Document Canvas",
    placement: "center",
  },
  {
    target: '[data-tour="property-panel"]',
    content: "Edit selected element properties here — position, style, and content.",
    title: "Property Panel",
    placement: "left",
  },
  {
    target: '[data-tour="zoom-controls"]',
    content: "Zoom in/out or use Ctrl+Scroll. Press Space+Drag to pan around.",
    title: "Zoom & Navigation",
    placement: "bottom",
  },
  {
    target: '[data-tour="undo-redo"]',
    content: "Undo/Redo with Ctrl+Z / Ctrl+Y. Full command history is maintained.",
    title: "Undo & Redo",
    placement: "bottom",
  },
  {
    target: '[data-tour="layers-toggle"]',
    content: "Toggle the layers panel to manage element stacking order, visibility, and locks.",
    title: "Layers Panel",
    placement: "bottom",
  },
  {
    target: '[data-tour="page-nav"]',
    content: "Navigate between pages. Add new pages for multi-page documents.",
    title: "Page Navigation",
    placement: "top",
  },
  {
    target: '[data-tour="save-export"]',
    content: "Save your document to the cloud or export as PDF. Auto-save keeps your work safe.",
    title: "Save & Export",
    placement: "bottom",
  },
];

const TOUR_STORAGE_KEY = "docudex-tour-completed";

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

export function OnboardingTour({ run: forcedRun, onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (forcedRun !== undefined) {
      setRun(forcedRun);
      return;
    }
    const completed = safeGetItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [forcedRun]);

  const handleCallback = (data: any) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      safeSetItem(TOUR_STORAGE_KEY, "true");
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      scrollToFirstStep
      callback={handleCallback}
      locale={{
        back: "Back",
        close: "Got it",
        last: "Let's go!",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}

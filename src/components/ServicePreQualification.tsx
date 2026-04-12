/**
 * B-101+: Pre-qualification checker shown before booking.
 * Ensures the client meets requirements before entering the intake flow.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { getServiceFlow } from "@/lib/serviceFlowConfig";

interface ServicePreQualificationProps {
  serviceId: string;
  onPass: () => void;
  onFail?: () => void;
}

export function ServicePreQualification({ serviceId, onPass, onFail }: ServicePreQualificationProps) {
  const flow = getServiceFlow(serviceId);
  const questions = flow?.preQualification ?? [];
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [passed, setPassed] = useState(false);

  if (questions.length === 0 || passed) {
    return null;
  }

  const allAnswered = Object.keys(answers).length === questions.length;
  const allYes = allAnswered && Object.values(answers).every(Boolean);
  const anyNo = Object.values(answers).some(v => v === false);

  return (
    <Card className="border-2 border-border rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Eligibility Check
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please confirm the following before proceeding:
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{q}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={answers[i] === true ? "default" : "outline"}
                onClick={() => setAnswers(prev => ({ ...prev, [i]: true }))}
                className="h-8 px-3 text-xs rounded-lg"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" /> Yes
              </Button>
              <Button
                size="sm"
                variant={answers[i] === false ? "destructive" : "outline"}
                onClick={() => setAnswers(prev => ({ ...prev, [i]: false }))}
                className="h-8 px-3 text-xs rounded-lg"
              >
                <XCircle className="h-3 w-3 mr-1" /> No
              </Button>
            </div>
          </div>
        ))}

        {anyNo && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              Based on your answers, this service may not be available for your situation. 
              Please contact us for assistance.
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={onFail}>
              Contact Support
            </Button>
          </div>
        )}

        {allYes && (
          <Button onClick={onPass} className="w-full gap-2 rounded-xl">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

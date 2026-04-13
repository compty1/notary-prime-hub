import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Award } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correct: number; // index
  explanation?: string;
}

export default function AcademyQuiz() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const { data: quiz } = useQuery({
    queryKey: ["academy-quiz", id],
    queryFn: async () => {
      const { data } = await supabase.from("academy_quizzes").select("*, e_courses(title, slug, id)").eq("id", id!).single();
      return data;
    },
  });

  usePageMeta({ title: quiz?.title ? `${quiz.title} — Quiz` : "Quiz" });

  const { data: pastAttempts = [] } = useQuery({
    queryKey: ["quiz-attempts", id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_quiz_attempts")
        .select("*")
        .eq("quiz_id", id!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const questions: Question[] = (quiz?.questions as any) || [];
  const isFinal = quiz?.quiz_type === "final";
  const maxAttempts = isFinal ? 3 : Infinity;
  const canAttempt = pastAttempts.length < maxAttempts && !pastAttempts.some((a: any) => a.passed);

  // 48hr lockout for final exams
  const lastFail = isFinal ? pastAttempts.find((a: any) => !a.passed) : null;
  const lockoutUntil = lastFail ? new Date(new Date(lastFail.created_at).getTime() + 48 * 60 * 60 * 1000) : null;
  const isLockedOut = lockoutUntil && lockoutUntil > new Date() && !pastAttempts.some((a: any) => a.passed);

  const submitMutation = useMutation({
    mutationFn: async () => {
      let correct = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.correct) correct++;
      });
      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= (quiz?.passing_score || 80);

      const { error } = await supabase.from("academy_quiz_attempts").insert({
        user_id: user!.id,
        quiz_id: id!,
        score,
        passed,
        answers: answers as any,
      });
      if (error) throw error;

      // Auto-generate certificate on final exam pass
      if (passed && isFinal && quiz?.course_id) {
        await supabase.from("academy_certificates").insert({
          user_id: user!.id,
          course_id: quiz.course_id,
          certificate_data: { quiz_score: score, quiz_id: id },
        }).then(() => {});
      }

      return { score, passed };
    },
    onSuccess: (res) => {
      setResult(res);
      setSubmitted(true);
      qc.invalidateQueries({ queryKey: ["quiz-attempts"] });
      qc.invalidateQueries({ queryKey: ["my-academy-certs"] });
      if (res.passed) toast({ title: "Congratulations! You passed!", description: `Score: ${res.score}%` });
      else toast({ title: "Not quite", description: `Score: ${res.score}%. You need ${quiz?.passing_score || 80}% to pass.`, variant: "destructive" });
    },
  });

  if (!quiz) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const course = (quiz as any).e_courses;
  const alreadyPassed = pastAttempts.some((a: any) => a.passed);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link to={course ? `/academy/course/${course.slug || course.id}` : "/academy"} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Course
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{questions.length} questions</Badge>
            <Badge variant="outline">Pass: {quiz.passing_score}%</Badge>
            {isFinal && <Badge>Final Exam</Badge>}
          </div>
        </div>

        {alreadyPassed && !submitted && (
          <Card className="border-green-300 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-4 flex items-center gap-3">
              <Award className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">You've already passed this quiz!</p>
                <p className="text-sm text-green-700 dark:text-green-400">Best score: {Math.max(...pastAttempts.map((a: any) => a.score))}%</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isLockedOut && (
          <Card className="border-red-300 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-4">
              <p className="text-red-800 dark:text-red-300 font-medium">48-hour lockout active</p>
              <p className="text-sm text-red-700 dark:text-red-400">You can retry after {lockoutUntil!.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {!submitted && canAttempt && !isLockedOut && (
          <div className="space-y-6">
            {questions.map((q, qi) => (
              <Card key={qi}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{qi + 1}. {q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}
                      className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${answers[qi] === oi ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted/50"}`}>
                      <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
            <Button size="lg" className="w-full" onClick={() => submitMutation.mutate()}
              disabled={Object.keys(answers).length < questions.length || submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Answers"}
            </Button>
          </div>
        )}

        {/* Results */}
        {submitted && result && (
          <div className="space-y-6">
            <Card className={result.passed ? "border-green-300 bg-green-50 dark:bg-green-900/20" : "border-red-300 bg-red-50 dark:bg-red-900/20"}>
              <CardContent className="pt-6 text-center space-y-2">
                {result.passed ? <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" /> : <XCircle className="h-12 w-12 text-red-500 mx-auto" />}
                <p className="text-2xl font-bold">{result.score}%</p>
                <p className="text-lg font-medium">{result.passed ? "You Passed!" : "Not Passed"}</p>
                {result.passed && isFinal && <p className="text-sm text-muted-foreground">Your certificate has been generated.</p>}
              </CardContent>
            </Card>

            {/* Show correct answers */}
            {questions.map((q, qi) => (
              <Card key={qi} className={answers[qi] === q.correct ? "border-green-200" : "border-red-200"}>
                <CardContent className="pt-4">
                  <p className="font-medium text-sm mb-2">{qi + 1}. {q.question}</p>
                  <p className="text-sm">Your answer: <span className={answers[qi] === q.correct ? "text-green-600 font-medium" : "text-red-500 line-through"}>{q.options[answers[qi]]}</span></p>
                  {answers[qi] !== q.correct && <p className="text-sm text-green-600">Correct: {q.options[q.correct]}</p>}
                  {q.explanation && <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>}
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-3">
              <Link to={course ? `/academy/course/${course.slug || course.id}` : "/academy"} className="flex-1">
                <Button variant="outline" className="w-full">Back to Course</Button>
              </Link>
              {result.passed && isFinal && (
                <Link to="/academy" className="flex-1">
                  <Button className="w-full"><Award className="h-4 w-4 mr-1" /> View Certificate</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

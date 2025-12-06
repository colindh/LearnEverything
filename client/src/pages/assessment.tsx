import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Loader2,
  FileQuestion,
} from "lucide-react";
import type { Assessment, AssessmentSubmission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
};

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmission | null>(null);
  const [isRetaking, setIsRetaking] = useState(false);

  const { data: assessment, isLoading, error } = useQuery<Assessment>({
    queryKey: ["/api/assessments", id],
    enabled: !!id,
  });

  const { data: existingSubmission } = useQuery<AssessmentSubmission | null>({
    queryKey: ["/api/submissions", id],
    enabled: !!id && isAuthenticated,
  });

  const submitMutation = useMutation({
    mutationFn: (data: { answers: Record<string, number> }) =>
      apiRequest("POST", `/api/submissions/${id}`, data),
    onSuccess: (result: AssessmentSubmission) => {
      setSubmitted(true);
      setSubmissionResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions", id] });
      toast({
        title: result.passed ? "Congratulations!" : "Assessment Complete",
        description: result.passed
          ? `You passed with a score of ${result.score}%!`
          : `You scored ${result.score}%. Keep learning and try again!`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Login Required</h3>
            <p className="mb-4 text-muted-foreground">
              Please log in to take assessments.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-2xl">
            <Skeleton className="mb-4 h-8 w-48" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Assessment not found</h3>
            <p className="mb-4 text-muted-foreground">
              The assessment you're looking for doesn't exist.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const questions = (assessment.questions as Question[]) || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate({ answers });
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSubmitted(false);
    setSubmissionResult(null);
    setIsRetaking(true);
  };

  if (existingSubmission && !submitted && !isRetaking) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-2xl">
            <Link href={`/topic/${assessment.topicId}`}>
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Topic
              </Button>
            </Link>

            <Card>
              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  existingSubmission.passed ? "bg-primary/10" : "bg-muted"
                }`}>
                  {existingSubmission.passed ? (
                    <Trophy className="h-8 w-8 text-primary" />
                  ) : (
                    <FileQuestion className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <CardTitle>{assessment.title}</CardTitle>
                <CardDescription>
                  You have already completed this assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold" data-testid="text-previous-score">
                    {existingSubmission.score}%
                  </div>
                  <Badge
                    variant={existingSubmission.passed ? "default" : "secondary"}
                    className="mt-2"
                    data-testid="badge-previous-result"
                  >
                    {existingSubmission.passed ? "Passed" : "Did Not Pass"}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={handleRetake}
                  data-testid="button-retake"
                >
                  Retake Assessment
                </Button>
                <Link href={`/topic/${assessment.topicId}`} className="w-full">
                  <Button variant="outline" className="w-full" data-testid="button-back-to-topic">
                    Back to Topic
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (submitted && submissionResult) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  submissionResult.passed ? "bg-primary/10" : "bg-destructive/10"
                }`}>
                  {submissionResult.passed ? (
                    <Trophy className="h-8 w-8 text-primary" />
                  ) : (
                    <XCircle className="h-8 w-8 text-destructive" />
                  )}
                </div>
                <CardTitle data-testid="text-result-title">
                  {submissionResult.passed ? "Congratulations!" : "Keep Learning!"}
                </CardTitle>
                <CardDescription>
                  {submissionResult.passed
                    ? "You have successfully passed this assessment."
                    : "Don't worry, you can retake this assessment."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold" data-testid="text-final-score">
                    {submissionResult.score}%
                  </div>
                  <Badge
                    variant={submissionResult.passed ? "default" : "destructive"}
                    className="mt-2"
                    data-testid="badge-final-result"
                  >
                    {submissionResult.passed ? "Passed" : "Did Not Pass"}
                  </Badge>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Passing score: {assessment.passingScore || 70}%
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Review Your Answers</h4>
                  {questions.map((question, index) => {
                    const userAnswer = answers[question.id];
                    const isCorrect = userAnswer === question.correctAnswer;
                    return (
                      <div
                        key={question.id}
                        className={`rounded-lg border p-4 ${
                          isCorrect ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"
                        }`}
                        data-testid={`review-question-${question.id}`}
                      >
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          ) : (
                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {index + 1}. {question.question}
                            </p>
                            <p className="mt-1 text-sm">
                              Your answer: {question.options[userAnswer]}
                            </p>
                            {!isCorrect && (
                              <p className="mt-1 text-sm text-primary">
                                Correct answer: {question.options[question.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {!submissionResult.passed && (
                  <Button
                    className="w-full"
                    onClick={handleRetake}
                    data-testid="button-retake-after-fail"
                  >
                    Retake Assessment
                  </Button>
                )}
                <Link href={`/topic/${assessment.topicId}`} className="w-full">
                  <Button
                    variant={submissionResult.passed ? "default" : "outline"}
                    className="w-full"
                    data-testid="button-back-to-topic-after"
                  >
                    Back to Topic
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (totalQuestions === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-2xl">
            <Link href={`/topic/${assessment.topicId}`}>
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Topic
              </Button>
            </Link>
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>{assessment.title}</CardTitle>
                <CardDescription>
                  This assessment has no questions yet.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href={`/topic/${assessment.topicId}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Back to Topic
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showSearch={false} />
      <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-2xl">
          <Link href={`/topic/${assessment.topicId}`}>
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topic
            </Button>
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold" data-testid="text-assessment-title">
              {assessment.title}
            </h1>
            {assessment.description && (
              <p className="mt-1 text-muted-foreground">{assessment.description}</p>
            )}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-muted-foreground" data-testid="text-question-progress">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <Progress value={progressPercent} className="flex-1" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg" data-testid="text-current-question">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id]?.toString()}
                onValueChange={(value) =>
                  handleAnswerSelect(currentQuestion.id, parseInt(value))
                }
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 rounded-lg border p-4 hover-elevate cursor-pointer"
                    onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    data-testid={`option-${index}`}
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                data-testid="button-previous"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              {currentQuestionIndex === totalQuestions - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Submit
                </Button>
              ) : (
                <Button onClick={handleNext} data-testid="button-next">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {questions.map((q, index) => (
              <Button
                key={q.id}
                variant={answers[q.id] !== undefined ? "default" : "outline"}
                size="icon"
                className={currentQuestionIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}
                onClick={() => setCurrentQuestionIndex(index)}
                data-testid={`question-nav-${index}`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

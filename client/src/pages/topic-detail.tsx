import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Play,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Trophy,
  Loader2,
} from "lucide-react";
import type { TopicWithRelations, UserProgress } from "@shared/schema";
import { getModeIcon, getModeColor } from "@/components/mode-tabs";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const difficultyConfig = {
  beginner: { label: "Beginner", class: "bg-chart-2/10 text-chart-2" },
  intermediate: { label: "Intermediate", class: "bg-chart-3/10 text-chart-3" },
  advanced: { label: "Advanced", class: "bg-destructive/10 text-destructive" },
};

const assessmentTypeConfig = {
  quiz: { label: "Quiz", icon: FileQuestion },
  project: { label: "Project", icon: BookOpen },
  exercise: { label: "Exercise", icon: CheckCircle2 },
};

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: topic, isLoading, error } = useQuery<TopicWithRelations>({
    queryKey: ["/api/topics", id],
    enabled: !!id,
  });

  const { data: progress } = useQuery<UserProgress | null>({
    queryKey: ["/api/progress", id],
    enabled: !!id && isAuthenticated,
  });

  const startMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/progress/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/stats"] });
      toast({ title: "Topic started!", description: "Your progress is now being tracked." });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/progress/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/stats"] });
      toast({ title: "Topic completed!", description: "Great job finishing this topic!" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <TopicDetailSkeleton />
        </main>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Topic not found</h3>
            <p className="mb-4 text-muted-foreground">
              The topic you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Topics
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const ModeIcon = getModeIcon(topic.mode);
  const modeColorClass = getModeColor(topic.mode);
  const difficulty = difficultyConfig[topic.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner;

  return (
    <div className="flex min-h-screen flex-col">
      <Header showSearch={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topics
            </Button>
          </Link>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1.5 ${modeColorClass}`}
                  data-testid="badge-topic-mode"
                >
                  <ModeIcon className="h-3 w-3" />
                  <span className="capitalize">{topic.mode}</span>
                </Badge>
                <Badge variant="secondary" className={difficulty.class} data-testid="badge-topic-difficulty">
                  {difficulty.label}
                </Badge>
                {topic.estimatedMinutes && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {topic.estimatedMinutes} min
                  </Badge>
                )}
              </div>

              <h1 className="mb-4 text-3xl font-bold md:text-4xl" data-testid="text-topic-title">
                {topic.title}
              </h1>
              
              <p className="mb-6 text-lg text-muted-foreground" data-testid="text-topic-description">
                {topic.description}
              </p>

              {topic.lessons && topic.lessons.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Lessons
                    </CardTitle>
                    <CardDescription>
                      {topic.lessons.length} lesson{topic.lessons.length !== 1 ? "s" : ""} in this topic
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topic.lessons
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className="flex items-start gap-3 rounded-lg border p-3 hover-elevate"
                            data-testid={`lesson-item-${lesson.id}`}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">{lesson.title}</h4>
                              {lesson.content && (
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                  {lesson.content}
                                </p>
                              )}
                            </div>
                            {(lesson.videoUrl || lesson.externalLink) && (
                              <Button variant="ghost" size="icon" asChild>
                                <a
                                  href={lesson.videoUrl || lesson.externalLink || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {lesson.videoUrl ? (
                                    <Play className="h-4 w-4" />
                                  ) : (
                                    <ExternalLink className="h-4 w-4" />
                                  )}
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {topic.assessments && topic.assessments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileQuestion className="h-5 w-5" />
                      Assessments
                    </CardTitle>
                    <CardDescription>
                      Test your knowledge with these assessments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topic.assessments.map((assessment) => {
                        const typeConfig =
                          assessmentTypeConfig[assessment.type as keyof typeof assessmentTypeConfig] ||
                          assessmentTypeConfig.quiz;
                        const TypeIcon = typeConfig.icon;
                        return (
                          <div
                            key={assessment.id}
                            className="flex items-start gap-3 rounded-lg border p-3"
                            data-testid={`assessment-item-${assessment.id}`}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                              <TypeIcon className="h-4 w-4 text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium">{assessment.title}</h4>
                                <Badge variant="outline">
                                  {typeConfig.label}
                                </Badge>
                              </div>
                              {assessment.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {assessment.description}
                                </p>
                              )}
                              {assessment.passingScore && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Passing score: {assessment.passingScore}%
                                </p>
                              )}
                            </div>
                            <Link href={`/assessment/${assessment.id}`}>
                              <Button size="sm" data-testid={`button-take-assessment-${assessment.id}`}>
                                <Play className="mr-1 h-3 w-3" />
                                Take
                              </Button>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {topic.prerequisites && topic.prerequisites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prerequisites</CardTitle>
                    <CardDescription>
                      Complete these topics first for the best learning experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topic.prerequisites.map((prereq) => (
                        <Link
                          key={prereq.id}
                          href={`/topic/${prereq.prerequisiteTopicId}`}
                        >
                          <div
                            className="flex items-center gap-2 rounded-md p-2 hover-elevate cursor-pointer"
                            data-testid={`prereq-item-${prereq.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {prereq.prerequisiteTopic?.title || `Topic #${prereq.prerequisiteTopicId}`}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Topic Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="font-medium capitalize">{topic.mode}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-medium">{difficulty.label}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Time</span>
                    <span className="font-medium">{topic.estimatedMinutes || 30} minutes</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Lessons</span>
                    <span className="font-medium">{topic.lessons?.length || 0}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assessments</span>
                    <span className="font-medium">{topic.assessments?.length || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {progress?.status === "completed" ? (
                      <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-3">
                        <Trophy className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-medium" data-testid="text-progress-completed">Completed</p>
                          <p className="text-sm text-muted-foreground">
                            Great job finishing this topic!
                          </p>
                        </div>
                      </div>
                    ) : progress?.status === "in_progress" ? (
                      <>
                        <div className="flex items-center gap-3 rounded-lg bg-secondary/10 p-3">
                          <Clock className="h-6 w-6 text-secondary-foreground" />
                          <div>
                            <p className="font-medium" data-testid="text-progress-in-progress">In Progress</p>
                            <p className="text-sm text-muted-foreground">
                              Keep going, you're doing great!
                            </p>
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => completeMutation.mutate()}
                          disabled={completeMutation.isPending}
                          data-testid="button-complete-topic"
                        >
                          {completeMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Mark as Complete
                        </Button>
                      </>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => startMutation.mutate()}
                        disabled={startMutation.isPending}
                        data-testid="button-start-topic"
                      >
                        {startMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Start Learning
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TopicDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="mb-6 h-20 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

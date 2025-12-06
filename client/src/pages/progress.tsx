import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, BookOpen, ArrowRight, Trophy, Zap } from "lucide-react";
import type { UserProgressWithTopic } from "@shared/schema";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  testId 
}: { 
  title: string; 
  value: number; 
  icon: typeof Trophy; 
  testId: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold" data-testid={testId}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressCard({ progress }: { progress: UserProgressWithTopic }) {
  const isCompleted = progress.status === "completed";
  const topic = progress.topic;

  if (!topic) return null;

  const modeLabels: Record<string, string> = {
    skill: "Skill Mode",
    school: "School Mode",
    task: "Task Mode",
  };

  return (
    <Card data-testid={`card-progress-${progress.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
            {topic.imageUrl ? (
              <img 
                src={topic.imageUrl} 
                alt={topic.title}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="font-semibold truncate" data-testid={`text-progress-title-${progress.id}`}>
                {topic.title}
              </h3>
              <Badge 
                variant={isCompleted ? "default" : "secondary"} 
                className="shrink-0"
                data-testid={`badge-status-${progress.id}`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 h-3 w-3" />
                    In Progress
                  </>
                )}
              </Badge>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {modeLabels[topic.mode] || topic.mode}
              {topic.estimatedMinutes && ` • ${topic.estimatedMinutes} min`}
            </p>
            <Link href={`/topic/${topic.id}`}>
              <Button size="sm" variant={isCompleted ? "outline" : "default"} data-testid={`button-continue-${progress.id}`}>
                {isCompleted ? "Review" : "Continue"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Progress() {
  const { data: progressList, isLoading: isLoadingProgress } = useQuery<UserProgressWithTopic[]>({
    queryKey: ["/api/progress"],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<{ completed: number; inProgress: number }>({
    queryKey: ["/api/progress/stats"],
  });

  const inProgressItems = progressList?.filter((p) => p.status === "in_progress") || [];
  const completedItems = progressList?.filter((p) => p.status === "completed") || [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header showSearch={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold md:text-3xl" data-testid="text-progress-page-title">
              My Learning Progress
            </h1>
            <p className="text-muted-foreground">
              Track your learning journey and pick up where you left off
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {isLoadingStats ? (
              <>
                <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
              </>
            ) : (
              <>
                <StatCard 
                  title="Topics Completed" 
                  value={stats?.completed || 0} 
                  icon={Trophy}
                  testId="stat-completed"
                />
                <StatCard 
                  title="In Progress" 
                  value={stats?.inProgress || 0} 
                  icon={Zap}
                  testId="stat-in-progress"
                />
              </>
            )}
          </div>

          {inProgressItems.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold" data-testid="text-in-progress-section">
                Continue Learning
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {inProgressItems.map((progress) => (
                  <ProgressCard key={progress.id} progress={progress} />
                ))}
              </div>
            </section>
          )}

          {completedItems.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold" data-testid="text-completed-section">
                Completed Topics
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {completedItems.map((progress) => (
                  <ProgressCard key={progress.id} progress={progress} />
                ))}
              </div>
            </section>
          )}

          {isLoadingProgress ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProgressCardSkeleton key={i} />
              ))}
            </div>
          ) : !progressList?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold" data-testid="text-no-progress-title">
                No learning progress yet
              </h3>
              <p className="mb-4 max-w-md text-muted-foreground" data-testid="text-no-progress-description">
                Start exploring topics to begin tracking your learning journey.
              </p>
              <Link href="/">
                <Button data-testid="button-explore-topics">
                  Explore Topics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

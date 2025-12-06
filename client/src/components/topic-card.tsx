import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import type { Topic } from "@shared/schema";
import { getModeIcon, getModeColor } from "./mode-tabs";

interface TopicCardProps {
  topic: Topic;
  isLocked?: boolean;
  isCompleted?: boolean;
}

const difficultyConfig = {
  beginner: { label: "Beginner", class: "bg-chart-2/10 text-chart-2" },
  intermediate: { label: "Intermediate", class: "bg-chart-3/10 text-chart-3" },
  advanced: { label: "Advanced", class: "bg-destructive/10 text-destructive" },
};

export function TopicCard({ topic, isLocked, isCompleted }: TopicCardProps) {
  const ModeIcon = getModeIcon(topic.mode);
  const modeColorClass = getModeColor(topic.mode);
  const difficulty = difficultyConfig[topic.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner;

  return (
    <Link href={`/topic/${topic.id}`}>
      <Card className={`group h-full cursor-pointer transition-all duration-200 hover-elevate ${isLocked ? "opacity-75" : ""}`} data-testid={`card-topic-${topic.id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 ${modeColorClass}`}
              data-testid={`badge-mode-${topic.id}`}
            >
              <ModeIcon className="h-3 w-3" />
              <span className="capitalize">{topic.mode}</span>
            </Badge>
            <div className="flex items-center gap-2">
              {isLocked && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive" data-testid={`badge-locked-${topic.id}`}>
                  <Lock className="mr-1 h-3 w-3" />
                  Locked
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="secondary" className="bg-chart-2/10 text-chart-2" data-testid={`badge-completed-${topic.id}`}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Done
                </Badge>
              )}
              {!isLocked && !isCompleted && (
                <Badge variant="secondary" className={difficulty.class} data-testid={`badge-difficulty-${topic.id}`}>
                  {difficulty.label}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <h3 className={`mb-2 line-clamp-2 text-lg font-semibold leading-tight ${isLocked ? "" : "group-hover:text-primary"}`} data-testid={`text-title-${topic.id}`}>
            {topic.title}
          </h3>
          <p className="line-clamp-3 text-sm text-muted-foreground" data-testid={`text-description-${topic.id}`}>
            {topic.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {topic.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {topic.estimatedMinutes} min
              </span>
            )}
          </div>
          {isLocked ? (
            <Lock className="h-4 w-4 text-destructive" />
          ) : (
            <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

export function TopicCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </CardFooter>
    </Card>
  );
}

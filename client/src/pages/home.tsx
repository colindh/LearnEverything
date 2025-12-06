import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { ModeTabs } from "@/components/mode-tabs";
import { TopicCard, TopicCardSkeleton } from "@/components/topic-card";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Frown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Topic, LearningMode, UserProgressWithTopic } from "@shared/schema";

export default function Home() {
  const [activeMode, setActiveMode] = useState<LearningMode | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated } = useAuth();

  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ["/api/topics", { mode: activeMode !== "all" ? activeMode : undefined, search: searchQuery || undefined }],
  });

  const { data: userProgress } = useQuery<UserProgressWithTopic[]>({
    queryKey: ["/api/progress"],
    enabled: isAuthenticated,
  });

  const filteredTopics = topics?.filter((topic) => {
    const matchesMode = activeMode === "all" || topic.mode === activeMode;
    const matchesSearch = !searchQuery || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesSearch && topic.isPublished;
  });

  const topicIds = useMemo(() => filteredTopics?.map(t => t.id) || [], [filteredTopics]);

  const { data: prerequisiteStatus } = useQuery<Record<number, boolean>>({
    queryKey: ["/api/topics/prerequisites-status", topicIds],
    queryFn: async () => {
      if (topicIds.length === 0) return {};
      const res = await apiRequest("POST", "/api/topics/prerequisites-status", { topicIds });
      return res.json();
    },
    enabled: isAuthenticated && topicIds.length > 0,
  });

  const completedTopicIds = useMemo(() => {
    return new Set(
      (userProgress || [])
        .filter(p => p.status === "completed")
        .map(p => p.topicId)
    );
  }, [userProgress]);

  const lockedTopicIds = useMemo(() => {
    if (!prerequisiteStatus) return new Set<number>();
    return new Set(
      Object.entries(prerequisiteStatus)
        .filter(([_, unlocked]) => !unlocked)
        .map(([id]) => parseInt(id))
    );
  }, [prerequisiteStatus]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header showSearch={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold md:text-3xl" data-testid="text-home-title">
              Explore Topics
            </h1>
            <p className="text-muted-foreground">
              Choose your learning mode and discover topics that match your style
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="w-full md:max-w-lg">
              <ModeTabs activeMode={activeMode} onModeChange={setActiveMode} />
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search topics..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-home-search"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <TopicCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredTopics && filteredTopics.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTopics.map((topic) => (
                <TopicCard 
                  key={topic.id} 
                  topic={topic} 
                  isLocked={lockedTopicIds.has(topic.id)}
                  isCompleted={completedTopicIds.has(topic.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                {searchQuery ? (
                  <Frown className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="mb-2 text-lg font-semibold" data-testid="text-no-topics-title">
                {searchQuery ? "No matching topics found" : "No topics available"}
              </h3>
              <p className="max-w-md text-muted-foreground" data-testid="text-no-topics-description">
                {searchQuery
                  ? `We couldn't find any topics matching "${searchQuery}". Try a different search term.`
                  : activeMode === "all"
                  ? "Topics will appear here once they're published by administrators."
                  : `No ${activeMode} mode topics are available yet. Check back soon or try another mode.`}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

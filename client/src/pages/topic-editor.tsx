import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TopicWithRelations, Topic } from "@shared/schema";
import { Link } from "wouter";

const lessonSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  externalLink: z.string().url().optional().or(z.literal("")),
  orderIndex: z.number(),
});

const assessmentSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["quiz", "project", "exercise"]),
  passingScore: z.number().min(0).max(100).optional(),
});

const topicFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  mode: z.enum(["skill", "school", "task"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedMinutes: z.number().min(1).max(600).optional(),
  isPublished: z.boolean(),
  prerequisiteIds: z.array(z.number()),
  lessons: z.array(lessonSchema),
  assessments: z.array(assessmentSchema),
});

type TopicFormData = z.infer<typeof topicFormSchema>;

export default function TopicEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const isNew = id === "new";

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [isAuthenticated, isAdmin, authLoading, toast]);

  const { data: topic, isLoading: topicLoading } = useQuery<TopicWithRelations>({
    queryKey: ["/api/admin/topics", id],
    enabled: !isNew && isAuthenticated && isAdmin,
  });

  const { data: allTopics } = useQuery<Topic[]>({
    queryKey: ["/api/admin/topics"],
    enabled: isAuthenticated && isAdmin,
  });

  const form = useForm<TopicFormData>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: "",
      description: "",
      mode: "skill",
      difficulty: "beginner",
      estimatedMinutes: 30,
      isPublished: false,
      prerequisiteIds: [],
      lessons: [],
      assessments: [],
    },
  });

  const lessonsFieldArray = useFieldArray({
    control: form.control,
    name: "lessons",
  });

  const assessmentsFieldArray = useFieldArray({
    control: form.control,
    name: "assessments",
  });

  useEffect(() => {
    if (topic && !isNew) {
      form.reset({
        title: topic.title,
        description: topic.description,
        mode: topic.mode as "skill" | "school" | "task",
        difficulty: (topic.difficulty || "beginner") as "beginner" | "intermediate" | "advanced",
        estimatedMinutes: topic.estimatedMinutes || 30,
        isPublished: topic.isPublished,
        prerequisiteIds: topic.prerequisites?.map((p) => p.prerequisiteTopicId) || [],
        lessons: topic.lessons?.map((l, i) => ({
          id: l.id,
          title: l.title,
          content: l.content || "",
          videoUrl: l.videoUrl || "",
          externalLink: l.externalLink || "",
          orderIndex: l.orderIndex || i,
        })) || [],
        assessments: topic.assessments?.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description || "",
          type: (a.type || "quiz") as "quiz" | "project" | "exercise",
          passingScore: a.passingScore || 70,
        })) || [],
      });
    }
  }, [topic, isNew, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: TopicFormData) => {
      const payload = {
        topic: {
          title: data.title,
          description: data.description,
          mode: data.mode,
          difficulty: data.difficulty,
          estimatedMinutes: data.estimatedMinutes,
          isPublished: data.isPublished,
        },
        lessons: data.lessons,
        assessments: data.assessments,
        prerequisiteIds: data.prerequisiteIds,
      };
      if (isNew) {
        return await apiRequest("POST", "/api/admin/topics", payload);
      } else {
        return await apiRequest("PUT", `/api/admin/topics/${id}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({
        title: isNew ? "Topic created" : "Topic updated",
        description: isNew
          ? "Your new topic has been created successfully."
          : "Your changes have been saved.",
      });
      navigate("/admin");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${isNew ? "create" : "update"} topic. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TopicFormData) => {
    saveMutation.mutate(data);
  };

  const availablePrerequisites = allTopics?.filter(
    (t) => t.id !== Number(id)
  ) || [];

  if (authLoading || (!isNew && topicLoading)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header showSearch={false} />
        <main className="container mx-auto flex-1 px-4 py-6 md:px-6 md:py-8">
          <TopicEditorSkeleton />
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showSearch={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold md:text-3xl" data-testid="text-editor-title">
              {isNew ? "Create New Topic" : "Edit Topic"}
            </h1>
            <p className="text-muted-foreground">
              {isNew
                ? "Add a new learning topic with lessons and assessments"
                : "Update topic details, lessons, and assessments"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Set the core details for this learning topic
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Introduction to JavaScript"
                            {...field}
                            data-testid="input-topic-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what learners will gain from this topic..."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="input-topic-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning Mode</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-mode">
                                <SelectValue placeholder="Select mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="skill">Skill</SelectItem>
                              <SelectItem value="school">School</SelectItem>
                              <SelectItem value="task">Task</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-difficulty">
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Time (min)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={600}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-estimated-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                          <FormLabel>Published</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-published"
                              />
                            </FormControl>
                            <span className="text-sm text-muted-foreground">
                              {field.value ? "Visible to learners" : "Draft"}
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {availablePrerequisites.length > 0 && (
                    <FormField
                      control={form.control}
                      name="prerequisiteIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prerequisites</FormLabel>
                          <FormDescription>
                            Select topics that should be completed before this one
                          </FormDescription>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {availablePrerequisites.map((prereq) => (
                              <Button
                                key={prereq.id}
                                type="button"
                                variant={field.value.includes(prereq.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const current = field.value;
                                  if (current.includes(prereq.id)) {
                                    field.onChange(current.filter((id) => id !== prereq.id));
                                  } else {
                                    field.onChange([...current, prereq.id]);
                                  }
                                }}
                                data-testid={`button-prereq-${prereq.id}`}
                              >
                                {prereq.title}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Lessons</CardTitle>
                    <CardDescription>
                      Add learning materials, videos, and resources
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      lessonsFieldArray.append({
                        title: "",
                        content: "",
                        videoUrl: "",
                        externalLink: "",
                        orderIndex: lessonsFieldArray.fields.length,
                      })
                    }
                    data-testid="button-add-lesson"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lesson
                  </Button>
                </CardHeader>
                <CardContent>
                  {lessonsFieldArray.fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                      <p className="mb-2 text-muted-foreground">No lessons added yet</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          lessonsFieldArray.append({
                            title: "",
                            content: "",
                            videoUrl: "",
                            externalLink: "",
                            orderIndex: 0,
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Lesson
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lessonsFieldArray.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="relative rounded-lg border p-4"
                          data-testid={`lesson-form-${index}`}
                        >
                          <div className="mb-4 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Lesson {index + 1}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => lessonsFieldArray.remove(index)}
                              data-testid={`button-remove-lesson-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`lessons.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Lesson title" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lessons.${index}.content`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Content</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Lesson content..."
                                      className="min-h-[80px]"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`lessons.${index}.videoUrl`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Video URL</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="https://..." />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`lessons.${index}.externalLink`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>External Link</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="https://..." />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>Assessments</CardTitle>
                    <CardDescription>
                      Add quizzes, projects, or exercises to test learning
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      assessmentsFieldArray.append({
                        title: "",
                        description: "",
                        type: "quiz",
                        passingScore: 70,
                      })
                    }
                    data-testid="button-add-assessment"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assessment
                  </Button>
                </CardHeader>
                <CardContent>
                  {assessmentsFieldArray.fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                      <p className="mb-2 text-muted-foreground">No assessments added yet</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          assessmentsFieldArray.append({
                            title: "",
                            description: "",
                            type: "quiz",
                            passingScore: 70,
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Assessment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assessmentsFieldArray.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="relative rounded-lg border p-4"
                          data-testid={`assessment-form-${index}`}
                        >
                          <div className="mb-4 flex items-center justify-between gap-2">
                            <span className="font-medium">Assessment {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => assessmentsFieldArray.remove(index)}
                              data-testid={`button-remove-assessment-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`assessments.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Assessment title" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`assessments.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="What does this assessment cover?"
                                      className="min-h-[60px]"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <FormField
                                control={form.control}
                                name={`assessments.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                        <SelectItem value="project">Project</SelectItem>
                                        <SelectItem value="exercise">Exercise</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`assessments.${index}.passingScore`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Passing Score (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Link href="/admin">
                  <Button type="button" variant="outline" className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-save-topic"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isNew ? "Create Topic" : "Save Changes"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

function TopicEditorSkeleton() {
  return (
    <>
      <Skeleton className="mb-4 h-8 w-32" />
      <Skeleton className="mb-2 h-10 w-64" />
      <Skeleton className="mb-8 h-4 w-96" />
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="mb-2 h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 sm:grid-cols-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

import { BookOpen, Wrench, GraduationCap, CheckSquare, ArrowRight, Sparkles, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Wrench,
    title: "Skill Mode",
    description: "Master practical skills through hands-on practice and real-world projects",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    icon: GraduationCap,
    title: "School Mode",
    description: "Structured academic learning with comprehensive assessments and certifications",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    icon: CheckSquare,
    title: "Task Mode",
    description: "Complete specific tasks and projects to build your portfolio",
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold" data-testid="text-landing-logo">Learn Everything</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild data-testid="button-landing-browse">
              <Link href="/browse">Browse Topics</Link>
            </Button>
            <ThemeToggle />
            <Button asChild data-testid="button-landing-login">
              <a href="/api/login">Log in</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Learn anything, your way
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl" data-testid="text-hero-title">
                Master Any Topic with
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Personalized Learning</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl" data-testid="text-hero-description">
                Choose your learning style. Whether you prefer skill-based practice, structured school courses, or task-oriented projects, we adapt to how you learn best.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="min-w-[200px]" data-testid="button-get-started">
                  <a href="/api/login">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" size="lg" className="min-w-[200px]" asChild data-testid="button-browse-topics">
                  <Link href="/browse">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Topics
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold" data-testid="text-modes-title">Three Ways to Learn</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Our platform adapts to your preferred learning style with three distinct modes
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="group relative overflow-visible transition-all hover-elevate" data-testid={`card-feature-${index}`}>
                  <CardHeader>
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold" data-testid="text-cta-title">Ready to Start Learning?</h2>
              <p className="mb-8 text-muted-foreground">
                Join thousands of learners who have transformed their skills with our personalized learning platform.
              </p>
              <Button asChild size="lg" data-testid="button-cta-signup">
                <a href="/api/login">
                  Create Your Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold">Learn Everything</span>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-footer-copyright">
            Built with care for learners everywhere
          </p>
        </div>
      </footer>
    </div>
  );
}

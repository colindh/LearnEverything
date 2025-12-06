import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, GraduationCap, CheckSquare } from "lucide-react";
import type { LearningMode } from "@shared/schema";

interface ModeTabsProps {
  activeMode: LearningMode | "all";
  onModeChange: (mode: LearningMode | "all") => void;
}

const modeConfig = {
  all: {
    label: "All Topics",
    icon: null,
    description: "Browse all available learning content",
  },
  skill: {
    label: "Skill",
    icon: Wrench,
    description: "Master practical skills through hands-on practice",
  },
  school: {
    label: "School",
    icon: GraduationCap,
    description: "Structured academic learning with assessments",
  },
  task: {
    label: "Task",
    icon: CheckSquare,
    description: "Complete specific tasks and projects",
  },
};

export function ModeTabs({ activeMode, onModeChange }: ModeTabsProps) {
  return (
    <div className="w-full">
      <Tabs value={activeMode} onValueChange={(v) => onModeChange(v as LearningMode | "all")}>
        <TabsList className="grid w-full grid-cols-4 gap-1">
          {(Object.keys(modeConfig) as (LearningMode | "all")[]).map((mode) => {
            const config = modeConfig[mode];
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={mode}
                value={mode}
                className="flex items-center gap-1.5 text-xs sm:text-sm"
                data-testid={`tab-mode-${mode}`}
              >
                {Icon && <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                <span className="hidden xs:inline sm:inline">{config.label}</span>
                <span className="xs:hidden sm:hidden">{mode === "all" ? "All" : config.label.slice(0, 3)}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {modeConfig[activeMode].description}
      </p>
    </div>
  );
}

export function getModeIcon(mode: LearningMode) {
  const icons = {
    skill: Wrench,
    school: GraduationCap,
    task: CheckSquare,
  };
  return icons[mode];
}

export function getModeColor(mode: LearningMode) {
  const colors = {
    skill: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    school: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    task: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  };
  return colors[mode];
}

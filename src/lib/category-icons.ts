import { Code, Bot, GraduationCap, Users, Award, TrendingUp, type LucideIcon } from "lucide-react";
import type { CategorySlug } from "@/lib/categories";

export const CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  "software-development": Code,
  "digital-marketing": TrendingUp,
  "ai-automations": Bot,
  "industrial-training": GraduationCap,
  "resource-augmentation": Users,
  "internship-program": Award,
};

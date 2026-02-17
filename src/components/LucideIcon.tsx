import { icons } from "lucide-react";

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export function LucideIcon({ name, size = 16, className }: Props) {
  const IconComp = (icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  if (!IconComp) return null;
  return <IconComp size={size} className={className} />;
}

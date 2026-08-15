declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
  }
  export type Icon = FC<IconProps>;
  export const ArrowLeft: Icon;
  export const Target: Icon;
  export const Shield: Icon;
  export const HelpCircle: Icon;
  export const BookOpen: Icon;
  export const Plus: Icon;
  export const Trash2: Icon;
  export const Check: Icon;
  export const Save: Icon;
  export const Edit: Icon;
  export const User: Icon;
  export const Key: Icon;
  export const DollarSign: Icon;
  export const AlertTriangle: Icon;
  export const Calendar: Icon;
  export const Download: Icon;
  export const Share2: Icon;
  export const FileText: Icon;
  export const ExternalLink: Icon;
  export const Building: Icon;
  export const Mail: Icon;
  export const Globe: Icon;
  export const Settings: Icon;
  export const LogOut: Icon;
  export const Briefcase: Icon;
  export const LayoutDashboard: Icon;
  export const ChevronRight: Icon;
  export const Copy: Icon;
  export const CheckCircle2: Icon;
  export const MessageSquare: Icon;
  export const TrendingUp: Icon;
  export const Users: Icon;
  export const Clock: Icon;
}

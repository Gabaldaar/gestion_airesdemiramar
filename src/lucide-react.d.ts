
// This is a placeholder file to make TypeScript happy
// because lucide-react doesn't have its own types.
declare module 'lucide-react' {
    import { SVGProps } from 'react';
    
    // Define a general type for any Lucide icon
    export type LucideIcon = React.FC<SVGProps<SVGSVGElement>>;

    // List all icons you use in your app to get type-checking
    export const Home: LucideIcon;
    export const Building2: LucideIcon;
    export const Users: LucideIcon;
    export const Calendar: LucideIcon;
    export const Settings: LucideIcon;
    export const Menu: LucideIcon;
    export const BarChart3: LucideIcon;
    export const ShoppingCart: LucideIcon;
    export const CreditCard: LucideIcon;
    export const Mail: LucideIcon;
    export const LogOut: LucideIcon;
    export const CircleHelp: LucideIcon;
    export const ChevronLeft: LucideIcon;
    export const WifiOff: LucideIcon;
    export const DollarSign: LucideIcon;
    export const TrendingUp: LucideIcon;
    export const AlertTriangle: LucideIcon;
    export const Info: LucideIcon;
    export const Copy: LucideIcon;
    export const Calendar as CalendarIcon: LucideIcon;
    export const ExternalLink: LucideIcon;
    export const NotebookPen: LucideIcon;
    export const Landmark: LucideIcon;
    export const Wallet: LucideIcon;
    export const Pencil: LucideIcon;
    export const Trash2: LucideIcon;
    export const FileText: LucideIcon;
    export const Phone: LucideIcon;
    export const PlusCircle: LucideIcon;
    export const Loader2: LucideIcon;
    export const Download: LucideIcon;
    export const ChevronDown: LucideIcon;
    export const History: LucideIcon;
    export const Send: LucideIcon;
    export const Save: LucideIcon;
    export const X: LucideIcon;
    export const Shield: LucideIcon;
    export const RefreshCw: LucideIcon;
    export const Search: LucideIcon;
    export const BedDouble: LucideIcon;
    export const CalendarX: LucideIcon;
}

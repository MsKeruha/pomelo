import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = 
    | 'pomelo' 
    | 'dashboard' 
    | 'plane' 
    | 'calendar' 
    | 'users' 
    | 'message' 
    | 'settings' 
    | 'home' 
    | 'logout' 
    | 'star' 
    | 'close' 
    | 'send' 
    | 'pool' 
    | 'beach' 
    | 'spa' 
    | 'restaurant' 
    | 'gym' 
    | 'wifi' 
    | 'party' 
    | 'user'
    | 'support'
    | 'search'
    | 'map'
    | 'ship'
    | 'mountain'
    | 'bell'
    | 'credit-card'
    | 'edit'
    | 'trash'
    | 'eye'
    | 'clock'
    | 'check'
    | 'moon'
    | 'users-group'
    | 'heart'
    | 'skis'
    | 'city'
    | 'lion' 
    | 'check-circle' 
    | 'x-circle' 
    | 'clock-loading'
    | 'smile'
    | 'paperclip'
    | 'check-check'
    | 'arrow-right'
    | 'anchor';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
    color?: string;
    fill?: string;
    strokeWidth?: number;
}

const Icon: React.FC<IconProps> = ({ 
    name, 
    size = 24, 
    color = 'currentColor', 
    fill = 'none',
    strokeWidth = 2,
    className = '', 
    ...props 
}) => {
    // Custom logo handling
    if (name === 'pomelo') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                className={className}
                {...props}
            >
                <g transform="translate(2,2) scale(0.85)">
                    <circle cx="12" cy="12" r="11" fill="#ffcd3c" stroke="#ff9f1c" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="9" fill="#fffef7" />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                        <path
                            key={angle}
                            d="M12 12 L12 4 A8 8 0 0 1 18 6.5 Z"
                            fill="#ff9f1c"
                            opacity="0.8"
                            transform={`rotate(${angle} 12 12)`}
                        />
                    ))}
                    <circle cx="12" cy="12" r="2" fill="white" />
                </g>
            </svg>
        );
    }

    // Mapping to Lucide components
    const mapping: Record<Exclude<IconName, 'pomelo'>, React.ComponentType<any>> = {
        dashboard: LucideIcons.LayoutDashboard,
        plane: LucideIcons.Plane,
        calendar: LucideIcons.Calendar,
        users: LucideIcons.Users,
        message: LucideIcons.MessageSquare,
        settings: LucideIcons.Settings,
        home: LucideIcons.Home,
        logout: LucideIcons.LogOut,
        star: LucideIcons.Star,
        close: LucideIcons.X,
        send: LucideIcons.Send,
        pool: LucideIcons.Waves,
        beach: LucideIcons.Umbrella,
        spa: LucideIcons.Flower2,
        restaurant: LucideIcons.Utensils,
        gym: LucideIcons.Dumbbell,
        wifi: LucideIcons.Wifi,
        party: LucideIcons.PartyPopper,
        user: LucideIcons.User,
        support: LucideIcons.Headphones,
        search: LucideIcons.Search,
        map: LucideIcons.Map,
        ship: LucideIcons.Ship,
        mountain: LucideIcons.Mountain,
        bell: LucideIcons.Bell,
        'credit-card': LucideIcons.CreditCard,
        edit: LucideIcons.Pencil,
        trash: LucideIcons.Trash2,
        eye: LucideIcons.Eye,
        clock: LucideIcons.Clock,
        check: LucideIcons.Check,
        moon: LucideIcons.Moon,
        'users-group': LucideIcons.Users,
        heart: LucideIcons.Heart,
        skis: LucideIcons.MountainSnow,
        city: LucideIcons.Building2,
        lion: LucideIcons.PawPrint,
        'check-circle': LucideIcons.CheckCircle,
        'x-circle': LucideIcons.XCircle,
        'clock-loading': LucideIcons.Loader2,
        smile: LucideIcons.Smile,
        paperclip: LucideIcons.Paperclip,
        'check-check': LucideIcons.CheckCheck,
        'arrow-right': LucideIcons.ArrowRight,
        anchor: LucideIcons.Anchor,
    };

    const LucideIcon = mapping[name] || LucideIcons.HelpCircle;

    return (
        <LucideIcon 
            size={size} 
            color={color} 
            fill={fill}
            strokeWidth={strokeWidth} 
            className={`${className} ${name === 'clock-loading' ? 'animate-spin' : ''}`}
            {...props} 
        />
    );
};

export default Icon;

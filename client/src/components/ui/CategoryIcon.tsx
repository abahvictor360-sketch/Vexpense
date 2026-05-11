import {
  UtensilsCrossed, Car, Home, Film, ShoppingBag, HeartPulse,
  BookOpen, PiggyBank, Smartphone, Package, Target, Plane,
  Laptop, GraduationCap, Gem, Umbrella, Dumbbell, Music,
  Camera, Rocket, Trophy, Banknote, CreditCard, ArrowRightLeft,
  Wallet, Search, Flame, type LucideIcon,
} from 'lucide-react';

/** Maps either an emoji string (legacy DB data) or a string key to a Lucide icon component */
export const ICON_MAP: Record<string, LucideIcon> = {
  // ── Emoji keys (existing DB rows) ────────────────
  '🍔': UtensilsCrossed,
  '🚗': Car,
  '🏠': Home,
  '🎬': Film,
  '🛍️': ShoppingBag,
  '❤️': HeartPulse,
  '📚': BookOpen,
  '💰': PiggyBank,
  '📱': Smartphone,
  '📦': Package,
  '🎯': Target,
  '✈️': Plane,
  '💻': Laptop,
  '🎓': GraduationCap,
  '💍': Gem,
  '🏖️': Umbrella,
  '🏋️': Dumbbell,
  '🎸': Music,
  '📸': Camera,
  '🚀': Rocket,
  '⚽': Trophy,
  '💸': Wallet,
  '🔍': Search,
  '🔥': Flame,
  // ── String keys (new goals) ────────────────────────
  target:     Target,
  home:       Home,
  car:        Car,
  plane:      Plane,
  laptop:     Laptop,
  smartphone: Smartphone,
  graduation: GraduationCap,
  gem:        Gem,
  umbrella:   Umbrella,
  piggybank:  PiggyBank,
  dumbbell:   Dumbbell,
  music:      Music,
  camera:     Camera,
  rocket:     Rocket,
  trophy:     Trophy,
  food:       UtensilsCrossed,
  transport:  Car,
  rent:       Home,
  entertainment: Film,
  shopping:   ShoppingBag,
  health:     HeartPulse,
  education:  BookOpen,
  savings:    PiggyBank,
  other:      Package,
  cash:       Banknote,
  card:       CreditCard,
  transfer:   ArrowRightLeft,
};

export const GOAL_ICON_OPTIONS: { key: string; Icon: LucideIcon; label: string }[] = [
  { key: 'target',     Icon: Target,         label: 'Goal'       },
  { key: 'home',       Icon: Home,           label: 'Home'       },
  { key: 'car',        Icon: Car,            label: 'Car'        },
  { key: 'plane',      Icon: Plane,          label: 'Travel'     },
  { key: 'laptop',     Icon: Laptop,         label: 'Tech'       },
  { key: 'smartphone', Icon: Smartphone,     label: 'Phone'      },
  { key: 'graduation', Icon: GraduationCap,  label: 'Education'  },
  { key: 'gem',        Icon: Gem,            label: 'Luxury'     },
  { key: 'umbrella',   Icon: Umbrella,       label: 'Vacation'   },
  { key: 'piggybank',  Icon: PiggyBank,      label: 'Savings'    },
  { key: 'dumbbell',   Icon: Dumbbell,       label: 'Fitness'    },
  { key: 'music',      Icon: Music,          label: 'Music'      },
  { key: 'camera',     Icon: Camera,         label: 'Camera'     },
  { key: 'rocket',     Icon: Rocket,         label: 'Business'   },
  { key: 'trophy',     Icon: Trophy,         label: 'Sport'      },
];

interface CategoryIconProps {
  icon: string;
  className?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

export function CategoryIcon({ icon, className, color, size = 'md' }: CategoryIconProps) {
  const IconComp = ICON_MAP[icon] ?? Package;
  const cls = className ?? SIZE_MAP[size];
  return <IconComp className={cls} style={color ? { color } : undefined} />;
}

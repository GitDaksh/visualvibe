import { CalendarDays, CircleDot, DoorOpen, House, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/recordings", label: "Recordings", icon: CircleDot },
  { href: "/room", label: "Your room", icon: DoorOpen },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

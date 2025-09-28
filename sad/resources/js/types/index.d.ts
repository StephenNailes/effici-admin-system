import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    avatarUrl?: string;
    profile_picture?: string;
    profile_picture_url?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    role?: string;
  // Additional profile fields used in UI (optional)
  date_of_birth?: string | null;
  school_id_number?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  region?: string | null;
  contact_number?: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
export interface PageProps {
  auth: {
    user?: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      role?: string;
    } | null;
  };
    ziggy: any;
  [key: string]: unknown; // ✅ Required for Inertia compatibility
}
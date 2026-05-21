import { LayoutDashboard, Package, MapPin, User } from 'lucide-react';

export const ACCOUNT_NAV = [
  { to: '/hesabim', label: 'Genel Bakış', icon: LayoutDashboard, end: true },
  { to: '/hesabim/siparislerim', label: 'Siparişlerim', icon: Package, end: false },
  { to: '/hesabim/adreslerim', label: 'Adreslerim', icon: MapPin, end: false },
  { to: '/hesabim/profilim', label: 'Profilim', icon: User, end: false },
];

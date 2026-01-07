'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Wallet,
  History,
  Mic,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const mainNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
];

const callCenterItems = [
  { href: '/call-center/saldo', label: 'Saldo', icon: Wallet },
  { href: '/call-center/llamadas', label: 'Llamadas', icon: History },
  { href: '/call-center/grabaciones', label: 'Grabaciones', icon: Mic },
  { href: '/call-center/metricas', label: 'Metricas', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration - only read localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setCollapsed(JSON.parse(saved));
    setMounted(true);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    }
  }, [collapsed, mounted]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`bg-brand-primary min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-52'
      }`}
    >
      {/* Logo */}
      <div className={`p-3 border-b border-white/10 flex justify-center items-center ${
        collapsed ? 'h-16' : 'h-20'
      } transition-all duration-300`}>
        <Link href="/dashboard" className="block">
          <div className={`transition-all duration-300 ${
            collapsed ? 'w-8 h-8' : 'w-32 h-12'
          }`}>
            <Image
              src="/logos/logo-calidad-energia.png"
              alt="Calidad Energia"
              width={180}
              height={60}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {/* Principal */}
        <div className="mb-4">
          {!collapsed && (
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-brand-text/50 uppercase tracking-wider">
              Principal
            </p>
          )}
          {collapsed && <div className="h-px bg-white/10 mx-1 mb-2" />}
          <ul className="space-y-0.5">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center py-2 rounded-lg transition-all duration-200 text-sm ${
                    isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-brand-text hover:bg-white/10'
                  } ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-2.5'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mx-1 mb-4" />

        {/* Call Center Section */}
        <div>
          {!collapsed && (
            <div className="flex items-center gap-1.5 px-2 mb-1.5">
              <p className="text-[10px] font-semibold text-brand-text/50 uppercase tracking-wider">
                Call Center
              </p>
              <span className="text-[10px] bg-yellow-500 text-black px-1.5 py-0.5 rounded-full">
                Pronto
              </span>
            </div>
          )}
          <ul className="space-y-0.5">
            {callCenterItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center py-1.5 rounded-lg transition-all duration-200 text-brand-text/50 cursor-not-allowed text-sm ${
                    collapsed ? 'justify-center px-2' : 'gap-2.5 px-2.5'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="py-2 px-2 border-t border-white/10 space-y-0.5">
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center py-2 px-2.5 rounded-lg text-brand-text hover:bg-white/10 transition-all duration-200 w-full text-sm ${
            collapsed ? 'justify-center' : 'gap-2.5'
          }`}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? (
            <ChevronRight size={18} className="flex-shrink-0" />
          ) : (
            <ChevronLeft size={18} className="flex-shrink-0" />
          )}
          {!collapsed && <span>Colapsar</span>}
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`flex items-center py-2 px-2.5 rounded-lg text-brand-text hover:bg-white/10 transition-all duration-200 w-full text-sm ${
            collapsed ? 'justify-center' : 'gap-2.5'
          }`}
          title={collapsed ? 'Cerrar sesion' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesion</span>}
        </button>
      </div>
    </aside>
  );
}

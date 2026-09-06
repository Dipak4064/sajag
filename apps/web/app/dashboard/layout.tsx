'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Map as MapIcon,
  Radio,
  BellRing,
  LifeBuoy,
  Users,
  FileSpreadsheet,
  Flame,
  Home
} from 'lucide-react';
import SimulationModal from '@/components/simulation/simulation-modal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Command Center', icon: ShieldAlert },
    { href: '/dashboard/devices', label: 'IoT Sensors & LoRa', icon: Radio },
    { href: '/dashboard/alerts', label: 'Alerts & IVR', icon: BellRing },
    { href: '/dashboard/sos', label: 'SOS Triage', icon: LifeBuoy },
    { href: '/dashboard/reports', label: 'Citizen Reports', icon: FileSpreadsheet },
    { href: '/dashboard/users', label: 'Residents Roster', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Operations Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-red-600 rounded-lg text-white font-black text-sm">स</div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-wide">SAJAG // PRAKOP</div>
              <div className="text-[10px] text-slate-400">Kathmandu Metropolitan Command Center</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Hackathon 1-Click Simulator Trigger */}
          <button
            onClick={() => setIsSimModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg shadow-red-950/60 active:scale-95 transition-transform"
          >
            <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>SIMULATE DISASTER</span>
          </button>

          <Link
            href="/citizen"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Citizen View 📱
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>

      {/* Simulation Modal */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
      />
    </div>
  );
}

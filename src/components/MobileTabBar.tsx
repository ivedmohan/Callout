'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LineChart, PieChart, PlusCircle, Trophy } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export function MobileTabBar() {
    const pathname = usePathname();
    const { authenticated } = useWallet();

    const navItems = [
        { label: 'Home', href: '/', icon: Home },
        { label: 'Markets', href: '/markets', icon: LineChart },
        { label: 'Leaders', href: '/leaderboards', icon: Trophy },
    ];

    if (authenticated) {
        navItems.push({ label: 'Create', href: '/create', icon: PlusCircle });
        navItems.push({ label: 'Portfolio', href: '/dashboard', icon: PieChart });
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-zinc-800 bg-zinc-950/90 pb-safe pt-1 backdrop-blur-lg sm:hidden">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center gap-1 w-full h-full px-2 ${isActive ? 'text-blue-500' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <Icon className={`h-6 w-6 ${isActive ? 'fill-blue-500/20 stroke-[1.5px]' : 'stroke-[1.5]'}`} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}

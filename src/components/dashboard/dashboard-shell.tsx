"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Building2,
  FileDown,
  FolderTree,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface DashboardShellProps {
  role: "SUPER_ADMIN" | "FACULTY_ADMIN";
  activeTab: string;
  userEmail: string;
  facultyName?: string;
  children: ReactNode;
}

export function DashboardShell({
  role,
  activeTab,
  userEmail,
  facultyName,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const superAdminNavItems: NavItem[] = [
    {
      id: "overview",
      label: "Overview",
      href: "/admin?tab=overview",
      icon: LayoutDashboard,
    },
    {
      id: "students",
      label: "Students",
      href: "/admin?tab=students",
      icon: GraduationCap,
    },
    {
      id: "faculties",
      label: "Faculties",
      href: "/admin?tab=faculties",
      icon: Building2,
    },
    {
      id: "departments",
      label: "Departments",
      href: "/admin?tab=departments",
      icon: FolderTree,
    },
    {
      id: "admins",
      label: "Administrators",
      href: "/admin?tab=admins",
      icon: ShieldCheck,
    },
    {
      id: "exports",
      label: "Export Data",
      href: "/admin?tab=exports",
      icon: FileDown,
    },
    {
      id: "settings",
      label: "Data Management",
      href: "/admin?tab=settings",
      icon: Trash2,
    },
  ];

  const facultyAdminNavItems: NavItem[] = [
    {
      id: "overview",
      label: "Overview",
      href: "/admin?tab=overview",
      icon: LayoutDashboard,
    },
    {
      id: "students",
      label: "Students",
      href: "/admin?tab=students",
      icon: GraduationCap,
    },
    {
      id: "exports",
      label: "Export Data",
      href: "/admin?tab=exports",
      icon: FileDown,
    },
  ];

  const navItems =
    role === "SUPER_ADMIN" ? superAdminNavItems : facultyAdminNavItems;

  const currentItem =
    navItems.find((item) => item.id === activeTab) ?? navItems[0];

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-white/10 bg-[#10241e] text-white lg:flex">
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Logo / Brand */}
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-[#d9ee88] ring-1 ring-white/15">
                <GraduationCap className="size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-[0.16em] text-[#d9ee88] uppercase">
                  Registrar
                </p>
                <h1 className="truncate text-base font-bold text-white">
                  Student Portal
                </h1>
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/80">
                {role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : facultyName
                    ? `Faculty: ${facultyName}`
                    : "Faculty Admin"}
              </span>
            </div>
          </div>

          {/* Quick Action Button: Enroll Student */}
          <div className="px-3.5 pt-4 pb-2">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d9ee88] px-3.5 py-2.5 text-xs font-bold text-[#10241e] shadow-xs transition hover:bg-[#c9de78] active:scale-[0.98]"
            >
              <UserPlus className="size-4" />
              <span>+ Enroll Student</span>
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 space-y-1 px-3 py-3" aria-label="Sidebar">
            <p className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
              Dashboard Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-white/15 font-semibold text-white shadow-xs ring-1 ring-white/20"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`size-4.5 shrink-0 transition ${
                      isActive
                        ? "text-[#d9ee88]"
                        : "text-white/60 group-hover:text-white"
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="size-4 text-white/50" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions Footer */}
        <div className="space-y-3 border-t border-white/10 bg-[#0d1e19] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white uppercase">
              {userEmail.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {userEmail}
              </p>
              <p className="truncate text-[10px] tracking-wider text-white/50 uppercase">
                {role === "SUPER_ADMIN" ? "Super Admin" : "Faculty Admin"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/change-password"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <KeyRound className="size-3.5" />
              <span>Password</span>
            </Link>
            <form action="/auth/logout" method="POST" className="flex-1">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
              >
                <LogOut className="size-3.5" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-xs lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open sidebar menu"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          >
            <Menu className="size-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#10241e] text-[#d9ee88]">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-xs leading-tight font-bold text-slate-900">
                {currentItem.label}
              </p>
              <p className="text-[10px] text-slate-500">
                {role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : (facultyName ?? "Faculty Admin")}
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-md bg-[#10241e] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs"
        >
          <UserPlus className="size-3.5 text-[#d9ee88]" />
          <span>+ Enroll</span>
        </Link>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 left-0 flex w-72 flex-col justify-between bg-[#10241e] text-white shadow-2xl">
            <div className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-[#d9ee88]">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#d9ee88] uppercase">
                      Registrar
                    </p>
                    <p className="text-sm font-bold text-white">
                      Student Portal
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close sidebar menu"
                  className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="px-4 pt-4 pb-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d9ee88] px-3.5 py-2.5 text-xs font-bold text-[#10241e] shadow-xs"
                >
                  <UserPlus className="size-4" />
                  <span>+ Enroll Student</span>
                </Link>
              </div>

              <nav
                className="flex-1 space-y-1 px-3 py-3"
                aria-label="Mobile Navigation"
              >
                <p className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                  Menu
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-white/15 font-semibold text-white ring-1 ring-white/20"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`size-4.5 ${
                          isActive ? "text-[#d9ee88]" : "text-white/60"
                        }`}
                      />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 border-t border-white/10 bg-[#0d1e19] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white uppercase">
                  {userEmail.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">
                    {userEmail}
                  </p>
                  <p className="truncate text-[10px] text-white/50 uppercase">
                    {role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : (facultyName ?? "Faculty Admin")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/change-password"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-medium text-white/80"
                >
                  <KeyRound className="size-3.5" />
                  <span>Password</span>
                </Link>
                <form action="/auth/logout" method="POST" className="flex-1">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-medium text-white/80"
                  >
                    <LogOut className="size-3.5" />
                    <span>Logout</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Desktop Top Header Bar */}
        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-2xs lg:flex">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-500">Dashboard</span>
            <span className="text-slate-400">/</span>
            <span className="font-semibold text-slate-900">
              {currentItem.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <UserPlus className="size-3.5 text-slate-600" />
              <span>+ Enroll student</span>
            </Link>

            <span className="h-5 w-px bg-slate-200" aria-hidden="true" />

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{userEmail}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

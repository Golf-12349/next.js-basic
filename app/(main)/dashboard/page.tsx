'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { RecentDocumentsCard } from '@/app/components/dashboard/RecentDocumentsCard';
import { QuickActionsHub } from '@/app/components/dashboard/QuickActionsHub';
import { ArchiveOrgSummaryCard } from '@/app/components/dashboard/ArchiveOrgSummaryCard';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 1. Greeting & Quick Action Header */}
        <GreetingHeader />

        {/* 2. Top Essential KPIs (Zero charts) */}
        <MetricCards />

        {/* 3. Main Operational Hub: Recent Documents Stream & Quick Operations/Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Recent Documents Table with Live Search */}
          <div className="lg:col-span-7 xl:col-span-8">
            <RecentDocumentsCard />
          </div>

          {/* Right Column: Watchlist / Operational Shortcuts & Archive Inventory */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <QuickActionsHub />
            <ArchiveOrgSummaryCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
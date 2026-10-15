'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { CompactTrafficCurve } from '@/app/components/dashboard/CompactTrafficCurve';
import { ActionCenterCard } from '@/app/components/dashboard/ActionCenterCard';
import { CabinetDirectoryCard } from '@/app/components/dashboard/CabinetDirectoryCard';
import { QuickActionsHub } from '@/app/components/dashboard/QuickActionsHub';
import { ArchiveOrgSummaryCard } from '@/app/components/dashboard/ArchiveOrgSummaryCard';
import { CategoryDirectoryCard } from '@/app/components/dashboard/CategoryDirectoryCard';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 1. Greeting & Quick Action Header */}
        <GreetingHeader />

        {/* 2. Top Essential KPIs */}
        <MetricCards />

        {/* 3. Sleek Compact Document Flow Curve (ໂຄ້ງເອກະສານແບບຍ່ອຍ ກະທັດຮັດ ແລະ ສວຍງາມ) */}
        <CompactTrafficCurve />

        {/* 4. Main Operational Hub: Action Center, Cabinet Directory & Structure Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Urgent Action Center & Storage Cabinet Directory */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <ActionCenterCard />
            <CabinetDirectoryCard />
          </div>

          {/* Right Column: Watchlist / Shortcuts, Archive Inventory & Category Explorer */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <QuickActionsHub />
            <ArchiveOrgSummaryCard />
            <CategoryDirectoryCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
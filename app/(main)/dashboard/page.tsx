'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { AnalyticsOverviewCards } from '@/app/components/dashboard/AnalyticsOverviewCards';
import { ReportsSection } from '@/app/components/dashboard/ReportsSection';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <main className="w-full space-y-4 p-3 sm:p-4 lg:p-5">
        <GreetingHeader />
        <MetricCards />
        <AnalyticsOverviewCards />
        <ReportsSection />
      </main>
    </DashboardLayout>
  );
}
'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { AnalyticsOverviewCards } from '@/app/components/dashboard/AnalyticsOverviewCards';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        <GreetingHeader />
        <MetricCards />
        <AnalyticsOverviewCards />
      </div>
    </DashboardLayout>
  );
}
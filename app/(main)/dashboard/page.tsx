'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { AnalyticsOverviewCards } from '@/app/components/dashboard/AnalyticsOverviewCards';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <div className="w-full min-h-full flex flex-col gap-4 p-3 sm:p-4 lg:p-5">
        <div className="shrink-0">
          <GreetingHeader />
        </div>
        <div className="shrink-0">
          <MetricCards />
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <AnalyticsOverviewCards className="flex-1 h-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { SchedulePanel } from '@/app/components/dashboard/SchedulePanel';
import { StatusBreakdown } from '@/app/components/dashboard/StatusBreakdown';
import { TrafficChart } from '@/app/components/dashboard/TrafficChart';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <GreetingHeader />
        <MetricCards />

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <TrafficChart />
            <StatusBreakdown />
          </div>
          <SchedulePanel />
        </div>
      </main>
    </DashboardLayout>
  );
}
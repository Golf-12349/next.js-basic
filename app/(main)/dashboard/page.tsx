'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { ReportsSection } from '@/app/components/dashboard/ReportsSection';
import { SchedulePanel } from '@/app/components/dashboard/SchedulePanel';
import { StatusBreakdown } from '@/app/components/dashboard/StatusBreakdown';
import { TrafficChart } from '@/app/components/dashboard/TrafficChart';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <main className="w-full space-y-4 p-3 sm:p-4 lg:p-5">
        <GreetingHeader />
        <MetricCards />

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <TrafficChart />
            <StatusBreakdown />
          </div>
          <SchedulePanel />
        </div>

        <ReportsSection />
      </main>
    </DashboardLayout>
  );
}
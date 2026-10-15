'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { GreetingHeader } from '@/app/components/dashboard/GreetingHeader';
import { MetricCards } from '@/app/components/dashboard/MetricCards';
import { TrafficChart } from '@/app/components/dashboard/TrafficChart';
import { StorageDistributionCard } from '@/app/components/dashboard/StorageDistributionCard';
import { RecentDocumentsCard } from '@/app/components/dashboard/RecentDocumentsCard';

export default function DashboardPage() {
  return (
    <DashboardLayout title="ໜ້າຫຼັກ">
      <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 1. Header with greeting, date, and quick action shortcuts */}
        <GreetingHeader />

        {/* 2. Top Essential KPIs: Total Docs, Inbound/Outbound, Storage & Expiration */}
        <MetricCards />

        {/* 3. Middle Section: Activity Trends Curve & Storage Allocation Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <TrafficChart />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <StorageDistributionCard />
          </div>
        </div>

        {/* 4. Bottom Section: Stream of Recent Documents */}
        <RecentDocumentsCard />
      </div>
    </DashboardLayout>
  );
}
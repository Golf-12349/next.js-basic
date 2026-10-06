'use client';

import { DashboardLayout } from '@/app/components/dashboard-layout';
import { ReportsSection } from '@/app/components/dashboard/ReportsSection';

export default function ReportsPage() {
  return (
    <DashboardLayout title="ລາຍງານ & ສະຖິຕິ">
      <main className="w-full space-y-4 p-3 sm:p-4 lg:p-5">
        <ReportsSection />
      </main>
    </DashboardLayout>
  );
}

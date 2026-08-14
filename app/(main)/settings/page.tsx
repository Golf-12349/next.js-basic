import { DashboardLayout } from '@/app/components/dashboard-layout';

const settings = [
  'ການຕັ້ງຄ່າທົ່ວໄປ',
  'ຄວາມປອດໄພການເຂົ້າເຖິງ',
  'ການຕັ້ງຄ່າເງິນ',
  'ການແຈ້ງເຕືອນ',
  'ການເຊື່ອມໂຍງ',
];

export default function SettingsPage() {
  return (
    <DashboardLayout title="ຕັ້ງຄ່າ">
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ຕັ້ງຄ່າ</h1>
          <p className="text-sm text-gray-500 mt-1">ຈັດການການຕັ້ງຄ່າລະບົບແລະຂໍ້ມູນບັນຊີ</p>
        </div>

        <div className="space-y-3">
          {settings.map((setting) => (
            <div key={setting} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
              <span className="text-gray-700 font-medium">{setting}</span>
              <button type="button" className="text-sm text-indigo-600 font-medium">ຈັດການ</button>
            </div>
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
}

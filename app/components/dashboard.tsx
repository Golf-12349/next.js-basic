import { Activity, DollarSign, Plus, ShoppingCart, Users } from 'lucide-react';

type StatItem = {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: typeof DollarSign;
};

const stats: StatItem[] = [
  { title: 'ລາຍຮັບທັງໝົດ', value: '฿124,500', change: '+12.5%', isPositive: true, icon: DollarSign },
  { title: 'ຜູ້ໃຊ້ໃໝ່', value: '+1,234', change: '+18.2%', isPositive: true, icon: Users },
  { title: 'ຄຳສັ່ງຊື້', value: '564', change: '-2.4%', isPositive: false, icon: ShoppingCart },
  { title: 'ສະຖານະລະບົບ', value: '98.5%', change: '+4.1%', isPositive: true, icon: Activity },
];

export function Dashboard() {
  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">ຍິນດີຕ້ອນຮັບກັບຄືນ! ນີ້ແມ່ນພາບລວມລະບົບຂອງທ່ານມື້ນີ້</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          ສ້າງລາຍການໃໝ່
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.title} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{stat.title}</span>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className={`text-xs mt-1 font-semibold ${stat.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.change} <span className="text-gray-400 font-normal">ທຽບກັບເດືອນກ່ອນ</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">ກິດຈະກຳລ່າສຸດ</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">ຜູ້ໃຊ້ງານ</th>
                <th className="py-3 px-4">ລາຍການ</th>
                <th className="py-3 px-4">ເວລາ</th>
                <th className="py-3 px-4">ສະຖານະ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Somchai Jaidee</td>
                <td className="py-3 px-4">ສະໝັກແພັກເກັດ Pro (1 ປີ)</td>
                <td className="py-3 px-4 text-gray-500">2 ນາທີກ່ອນ</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">ສຳເລັດ</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Somsri Raka</td>
                <td className="py-3 px-4">ອັບເດດຂໍ້ມູນໂປຣໄຟລ໌</td>
                <td className="py-3 px-4 text-gray-500">1 ຊົ່ວໂມງກ່ອນ</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">ສຳເລັດ</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Anan Sukjai</td>
                <td className="py-3 px-4">ຊຳລະເງິນບໍ່ສຳເລັດ</td>
                <td className="py-3 px-4 text-gray-500">3 ຊົ່ວໂມງກ່ອນ</td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">ລົ້ມເຫລວ</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

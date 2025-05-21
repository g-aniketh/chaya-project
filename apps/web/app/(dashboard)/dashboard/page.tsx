'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const lineGraphData = [
  { name: 'Sep', value: 80 },
  { name: 'Oct', value: 100 },
  { name: 'Nov', value: 108 },
  { name: 'Dec', value: 95 },
  { name: 'Jan', value: 90 },
  { name: 'Feb', value: 92 },
];

const pieChartData = [
  { name: 'Ginger', value: 15 },
  { name: 'Coffee', value: 30 },
  { name: 'Turmeric', value: 25 },
  { name: 'Your Files', value: 63 },
];

const COLORS = ['#FFB703', '#FB8500', '#219EBC', '#8ECAE6'];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Farmer Details</h1>
        <p className="text-gray-600">Manage and track crop procurement information</p>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Procurement Section */}
        <div className="p-4 bg-white rounded shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Procurement</h2>
            <button className="text-sm text-gray-500 hover:underline">Month</button>
          </div>
          <p className="text-2xl font-bold text-green-600">2000.00 kg</p>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineGraphData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#4CAF50" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Section */}
        <div className="p-4 bg-white rounded shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Crop</h2>
            <button className="text-sm text-gray-500 hover:underline">Month</button>
          </div>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Staff Section */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-bold">Top Performing Staff</h2>
        {/* Table remains unchanged */}
      </div>
    </div>
  );
}

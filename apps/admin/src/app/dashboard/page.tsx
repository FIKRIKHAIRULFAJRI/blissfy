export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Processing</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">0</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
        <p className="text-gray-500">No orders yet</p>
      </div>
    </div>
  );
}

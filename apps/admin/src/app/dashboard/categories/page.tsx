export default function CategoriesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Add Category
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <p className="text-gray-500">Category list will be implemented here</p>
        </div>
      </div>
    </div>
  );
}

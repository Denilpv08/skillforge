const CoursesLoading = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        <div className="h-10 w-36 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-10 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
};

export default CoursesLoading;

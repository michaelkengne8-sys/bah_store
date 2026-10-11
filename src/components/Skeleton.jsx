export function ProductCardSkeleton() {
  return (
    <div className="surface flex flex-col overflow-hidden rounded-2xl p-3">
      <div className="skeleton aspect-[4/5] rounded-xl" />
      <div className="flex flex-col gap-2 px-1 pb-1 pt-4">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton mt-1 h-5 w-20 rounded" />
      </div>
    </div>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-8 w-64 rounded" />
    </div>
  );
}

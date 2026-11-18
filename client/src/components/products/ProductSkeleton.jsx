export default function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-stone-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-stone-200" />
        <div className="h-3 w-full animate-pulse rounded bg-stone-100" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-6 w-20 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    </div>
  );
}

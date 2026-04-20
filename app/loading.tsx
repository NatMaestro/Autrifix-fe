import { CardListSkeleton, PageHeaderSkeleton } from "@/components/skeletons/app-skeletons";

export default function RootLoading() {
  return (
    <main className="min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <PageHeaderSkeleton />
        <div className="mt-6">
          <CardListSkeleton count={4} />
        </div>
      </div>
    </main>
  );
}

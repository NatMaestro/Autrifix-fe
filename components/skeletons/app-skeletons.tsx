"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AuthCardSkeleton() {
  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-300/70 bg-white/90 p-6 dark:border-white/10 dark:bg-[#1a2437]/85">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-8 w-3/4" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-5/6" />
      <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
      <Skeleton className="mt-3 h-12 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-11 w-full rounded-2xl" />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 dark:border-white/10 dark:bg-[#212d40]/85"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function DriverPageSkeleton() {
  return (
    <div className="px-4 pb-28 pt-6">
      <PageHeaderSkeleton />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 dark:border-white/10 dark:bg-[#1b2739]/85 lg:col-span-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-4 h-16 w-full" />
        </div>
        <div className="rounded-2xl border border-slate-300/70 bg-white/90 p-4 dark:border-white/10 dark:bg-[#1b2739]/85">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </div>
      </div>
      <div className="mt-6">
        <CardListSkeleton count={3} />
      </div>
    </div>
  );
}

export function MechanicPageSkeleton() {
  return (
    <div className="px-4 pt-6">
      <PageHeaderSkeleton />
      <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_280px]">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
      <div className="mt-6">
        <CardListSkeleton count={2} />
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="px-4 py-6">
      <PageHeaderSkeleton />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>
      <div className="mt-6">
        <CardListSkeleton count={4} />
      </div>
    </div>
  );
}

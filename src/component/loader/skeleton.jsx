import React from "react";

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="p-4 border border-gray-200 rounded shadow animate-pulse">
    <Skeleton className="h-4 w-1/2 mb-4" />
    <Skeleton className="h-8 w-full mb-2" />
    <Skeleton className="h-8 w-full" />
  </div>
);

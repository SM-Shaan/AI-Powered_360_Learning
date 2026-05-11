import { useState, useEffect, useRef } from 'react';
import { ArrowUpToLine } from 'lucide-react';
import { cn } from '../../lib/utils';

// Skeleton component for loading states
export const Skeleton = ({ className }) => (
  <div className={cn("animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded", className)}
       style={{ animation: 'shimmer 1.5s infinite' }} />
);

// Compact post card skeleton
const PostSkeletonCompact = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
    <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="h-8 w-16 rounded-lg" />
  </div>
);

// Post card skeleton
export const PostSkeleton = ({ compact = false }) => {
  if (compact) return <PostSkeletonCompact />;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex gap-5">
        <div className="hidden sm:flex flex-col items-center gap-3 min-w-[70px]">
          <Skeleton className="h-[72px] w-full rounded-xl" />
          <Skeleton className="h-[72px] w-full rounded-xl" />
        </div>
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Answer skeleton
export const AnswerSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <div className="flex items-start gap-4 mb-4">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

// Animated number counter
export const AnimatedNumber = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span className={className}>{displayValue}</span>;
};

// Virtualized list intersection observer hook
export const useIntersectionObserver = (callback, options = {}) => {
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, { threshold: 0.1, ...options });

    observer.observe(target);
    return () => observer.disconnect();
  }, [callback, options]);

  return targetRef;
};

// Scroll to top button component
export const ScrollToTopButton = ({ show, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "fixed bottom-6 right-6 z-40 p-3 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-700 hover:scale-110",
      show ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
    )}
  >
    <ArrowUpToLine className="h-5 w-5" />
  </button>
);

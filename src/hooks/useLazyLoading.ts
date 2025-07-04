import { useState, useEffect, useRef, useCallback } from 'react';

// PHASE 2: Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callback(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [callback, options]);

  return targetRef;
}

// Lazy loading hook for images and components
export function useLazyLoading<T>(
  items: T[],
  initialCount = 20,
  increment = 10
) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(() => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Simulate async loading (you can replace with actual async operation)
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + increment, items.length));
      setIsLoading(false);
    }, 100);
  }, [isLoading, increment, items.length]);

  const hasMore = displayCount < items.length;
  const displayedItems = items.slice(0, displayCount);

  // Auto-trigger ref for infinite scroll
  const triggerRef = useIntersectionObserver(
    useCallback((isIntersecting: boolean) => {
      if (isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    }, [hasMore, isLoading, loadMore])
  );

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    triggerRef,
    progress: Math.round((displayCount / items.length) * 100)
  };
}

// Image lazy loading hook
export function useImageLazyLoading(src: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  const imgRef = useIntersectionObserver(
    useCallback((isIntersecting: boolean) => {
      if (isIntersecting && !isInView) {
        setIsInView(true);
      }
    }, [isInView])
  );

  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.src = src;
  }, [isInView, src]);

  return {
    imgRef,
    shouldLoad: isInView,
    isLoaded,
    src: isInView ? src : undefined
  };
}
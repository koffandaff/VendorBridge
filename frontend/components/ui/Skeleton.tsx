import React from "react";
import styles from "./skeleton.module.css";

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`${styles.skeleton} ${className}`} style={style} aria-hidden="true" />;
}

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Skeleton style={{ width: 200, height: 26 }} />
        <Skeleton style={{ width: 280, height: 14 }} />
      </div>
      {children}
    </div>
  );
}

export function ToolbarSkeleton({ tabs = true }: { tabs?: boolean }) {
  return (
    <div className={styles.toolbar}>
      <Skeleton style={{ height: 40, width: "100%", maxWidth: 360, borderRadius: 10 }} />
      {tabs && (
        <div className={styles.tabs}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ width: 88 + i * 12, height: 32, borderRadius: 8 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  const grid = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } as React.CSSProperties;
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHead} style={grid}>
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton key={c} style={{ height: 14, width: c % 2 === 0 ? "60%" : "40%" }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tableRow} style={grid}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} style={{ height: 14, width: c % 3 === 0 ? "70%" : "45%" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatsGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className={styles.statsGrid}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton style={{ width: 96, height: 14 }} />
          <Skeleton style={{ width: 72, height: 28, marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className={styles.card}>
      <Skeleton style={{ width: 180, height: 16 }} />
      <div className={styles.cardLines}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} style={{ height: 13, width: `${100 - (i % 3) * 18}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={styles.timeline}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.timelineRow}>
          <Skeleton style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
          <div className={styles.timelineContent}>
            <Skeleton style={{ width: "55%", height: 14 }} />
            <Skeleton style={{ width: "80%", height: 12 }} />
          </div>
          <Skeleton style={{ width: 44, height: 12, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
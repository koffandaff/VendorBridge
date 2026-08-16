"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck } from "lucide-react";
import styles from "./NotificationBell.module.css";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { NotificationDto } from "@/lib/types";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const count = await fetchUnreadNotificationCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    };
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      try {
        const result = await fetchNotifications({ limit: 10 });
        if (cancelled) return;
        setNotifications(result.items);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const togglePanel = () => {
    if (!open) {
      setLoading(true);
      setError(false);
    }
    setOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      setError(true);
    }
  };

  const handleOpenNotification = async (notification: NotificationDto) => {
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await markNotificationRead(notification.id);
      } catch {
        try {
          const count = await fetchUnreadNotificationCount();
          setUnreadCount(count);
        } catch {
          setUnreadCount(0);
        }
      }
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.bellButton}
        onClick={togglePanel}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Notifications</span>
            <button
              className={styles.markAllButton}
              onClick={handleMarkAllRead}
              disabled={notifications.length === 0}
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.stateContainer}>
                <div className={styles.spinner} />
              </div>
            ) : error ? (
              <div className={styles.stateText}>Could not load notifications</div>
            ) : notifications.length === 0 ? (
              <div className={styles.stateText}>You&apos;re all caught up</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={styles.item}
                  onClick={() => handleOpenNotification(notification)}
                >
                  {!notification.isRead && <span className={styles.unreadDot} />}
                  <div className={styles.itemContent}>
                    <span className={`${styles.itemTitle} ${!notification.isRead ? styles.unreadTitle : ""}`}>
                      {notification.title}
                    </span>
                    <span className={styles.itemMessage}>{notification.message}</span>
                    <span className={styles.itemTime}>{formatDate(notification.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

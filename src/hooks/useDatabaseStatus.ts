import { useState, useEffect, useCallback } from "react";
import { getApiBaseUrl } from "../lib/api";

type DatabaseStatus = "connected" | "error" | "checking" | "disconnected";

interface DatabaseStatusResult {
  status: DatabaseStatus;
  message: string;
  lastChecked: Date | null;
  error: string | null;
}

const POLL_INTERVAL = 30000; // 30 seconds
const API_HEALTH_ENDPOINT = `${getApiBaseUrl()}/health`;

export function useDatabaseStatus() {
  const [statusResult, setStatusResult] = useState<DatabaseStatusResult>({
    status: "checking",
    message: "Tekshirilmoqda...",
    lastChecked: null,
    error: null,
  });

  const checkDatabaseStatus = useCallback(async () => {
    try {
      const response = await fetch(API_HEALTH_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.database === "connected" || data.status === "ok") {
          setStatusResult({
            status: "connected",
            message: "Ma'lumotlar sinxronizatsiya qilingan",
            lastChecked: new Date(),
            error: null,
          });
        } else {
          setStatusResult({
            status: "error",
            message: "Ma'lumotlar bazasi bilan aloqa yo'q",
            lastChecked: new Date(),
            error: data.error || "Unknown error",
          });
        }
      } else {
        setStatusResult({
          status: "error",
          message: "Server javob bermayapti",
          lastChecked: new Date(),
          error: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      setStatusResult({
        status: "disconnected",
        message: "Serverga ulanishda xatolik",
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Network error",
      });
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkDatabaseStatus();

    // Set up polling interval
    const intervalId = setInterval(() => {
      checkDatabaseStatus();
    }, POLL_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [checkDatabaseStatus]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setStatusResult((prev) => ({
      ...prev,
      status: "checking",
      message: "Tekshirilmoqda...",
    }));
    checkDatabaseStatus();
  }, [checkDatabaseStatus]);

  return {
    ...statusResult,
    refresh,
  };
}

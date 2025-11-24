
import { useState, useRef } from 'react';

export function useGoogleSheets<T>(scriptUrl: string, password: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // Load data from Google Sheet
  const loadData = async () => {
    if (!scriptUrl || !password) return;
    setLoading(true);
    setError(null);
    try {
      // Add random param to prevent caching
      const response = await fetch(`${scriptUrl}?action=read&key=${encodeURIComponent(password)}&t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
      if (result) {
        setData(result as T);
      } else {
        // If null (new user), we keep the initialValue but we don't save yet until they make changes
        console.log("New user detected, using initial data.");
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("โหลดข้อมูลไม่สำเร็จ ตรวจสอบ URL หรือ อินเทอร์เน็ต");
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  };

  // Save data to Google Sheet
  const saveData = async (newData: T) => {
    // Optimistic update
    setData(newData);
    
    if (!scriptUrl || !password || isFirstLoad.current) return;

    setIsSaving(true);
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script Simple Requests
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: password,
          data: newData
        })
      });
      console.log("Data sent to sheet");
    } catch (err) {
      console.error("Error saving data:", err);
    } finally {
      // Small delay to let user see the saving state
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  return { data, saveData, loadData, loading, error, isSaving };
}

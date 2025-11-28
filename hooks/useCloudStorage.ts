
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCloudStorage<T>(collectionName: string, docId: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // Load data from Cloud
  const loadData = async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setData(docSnap.data() as T);
      } else {
        // If new user/password, save the initial data to cloud
        await setDoc(docRef, initialValue as any);
        setData(initialValue);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("ไม่สามารถโหลดข้อมูลได้ ตรวจสอบอินเทอร์เน็ต");
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  };

  // Save data to Cloud (Debounced)
  const saveData = async (newData: T) => {
    setData(newData); // Optimistic update
    if (!docId || isFirstLoad.current) return;

    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, newData as any);
    } catch (err) {
      console.error("Error saving data:", err);
    }
  };

  return { data, saveData, loadData, loading, error };
}

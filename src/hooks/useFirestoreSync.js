/**
 * useFirestoreSync.js — Real-time Firestore Synchronization Layer
 *
 * Directives:
 * - Authoritative Firestore onSnapshot data with local cache fallback
 * - Comprehensive debug logging for every query/path
 * - Full try/catch, error propagation, and retry handles
 * - Supports nested student doc fields and Firestore subcollections
 * - Subscribes to live 'broadcasts' collection for school notices
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../firebase.js";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useLocalCache } from "./useLocalCache.js";

// ─── Helper: Parse Timestamp ──────────────────────────────────────────────────
export function getNoticeTimestampMs(item) {
  if (!item) return 0;
  const ts =
    item.sentAt ||
    item.timestamp ||
    item.date ||
    item.createdAt ||
    item.publishedAt ||
    item.noticeDate ||
    item.eventDate ||
    item.time;

  if (ts?.seconds) return ts.seconds * 1000;
  if (typeof ts === "number") return ts > 1e11 ? ts : ts * 1000;
  if (typeof ts === "string") {
    const parsed = new Date(ts).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

// ─── Helper: Check Expiry (Strictly explicit expiry dates only) ───────────────
export function isNoticeExpired(item) {
  if (!item) return true;
  const now = Date.now();

  const expiry = item.expiryDate || item.expiresAt || item.validUntil || item.dueDate;
  if (expiry) {
    let expiryMs = 0;
    if (expiry?.seconds) expiryMs = expiry.seconds * 1000;
    else if (typeof expiry === "number") expiryMs = expiry > 1e11 ? expiry : expiry * 1000;
    else if (typeof expiry === "string") expiryMs = new Date(expiry).getTime();

    if (expiryMs > 0 && now > expiryMs) {
      return true;
    }
  }

  // Active broadcasts/notices do NOT auto-expire by 24h
  return false;
}

// ─── 1. Student Profile Hook ─────────────────────────────────────────────────
export function useStudentProfile(satsId) {
  const cleanId = (satsId || "").trim().toUpperCase();

  const [initialCached] = useLocalCache(`student_${cleanId}`, null);
  const [, setCached] = useLocalCache(`student_${cleanId}`, null);

  const [student, setStudent] = useState(initialCached);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!cleanId || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`[Firestore:Profile] Listening to /students/${cleanId}`);

    const docRef = doc(db, "students", cleanId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          console.log(`[Firestore:Profile] SUCCESS: /students/${cleanId} -> Name: "${data.name}", Class: "${data.class}"`);
          setStudent(data);
          setCached(data);
          setError(null);
        } else {
          console.warn(`[Firestore:Profile] Document /students/${cleanId} not found`);
          setError(`Student record ${cleanId} not found in database.`);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore:Profile] ERROR: /students/${cleanId}`, err);
        setError(err.message || "Failed to load student profile");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [cleanId, retryCount]);

  return { student, loading, error, retry };
}

// ─── 2. Student Attendance Hook (Subcollection + Doc Summary) ─────────────────
export function useStudentAttendance(satsId, student = null) {
  const cleanId = (satsId || student?.id || student?.satsId || "").trim().toUpperCase();
  const [dayLogs, setDayLogs] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [stats, setStats] = useState(() => {
    const p = Number(student?.daysPresent ?? student?.attendance?.daysPresent ?? 0);
    const a = Number(student?.daysAbsent ?? student?.attendance?.daysAbsent ?? 0);
    const t = Number(student?.totalWorkingDays ?? student?.attendance?.totalWorkingDays ?? (p + a > 0 ? p + a : 180));
    return {
      daysPresent: p,
      daysAbsent: a,
      totalWorkingDays: t,
      percentage: t > 0 ? Math.round((p / t) * 100) : 0,
    };
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!cleanId || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`[Firestore:Attendance] Listening to /students/${cleanId}/attendance`);

    const attRef = collection(db, "students", cleanId, "attendance");
    const unsubscribe = onSnapshot(
      attRef,
      (snapshot) => {
        const logs = [];
        const map = {};
        snapshot.forEach((docSnap) => {
          const d = { id: docSnap.id, ...docSnap.data() };
          logs.push(d);
          const dateKey = d.date || docSnap.id;
          if (dateKey) map[dateKey] = d;
        });

        // Compute summary from subcollection or student document fields
        const subPresent = logs.filter((l) => String(l.status || "").toLowerCase().includes("present") || String(l.status || "").toLowerCase().includes("late")).length;
        const subAbsent = logs.filter((l) => String(l.status || "").toLowerCase().includes("absent")).length;

        const docPresent = Number(student?.daysPresent ?? student?.attendance?.daysPresent ?? 0);
        const docAbsent = Number(student?.daysAbsent ?? student?.attendance?.daysAbsent ?? 0);
        const docTotal = Number(student?.totalWorkingDays ?? student?.attendance?.totalWorkingDays ?? 0);

        const daysPresent = Math.max(subPresent, docPresent);
        const daysAbsent = Math.max(subAbsent, docAbsent);
        const totalWorkingDays = docTotal > 0 ? docTotal : (daysPresent + daysAbsent > 0 ? daysPresent + daysAbsent : 0);
        const percentage = totalWorkingDays > 0 ? Math.round((daysPresent / totalWorkingDays) * 100) : 0;

        console.log(`[Firestore:Attendance] SUCCESS: /students/${cleanId}/attendance -> ${logs.length} logs. Present: ${daysPresent}, Absent: ${daysAbsent}, Rate: ${percentage}%`);

        setDayLogs(logs);
        setAttendanceMap(map);
        setStats({ daysPresent, daysAbsent, totalWorkingDays, percentage });
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore:Attendance] ERROR: /students/${cleanId}/attendance`, err);
        setError(err.message || "Failed to load attendance logs");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [cleanId, student, retryCount]);

  return { dayLogs, attendanceMap, stats, loading, error, retry };
}

// ─── 3. Student Receipts Hook ────────────────────────────────────────────────
export function useStudentReceipts(satsId, student = null) {
  const cleanId = (satsId || student?.id || student?.satsId || "").trim().toUpperCase();
  const [initialCached] = useLocalCache(`receipts_${cleanId}`, []);
  const [, setCached] = useLocalCache(`receipts_${cleanId}`, []);

  const [receipts, setReceipts] = useState(initialCached);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const resultMapRef = useRef(new Map());

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!cleanId || !db) {
      setLoading(false);
      return;
    }

    resultMapRef.current = new Map();
    setLoading(true);
    setError(null);
    console.log(`[Firestore:Receipts] Querying receipts for student ${cleanId}`);

    const unsubscribes = [];

    const pushAndSort = () => {
      const list = Array.from(resultMapRef.current.values());
      list.sort((a, b) => {
        const tsA = getNoticeTimestampMs(a) || (a.date ? new Date(a.date).getTime() : 0);
        const tsB = getNoticeTimestampMs(b) || (b.date ? new Date(b.date).getTime() : 0);
        return tsB - tsA;
      });
      console.log(`[Firestore:Receipts] Total combined receipts for ${cleanId}: ${list.length}`);
      setReceipts(list);
      setCached(list);
      setLoading(false);
    };

    // Subcollections under /students/{cleanId}/
    ["receipts", "payments", "transactions", "fee_receipts"].forEach((subName) => {
      try {
        const subRef = collection(db, "students", cleanId, subName);
        const unsub = onSnapshot(
          subRef,
          (snap) => {
            snap.forEach((docSnap) => {
              resultMapRef.current.set(`${subName}_${docSnap.id}`, { id: docSnap.id, _source: subName, ...docSnap.data() });
            });
            snap.docChanges().forEach((change) => {
              if (change.type === "removed") {
                resultMapRef.current.delete(`${subName}_${change.doc.id}`);
              }
            });
            pushAndSort();
          },
          (err) => console.warn(`[Firestore:Receipts] Subcollection ${subName} warning:`, err.message)
        );
        unsubscribes.push(unsub);
      } catch (err) {
        console.warn(`[Firestore:Receipts] Subcollection ${subName} setup error:`, err);
      }
    });

    return () => {
      unsubscribes.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, [cleanId, retryCount]);

  // Merge direct receipts array on the student document
  useEffect(() => {
    if (!student) return;
    const docArrays = [
      ...(student?.receipts || []),
      ...(student?.payments || []),
      ...(student?.transactions || []),
      ...(student?.feeHistory || []),
      ...(student?.receiptList || []),
    ];
    if (docArrays.length === 0) return;

    let changed = false;
    docArrays.forEach((r, idx) => {
      if (r && typeof r === "object") {
        const recId = `docfield_${r.id || r.receiptNo || r.transactionId || idx}`;
        if (!resultMapRef.current.has(recId)) {
          resultMapRef.current.set(recId, { id: recId, _source: "docfield", ...r });
          changed = true;
        }
      }
    });

    if (changed) {
      const list = Array.from(resultMapRef.current.values());
      list.sort((a, b) => {
        const tsA = getNoticeTimestampMs(a) || (a.date ? new Date(a.date).getTime() : 0);
        const tsB = getNoticeTimestampMs(b) || (b.date ? new Date(b.date).getTime() : 0);
        return tsB - tsA;
      });
      setReceipts(list);
      setCached(list);
      setLoading(false);
    }
  }, [student]);

  return { receipts, loading, error, retry };
}

// ─── 4. Student Marks / Academics Hook ───────────────────────────────────────
export function useStudentMarks(satsId, student = null) {
  const cleanId = (satsId || student?.id || student?.satsId || "").trim().toUpperCase();
  const [initialCached] = useLocalCache(`marks_${cleanId}`, null);
  const [, setCached] = useLocalCache(`marks_${cleanId}`, null);

  const [marksData, setMarksData] = useState(initialCached);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const subMarksRef = useRef({});

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!cleanId || !db) {
      setLoading(false);
      return;
    }

    subMarksRef.current = {};
    setLoading(true);
    setError(null);
    console.log(`[Firestore:Marks] Listening to marks for student ${cleanId}`);

    const unsubscribes = [];

    const merge = () => {
      const docMarks = student?.marks || student?.examMarks || student?.academics || student?.results || {};
      const merged = {
        ...docMarks,
        ...subMarksRef.current,
      };
      console.log(`[Firestore:Marks] Merged marks keys for ${cleanId}:`, Object.keys(merged));
      setMarksData(merged);
      setCached(merged);
      setLoading(false);
    };

    ["marks", "results", "academics", "examResults"].forEach((subName) => {
      try {
        const subRef = collection(db, "students", cleanId, subName);
        const unsub = onSnapshot(
          subRef,
          (snap) => {
            snap.forEach((docSnap) => {
              subMarksRef.current[docSnap.id] = docSnap.data();
            });
            snap.docChanges().forEach((change) => {
              if (change.type === "removed") {
                delete subMarksRef.current[change.doc.id];
              }
            });
            merge();
          },
          (err) => console.warn(`[Firestore:Marks] Subcollection ${subName} warning:`, err.message)
        );
        unsubscribes.push(unsub);
      } catch (err) {
        console.warn(`[Firestore:Marks] Subcollection ${subName} error:`, err);
      }
    });

    merge();

    return () => {
      unsubscribes.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, [cleanId, retryCount]);

  useEffect(() => {
    if (!student) return;
    const docMarks = student?.marks || student?.examMarks || student?.academics || student?.results;
    if (!docMarks) return;
    const merged = { ...docMarks, ...subMarksRef.current };
    setMarksData(merged);
  }, [student]);

  return { marksData, loading, error, retry };
}

// ─── 5. School Broadcasts & Notices Hook ─────────────────────────────────────
export function useEventsList(satsId = "", student = null) {
  const cleanId = (satsId || student?.id || student?.satsId || "").trim().toUpperCase();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const resultMap = new Map();
    const unsubscribes = [];
    setLoading(true);
    setError(null);
    console.log(`[Firestore:Notices] Subscribing to broadcasts & notices...`);

    const pushAndSet = () => {
      const list = Array.from(resultMap.values());
      list.sort((a, b) => {
        const tsA = getNoticeTimestampMs(a);
        const tsB = getNoticeTimestampMs(b);
        return tsB - tsA;
      });
      console.log(`[Firestore:Notices] SUCCESS: Loaded ${list.length} total notices/broadcasts.`);
      setEvents(list);
      setLoading(false);
    };

    // Primary collection in Firestore is 'broadcasts', along with events/notices
    const topCollections = [
      "broadcasts",
      "notices",
      "events",
      "announcements",
      "circulars",
      "school_notices",
      "communications",
      "alerts",
    ];

    topCollections.forEach((topName) => {
      try {
        const topRef = collection(db, topName);
        const unsub = onSnapshot(
          topRef,
          (snap) => {
            snap.forEach((d) => {
              const item = {
                id: d.id,
                _source: topName,
                title: d.data().title || d.data().name || "School Notice",
                message: d.data().body || d.data().message || d.data().text || d.data().description || "",
                date: d.data().sentAt || d.data().date || d.data().timestamp,
                priority: d.data().priority || "normal",
                sender: d.data().sender || d.data().by || "Administration",
                ...d.data(),
              };
              if (!isNoticeExpired(item)) {
                resultMap.set(`top_${topName}_${d.id}`, item);
              }
            });
            snap.docChanges().forEach((change) => {
              if (change.type === "removed") {
                resultMap.delete(`top_${topName}_${change.doc.id}`);
              }
            });
            pushAndSet();
          },
          (err) => console.warn(`[Firestore:Notices] ${topName} query warning:`, err.message)
        );
        unsubscribes.push(unsub);
      } catch (err) {
        console.warn(`[Firestore:Notices] ${topName} setup failed:`, err);
      }
    });

    // Student specific subcollections
    if (cleanId) {
      ["broadcasts", "notices", "events", "notifications", "alerts"].forEach((subName) => {
        try {
          const subRef = collection(db, "students", cleanId, subName);
          const unsub = onSnapshot(
            subRef,
            (snap) => {
              snap.forEach((d) => {
                const item = {
                  id: d.id,
                  _source: subName,
                  title: d.data().title || "Student Notice",
                  message: d.data().body || d.data().message || d.data().text || "",
                  date: d.data().sentAt || d.data().date || d.data().timestamp,
                  ...d.data(),
                };
                if (!isNoticeExpired(item)) {
                  resultMap.set(`sub_${subName}_${d.id}`, item);
                }
              });
              pushAndSet();
            },
            (err) => console.warn(`[Firestore:Notices] Subcollection ${subName} warning:`, err.message)
          );
          unsubscribes.push(unsub);
        } catch (err) {}
      });
    }

    return () => {
      unsubscribes.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, [cleanId, retryCount]);

  // Merge notices array fields on student document
  useEffect(() => {
    if (!student) return;
    const docArrays = [
      ...(student?.broadcasts || []),
      ...(student?.notices || []),
      ...(student?.events || []),
      ...(student?.announcements || []),
      ...(student?.notifications || []),
    ];
    if (!docArrays.length) return;

    setEvents((prev) => {
      const existing = new Map(prev.map((item) => [item.id, item]));
      let added = false;
      docArrays.forEach((item, idx) => {
        if (item && typeof item === "object" && !isNoticeExpired(item)) {
          const itemId = item.id || `doc_notice_${idx}`;
          if (!existing.has(itemId)) {
            existing.set(itemId, {
              id: itemId,
              title: item.title || "Notice",
              message: item.message || item.body || item.text || "",
              ...item,
            });
            added = true;
          }
        }
      });
      return added ? Array.from(existing.values()) : prev;
    });
  }, [student]);

  return { events, loading, error, retry };
}

// ─── 6. Filter Events by Student Class/Section ───────────────────────────────
export function useFilteredEvents(student) {
  const satsId = student?.id || student?.satsId || "";
  const { events, loading, error, retry } = useEventsList(satsId, student);
  return { events: filterEventsForStudent(events, student), loading, error, retry };
}

export function filterEventsForStudent(events, student) {
  if (!Array.isArray(events)) return [];
  if (!student) return events;

  const studentClassRaw = String(student.class || student.grade || "").toLowerCase();
  const studentClassClean = studentClassRaw.replace(/class|grade|\s/gi, "");
  const studentSectionClean = String(student.section || "")
    .toLowerCase()
    .replace(/section|\s/gi, "");

  return events.filter((evt) => {
    if (!evt) return false;

    // Direct student targeted
    const targetSats = String(evt.satsId || evt.studentId || evt.targetSats || "").toLowerCase();
    if (targetSats && student.id && targetSats === String(student.id).toLowerCase()) {
      return true;
    }

    const targetClass = String(evt.targetClass || evt.class || "all").toLowerCase();
    const targetSection = String(evt.targetSection || evt.section || "all").toLowerCase();

    const isAllClass =
      targetClass === "all" ||
      targetClass === "all classes" ||
      targetClass === "" ||
      targetClass === "undefined";
    const isAllSection =
      targetSection === "all" ||
      targetSection === "all sections" ||
      targetSection === "" ||
      targetSection === "undefined";

    const targetClassClean = targetClass.replace(/class|grade|\s/gi, "");
    const targetSectionClean = targetSection.replace(/section|\s/gi, "");

    const classMatches =
      isAllClass ||
      targetClassClean === studentClassClean ||
      studentClassClean.includes(targetClassClean) ||
      targetClassClean.includes(studentClassClean);

    const sectionMatches = isAllSection || targetSectionClean === studentSectionClean;

    return classMatches && sectionMatches;
  });
}

// ─── 7. Urgent Communication Alerts ──────────────────────────────────────────
export function useStudentAlerts(satsId, student = null) {
  const cleanId = (satsId || student?.id || student?.satsId || "").trim().toUpperCase();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !cleanId) {
      setLoading(false);
      return;
    }

    const resultMap = new Map();
    const unsubscribes = [];

    const pushAndSet = () => {
      const list = Array.from(resultMap.values());
      setAlerts(list);
      setLoading(false);
    };

    ["alerts", "broadcasts"].forEach((colName) => {
      try {
        const ref = collection(db, colName);
        const unsub = onSnapshot(ref, (snap) => {
          snap.forEach((d) => {
            const data = d.data();
            if (data.priority === "urgent" || data.priority === "high" || data.isAlert) {
              resultMap.set(`${colName}_${d.id}`, { id: d.id, ...data });
            }
          });
          pushAndSet();
        }, () => {});
        unsubscribes.push(unsub);
      } catch {}
    });

    return () => {
      unsubscribes.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, [cleanId]);

  return { alerts, loading };
}

// ─── 8. Bus Routes Hook ──────────────────────────────────────────────────────
export function useBusRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    console.log("[Firestore:Buses] Subscribing to buses...");
    const collRef = collection(db, "buses");
    const unsubscribe = onSnapshot(
      collRef,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        console.log(`[Firestore:Buses] SUCCESS: Loaded ${list.length} buses.`);
        setRoutes(list);
        setLoading(false);
      },
      (err) => {
        console.error("[Firestore:Buses] ERROR:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { routes, loading, error };
}

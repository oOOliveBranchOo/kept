import { useEffect, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { FIREBASE_CONFIG } from "./firebase-config";
import { readExportTime, writeExportTime } from "./storage";

function cloudEnabled() {
  return FIREBASE_CONFIG && FIREBASE_CONFIG.enabled && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
}

function isNewer(a, b) {
  if (!a) return false;
  if (!b) return true;
  return new Date(a).getTime() > new Date(b).getTime();
}

function hasLocalKept(today, weekly, lists, log, permanent) {
  return (
    (today?.items && today.items.length > 0) ||
    (weekly?.items && weekly.items.length > 0) ||
    (permanent?.items && permanent.items.length > 0) ||
    (lists && lists.length > 0) ||
    (log && log.length > 0)
  );
}

function remoteHasKept(remote) {
  if (!remote) return false;
  return (
    (remote.today?.items && remote.today.items.length > 0) ||
    (remote.weekly?.items && remote.weekly.items.length > 0) ||
    (remote.permanent?.items && remote.permanent.items.length > 0) ||
    (remote.lists && remote.lists.length > 0) ||
    (remote.log && remote.log.length > 0) ||
    (remote.routines && remote.routines.length > 0)
  );
}

function cleanForCloud(value) {
  if (value === undefined) return null;
  if (typeof value === "number" && Number.isNaN(value)) return null;
  if (Array.isArray(value)) return value.map(cleanForCloud);
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).forEach((k) => {
      out[k] = cleanForCloud(value[k]);
    });
    return out;
  }
  return value;
}

export function useCloudSync({
  ready,
  today,
  weekly,
  permanent,
  lists,
  routines,
  log,
  setToday,
  setWeekly,
  setPermanent,
  setLists,
  setRoutines,
  setLog,
}) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [status, setStatus] = useState("local");
  const [error, setError] = useState("");
  const applyingRemote = useRef(false);
  const initialSyncDone = useRef(false);
  const writeTimer = useRef(null);
  const unsubSnap = useRef(null);
  const latest = useRef({ today, weekly, permanent, lists, routines, log });
  const dbRef = useRef(null);
  const authRef = useRef(null);

  latest.current = { today, weekly, permanent, lists, routines, log };

  useEffect(() => {
    if (!cloudEnabled()) {
      setAuthReady(true);
      setStatus("local");
      return;
    }
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const auth = getAuth(app);
      const db = getFirestore(app);
      authRef.current = auth;
      dbRef.current = db;
      setPersistence(auth, browserLocalPersistence).catch(() => {});
      const unsub = onAuthStateChanged(auth, (next) => {
        setUser(next);
        setAuthReady(true);
        setError("");
        if (!next) {
          initialSyncDone.current = false;
          if (unsubSnap.current) {
            unsubSnap.current();
            unsubSnap.current = null;
          }
          setStatus("local");
        }
      });
      return () => unsub();
    } catch {
      setAuthReady(true);
      setStatus("local");
    }
  }, []);

  function applyRemote(remote) {
    applyingRemote.current = true;
    if (remote.today) setToday(remote.today);
    if (remote.weekly) setWeekly(remote.weekly);
    if (remote.permanent && Array.isArray(remote.permanent.items)) setPermanent(remote.permanent);
    if (Array.isArray(remote.lists)) setLists(remote.lists);
    if (Array.isArray(remote.routines)) setRoutines(remote.routines);
    if (Array.isArray(remote.log)) setLog(remote.log);
    writeExportTime(remote.exportedAt || new Date().toISOString());
    setTimeout(() => {
      applyingRemote.current = false;
    }, 50);
  }

  function buildPayload() {
    const exportedAt = new Date().toISOString();
    writeExportTime(exportedAt);
    return cleanForCloud({
      app: "kept",
      version: 2,
      exportedAt,
      today: latest.current.today,
      weekly: latest.current.weekly,
      permanent: latest.current.permanent,
      lists: latest.current.lists,
      routines: latest.current.routines,
      log: latest.current.log,
    });
  }

  async function pushCloud() {
    if (!user || !dbRef.current) return;
    const payload = buildPayload();
    await setDoc(doc(dbRef.current, "kept", user.uid), payload);
    setStatus("synced");
  }

  useEffect(() => {
    if (!ready || !authReady || !user || !dbRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const ref = doc(dbRef.current, "kept", user.uid);
        const snap = await getDoc(ref);
        if (cancelled) return;
        const localAt = readExportTime();
        const localData = latest.current;
        const localExists = hasLocalKept(localData.today, localData.weekly, localData.lists, localData.log, localData.permanent);

        if (!snap.exists()) {
          if (localExists || (localData.routines && localData.routines.length)) await pushCloud();
          else setStatus("synced");
        } else {
          const remote = snap.data();
          if (!localExists && remoteHasKept(remote)) {
            applyRemote(remote);
          } else if (isNewer(remote.exportedAt, localAt)) {
            applyRemote(remote);
          } else if (isNewer(localAt, remote.exportedAt) || (localExists && !remoteHasKept(remote))) {
            await pushCloud();
          }
          setStatus("synced");
        }
        initialSyncDone.current = true;

        if (unsubSnap.current) unsubSnap.current();
        unsubSnap.current = onSnapshot(ref, (live) => {
          if (!live.exists() || applyingRemote.current) return;
          const remote = live.data();
          if (!remote) return;
          const localAtNow = readExportTime();
          if (remote.exportedAt === localAtNow) return;
          if (!isNewer(remote.exportedAt, localAtNow) && hasLocalKept(
            latest.current.today,
            latest.current.weekly,
            latest.current.lists,
            latest.current.log,
            latest.current.permanent
          )) return;
          applyRemote(remote);
          setStatus("synced");
        });
      } catch {
        setStatus("error");
        setError("Cloud sync is unavailable right now. Your lists are still saved on this device.");
      }
    })();

    return () => {
      cancelled = true;
      if (unsubSnap.current) {
        unsubSnap.current();
        unsubSnap.current = null;
      }
    };
  }, [ready, authReady, user]);

  useEffect(() => {
    if (!ready || !user || applyingRemote.current || !initialSyncDone.current) return;
    clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      pushCloud().catch(() => setStatus("error"));
    }, 700);
    return () => clearTimeout(writeTimer.current);
  }, [ready, user, today, weekly, permanent, lists, routines, log]);

  async function signIn(email, password) {
    if (!authRef.current) throw new Error("Cloud sync is not set up yet.");
    setError("");
    await signInWithEmailAndPassword(authRef.current, email, password);
  }

  async function signUp(email, password) {
    if (!authRef.current) throw new Error("Cloud sync is not set up yet.");
    setError("");
    await createUserWithEmailAndPassword(authRef.current, email, password);
  }

  async function resetPassword(email) {
    if (!authRef.current) throw new Error("Cloud sync is not set up yet.");
    await sendPasswordResetEmail(authRef.current, email);
  }

  async function logOut() {
    if (!authRef.current) return;
    await signOut(authRef.current);
  }

  function authMessage(err) {
    const code = (err && err.code) || "";
    if (code === "auth/email-already-in-use") return "That email already has an account. Sign in, or use Forgot password if you do not remember it.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-login-credentials") {
      return "Email or password is not right. Use the same login as The Grand Library, or Create Account if you never made one.";
    }
    if (code === "auth/too-many-requests") return "Too many tries. Wait a minute, then try again.";
    if (code === "auth/network-request-failed") return "The phone could not reach the sync server. Check Wi-Fi, then try again.";
    if (code === "auth/invalid-email") return "Please enter a full email address.";
    if (code === "auth/weak-password") return "Password needs at least 6 characters.";
    return (err && err.message) || "Sign in failed.";
  }

  return {
    enabled: cloudEnabled(),
    user,
    authReady,
    status,
    error,
    setError,
    signIn,
    signUp,
    resetPassword,
    logOut,
    authMessage,
  };
}

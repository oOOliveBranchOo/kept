import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Check,
  Trash2,
  X,
  Home,
  ListChecks,
  Repeat,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Archive,
  Sunrise,
  Moon,
  Dumbbell,
  Package,
  Luggage,
  FolderPlus,
  ShoppingCart,
  Apple,
  Shirt,
  Compass,
  Utensils,
  Pin,
  Cloud,
} from "lucide-react";
import { loadKey, saveKey } from "./storage";
import { useCloudSync } from "./cloud";
import SyncModal from "./SyncModal";

/* ---------------------------------------------------------
   Kept — a soft, iPhone-first checklist / list / routine app.
   Home lives behind its own persistent corner button; every
   other section lives in a slide-in drawer opened from a tab
   fixed to the right edge, within thumb reach.
   Data persists on this device and, after sign-in, across devices.
--------------------------------------------------------- */

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const prettyDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const uid = () => Math.random().toString(36).slice(2, 10);

const SECTIONS = [
  { key: "today", label: "Today", icon: ListChecks, accent: "blue" },
  { key: "lists", label: "Lists", icon: FolderPlus, accent: "rose" },
  { key: "routines", label: "Routines", icon: Repeat, accent: "sage" },
  { key: "guide", label: "Guide", icon: Compass, accent: "lavender" },
  { key: "log", label: "Logbook", icon: BookOpen, accent: "mint" },
];

const ACCENTS = {
  blue: { soft: "#B2C2D2", deep: "#7C93AC", tint: "#EDF1F5" },
  rose: { soft: "#D6C5C5", deep: "#B98A8A", tint: "#F7F0EF" },
  sage: { soft: "#A4B8B8", deep: "#6E8886", tint: "#EBF1F0" },
  mint: { soft: "#B6E3D8", deep: "#6FAE9C", tint: "#EAF7F3" },
  lavender: { soft: "#CBC3DE", deep: "#8A7EAE", tint: "#F0EDF7" },
  neutral: { soft: "#E8E6E1", deep: "#8A7F76", tint: "#F4F1E8" },
};

const LIST_CATEGORIES = [
  { key: "packing", label: "Packing", icon: Luggage },
  { key: "moving", label: "Moving", icon: Package },
  { key: "shopping", label: "Shopping", icon: ShoppingCart },
  { key: "grocery", label: "Grocery", icon: Apple },
  { key: "closet", label: "Closet", icon: Shirt },
  { key: "general", label: "General", icon: FolderPlus },
];

const GUIDE_CATEGORIES = [
  {
    key: "packing",
    label: "Packing",
    icon: Luggage,
    listCategory: "packing",
    templates: [
      {
        title: "Business Trip (2–3 Days)",
        items: ["Laptop & charger", "Business cards", "2 dress shirts", "1 blazer", "Dress shoes", "Toiletry bag", "Phone charger", "Notebook & pen", "Presentation materials", "Travel adapter", "Umbrella", "ID / passport"],
      },
      {
        title: "Beach Vacation",
        items: ["Swimsuits", "Sunscreen", "Sunglasses", "Flip-flops", "Beach towel", "Hat", "After-sun lotion", "Light cover-up", "Waterproof phone pouch", "Snorkel gear", "Cooler bag", "Book"],
      },
      {
        title: "Winter Trip",
        items: ["Heavy coat", "Thermal layers", "Gloves", "Scarf", "Wool socks", "Snow boots", "Hand warmers", "Lip balm", "Beanie", "Travel-size lotion"],
      },
      {
        title: "Weekend Getaway",
        items: ["Change of clothes (2 days)", "Toiletries", "Phone charger", "Comfortable shoes", "Light jacket", "Snacks", "Reusable water bottle", "ID / wallet"],
      },
      {
        title: "Cruise",
        items: ["Passport", "Cruise documents & boarding pass", "Swimsuits", "Formal outfit for dinner night", "Motion sickness medication", "Reusable water bottle", "Waterproof phone pouch", "Power strip (no surge protector)", "Comfortable walking shoes", "Sunscreen", "Light jacket for evenings", "Small daypack for excursions"],
      },
      {
        title: "Hiking Trip",
        items: ["Hiking boots", "Moisture-wicking socks", "Trekking poles", "Backpack with hip belt", "Rain jacket", "Water bottle or hydration bladder", "Trail snacks", "First aid kit", "Sunscreen", "Map or GPS device", "Headlamp", "Layered clothing"],
      },
      {
        title: "Skiing Trip",
        items: ["Ski jacket", "Ski pants", "Thermal base layers", "Gloves or mittens", "Goggles", "Helmet", "Wool socks", "Neck gaiter or scarf", "Hand warmers", "Lip balm with SPF", "Skis/board, boots & poles", "Après-ski boots"],
      },
    ],
  },
  {
    key: "moving",
    label: "Moving",
    icon: Package,
    listCategory: "moving",
    templates: [
      {
        title: "Moving Day Checklist",
        items: ["Boxes & tape", "Bubble wrap", "Furniture blankets", "Label markers", "Box cutter", "Moving dolly", "Trash bags", "Cleaning supplies", "Toolkit", "Zip ties", "Snacks & water", "Phone charger"],
      },
      {
        title: "New Home Essentials Box",
        items: ["Toilet paper", "Paper towels", "Basic toolkit", "Phone chargers", "Trash bags", "Hand soap", "Light bulbs", "Bed sheets", "Coffee maker & mugs", "Snacks"],
      },
    ],
  },
  {
    key: "grocery",
    label: "Grocery",
    icon: Apple,
    listCategory: "grocery",
    templates: [
      {
        title: "Costco Run",
        items: ["Rotisserie chicken", "Bulk paper towels", "Frozen berries", "Organic eggs", "Trail mix", "Bottled water", "Olive oil", "Rice", "Paper plates", "Laundry detergent", "Coffee", "Cheese variety pack"],
      },
      {
        title: "Trader Joe's Staples",
        items: ["Everything but the Bagel seasoning", "Frozen dumplings", "Unexpected cheddar", "Mandarin orange chicken", "Cauliflower gnocchi", "Dark chocolate peanut butter cups", "Trail mix", "Sparkling water", "Hummus", "Salsa"],
      },
      {
        title: "Whole Foods Healthy Basics",
        items: ["Organic greens", "Wild salmon", "Quinoa", "Almond butter", "Greek yogurt", "Avocados", "Berries", "Chicken breast", "Olive oil", "Sweet potatoes"],
      },
      {
        title: "Weekly Basics",
        items: ["Milk", "Eggs", "Bread", "Bananas", "Chicken", "Rice", "Pasta", "Canned tomatoes", "Onions", "Garlic", "Butter", "Coffee"],
      },
      {
        title: "Walmart Run",
        items: ["Great Value pantry staples", "Rotisserie chicken", "Frozen vegetables", "Milk & eggs", "Bread", "Ground beef", "Snacks", "Paper towels", "Laundry detergent", "Toiletries", "Cereal", "Bottled water"],
      },
      {
        title: "Sam's Club Run",
        items: ["Bulk chicken breast", "Bulk paper towels & toilet paper", "Frozen berries", "Rotisserie chicken", "Bulk snacks", "Bottled water case", "Bulk eggs", "Olive oil", "Bulk rice or pasta", "Paper plates & cups", "Coffee pods", "Cheese variety pack"],
      },
    ],
  },
  {
    key: "diet",
    label: "Diet Plans",
    icon: Utensils,
    listCategory: "grocery",
    templates: [
      {
        title: "Keto Grocery List",
        items: ["Eggs", "Avocados", "Ground beef", "Chicken thighs", "Cheese", "Butter", "Heavy cream", "Leafy greens", "Broccoli", "Almonds", "Olive oil", "Salmon"],
      },
      {
        title: "Vegetarian Staples",
        items: ["Tofu", "Lentils", "Chickpeas", "Quinoa", "Greek yogurt", "Spinach", "Eggs", "Mixed nuts", "Oats", "Bell peppers", "Black beans", "Cheese"],
      },
      {
        title: "Pescatarian Staples",
        items: ["Salmon", "Shrimp", "Tuna", "Eggs", "Greek yogurt", "Quinoa", "Leafy greens", "Chickpeas", "Avocados", "Whole grain bread", "Olive oil", "Mixed berries"],
      },
      {
        title: "High-Protein Basics",
        items: ["Chicken breast", "Greek yogurt", "Cottage cheese", "Eggs", "Protein powder", "Lean ground turkey", "Salmon", "Lentils", "Almonds", "Edamame"],
      },
      {
        title: "Balanced Meal Prep",
        items: ["Brown rice", "Chicken breast", "Broccoli", "Sweet potatoes", "Mixed greens", "Olive oil", "Eggs", "Oats", "Berries", "Almond butter"],
      },
    ],
  },
  {
    key: "shopping",
    label: "Shopping",
    icon: ShoppingCart,
    listCategory: "shopping",
    templates: [
      {
        title: "New Apartment Essentials",
        items: ["Shower curtain", "Trash cans", "Cleaning supplies", "Bed sheets", "Towels", "Basic cookware", "Light bulbs", "Curtains", "Dish soap", "Laundry basket"],
      },
      {
        title: "Furniture Essentials (Empty Apartment)",
        items: ["Mattress & bed frame", "Pillows & bedding", "Couch or sofa", "Coffee table", "Dining table & chairs", "Dresser", "Nightstand", "Floor lamp", "TV stand", "Curtains & rods", "Area rug", "Trash cans"],
      },
      {
        title: "New Job Essentials",
        items: ["Laptop bag or briefcase", "Notebook & pens", "Planner or organizer", "Business casual outfits", "Comfortable work shoes", "Water bottle", "Badge holder / lanyard", "Umbrella", "Desk organizer", "Headphones", "Reusable lunch container", "Portable phone charger"],
      },
    ],
  },
];

function routineIcon(name) {
  const n = name.toLowerCase();
  if (n.includes("morning")) return Sunrise;
  if (n.includes("night") || n.includes("evening")) return Moon;
  if (n.includes("workout") || n.includes("gym") || n.includes("exercise")) return Dumbbell;
  return Repeat;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function notepadRowStyle(accent) {
  return {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "8px 12px 8px 44px",
    borderBottom: `1px solid ${ACCENTS[accent].tint}`,
    overflow: "visible",
  };
}

function normalizeResetDays(routine) {
  if (Array.isArray(routine.resetDays) && routine.resetDays.length > 0) {
    const unique = [...new Set(routine.resetDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))];
    unique.sort((a, b) => a - b);
    if (unique.length > 0) return unique;
  }
  const fallback = Number.isInteger(routine.resetDay) ? routine.resetDay : 1;
  return [fallback];
}

function toggleDayInList(days, idx) {
  const has = days.includes(idx);
  if (has) {
    const next = days.filter((d) => d !== idx);
    return next.length ? next : days;
  }
  return [...days, idx].sort((a, b) => a - b);
}

function routineScheduleText(routine) {
  const freq = routine.frequency || "daily";
  if (freq === "daily") return "Resets daily";
  const days = normalizeResetDays(routine);
  return `Resets ${days.map((d) => DOW_LABELS[d]).join(" · ")}`;
}

function routineDueForReset(routine, now, nowDow) {
  const freq = routine.frequency || "daily";
  if (routine.lastResetDate === now) return false;
  if (freq === "daily") return true;
  return normalizeResetDays(routine).includes(nowDow);
}

const DEFAULT_ROUTINES = [
  {
    id: uid(),
    name: "Morning Routine",
    items: [
      { id: uid(), text: "Make the bed", done: false },
      { id: uid(), text: "Drink a glass of water", done: false },
      { id: uid(), text: "Stretch for 5 minutes", done: false },
    ],
    lastResetDate: todayStr(),
    frequency: "daily",
    resetDay: 1,
    resetDays: [1],
  },
  {
    id: uid(),
    name: "Night Routine",
    items: [
      { id: uid(), text: "Set out clothes for tomorrow", done: false },
      { id: uid(), text: "Wash face", done: false },
      { id: uid(), text: "Lights out by 11", done: false },
    ],
    lastResetDate: todayStr(),
    frequency: "daily",
    resetDay: 1,
    resetDays: [1],
  },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("home");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [today, setToday] = useState({ date: todayStr(), items: [] });
  const [weekly, setWeekly] = useState({ date: todayStr(), resetDay: 1, items: [] });
  const [permanent, setPermanent] = useState({ items: [] });
  const [lists, setLists] = useState([]);
  const [routines, setRoutines] = useState(DEFAULT_ROUTINES);
  const [log, setLog] = useState([]);
  const [syncOpen, setSyncOpen] = useState(false);

  const cloud = useCloudSync({
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
  });

  useEffect(() => {
    (async () => {
      const [t, w, p, l, r, g] = await Promise.all([
        loadKey("kept:today", { date: todayStr(), items: [] }),
        loadKey("kept:weekly", { date: todayStr(), resetDay: 1, items: [] }),
        loadKey("kept:permanent", { items: [] }),
        loadKey("kept:lists", []),
        loadKey("kept:routines", DEFAULT_ROUTINES),
        loadKey("kept:log", []),
      ]);

      const now = todayStr();
      let newLog = [...g];

      let nextToday = t;
      if (t.date !== now) {
        if (t.items.length > 0) {
          newLog.push({
            id: uid(),
            date: t.date,
            type: "today",
            title: "Daily To-Do",
            total: t.items.length,
            completed: t.items.filter((i) => i.done).length,
            items: t.items,
            closedAt: Date.now(),
          });
        }
        // Unfinished items roll into the new day unless they were flagged
        // "today only" — those are logged above but don't carry forward.
        const carryOver = t.items
          .filter((i) => !i.done && !i.todayOnly)
          .map((i) => ({ id: uid(), text: i.text, done: false, todayOnly: false }));
        nextToday = { date: now, items: carryOver };
      }

      // The weekly checklist works the same way as Today, just on a
      // once-a-week cycle — it only resets on its chosen day of the week.
      const nowDow = new Date().getDay();
      let nextWeekly = w;
      if (w.date !== now && nowDow === (w.resetDay ?? 1)) {
        if (w.items.length > 0) {
          newLog.push({
            id: uid(),
            date: w.date,
            type: "weekly",
            title: "Weekly Checklist",
            total: w.items.length,
            completed: w.items.filter((i) => i.done).length,
            items: w.items,
            closedAt: Date.now(),
          });
        }
        const carryOver = w.items
          .filter((i) => !i.done && !i.weekOnly)
          .map((i) => ({ id: uid(), text: i.text, done: false, weekOnly: false }));
        nextWeekly = { date: now, resetDay: w.resetDay ?? 1, items: carryOver };
      }

      // Routines just reset their checkmarks — they are kept, not dated,
      // and only reach the Logbook if the person archives one. Daily
      // routines reset any new day; weekly ones reset on each selected
      // weekday, at most once per calendar day.
      const nextRoutines = r.map((routine) => {
        const days = normalizeResetDays(routine);
        const migrated = { ...routine, resetDays: days, resetDay: days[0] };
        if (routineDueForReset(migrated, now, nowDow)) {
          return {
            ...migrated,
            items: migrated.items.map((i) => ({ ...i, done: false })),
            lastResetDate: now,
          };
        }
        return migrated;
      });

      const nextPermanent = p && Array.isArray(p.items) ? p : { items: [] };

      setToday(nextToday);
      setWeekly(nextWeekly);
      setPermanent(nextPermanent);
      setLists(l);
      setRoutines(nextRoutines);
      setLog(newLog);
      setReady(true);

      saveKey("kept:today", nextToday);
      saveKey("kept:weekly", nextWeekly);
      saveKey("kept:permanent", nextPermanent);
      saveKey("kept:routines", nextRoutines);
      if (newLog.length !== g.length) saveKey("kept:log", newLog);
    })();
  }, []);

  const skipFirst = useRef({ today: true, weekly: true, permanent: true, lists: true, routines: true, log: true });
  useEffect(() => {
    if (!ready) return;
    if (skipFirst.current.today) { skipFirst.current.today = false; return; }
    saveKey("kept:today", today);
  }, [today, ready]);
  useEffect(() => {
    if (!ready) return;
    if (skipFirst.current.weekly) { skipFirst.current.weekly = false; return; }
    saveKey("kept:weekly", weekly);
  }, [weekly, ready]);
  useEffect(() => {
    if (!ready) return;
    if (skipFirst.current.permanent) { skipFirst.current.permanent = false; return; }
    saveKey("kept:permanent", permanent);
  }, [permanent, ready]);
  useEffect(() => {
    if (!ready) return;
    if (skipFirst.current.lists) { skipFirst.current.lists = false; return; }
    saveKey("kept:lists", lists);
  }, [lists, ready]);
  useEffect(() => {
    if (!ready) return;
    if (skipFirst.current.routines) { skipFirst.current.routines = false; return; }
    saveKey("kept:routines", routines);
  }, [routines, ready]);
  useEffect(() => {
    if (!ready) return;
    if (skipFirst.current.log) { skipFirst.current.log = false; return; }
    saveKey("kept:log", log);
  }, [log, ready]);

  /* ---------------- today actions ---------------- */
  const addTodayItem = (text) => {
    if (!text.trim()) return;
    setToday((t) => ({ ...t, items: [...t.items, { id: uid(), text: text.trim(), done: false, todayOnly: false }] }));
  };
  const toggleTodayItem = (id) => {
    setToday((t) => ({ ...t, items: t.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
  };
  const toggleTodayItemFlag = (id) => {
    setToday((t) => ({ ...t, items: t.items.map((i) => (i.id === id ? { ...i, todayOnly: !i.todayOnly } : i)) }));
  };
  const deleteTodayItem = (id) => {
    setToday((t) => ({ ...t, items: t.items.filter((i) => i.id !== id) }));
  };
  const editTodayItemText = (id, text) => {
    setToday((t) => ({ ...t, items: t.items.map((i) => (i.id === id ? { ...i, text } : i)) }));
  };
  const archiveToday = () => {
    if (today.items.length === 0) return;
    setLog((g) => [
      {
        id: uid(),
        date: today.date,
        type: "today",
        title: "Daily To-Do",
        total: today.items.length,
        completed: today.items.filter((i) => i.done).length,
        items: today.items,
        closedAt: Date.now(),
      },
      ...g,
    ]);
    const carryOver = today.items
      .filter((i) => !i.done && !i.todayOnly)
      .map((i) => ({ id: uid(), text: i.text, done: false, todayOnly: false }));
    setToday({ date: todayStr(), items: carryOver });
  };
  const bulkAddTodayItems = (text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setToday((t) => ({ ...t, items: [...t.items, ...lines.map((l) => ({ id: uid(), text: l, done: false, todayOnly: false }))] }));
  };

  /* ---------------- weekly checklist actions ---------------- */
  const addWeeklyItem = (text) => {
    if (!text.trim()) return;
    setWeekly((w) => ({ ...w, items: [...w.items, { id: uid(), text: text.trim(), done: false, weekOnly: false }] }));
  };
  const toggleWeeklyItem = (id) => {
    setWeekly((w) => ({ ...w, items: w.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
  };
  const toggleWeeklyItemFlag = (id) => {
    setWeekly((w) => ({ ...w, items: w.items.map((i) => (i.id === id ? { ...i, weekOnly: !i.weekOnly } : i)) }));
  };
  const deleteWeeklyItem = (id) => {
    setWeekly((w) => ({ ...w, items: w.items.filter((i) => i.id !== id) }));
  };
  const editWeeklyItemText = (id, text) => {
    setWeekly((w) => ({ ...w, items: w.items.map((i) => (i.id === id ? { ...i, text } : i)) }));
  };
  const archiveWeekly = () => {
    if (weekly.items.length === 0) return;
    setLog((g) => [
      {
        id: uid(),
        date: weekly.date,
        type: "weekly",
        title: "Weekly Checklist",
        total: weekly.items.length,
        completed: weekly.items.filter((i) => i.done).length,
        items: weekly.items,
        closedAt: Date.now(),
      },
      ...g,
    ]);
    const carryOver = weekly.items
      .filter((i) => !i.done && !i.weekOnly)
      .map((i) => ({ id: uid(), text: i.text, done: false, weekOnly: false }));
    setWeekly((w) => ({ date: todayStr(), resetDay: w.resetDay ?? 1, items: carryOver }));
  };
  const bulkAddWeeklyItems = (text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setWeekly((w) => ({ ...w, items: [...w.items, ...lines.map((l) => ({ id: uid(), text: l, done: false, weekOnly: false }))] }));
  };
  const editWeeklyResetDay = (day) => {
    setWeekly((w) => ({ ...w, resetDay: day }));
  };

  /* ---------------- permanent checklist actions ---------------- */
  const addPermanentItem = (text) => {
    if (!text.trim()) return;
    setPermanent((p) => ({ ...p, items: [...p.items, { id: uid(), text: text.trim(), done: false }] }));
  };
  const togglePermanentItem = (id) => {
    setPermanent((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
  };
  const deletePermanentItem = (id) => {
    setPermanent((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));
  };
  const editPermanentItemText = (id, text) => {
    setPermanent((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, text } : i)) }));
  };
  const archivePermanent = () => {
    if (permanent.items.length === 0) return;
    setLog((g) => [
      {
        id: uid(),
        date: todayStr(),
        type: "permanent",
        title: "Permanent Checklist",
        total: permanent.items.length,
        completed: permanent.items.filter((i) => i.done).length,
        items: permanent.items,
        closedAt: Date.now(),
      },
      ...g,
    ]);
  };
  const bulkAddPermanentItems = (text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setPermanent((p) => ({ ...p, items: [...p.items, ...lines.map((l) => ({ id: uid(), text: l, done: false }))] }));
  };

  /* ---------------- list actions ---------------- */
  const createList = (name, category) => {
    if (!name.trim()) return;
    setLists((ls) => [{ id: uid(), name: name.trim(), category, items: [], createdAt: Date.now() }, ...ls]);
  };
  const createListFromTemplate = (name, category, itemTexts) => {
    const newList = {
      id: uid(),
      name,
      category,
      items: (itemTexts || []).filter((t) => t && t.trim()).map((t) => ({ id: uid(), text: t.trim(), done: false })),
      createdAt: Date.now(),
    };
    setLists((ls) => [newList, ...ls]);
  };
  const addListItem = (listId, text) => {
    if (!text.trim()) return;
    setLists((ls) => ls.map((l) => (l.id === listId ? { ...l, items: [...l.items, { id: uid(), text: text.trim(), done: false }] } : l)));
  };
  const bulkAddListItems = (listId, text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setLists((ls) => ls.map((l) => (l.id === listId ? { ...l, items: [...l.items, ...lines.map((t) => ({ id: uid(), text: t, done: false }))] } : l)));
  };
  const toggleListItem = (listId, itemId) => {
    setLists((ls) => ls.map((l) => (l.id === listId ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) } : l)));
  };
  const deleteListItem = (listId, itemId) => {
    setLists((ls) => ls.map((l) => (l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l)));
  };
  const editListItemText = (listId, itemId, text) => {
    setLists((ls) => ls.map((l) => (l.id === listId ? { ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, text } : i)) } : l)));
  };
  const duplicateList = (listId) => {
    const l = lists.find((x) => x.id === listId);
    if (!l) return;
    const copy = {
      id: uid(),
      name: `${l.name} Copy`,
      category: l.category,
      items: l.items.map((i) => ({ id: uid(), text: i.text, done: false })),
      createdAt: Date.now(),
    };
    setLists((ls) => [copy, ...ls]);
  };
  const deleteList = (listId) => setLists((ls) => ls.filter((l) => l.id !== listId));
  const archiveList = (listId) => {
    const l = lists.find((x) => x.id === listId);
    if (!l) return;
    setLog((g) => [
      {
        id: uid(),
        date: todayStr(),
        type: "list",
        title: l.name,
        total: l.items.length,
        completed: l.items.filter((i) => i.done).length,
        items: l.items,
        closedAt: Date.now(),
      },
      ...g,
    ]);
    setLists((ls) => ls.filter((x) => x.id !== listId));
  };

  /* ---------------- routine actions ---------------- */
  const createRoutine = (name, frequency = "daily", resetDays = [1]) => {
    if (!name.trim()) return;
    const days = Array.isArray(resetDays) && resetDays.length ? resetDays : [1];
    setRoutines((rs) => [
      ...rs,
      {
        id: uid(),
        name: name.trim(),
        items: [],
        lastResetDate: todayStr(),
        frequency,
        resetDays: days,
        resetDay: days[0],
      },
    ]);
  };
  const editRoutineSchedule = (routineId, frequency, resetDays) => {
    const days = Array.isArray(resetDays) && resetDays.length ? resetDays : [1];
    setRoutines((rs) =>
      rs.map((r) => (r.id === routineId ? { ...r, frequency, resetDays: days, resetDay: days[0] } : r))
    );
  };
  const addRoutineItem = (routineId, text) => {
    if (!text.trim()) return;
    setRoutines((rs) => rs.map((r) => (r.id === routineId ? { ...r, items: [...r.items, { id: uid(), text: text.trim(), done: false }] } : r)));
  };
  const bulkAddRoutineItems = (routineId, text) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setRoutines((rs) => rs.map((r) => (r.id === routineId ? { ...r, items: [...r.items, ...lines.map((t) => ({ id: uid(), text: t, done: false }))] } : r)));
  };
  const toggleRoutineItem = (routineId, itemId) => {
    setRoutines((rs) => rs.map((r) => (r.id === routineId ? { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) } : r)));
  };
  const deleteRoutineItem = (routineId, itemId) => {
    setRoutines((rs) => rs.map((r) => (r.id === routineId ? { ...r, items: r.items.filter((i) => i.id !== itemId) } : r)));
  };
  const editRoutineItemText = (routineId, itemId, text) => {
    setRoutines((rs) => rs.map((r) => (r.id === routineId ? { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, text } : i)) } : r)));
  };
  const deleteRoutine = (routineId) => setRoutines((rs) => rs.filter((r) => r.id !== routineId));
  const archiveRoutine = (routineId) => {
    const r = routines.find((x) => x.id === routineId);
    if (!r) return;
    setLog((g) => [
      {
        id: uid(),
        date: todayStr(),
        type: "routine",
        title: r.name,
        total: r.items.length,
        completed: r.items.filter((i) => i.done).length,
        items: r.items,
        closedAt: Date.now(),
      },
      ...g,
    ]);
    setRoutines((rs) => rs.map((x) => (x.id === routineId ? { ...x, items: x.items.map((i) => ({ ...i, done: false })) } : x)));
  };

  const currentAccent = SECTIONS.find((s) => s.key === view)?.accent || "neutral";

  if (!ready) {
    return (
      <div style={{ ...styles.appShell, alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div style={{ fontFamily: "var(--font-label)", color: "var(--ink)", letterSpacing: "0.06em", fontSize: 13 }}>
          Opening Kept…
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appShell}>
      <GlobalStyles />

      {view !== "home" && (
        <button
          onClick={() => { setView("home"); setDrawerOpen(false); }}
          aria-label="Go home"
          style={styles.homeButton}
        >
          <Home size={18} color="var(--ink)" strokeWidth={2.25} />
        </button>
      )}

      <EdgeTab
        open={drawerOpen}
        onToggle={() => setDrawerOpen((o) => !o)}
        accent={currentAccent}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        view={view}
        onSelect={(k) => { setView(k); setDrawerOpen(false); }}
        todayCount={today.items.filter((i) => !i.done).length}
      />

      <div style={styles.page}>
        {view === "home" && (
          <HomeView
            setView={setView}
            today={today}
            lists={lists}
            routines={routines}
            log={log}
            cloud={cloud}
            onOpenSync={() => setSyncOpen(true)}
          />
        )}
        {view === "today" && (
          <TodayView
            today={today}
            addTodayItem={addTodayItem}
            toggleTodayItem={toggleTodayItem}
            toggleTodayItemFlag={toggleTodayItemFlag}
            deleteTodayItem={deleteTodayItem}
            editTodayItemText={editTodayItemText}
            archiveToday={archiveToday}
            bulkAddTodayItems={bulkAddTodayItems}
            weekly={weekly}
            addWeeklyItem={addWeeklyItem}
            toggleWeeklyItem={toggleWeeklyItem}
            toggleWeeklyItemFlag={toggleWeeklyItemFlag}
            deleteWeeklyItem={deleteWeeklyItem}
            editWeeklyItemText={editWeeklyItemText}
            archiveWeekly={archiveWeekly}
            bulkAddWeeklyItems={bulkAddWeeklyItems}
            editWeeklyResetDay={editWeeklyResetDay}
            permanent={permanent}
            addPermanentItem={addPermanentItem}
            togglePermanentItem={togglePermanentItem}
            deletePermanentItem={deletePermanentItem}
            editPermanentItemText={editPermanentItemText}
            archivePermanent={archivePermanent}
            bulkAddPermanentItems={bulkAddPermanentItems}
          />
        )}
        {view === "lists" && (
          <ListsView
            lists={lists}
            createList={createList}
            addListItem={addListItem}
            bulkAddListItems={bulkAddListItems}
            toggleListItem={toggleListItem}
            deleteListItem={deleteListItem}
            editListItemText={editListItemText}
            deleteList={deleteList}
            archiveList={archiveList}
            duplicateList={duplicateList}
          />
        )}
        {view === "routines" && (
          <RoutinesView
            routines={routines}
            createRoutine={createRoutine}
            addRoutineItem={addRoutineItem}
            bulkAddRoutineItems={bulkAddRoutineItems}
            toggleRoutineItem={toggleRoutineItem}
            deleteRoutineItem={deleteRoutineItem}
            editRoutineItemText={editRoutineItemText}
            deleteRoutine={deleteRoutine}
            archiveRoutine={archiveRoutine}
            editRoutineSchedule={editRoutineSchedule}
          />
        )}
        {view === "guide" && (
          <GuideView createListFromTemplate={createListFromTemplate} setView={setView} />
        )}
        {view === "log" && <LogView log={log} />}
      </div>

      <SyncModal open={syncOpen} onClose={() => setSyncOpen(false)} cloud={cloud} />
    </div>
  );
}

/* ================= Global styles ================= */

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

      :root {
        --bg: #E8E6E1;
        --card: #FBF9F4;
        --tint: #F4F1E8;
        --line: #DCD6C9;
        --ink: #443E3A;
        --ink-soft: #8A7F76;
        --font-label: 'Quicksand', ui-sans-serif, sans-serif;
        --font-body: 'Inter', ui-sans-serif, sans-serif;
      }
      html, body, #root { height: 100%; margin: 0; background: var(--bg); }
      body { overscroll-behavior: none; }
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      button { font-family: inherit; cursor: pointer; }
      input, textarea { font-family: inherit; font-size: 16px; }
    `}</style>
  );
}

const styles = {
  appShell: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    width: "100%",
    background: "var(--bg)",
    color: "var(--ink)",
    fontFamily: "var(--font-body)",
    position: "relative",
    overflowX: "hidden",
  },
  page: {
    flex: 1,
    padding: "calc(env(safe-area-inset-top, 0px) + 34px) 18px 60px",
    maxWidth: 430,
    margin: "0 auto",
    width: "100%",
  },
  homeButton: {
    position: "fixed",
    top: "calc(env(safe-area-inset-top, 0px) + 22px)",
    left: 16,
    zIndex: 30,
    width: 38,
    height: 38,
    borderRadius: 19,
    border: "none",
    background: "var(--card)",
    boxShadow: "0 2px 8px rgba(68,62,58,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

/* ================= Edge tab + drawer ================= */

function EdgeTab({ open, onToggle, accent }) {
  const c = ACCENTS[accent] || ACCENTS.neutral;
  return (
    <button
      onClick={onToggle}
      aria-label={open ? "Close navigation" : "Open navigation"}
      style={{
        position: "fixed",
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 41,
        width: 34,
        height: 76,
        border: "none",
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        background: c.deep,
        boxShadow: "-2px 3px 10px rgba(68,62,58,0.22)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.2s ease",
      }}
    >
      {open ? (
        <ChevronRight size={18} color="#FBF9F4" strokeWidth={2.5} />
      ) : (
        <ChevronLeft size={18} color="#FBF9F4" strokeWidth={2.5} />
      )}
    </button>
  );
}

function Drawer({ open, onClose, view, onSelect, todayCount }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(68,62,58,0.28)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
          zIndex: 39,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "min(78%, 300px)",
          background: "var(--card)",
          boxShadow: "-6px 0 24px rgba(68,62,58,0.2)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(.4,0,.2,1)",
          zIndex: 40,
          padding: "calc(env(safe-area-inset-top, 0px) + 34px) 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-label)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
            marginBottom: 6,
            paddingLeft: 4,
          }}
        >
          Go to
        </div>
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const c = ACCENTS[s.accent];
          const active = view === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onSelect(s.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 14px",
                borderRadius: 14,
                border: "none",
                background: active ? c.tint : "transparent",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: c.soft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color="#443E3A" strokeWidth={2.25} />
              </div>
              <span style={{ flex: 1, fontFamily: "var(--font-label)", fontSize: 15.5, fontWeight: 600 }}>
                {s.label}
              </span>
              {s.key === "today" && todayCount > 0 && (
                <span
                  style={{
                    fontFamily: "var(--font-label)",
                    fontSize: 11,
                    fontWeight: 700,
                    background: c.deep,
                    color: "#FBF9F4",
                    borderRadius: 10,
                    padding: "2px 7px",
                  }}
                >
                  {todayCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ================= Shared bits ================= */

function SectionHeader({ eyebrow, title, accent }) {
  const c = ACCENTS[accent];
  return (
    <div style={{ marginBottom: 18, paddingTop: 6 }}>
      <div
        style={{
          fontFamily: "var(--font-label)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: c.deep,
          marginBottom: 4,
        }}
      >
        {eyebrow}
      </div>
      <h1 style={{ fontFamily: "var(--font-label)", fontSize: 26, fontWeight: 700, margin: 0, color: "var(--ink)" }}>
        {title}
      </h1>
    </div>
  );
}

function Checkbox({ done, onClick, accent }) {
  const c = ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      style={{
        width: 24,
        height: 24,
        flexShrink: 0,
        border: `2px solid ${done ? c.deep : "#D3CCC2"}`,
        borderRadius: 8,
        background: done ? c.deep : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s ease",
      }}
    >
      {done && <Check size={15} color="#FBF9F4" strokeWidth={3} />}
    </button>
  );
}

function TextRow({ text, done, onToggle, onDelete, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 2px" }}>
      <Checkbox done={done} onClick={onToggle} accent={accent} />
      <span
        style={{
          flex: 1,
          fontSize: 15.5,
          color: done ? "var(--ink-soft)" : "var(--ink)",
          textDecoration: done ? "line-through" : "none",
        }}
      >
        {text}
      </span>
      {onDelete && (
        <button onClick={onDelete} aria-label="Delete item" style={{ border: "none", background: "none", color: "#C7BFB4", padding: 4 }}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}

function AddRow({ placeholder, onAdd, accent, buttonLabel }) {
  const [val, setVal] = useState("");
  const submit = () => {
    if (!val.trim()) return;
    onAdd(val);
    setVal("");
  };
  const c = ACCENTS[accent];
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "11px 13px",
          border: "1px solid var(--line)",
          borderRadius: 12,
          background: "#fff",
          fontSize: 16,
          fontFamily: "var(--font-body)",
          color: "var(--ink)",
        }}
      />
      <button
        onClick={submit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 15px",
          border: "none",
          borderRadius: 12,
          background: c.deep,
          color: "#FBF9F4",
          fontFamily: "var(--font-label)",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <Plus size={15} /> {buttonLabel || "Add"}
      </button>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 2px 10px rgba(68,62,58,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ArchiveButton({ onClick, accent, label }) {
  const c = ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "none",
        background: c.tint,
        color: c.deep,
        borderRadius: 10,
        padding: "9px 14px",
        fontFamily: "var(--font-label)",
        fontSize: 12.5,
        fontWeight: 700,
      }}
    >
      <Archive size={14} /> {label || "Archive"}
    </button>
  );
}

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function ClockReadout() {
  const time = useClock();
  const hh = time.getHours() % 12 || 12;
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontFamily: "var(--font-label)", fontSize: 22, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>
        {hh}:{mm}
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>:{ss}</span>
      </div>
      <div style={{ fontFamily: "var(--font-label)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink-soft)", marginTop: 2 }}>
        {ampm}
      </div>
    </div>
  );
}

/* ================= Home ================= */

function HomeView({ setView, today, lists, routines, log, cloud, onOpenSync }) {
  const doneToday = today.items.filter((i) => i.done).length;
  const totalToday = today.items.length;
  const tiles = [
    {
      key: "today",
      icon: ListChecks,
      accent: "blue",
      title: "Today",
      desc: "Daily, weekly, and a permanent list that stays until you change it. Archive snapshots into the logbook.",
      stat: totalToday ? `${doneToday}/${totalToday} done` : "Nothing added yet",
    },
    {
      key: "lists",
      icon: FolderPlus,
      accent: "rose",
      title: "Lists",
      desc: "Packing lists, moving lists, anything with its own set of items to organize.",
      stat: `${lists.length} active list${lists.length === 1 ? "" : "s"}`,
    },
    {
      key: "routines",
      icon: Repeat,
      accent: "sage",
      title: "Routines",
      desc: "Morning, night, workout — checklists that reset on the days you pick but keep their steps until you edit them.",
      stat: `${routines.length} routine${routines.length === 1 ? "" : "s"}`,
    },
    {
      key: "guide",
      icon: Compass,
      accent: "lavender",
      title: "Guide",
      desc: "Starter lists for packing, moving, groceries, and more — add one straight to Lists.",
      stat: "Browse",
    },
    {
      key: "log",
      icon: BookOpen,
      accent: "mint",
      title: "Logbook",
      desc: "Everything you've archived — a dated record you can look back through.",
      stat: `${log.length} entr${log.length === 1 ? "y" : "ies"}`,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 22, paddingTop: 6, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-label)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: 4,
            }}
          >
            {prettyDate(todayStr())}
          </div>
          <h1 style={{ fontFamily: "var(--font-label)", fontSize: 30, fontWeight: 700, margin: 0 }}>Kept</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14.5, lineHeight: 1.55, margin: "8px 0 0" }}>
            One place for today's list, your project lists, routines that hold steady, and everything
            you've finished.
          </p>
        </div>
        <ClockReadout />
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {tiles.map((t) => {
          const Icon = t.icon;
          const c = ACCENTS[t.accent];
          return (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              style={{
                textAlign: "left",
                display: "flex",
                gap: 13,
                alignItems: "flex-start",
                background: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "15px 16px",
                boxShadow: "0 2px 10px rgba(68,62,58,0.06)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: c.soft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} color="#443E3A" strokeWidth={2.1} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-label)", fontSize: 16.5, fontWeight: 700 }}>{t.title}</span>
                  <span style={{ fontFamily: "var(--font-label)", fontSize: 11, fontWeight: 700, color: c.deep }}>{t.stat}</span>
                </div>
                <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.5 }}>{t.desc}</p>
              </div>
              <ChevronRight size={17} color="#C7BFB4" style={{ marginTop: 5 }} />
            </button>
          );
        })}
        <button
          onClick={onOpenSync}
          style={{
            textAlign: "left",
            display: "flex",
            gap: 13,
            alignItems: "center",
            background: "var(--card)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: "15px 16px",
            boxShadow: "0 2px 10px rgba(68,62,58,0.06)",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: ACCENTS.blue.soft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Cloud size={18} color="#443E3A" strokeWidth={2.1} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: 16.5, fontWeight: 700 }}>
                {cloud?.user ? "Linked" : "Link devices"}
              </span>
              <span style={{ fontFamily: "var(--font-label)", fontSize: 11, fontWeight: 700, color: ACCENTS.blue.deep }}>
                {cloud?.user ? "Synced" : "Sign in"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.5 }}>
              {cloud?.user
                ? `Signed in as ${cloud.user.email}. Lists follow you to every device.`
                : "Use your Grand Library email so phone, iPad, and computer stay in step."}
            </p>
          </div>
          <ChevronRight size={17} color="#C7BFB4" />
        </button>
      </div>
    </div>
  );
}

function SpiralStrip({ accent }) {
  const c = ACCENTS[accent];
  const holes = new Array(11).fill(0);
  return (
    <div
      style={{
        height: 24,
        background: c.deep,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 10px",
      }}
    >
      {holes.map((_, i) => (
        <div
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "var(--bg)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
          }}
        />
      ))}
    </div>
  );
}

function NotepadEmptyHint({ accent }) {
  return (
    <div style={notepadRowStyle(accent)}>
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          lineHeight: 1.4,
          color: "var(--ink-soft)",
          fontStyle: "italic",
          overflowWrap: "anywhere",
        }}
      >
        Nothing here yet — start writing below.
      </span>
    </div>
  );
}

function NotepadLineRow({ text, done, onToggle, onDelete, onEdit, accent, flagged, onToggleFlag }) {
  const c = ACCENTS[accent];
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(text);
  const editRef = useRef(null);

  useEffect(() => {
    if (!editing) setVal(text);
  }, [text, editing]);

  useEffect(() => {
    if (!editing || !editRef.current) return;
    const el = editRef.current;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, val]);

  const commit = () => {
    setEditing(false);
    const trimmed = val.trim();
    if (trimmed && trimmed !== text) {
      onEdit && onEdit(trimmed);
    } else {
      setVal(text);
    }
  };

  const controlNudge = { marginTop: 1, flexShrink: 0 };

  return (
    <div style={notepadRowStyle(accent)}>
      <button
        onClick={onToggle}
        aria-label={done ? "Mark as not done" : "Mark as done"}
        style={{
          width: 19,
          height: 19,
          flexShrink: 0,
          marginTop: 1.5,
          border: `2px solid ${done ? c.deep : "#C9BFAF"}`,
          borderRadius: 6,
          background: done ? c.deep : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done && <Check size={12} color="#FBF9F4" strokeWidth={3} />}
      </button>
      {editing ? (
        <textarea
          ref={editRef}
          autoFocus
          rows={1}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") { setVal(text); setEditing(false); }
          }}
          onBlur={commit}
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-body)",
            fontSize: 16,
            lineHeight: 1.4,
            color: "var(--ink)",
            padding: 0,
            margin: 0,
            resize: "none",
            overflow: "hidden",
            display: "block",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <span
          onClick={() => onEdit && setEditing(true)}
          style={{
            flex: 1,
            minWidth: 0,
            display: "block",
            fontFamily: "var(--font-body)",
            fontSize: 16,
            lineHeight: 1.4,
            color: done ? "var(--ink-soft)" : "var(--ink)",
            textDecoration: done ? "line-through" : "none",
            cursor: onEdit ? "text" : "default",
            overflow: "visible",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </span>
      )}
      {onToggleFlag && (
        <button
          onClick={onToggleFlag}
          aria-label={flagged ? "Unmark as today-only" : "Mark as today-only (won't carry over)"}
          title={flagged ? "Today-only — won't carry over if unfinished" : "Mark as today-only"}
          style={{ border: "none", background: "none", color: flagged ? c.deep : "#D3CCC2", padding: 4, ...controlNudge }}
        >
          <Pin size={14} fill={flagged ? c.deep : "none"} />
        </button>
      )}
      <button onClick={onDelete} aria-label="Delete item" style={{ border: "none", background: "none", color: "#C7BFB4", padding: 4, ...controlNudge }}>
        <X size={14} />
      </button>
    </div>
  );
}

function NotepadAddLine({ placeholder, onAdd, accent }) {
  const [val, setVal] = useState("");
  const c = ACCENTS[accent];
  const submit = () => {
    if (!val.trim()) return;
    onAdd(val);
    setVal("");
  };
  return (
    <div style={{ ...notepadRowStyle(accent), alignItems: "center" }}>
      <Plus size={16} color={c.deep} style={{ flexShrink: 0 }} />
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        onBlur={submit}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "var(--font-body)",
          fontSize: 16,
          lineHeight: 1.4,
          color: "var(--ink)",
          padding: 0,
        }}
      />
    </div>
  );
}

function Notepad({ accent, children }) {
  return (
    <div
      style={{
        background: "#FFFEFA",
        borderRadius: "6px 6px 18px 18px",
        boxShadow: "0 4px 16px rgba(68,62,58,0.12)",
        overflow: "hidden",
        border: "1px solid var(--line)",
      }}
    >
      <SpiralStrip accent={accent} />
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 30, width: 2, background: "rgba(185,138,138,0.35)" }} />
        {children}
      </div>
    </div>
  );
}

function BulkAddPanel({ accent, onAdd, placeholder }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const c = ACCENTS[accent];
  const submit = () => {
    onAdd(val);
    setVal("");
    setOpen(false);
  };
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "none",
          background: "transparent",
          color: c.deep,
          fontFamily: "var(--font-label)",
          fontSize: 12.5,
          fontWeight: 700,
          padding: "4px 2px",
        }}
      >
        <FolderPlus size={13} /> Paste a whole list
      </button>
    );
  }
  return (
    <div style={{ marginTop: 10, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 12 }}>
      <textarea
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder || "One item per line…"}
        rows={5}
        style={{
          width: "100%",
          border: "1px solid var(--line)",
          borderRadius: 10,
          padding: "10px 12px",
          fontFamily: "var(--font-body)",
          fontSize: 16,
          color: "var(--ink)",
          background: "#fff",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
        <button
          onClick={() => { setOpen(false); setVal(""); }}
          style={{ border: "none", background: "var(--tint)", color: "var(--ink-soft)", borderRadius: 10, padding: "8px 13px", fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 700 }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          style={{ border: "none", background: c.deep, color: "#FBF9F4", borderRadius: 10, padding: "8px 13px", fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 700 }}
        >
          Add all
        </button>
      </div>
    </div>
  );
}

/* ================= Today ================= */

function TodayView({
  today,
  addTodayItem,
  toggleTodayItem,
  toggleTodayItemFlag,
  deleteTodayItem,
  editTodayItemText,
  archiveToday,
  bulkAddTodayItems,
  weekly,
  addWeeklyItem,
  toggleWeeklyItem,
  toggleWeeklyItemFlag,
  deleteWeeklyItem,
  editWeeklyItemText,
  archiveWeekly,
  bulkAddWeeklyItems,
  editWeeklyResetDay,
  permanent,
  addPermanentItem,
  togglePermanentItem,
  deletePermanentItem,
  editPermanentItemText,
  archivePermanent,
  bulkAddPermanentItems,
}) {
  const [mode, setMode] = useState("daily");
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  const total = today.items.length;
  const done = today.items.filter((i) => i.done).length;
  const wTotal = weekly.items.length;
  const wDone = weekly.items.filter((i) => i.done).length;
  const pTotal = permanent.items.length;
  const pDone = permanent.items.filter((i) => i.done).length;

  const header =
    mode === "daily"
      ? { eyebrow: prettyDate(today.date), title: "Today's List" }
      : mode === "weekly"
        ? { eyebrow: "This week", title: "Weekly Checklist" }
        : { eyebrow: "Always on", title: "Permanent List" };

  return (
    <div>
      <SectionHeader eyebrow={header.eyebrow} title={header.title} accent="blue" />

      <div style={{ display: "flex", gap: 5, marginTop: -10, marginBottom: 16 }}>
        {[{ key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" }, { key: "permanent", label: "Permanent" }].map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            style={{
              flex: 1,
              minWidth: 0,
              border: "none",
              borderRadius: 10,
              padding: "8px 4px",
              background: mode === m.key ? ACCENTS.blue.deep : "var(--tint)",
              color: mode === m.key ? "#FBF9F4" : "var(--ink-soft)",
              fontFamily: "var(--font-label)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "daily" && (
        <>
          <Notepad accent="blue">
            {today.items.length === 0 && <NotepadEmptyHint accent="blue" />}
            {today.items.map((item) => (
              <NotepadLineRow
                key={item.id}
                text={item.text}
                done={item.done}
                accent="blue"
                onToggle={() => toggleTodayItem(item.id)}
                onDelete={() => deleteTodayItem(item.id)}
                onEdit={(t) => editTodayItemText(item.id, t)}
                flagged={item.todayOnly}
                onToggleFlag={() => toggleTodayItemFlag(item.id)}
              />
            ))}
            <NotepadAddLine placeholder="Add a task…" onAdd={addTodayItem} accent="blue" />
          </Notepad>

          <BulkAddPanel accent="blue" onAdd={bulkAddTodayItems} placeholder={"One task per line…\ne.g.\nCall the dentist\nPick up dry cleaning\nEmail Sam"} />

          {total > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
                {done}/{total} done
              </span>
              <ArchiveButton onClick={archiveToday} accent="blue" label="Archive" />
            </div>
          )}
          <p style={{ color: "var(--ink-soft)", fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
            Unfinished tasks automatically carry into tomorrow's list. Tap the pin on a task to mark
            it today-only — if it's still unchecked at day's end, it gets logged but won't carry
            forward. Archiving does the same thing on demand, and it also happens automatically the
            next time you open Kept on a new day.
          </p>
        </>
      )}

      {mode === "weekly" && (
        <>
          <button
            onClick={() => setDayPickerOpen((o) => !o)}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              marginBottom: 10,
              fontFamily: "var(--font-label)",
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--ink-soft)",
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textUnderlineOffset: 3,
            }}
          >
            Resets every {DOW_LABELS[weekly.resetDay ?? 1]}
          </button>
          {dayPickerOpen && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {DOW_LABELS.map((label, idx) => (
                <button
                  key={label}
                  onClick={() => { editWeeklyResetDay(idx); setDayPickerOpen(false); }}
                  style={{
                    flex: "1 0 12%",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 4px",
                    background: (weekly.resetDay ?? 1) === idx ? ACCENTS.blue.deep : "var(--tint)",
                    color: (weekly.resetDay ?? 1) === idx ? "#FBF9F4" : "var(--ink-soft)",
                    fontFamily: "var(--font-label)",
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <Notepad accent="blue">
            {weekly.items.length === 0 && <NotepadEmptyHint accent="blue" />}
            {weekly.items.map((item) => (
              <NotepadLineRow
                key={item.id}
                text={item.text}
                done={item.done}
                accent="blue"
                onToggle={() => toggleWeeklyItem(item.id)}
                onDelete={() => deleteWeeklyItem(item.id)}
                onEdit={(t) => editWeeklyItemText(item.id, t)}
                flagged={item.weekOnly}
                onToggleFlag={() => toggleWeeklyItemFlag(item.id)}
              />
            ))}
            <NotepadAddLine placeholder="Add a task…" onAdd={addWeeklyItem} accent="blue" />
          </Notepad>

          <BulkAddPanel accent="blue" onAdd={bulkAddWeeklyItems} placeholder={"One task per line…\ne.g.\nFinish quarterly report\nSchedule 1:1s\nOrder office supplies"} />

          {wTotal > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
                {wDone}/{wTotal} done
              </span>
              <ArchiveButton onClick={archiveWeekly} accent="blue" label="Archive" />
            </div>
          )}
          <p style={{ color: "var(--ink-soft)", fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
            Works just like the daily list, but it only resets once a week, on the day you pick
            above. Unfinished tasks carry into next week unless you pin them as this-week-only.
          </p>
        </>
      )}

      {mode === "permanent" && (
        <>
          <Notepad accent="blue">
            {permanent.items.length === 0 && <NotepadEmptyHint accent="blue" />}
            {permanent.items.map((item) => (
              <NotepadLineRow
                key={item.id}
                text={item.text}
                done={item.done}
                accent="blue"
                onToggle={() => togglePermanentItem(item.id)}
                onDelete={() => deletePermanentItem(item.id)}
                onEdit={(t) => editPermanentItemText(item.id, t)}
              />
            ))}
            <NotepadAddLine placeholder="Add a task…" onAdd={addPermanentItem} accent="blue" />
          </Notepad>

          <BulkAddPanel accent="blue" onAdd={bulkAddPermanentItems} placeholder={"One task per line…\ne.g.\nPassport renewal\nReplace furnace filter\nCall insurance"} />

          {pTotal > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>
                {pDone}/{pTotal} done
              </span>
              <ArchiveButton onClick={archivePermanent} accent="blue" label="Archive" />
            </div>
          )}
          <p style={{ color: "var(--ink-soft)", fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
            This list never resets on its own. Items stay until you check, uncheck, or delete them.
            Archive copies a snapshot into the Logbook without clearing the list.
          </p>
        </>
      )}
    </div>
  );
}

/* ================= Lists ================= */

function ListsView({ lists, createList, addListItem, bulkAddListItems, toggleListItem, deleteListItem, editListItemText, deleteList, archiveList, duplicateList }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("packing");
  const [openId, setOpenId] = useState(null);

  const submitNew = () => {
    if (!name.trim()) return;
    createList(name, category);
    setName("");
    setShowNew(false);
  };

  return (
    <div>
      <SectionHeader eyebrow="Organizer" title="Lists" accent="rose" />

      {lists.length === 0 && !showNew && (
        <Card style={{ textAlign: "center", color: "var(--ink-soft)" }}>
          No lists yet. Start one for a trip, a move, or anything with its own set of items.
        </Card>
      )}

      <div style={{ display: "grid", gap: 10, marginTop: lists.length ? 0 : 14 }}>
        {lists.map((l) => {
          const Icon = LIST_CATEGORIES.find((c) => c.key === l.category)?.icon || FolderPlus;
          const open = openId === l.id;
          const done = l.items.filter((i) => i.done).length;
          return (
            <Card key={l.id} style={{ padding: 0, overflow: "hidden" }}>
              <button
                onClick={() => setOpenId(open ? null : l.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 15px", background: "transparent", border: "none", textAlign: "left" }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: ACCENTS.rose.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color="#443E3A" />
                </div>
                <span style={{ flex: 1, fontFamily: "var(--font-label)", fontWeight: 700, fontSize: 15.5 }}>{l.name}</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>{done}/{l.items.length}</span>
                {open ? <ChevronDown size={16} color="#C7BFB4" /> : <ChevronRight size={16} color="#C7BFB4" />}
              </button>
              {open && (
                <div style={{ padding: "0 15px 15px" }}>
                  <Notepad accent="rose">
                    {l.items.length === 0 && <NotepadEmptyHint accent="rose" />}
                    {l.items.map((item) => (
                      <NotepadLineRow
                        key={item.id}
                        text={item.text}
                        done={item.done}
                        accent="rose"
                        onToggle={() => toggleListItem(l.id, item.id)}
                        onDelete={() => deleteListItem(l.id, item.id)}
                        onEdit={(t) => editListItemText(l.id, item.id, t)}
                      />
                    ))}
                    <NotepadAddLine placeholder="Add an item…" onAdd={(t) => addListItem(l.id, t)} accent="rose" />
                  </Notepad>
                  <BulkAddPanel accent="rose" onAdd={(t) => bulkAddListItems(l.id, t)} placeholder={"One item per line…\ne.g.\nSunscreen\nPhone charger\nSwimsuit"} />
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    <ArchiveButton onClick={() => archiveList(l.id)} accent="rose" label="Archive" />
                    <button
                      onClick={() => duplicateList(l.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, border: "none", color: ACCENTS.rose.deep, background: ACCENTS.rose.tint, borderRadius: 10, padding: "9px 14px", fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 700 }}
                    >
                      <FolderPlus size={13} /> Duplicate
                    </button>
                    <button
                      onClick={() => deleteList(l.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, border: "none", color: "var(--ink-soft)", background: "var(--tint)", borderRadius: 10, padding: "9px 14px", fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 700 }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {showNew ? (
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {LIST_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={{
                  flex: "1 0 30%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: "9px 6px",
                  borderRadius: 10,
                  border: "none",
                  background: category === c.key ? ACCENTS.rose.deep : "var(--tint)",
                  color: category === c.key ? "#FBF9F4" : "var(--ink-soft)",
                  fontFamily: "var(--font-label)",
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                <c.icon size={13} />
                {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNew()}
              placeholder="List name, e.g. Beach Trip Packing"
              style={{ flex: 1, padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 12, fontSize: 16, fontFamily: "var(--font-body)", background: "#fff" }}
            />
            <button onClick={submitNew} style={{ padding: "0 15px", border: "none", borderRadius: 12, background: ACCENTS.rose.deep, color: "#FBF9F4", fontFamily: "var(--font-label)", fontSize: 13, fontWeight: 700 }}>
              Create
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", border: `1.5px dashed ${ACCENTS.rose.deep}`, borderRadius: 14, background: "transparent", color: ACCENTS.rose.deep, fontFamily: "var(--font-label)", fontSize: 13.5, fontWeight: 700 }}
        >
          <Plus size={16} /> New List
        </button>
      )}
    </div>
  );
}

/* ================= Routines ================= */

function DayToggleRow({ selected, onToggle, accent, filledBg }) {
  const c = ACCENTS[accent];
  const offBg = filledBg || "var(--tint)";
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {DOW_LABELS.map((label, idx) => {
        const on = selected.includes(idx);
        return (
          <button
            key={label}
            onClick={() => onToggle(idx)}
            style={{
              flex: "1 0 12%",
              border: "none",
              borderRadius: 8,
              padding: "7px 4px",
              background: on ? c.deep : offBg,
              color: on ? "#FBF9F4" : "var(--ink-soft)",
              fontFamily: "var(--font-label)",
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ScheduleLabel({ routine, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "none",
        padding: 0,
        fontFamily: "var(--font-label)",
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--ink-soft)",
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        textUnderlineOffset: 3,
      }}
    >
      {routineScheduleText(routine)}
    </button>
  );
}

function ScheduleEditor({ routine, onSave, onClose }) {
  const [freq, setFreq] = useState(routine.frequency || "daily");
  const [days, setDays] = useState(() => normalizeResetDays(routine));

  const save = (f, d) => {
    setFreq(f);
    setDays(d);
    onSave(f, d);
  };

  return (
    <div style={{ background: "var(--tint)", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: freq === "weekly" ? 8 : 0 }}>
        {["daily", "weekly"].map((f) => (
          <button
            key={f}
            onClick={() => save(f, days)}
            style={{
              flex: 1,
              border: "none",
              borderRadius: 8,
              padding: "7px 8px",
              background: freq === f ? ACCENTS.sage.deep : "#fff",
              color: freq === f ? "#FBF9F4" : "var(--ink-soft)",
              fontFamily: "var(--font-label)",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>
      {freq === "weekly" && (
        <DayToggleRow
          selected={days}
          accent="sage"
          filledBg="#fff"
          onToggle={(idx) => save("weekly", toggleDayInList(days, idx))}
        />
      )}
      <button
        onClick={onClose}
        style={{ marginTop: 8, border: "none", background: "none", color: "var(--ink-soft)", fontFamily: "var(--font-label)", fontSize: 11, fontWeight: 700, padding: 0 }}
      >
        Done
      </button>
    </div>
  );
}

function RoutinesView({ routines, createRoutine, addRoutineItem, bulkAddRoutineItems, toggleRoutineItem, deleteRoutineItem, editRoutineItemText, deleteRoutine, archiveRoutine, editRoutineSchedule }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [newFreq, setNewFreq] = useState("daily");
  const [newDays, setNewDays] = useState([1]);
  const [scheduleOpenId, setScheduleOpenId] = useState(null);

  const submitNew = () => {
    if (!name.trim()) return;
    createRoutine(name, newFreq, newDays);
    setName("");
    setNewFreq("daily");
    setNewDays([1]);
    setShowNew(false);
  };

  return (
    <div>
      <SectionHeader eyebrow="Daily or weekly" title="Routines" accent="sage" />
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: -10, marginBottom: 16, lineHeight: 1.5 }}>
        Checkboxes clear on schedule — every day, or on the weekdays you pick. Tap several days for
        something like a Tuesday/Thursday workout. The list of steps stays the same until you change it.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {routines.map((r) => {
          const Icon = routineIcon(r.name);
          const done = r.items.filter((i) => i.done).length;
          const scheduleOpen = scheduleOpenId === r.id;
          return (
            <Card key={r.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: ACCENTS.sage.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color="#443E3A" />
                </div>
                <span style={{ flex: 1, fontFamily: "var(--font-label)", fontWeight: 700, fontSize: 15.5 }}>{r.name}</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>{done}/{r.items.length}</span>
              </div>
              <div style={{ marginLeft: 40, marginBottom: 8 }}>
                <ScheduleLabel routine={r} onClick={() => setScheduleOpenId(scheduleOpen ? null : r.id)} />
              </div>
              {scheduleOpen && (
                <ScheduleEditor
                  routine={r}
                  onSave={(f, d) => editRoutineSchedule(r.id, f, d)}
                  onClose={() => setScheduleOpenId(null)}
                />
              )}
              <Notepad accent="sage">
                {r.items.length === 0 && <NotepadEmptyHint accent="sage" />}
                {r.items.map((item) => (
                  <NotepadLineRow
                    key={item.id}
                    text={item.text}
                    done={item.done}
                    accent="sage"
                    onToggle={() => toggleRoutineItem(r.id, item.id)}
                    onDelete={() => deleteRoutineItem(r.id, item.id)}
                    onEdit={(t) => editRoutineItemText(r.id, item.id, t)}
                  />
                ))}
                <NotepadAddLine placeholder="Add a step…" onAdd={(t) => addRoutineItem(r.id, t)} accent="sage" />
              </Notepad>
              <BulkAddPanel accent="sage" onAdd={(t) => bulkAddRoutineItems(r.id, t)} placeholder={"One step per line…\ne.g.\nMake the bed\nStretch\nDrink water"} />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <ArchiveButton onClick={() => archiveRoutine(r.id)} accent="sage" label="Archive today" />
                <button
                  onClick={() => deleteRoutine(r.id)}
                  style={{ display: "flex", alignItems: "center", gap: 5, border: "none", color: "var(--ink-soft)", background: "var(--tint)", borderRadius: 10, padding: "9px 14px", fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 700 }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {showNew ? (
        <Card style={{ marginTop: 12 }}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitNew()}
            placeholder="Routine name, e.g. Weekly Work Prep"
            style={{ width: "100%", padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 12, fontSize: 16, fontFamily: "var(--font-body)", background: "#fff", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 6, marginBottom: newFreq === "weekly" ? 8 : 10 }}>
            {["daily", "weekly"].map((f) => (
              <button
                key={f}
                onClick={() => setNewFreq(f)}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 9,
                  padding: "8px",
                  background: newFreq === f ? ACCENTS.sage.deep : "var(--tint)",
                  color: newFreq === f ? "#FBF9F4" : "var(--ink-soft)",
                  fontFamily: "var(--font-label)",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          {newFreq === "weekly" && (
            <div style={{ marginBottom: 10 }}>
              <DayToggleRow
                selected={newDays}
                accent="sage"
                onToggle={(idx) => setNewDays((d) => toggleDayInList(d, idx))}
              />
            </div>
          )}
          <button onClick={submitNew} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 12, background: ACCENTS.sage.deep, color: "#FBF9F4", fontFamily: "var(--font-label)", fontSize: 13, fontWeight: 700 }}>
            Create
          </button>
        </Card>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", border: `1.5px dashed ${ACCENTS.sage.deep}`, borderRadius: 14, background: "transparent", color: ACCENTS.sage.deep, fontFamily: "var(--font-label)", fontSize: 13.5, fontWeight: 700 }}
        >
          <Plus size={16} /> New Routine
        </button>
      )}
    </div>
  );
}

/* ================= Guide ================= */

function GuideView({ createListFromTemplate, setView }) {
  const [selectedCat, setSelectedCat] = useState(GUIDE_CATEGORIES[0].key);
  const [openKey, setOpenKey] = useState(null);
  const c = ACCENTS.lavender;

  const currentCat = GUIDE_CATEGORIES.find((g) => g.key === selectedCat);

  const addTemplate = (tpl) => {
    createListFromTemplate(tpl.title, currentCat.listCategory, tpl.items);
    setView("lists");
  };

  return (
    <div>
      <SectionHeader eyebrow="Starter lists" title="Guide" accent="lavender" />
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: -10, marginBottom: 16, lineHeight: 1.5 }}>
        Tap a list to see everything on it, or add it straight to Lists.
      </p>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
        {GUIDE_CATEGORIES.map((g) => {
          const active = selectedCat === g.key;
          return (
            <button
              key={g.key}
              onClick={() => { setSelectedCat(g.key); setOpenKey(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                border: "none",
                borderRadius: 10,
                padding: "7px 11px",
                background: active ? c.deep : "var(--tint)",
                color: active ? "#FBF9F4" : "var(--ink-soft)",
                fontFamily: "var(--font-label)",
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              <g.icon size={12} /> {g.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {currentCat.templates.map((tpl, idx) => {
          const key = `${selectedCat}-${idx}`;
          const open = openKey === key;
          return (
            <Card key={key} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => setOpenKey(open ? null : key)}
                  style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, padding: "10px 6px 10px 12px", border: "none", background: "transparent", textAlign: "left" }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: c.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <currentCat.icon size={14} color="#443E3A" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-label)", fontWeight: 700, fontSize: 14 }}>{tpl.title}</div>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "var(--ink-soft)" }}>{tpl.items.length} items</div>
                  </div>
                  {open ? <ChevronDown size={15} color="#C7BFB4" /> : <ChevronRight size={15} color="#C7BFB4" />}
                </button>
                <button
                  onClick={() => addTemplate(tpl)}
                  style={{ flexShrink: 0, marginRight: 10, border: "none", borderRadius: 9, padding: "7px 10px", background: c.tint, color: c.deep, fontFamily: "var(--font-label)", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Plus size={12} /> Add
                </button>
              </div>
              {open && (
                <div style={{ padding: "0 14px 12px 50px" }}>
                  {tpl.items.map((it, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13.5, color: "var(--ink)" }}>
                      <span style={{ width: 5, height: 5, borderRadius: 3, background: c.deep, flexShrink: 0 }} />
                      {it}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ================= Log ================= */

function LogView({ log }) {
  const [openId, setOpenId] = useState(null);
  const sorted = [...log].sort((a, b) => (a.date < b.date ? 1 : -1));
  const typeAccent = { today: "blue", weekly: "blue", permanent: "blue", list: "rose", routine: "sage" };
  const typeLabel = { today: "Daily To-Do", weekly: "Weekly Checklist", permanent: "Permanent Checklist", list: "List", routine: "Routine" };

  return (
    <div>
      <SectionHeader eyebrow="History" title="Logbook" accent="mint" />
      {sorted.length === 0 ? (
        <Card style={{ textAlign: "center", color: "var(--ink-soft)" }}>
          Nothing archived yet. Archive today's list or a routine day to see it here.
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((entry) => {
            const open = openId === entry.id;
            const accent = typeAccent[entry.type] || "mint";
            const c = ACCENTS[accent];
            return (
              <Card key={entry.id} style={{ padding: 0 }}>
                <button
                  onClick={() => setOpenId(open ? null : entry.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "14px 15px", background: "transparent", border: "none", textAlign: "left" }}
                >
                  <div style={{ width: 8, height: 36, borderRadius: 4, background: c.deep }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-label)", fontWeight: 700, fontSize: 15 }}>{entry.title}</div>
                    <div style={{ fontFamily: "var(--font-label)", fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>
                      {prettyDate(entry.date)} · {typeLabel[entry.type] || entry.type}
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-label)", fontSize: 12.5, fontWeight: 700, color: c.deep }}>{entry.completed}/{entry.total}</span>
                  {open ? <ChevronDown size={16} color="#C7BFB4" /> : <ChevronRight size={16} color="#C7BFB4" />}
                </button>
                {open && (
                  <div style={{ padding: "0 15px 15px" }}>
                    {entry.items.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "6px 2px", fontSize: 14, color: item.done ? "var(--ink-soft)" : "var(--ink)", textDecoration: item.done ? "line-through" : "none" }}>
                        <span style={{ width: 15, height: 15, borderRadius: 5, border: `1.5px solid ${item.done ? c.deep : "#D3CCC2"}`, background: item.done ? c.deep : "transparent", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

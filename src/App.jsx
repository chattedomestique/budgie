import { useState, useEffect, useRef } from "react";
import {
  // UI chrome icons
  Bird, CreditCard, ChartDonut, Lock, LockOpen,
  PauseCircle, Play, CaretUp, CaretDown, Trash,
  UploadSimple, ClipboardText, FileCsv, ShareNetwork,
  X, Sparkle, ArrowCounterClockwise, ArrowClockwise,
  // Category icons
  Building, FileText, House, ShoppingCart, PiggyBank,
  Hospital, Baby, Backpack, Star, Car, ForkKnife, Pill,
  Phone, GameController, Airplane, GraduationCap, PawPrint,
  Barbell, MusicNotes, Books, Laptop, TShirt, Scissors,
  Umbrella, BeerStein, Coffee, Gift, Wrench, Leaf, Bank,
} from "@phosphor-icons/react";

const ICON_MAP = {
  Building, FileText, House, ShoppingCart, PiggyBank,
  Hospital, Baby, Backpack, Star, Car, ForkKnife, Pill,
  Phone, GameController, Airplane, GraduationCap, PawPrint,
  Barbell, MusicNotes, Books, Laptop, TShirt, Scissors,
  Umbrella, BeerStein, Coffee, Gift, Wrench, Leaf, Bank,
};

const ICONS = [
  "Building","FileText","House","ShoppingCart","PiggyBank",
  "Hospital","Baby","Backpack","Star","Car","ForkKnife","Pill",
  "Phone","GameController","Airplane","GraduationCap","PawPrint",
  "Barbell","MusicNotes","Books","Laptop","TShirt","Scissors",
  "Umbrella","BeerStein","Coffee","Gift","Wrench","Leaf","Bank",
];

function CatIcon({ name, size = 22, color = "currentColor", weight = "duotone" }) {
  const Comp = ICON_MAP[name];
  if (!Comp) return null;
  return <Comp size={size} color={color} weight={weight} />;
}

const DEFAULT_CATEGORIES = [
  { id: "1", name: "Federal Taxes", percentage: 22, color: "#E05A6B", icon: "Building",     lockedAmount: null, lockedPct: false, inactive: false },
  { id: "2", name: "State Taxes",   percentage: 6,  color: "#E07A2F", icon: "FileText",     lockedAmount: null, lockedPct: false, inactive: false },
  { id: "3", name: "Rent",          percentage: 25, color: "#3B7DD8", icon: "House",         lockedAmount: null, lockedPct: false, inactive: false },
  { id: "4", name: "Groceries",     percentage: 10, color: "#3D9E5F", icon: "ShoppingCart",  lockedAmount: null, lockedPct: false, inactive: false },
  { id: "5", name: "Savings",       percentage: 15, color: "#6B5BD6", icon: "PiggyBank",     lockedAmount: null, lockedPct: false, inactive: false },
  { id: "6", name: "Medical",       percentage: 5,  color: "#D44E7A", icon: "Hospital",      lockedAmount: null, lockedPct: false, inactive: false },
  { id: "7", name: "Kids",          percentage: 8,  color: "#9B5BC4", icon: "Baby",          lockedAmount: null, lockedPct: false, inactive: false },
  { id: "8", name: "Gear",          percentage: 5,  color: "#2E9EC4", icon: "Backpack",      lockedAmount: null, lockedPct: false, inactive: false },
  { id: "9", name: "Misc",          percentage: 4,  color: "#C4973A", icon: "Star",          lockedAmount: null, lockedPct: false, inactive: false },
];

// Soft, high-contrast-enough pastels — works on cream background
const COLORS = ["#E05A6B","#E07A2F","#C4973A","#3D9E5F","#3B7DD8","#6B5BD6","#9B5BC4","#D44E7A","#2E9EC4","#D4612E","#2DB8A8","#4A9ED1","#5CAE7A","#C4A43A","#A868C4"];

const STORAGE_KEY = "paycheck-divider-v1";

// Migrate old emoji icon strings → Phosphor key strings
const EMOJI_TO_ICON = {
  "🏛️":"Building","📋":"FileText","🏠":"House","🛒":"ShoppingCart","💰":"PiggyBank",
  "🏥":"Hospital","👶":"Baby","🎒":"Backpack","✨":"Star","🚗":"Car","🍕":"ForkKnife",
  "💊":"Pill","📱":"Phone","🎮":"GameController","✈️":"Airplane","🎓":"GraduationCap",
  "🐾":"PawPrint","🏋️":"Barbell","🎵":"MusicNotes","📚":"Books","💻":"Laptop",
  "👗":"TShirt","💇":"Scissors","🏖️":"Umbrella","🍺":"BeerStein","☕":"Coffee",
  "🎁":"Gift","🔧":"Wrench","🌿":"Leaf","🏦":"Bank",
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Migrate emoji icons to Phosphor key strings
      if (data?.categories) {
        data.categories = data.categories.map(c => ({
          ...c,
          icon: EMOJI_TO_ICON[c.icon] ?? (ICON_MAP[c.icon] ? c.icon : "Star"),
        }));
      }
      return data;
    }
  } catch {}
  return null;
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function formatCurrency(val) {
  if (!val && val !== 0) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

// Round percentage to 1 decimal place, eliminating floating-point noise
function r1(n) { return Math.round(n * 10) / 10; }

export default function App() {
  const stored = loadData();
  const [paycheck, setPaycheck] = useState(stored?.paycheck ?? "");
  const [categories, setCategories] = useState(stored?.categories ?? DEFAULT_CATEGORIES);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", value: "", lockType: "none", color: COLORS[4], icon: "Star" });
  // lockType: "none" | "pct" | "amount"
  const [view, setView] = useState("split"); // split | donut
  const [shake, setShake] = useState(false);
  const [progressFlash, setProgressFlash] = useState(false);
  const [bouncingId, setBouncingId] = useState(null);
  const [pctRaw, setPctRaw] = useState({}); // { [id]: string } raw typed value
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null); // index in active list
  const [dragIndex, setDragIndex] = useState(null);         // index of card being dragged
  const dragOverCapRef = useRef({}); // { [id]: { overCap: bool, maxAllowed: number } }
  const paycheckRef = useRef(null);
  const dragStateRef = useRef(null);   // pointer drag state
  const cardListRef = useRef(null);    // ref to the cards container
  const ghostRef = useRef(null);       // ref to the floating ghost card element
  const [ghostRect, setGhostRect] = useState(null); // { top, left, width } for initial ghost placement

  // Undo / redo history
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const sliderPreDragRef = useRef(null); // captures pre-drag state on slider mousedown
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const MAX_HISTORY = 50;

  const total = categories.reduce((s, c) => c.inactive ? s : s + c.percentage, 0);
  const overBudget = total > 100;
  const paycheckNum = parseFloat(paycheck) || 0;

  useEffect(() => {
    saveData({ paycheck, categories });
  }, [paycheck, categories]);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  function pushHistory(cats, pay) {
    undoStackRef.current.push({ categories: cats, paycheck: pay });
    if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
    redoStackRef.current = [];
    setHistoryState({ canUndo: true, canRedo: false });
  }

  function undo() {
    if (!undoStackRef.current.length) return;
    const snap = undoStackRef.current.pop();
    redoStackRef.current.push({ categories, paycheck });
    setCategories(snap.categories);
    setPaycheck(snap.paycheck);
    setHistoryState({ canUndo: undoStackRef.current.length > 0, canRedo: true });
  }

  function redo() {
    if (!redoStackRef.current.length) return;
    const snap = redoStackRef.current.pop();
    undoStackRef.current.push({ categories, paycheck });
    setCategories(snap.categories);
    setPaycheck(snap.paycheck);
    setHistoryState({ canUndo: true, canRedo: redoStackRef.current.length > 0 });
  }

  // Ref-forwarding pattern: always call the latest render's undo/redo from the
  // keydown listener (registered once with empty deps), avoiding stale closures.
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  useEffect(() => { undoRef.current = undo; redoRef.current = redo; });

  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undoRef.current(); }
      else if ((e.key === "z" && e.shiftKey) || e.key === "y") { e.preventDefault(); redoRef.current(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  function updateCategory(id, field, value) {
    if (field === "percentage") {
      // Don't allow dragging a pct-locked or dollar-locked slider
      const target = categories.find(c => c.id === id);
      if (target?.lockedPct || target?.lockedAmount !== null || target?.inactive) return;

      const othersTotal = categories.reduce(
        (s, c) => (c.id === id || c.inactive ? s : s + c.percentage), 0
      );
      const maxAllowed = 100 - othersTotal;
      const parsed = r1(parseFloat(value));
      const isOver = parsed > maxAllowed;

      // Track overage state for this drag so mouseup handler knows what to do
      dragOverCapRef.current[id] = { overCap: isOver, maxAllowed };

      // Always apply the raw value freely while dragging — bounce happens on release
      // Also clear any typed raw value so slider stays in sync
      setPctRaw(prev => ({ ...prev, [id]: undefined }));
      setCategories(prev =>
        prev.map(c => (c.id === id ? { ...c, [field]: parsed } : c))
      );
      return;
    }
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function toggleLockPct(id) {
    pushHistory(categories, paycheck);
    setCategories(prev => prev.map(c => {
      if (c.id !== id) return c;
      // If currently dollar-locked, clear that first then lock pct
      return { ...c, lockedPct: !c.lockedPct, lockedAmount: null, lockedAmountRaw: undefined };
    }));
  }

  function toggleLockAmount(id) {
    pushHistory(categories, paycheck);
    setCategories(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (c.lockedAmount !== null) {
        // Unlock dollar — clear lockedAmount
        return { ...c, lockedAmount: null, lockedAmountRaw: undefined };
      } else {
        // Lock dollar — seed from current %, also clear pct lock
        const seedAmount = paycheckNum > 0
          ? parseFloat((paycheckNum * c.percentage / 100).toFixed(2))
          : 0;
        return { ...c, lockedPct: false, lockedAmount: seedAmount, lockedAmountRaw: String(seedAmount) };
      }
    }));
  }

  function updateLockedAmount(id, rawValue) {
    // Keep the raw string as typed (avoids leading zero fighting)
    // Strip any non-numeric except one decimal point
    const cleaned = rawValue.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    const amount = parseFloat(cleaned) || 0;
    const newPct = paycheckNum > 0
      ? r1((amount / paycheckNum) * 100)
      : 0;
    setCategories(prev => prev.map(c =>
      c.id === id ? { ...c, lockedAmount: amount, lockedAmountRaw: cleaned, percentage: newPct } : c
    ));
  }

  function handlePaycheckChange(val) {
    setPaycheck(val);
    const newPaycheck = parseFloat(val) || 0;
    if (newPaycheck <= 0) return;

    setCategories(prev => {
      // Step 1: Recalculate % for active dollar-locked buckets only
      const withUpdatedLocked = prev.map(c =>
        c.lockedAmount !== null && !c.inactive
          ? { ...c, percentage: r1((c.lockedAmount / newPaycheck) * 100) }
          : c
      );

      // Step 2: Sum up all active "frozen" buckets (dollar-locked OR pct-locked)
      const frozenTotal = withUpdatedLocked.reduce(
        (s, c) => (!c.inactive && (c.lockedAmount !== null || c.lockedPct)) ? s + c.percentage : s, 0
      );

      // Step 3: Figure out how much % is left for active free-floating buckets
      const remaining = Math.max(0, 100 - frozenTotal);

      // Step 4: Get active free-floating buckets and their current total
      const free = withUpdatedLocked.filter(c => !c.inactive && c.lockedAmount === null && !c.lockedPct);
      const freeTotal = free.reduce((s, c) => s + c.percentage, 0);

      // Step 5: Scale active free buckets proportionally; inactive buckets untouched
      return withUpdatedLocked.map(c => {
        if (c.inactive || c.lockedAmount !== null || c.lockedPct) return c;
        const newPct = freeTotal > 0
          ? r1((c.percentage / freeTotal) * remaining)
          : r1(remaining / Math.max(free.length, 1));
        return { ...c, percentage: Math.max(0, newPct) };
      });
    });
  }

  function handlePctInput(id, raw) {
    // Allow free typing — only digits and one decimal point
    const cleaned = raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setPctRaw(prev => ({ ...prev, [id]: cleaned }));
  }

  function handlePctBlur(id) {
    const raw = pctRaw[id];
    if (raw === undefined) return;
    pushHistory(categories, paycheck);
    const parsed = r1(Math.min(100, Math.max(0, parseFloat(raw) || 0)));
    const othersTotal = categories.reduce(
      (s, c) => (c.id === id || c.inactive ? s : s + c.percentage), 0
    );
    const maxAllowed = r1(100 - othersTotal);
    if (parsed > maxAllowed) {
      // Overshoot then bounce back
      setBouncingId(id);
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, percentage: parsed } : c)));
      setTimeout(() => {
        setCategories(prev => prev.map(c => (c.id === id ? { ...c, percentage: maxAllowed } : c)));
        setPctRaw(prev => ({ ...prev, [id]: String(maxAllowed) }));
        setProgressFlash(true);
        setShake(true);
        setTimeout(() => { setBouncingId(null); setProgressFlash(false); setShake(false); }, 550);
      }, 120);
    } else {
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, percentage: parsed } : c)));
      setPctRaw(prev => ({ ...prev, [id]: undefined }));
    }
  }

  function handleSliderRelease(id) {
    const info = dragOverCapRef.current[id];
    if (!info?.overCap) return;

    // Snap back to cap with a spring transition (set bouncingId to enable it)
    setBouncingId(id);
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, percentage: info.maxAllowed } : c))
    );
    setProgressFlash(true);
    setShake(true);

    // Clean up after animation
    setTimeout(() => {
      setBouncingId(null);
      setProgressFlash(false);
      setShake(false);
      dragOverCapRef.current[id] = null;
    }, 600);
  }

  function toggleInactive(id) {
    pushHistory(categories, paycheck);
    setCategories(prev => {
      const target = prev.find(c => c.id === id);
      const becomingInactive = !target.inactive;

      if (becomingInactive) {
        // Deactivating: release this bucket's % back to active free-floating buckets proportionally
        const releasedPct = target.percentage;
        const free = prev.filter(c => c.id !== id && !c.inactive && c.lockedAmount === null && !c.lockedPct);
        const freeTotal = free.reduce((s, c) => s + c.percentage, 0);

        return prev.map(c => {
          if (c.id === id) return { ...c, inactive: true };
          if (c.inactive || c.lockedAmount !== null || c.lockedPct) return c;
          // Proportionally distribute the released % among free buckets
          const bonus = freeTotal > 0
            ? r1((c.percentage / freeTotal) * releasedPct)
            : r1(releasedPct / Math.max(free.length, 1));
          return { ...c, percentage: r1(c.percentage + bonus) };
        });
      } else {
        // Reactivating: absorb this bucket's % back from active free-floating buckets proportionally
        const neededPct = target.percentage;
        const free = prev.filter(c => c.id !== id && !c.inactive && c.lockedAmount === null && !c.lockedPct);
        const freeTotal = free.reduce((s, c) => s + c.percentage, 0);
        const canAbsorb = Math.min(neededPct, freeTotal); // never go negative

        return prev.map(c => {
          if (c.id === id) return { ...c, inactive: false };
          if (c.inactive || c.lockedAmount !== null || c.lockedPct) return c;
          const reduction = freeTotal > 0
            ? r1((c.percentage / freeTotal) * canAbsorb)
            : 0;
          return { ...c, percentage: Math.max(0, r1(c.percentage - reduction)) };
        });
      }
    });
    // Close the expanded panel when deactivating
    setEditingId(null);
  }

  function reorderCategories(fromId, toId) {
    if (fromId === toId) return;
    setCategories(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(c => c.id === fromId);
      const toIdx = arr.findIndex(c => c.id === toId);
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  }

  function startPointerDrag(e, catId, catIndex) {
    e.preventDefault();
    e.stopPropagation();

    const container = cardListRef.current;
    if (!container) return;

    // Snapshot all card rects at drag start
    const cardEls = Array.from(container.querySelectorAll("[data-card-id]"));
    const rects = cardEls.map(el => el.getBoundingClientRect());
    const cardHeight = rects[0]?.height ?? 72;

    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    // Use a mutable ref to track the live "over index" from inside event handlers
    const liveOverIndex = { current: catIndex };

    dragStateRef.current = {
      id: catId,
      fromIndex: catIndex,
      startY,
      rects,
      cardHeight,
      liveOverIndex,
    };

    // Store initial rect so ghost JSX can position itself on mount
    setGhostRect({ top: rects[catIndex].top, left: rects[catIndex].left, width: rects[catIndex].width });
    setDraggingId(catId);
    setDragIndex(catIndex);
    setDragOverIndex(catIndex);

    const onMove = (ev) => {
      const clientY = ev.clientY ?? ev.touches?.[0]?.clientY ?? 0;
      const state = dragStateRef.current;
      if (!state) return;

      const dy = clientY - state.startY;

      // Move ghost directly via DOM for smooth 60fps (no React re-render)
      if (ghostRef.current) {
        ghostRef.current.style.top = `${state.rects[state.fromIndex].top + dy}px`;
      }
      // Find which slot the dragged card's centre is closest to
      const draggedCentre = state.rects[state.fromIndex].top + state.cardHeight / 2 + dy;
      let newOver = state.fromIndex;
      let minDist = Infinity;
      for (let i = 0; i < state.rects.length; i++) {
        const slotMid = state.rects[i].top + state.cardHeight / 2;
        const dist = Math.abs(draggedCentre - slotMid);
        if (dist < minDist) { minDist = dist; newOver = i; }
      }
      newOver = Math.max(0, Math.min(newOver, state.rects.length - 1));
      state.liveOverIndex.current = newOver;
      setDragOverIndex(newOver);
    };

    const onUp = () => {
      const state = dragStateRef.current;
      if (state) {
        const activeIds = categories.filter(c => !c.inactive).map(c => c.id);
        const fromId = state.id;
        const toId = activeIds[state.liveOverIndex.current];
        if (toId && toId !== fromId) {
          pushHistory(categories, paycheck);
          reorderCategories(fromId, toId);
        }
      }
      dragStateRef.current = null;
      setDraggingId(null);
      setDragIndex(null);
      setDragOverIndex(null);
      setGhostRect(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  }

  function deleteCategory(id) {
    pushHistory(categories, paycheck);
    setCategories(prev => prev.filter(c => c.id !== id));
    setEditingId(null);
  }

  function addCategory() {
    if (!newCat.name.trim() || !newCat.value) return;
    const parsed = parseFloat(newCat.value) || 0;

    let percentage, lockedAmount, lockedPct, lockedAmountRaw;

    if (newCat.lockType === "amount") {
      // Fixed dollar — derive percentage from paycheck
      lockedAmount = parsed;
      lockedAmountRaw = String(newCat.value);
      lockedPct = false;
      percentage = paycheckNum > 0
        ? r1((parsed / paycheckNum) * 100)
        : 0;
    } else if (newCat.lockType === "pct") {
      // Fixed percentage
      percentage = parsed;
      lockedPct = true;
      lockedAmount = null;
      lockedAmountRaw = undefined;
    } else {
      // Free-floating percentage
      percentage = parsed;
      lockedPct = false;
      lockedAmount = null;
      lockedAmountRaw = undefined;
    }

    if (total + percentage > 100) {
      setShowAdd(false);
      return;
    }

    pushHistory(categories, paycheck);
    const cat = {
      id: Date.now().toString(),
      name: newCat.name.trim(),
      percentage,
      lockedAmount: lockedAmount ?? null,
      lockedAmountRaw,
      lockedPct: lockedPct ?? false,
      inactive: false,
      color: newCat.color,
      icon: newCat.icon,
    };
    setCategories(prev => [...prev, cat]);
    setNewCat({ name: "", value: "", lockType: "none", color: COLORS[Math.floor(Math.random()*COLORS.length)], icon: "Star" });
    setShowAdd(false);
  }

  function distributeEvenly() {
    pushHistory(categories, paycheck);
    const active = categories.filter(c => !c.inactive);
    const each = parseFloat((100 / active.length).toFixed(1));
    setCategories(prev => {
      let activeIdx = 0;
      return prev.map(c => {
        if (c.inactive) return c;
        const pct = activeIdx === active.length - 1
          ? parseFloat((100 - each * (active.length - 1)).toFixed(1))
          : each;
        activeIdx++;
        return { ...c, percentage: pct };
      });
    });
  }

  // Export helpers
  function buildExportText() {
    const active = categories.filter(c => !c.inactive);
    const divider = "─".repeat(38);
    const pad = (s, n) => String(s).padEnd(n);
    const rpad = (s, n) => String(s).padStart(n);
    let lines = [];
    if (paycheckNum > 0) lines.push(`Paycheck: ${formatCurrency(paycheckNum)}`);
    lines.push(divider);
    active.forEach(c => {
      const lock = c.lockedAmount !== null ? " 🔒$" : c.lockedPct ? " 🔒%" : "";
      const amt = paycheckNum > 0 ? formatCurrency(paycheckNum * c.percentage / 100) : "—";
      lines.push(`${pad(c.name + lock, 24)}${rpad(c.percentage.toFixed(1) + "%", 7)}  ${rpad(amt, 9)}`);
    });
    lines.push(divider);
    const unallocated = 100 - total;
    lines.push(`${pad("TOTAL", 24)}${rpad(total.toFixed(1) + "%", 7)}  ${rpad(paycheckNum > 0 ? formatCurrency(paycheckNum * total / 100) : "—", 9)}`);
    if (unallocated > 0.005 && paycheckNum > 0) {
      lines.push(`${pad("Unallocated", 24)}${rpad(unallocated.toFixed(1) + "%", 7)}  ${rpad(formatCurrency(paycheckNum * unallocated / 100), 9)}`);
    }
    return lines.join("\n");
  }

  function buildCsv() {
    const active = categories.filter(c => !c.inactive);
    const escape = v => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Paycheck Summary", "", "", ""],
      ["Paycheck", paycheckNum > 0 ? formatCurrency(paycheckNum) : "—", "", ""],
      ["", "", "", ""],
      ["Category", "Percentage", "Amount", "Type"],
    ];
    active.forEach(c => {
      const type = c.lockedAmount !== null ? "Fixed $" : c.lockedPct ? "Fixed %" : "Free";
      const amt = paycheckNum > 0 ? formatCurrency(paycheckNum * c.percentage / 100) : "—";
      rows.push([c.name, c.percentage.toFixed(1) + "%", amt, type]);
    });
    rows.push(["TOTAL", total.toFixed(1) + "%", paycheckNum > 0 ? formatCurrency(paycheckNum * total / 100) : "—", ""]);
    const unallocated = 100 - total;
    if (unallocated > 0.005) {
      rows.push(["Unallocated", unallocated.toFixed(1) + "%", paycheckNum > 0 ? formatCurrency(paycheckNum * unallocated / 100) : "—", ""]);
    }
    return rows.map(r => r.map(escape).join(",")).join("\n");
  }

  function handleCopyText() {
    navigator.clipboard.writeText(buildExportText()).catch(() => {});
  }

  function handleDownloadCsv() {
    const csv = buildCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paycheck-budget.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    const text = buildExportText();
    const csv = buildCsv();
    try {
      // Try sharing a file (works on iOS)
      const file = new File([csv], "paycheck-budget.csv", { type: "text/csv" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Paycheck Budget", text, files: [file] });
        return;
      }
    } catch {}
    try {
      // Fall back to text-only share
      if (navigator.share) await navigator.share({ title: "Paycheck Budget", text });
    } catch {}
  }

  // Donut chart
  const DonutChart = () => {
    const size = 220;
    const cx = size / 2, cy = size / 2, r = 85, strokeW = 32;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const slices = categories.map(c => {
      const pct = Math.min(c.percentage / Math.max(total, 100), 1);
      const dash = circ * pct;
      const gap = circ - dash;
      const slice = { ...c, dash, gap, offset: offset * circ };
      offset += pct;
      return slice;
    });
    return (
      <svg width={size} height={size} style={{ display: "block", margin: "0 auto" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EDE8DF" strokeWidth={strokeW} />
        {slices.map((s, i) => (
          <circle
            key={s.id}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeW}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset + circ / 4}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease" }}
          />
        ))}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#1A1208" fontSize="22" fontWeight="700" fontFamily="Fredoka, system-ui, sans-serif">
          {paycheckNum ? formatCurrency(paycheckNum) : "—"}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#9B8E7A" fontSize="12" fontWeight="600" fontFamily="Nunito, system-ui, sans-serif">
          paycheck
        </text>
        <text x={cx} y={cy + 34} textAnchor="middle" fill={overBudget ? "#D44E4E" : "#9B8E7A"} fontSize="12" fontWeight="700" fontFamily="Nunito, system-ui, sans-serif">
          {total.toFixed(1)}% {overBudget ? "! over 100%" : "allocated"}
        </text>
      </svg>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      fontFamily: "var(--font-body)",
      color: "var(--ink)",
      maxWidth: 430,
      margin: "0 auto",
      paddingBottom: 100,
    }}>
      <style>{`
        /* ── Tokens ─────────────────────────────────────────── */
        :root {
          --bg:        #F5F0E8;
          --bg2:       #EDE8DF;
          --surface:   #FFFFFF;
          --ink:       #1A1208;
          --ink2:      #4A3F2F;
          --ink3:      #9B8E7A;
          --accent:    #3B7DD8;
          --danger:    #D44E4E;
          --success:   #3D9E5F;
          --warn:      #C4973A;
          --border:    #D9D2C5;
          --shadow-sm: 3px 3px 0px #C4BAA8;
          --shadow-md: 4px 4px 0px #B8AE9C, inset 0 1px 0 rgba(255,255,255,0.9);
          --shadow-lg: 6px 6px 0px #B0A490, inset 0 1px 0 rgba(255,255,255,0.85);
          --radius-sm: 12px;
          --radius-md: 18px;
          --radius-lg: 22px;
          --font-head: 'Fredoka', 'Varela Round', system-ui, sans-serif;
          --font-body: 'Nunito', system-ui, sans-serif;
        }

        /* ── Base ───────────────────────────────────────────── */
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input, textarea { -webkit-appearance: none; }
        body { background: var(--bg); }

        /* ── 1-bit dither pattern (header texture) ──────────── */
        @keyframes ditherFade {
          from { opacity: 0; } to { opacity: 1; }
        }
        .dither-bg {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='1' height='1' fill='%231A1208' opacity='0.035'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%231A1208' opacity='0.035'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }

        /* ── Animations ─────────────────────────────────────── */
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes slideUp {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.88); opacity: 0; }
          65%  { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes lockPop {
          0%   { transform: scale(1) rotate(0deg); }
          40%  { transform: scale(1.35) rotate(-14deg); }
          70%  { transform: scale(0.9) rotate(8deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes progressFlash {
          0%,100% { opacity: 1; }
          35%     { opacity: 0.25; }
          65%     { opacity: 1; }
        }
        @keyframes reactivate {
          0%   { transform: scale(0.96); opacity: 0.4; }
          60%  { transform: scale(1.025); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes wobble {
          0%,100% { transform: rotate(0deg); }
          25%     { transform: rotate(-2deg); }
          75%     { transform: rotate(2deg); }
        }

        /* ── Sheet / overlay ────────────────────────────────── */
        .cat-row  { animation: slideUp 0.22s ease both; }
        .sheet    { animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
        .sheet-scroll { overflow-y: auto; max-height: 88vh; max-height: 88dvh; }
        .sheet-scroll-lg { overflow-y: auto; max-height: 90vh; max-height: 90dvh; }

        /* ── Inputs ─────────────────────────────────────────── */
        .ios-input {
          background: var(--bg2);
          border: 2px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--ink);
          padding: 12px 14px;
          font-size: 16px;
          font-family: var(--font-body);
          font-weight: 600;
          width: 100%;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          box-shadow: var(--shadow-sm);
        }
        .ios-input:focus {
          border-color: var(--accent);
          box-shadow: 3px 3px 0px var(--accent);
        }
        .ios-input::placeholder { color: var(--ink3); font-weight: 400; }

        /* ── Buttons ────────────────────────────────────────── */
        .ios-btn {
          padding: 13px 22px;
          border-radius: var(--radius-sm);
          border: 2px solid var(--ink);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          font-family: var(--font-body);
          transition: transform 0.1s, box-shadow 0.1s;
          box-shadow: var(--shadow-sm);
          -webkit-user-select: none;
          letter-spacing: 0.01em;
        }
        .ios-btn:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px #C4BAA8;
        }
        .seg-btn {
          flex: 1;
          padding: 8px;
          border: 2px solid transparent;
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-body);
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.18s;
        }

        /* ── Category cards ─────────────────────────────────── */
        .cat-card {
          background: var(--surface);
          border-radius: var(--radius-md);
          border: 2px solid var(--border);
          box-shadow: var(--shadow-md);
          transition: box-shadow 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      opacity 0.22s;
          will-change: transform;
          position: relative;
          z-index: 0;
        }
        .cat-card:active { box-shadow: 2px 2px 0px #C4BAA8; transform: translate(1px, 1px); }
        .cat-card.is-dragging {
          opacity: 0;
          transform: scale(0.96);
          z-index: 10;
          transition: none;
        }
        .cat-card.drag-ghost {
          position: fixed;
          pointer-events: none;
          z-index: 50;
          box-shadow: 8px 8px 0px rgba(26,18,8,0.18), 0 2px 0 rgba(255,255,255,0.9) inset;
          border: 2.5px solid var(--ink);
          border-radius: var(--radius-md);
          opacity: 1;
          transform: scale(1.03) rotate(1.5deg);
          background: var(--surface);
          transition: none;
        }
        .cat-card.inactive-card {
          background: var(--bg2);
          border: 2px dashed var(--border);
          box-shadow: none;
          opacity: 0.65;
        }
        .cat-card.inactive-card:hover { opacity: 0.9; }
        .cat-card.reactivating { animation: reactivate 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── Drag handle ────────────────────────────────────── */
        .drag-handle {
          display: flex; flex-direction: column; justify-content: center; gap: 3.5px;
          padding: 10px 6px; cursor: grab; flex-shrink: 0; touch-action: none;
          -webkit-user-select: none; user-select: none;
        }
        .drag-handle span {
          display: block; width: 15px; height: 2.5px;
          background: var(--border);
          border-radius: 2px;
          transition: background 0.15s;
        }
        .drag-handle:hover span { background: var(--ink3); }
        .drag-handle:active { cursor: grabbing; }

        /* ── Lock buttons ───────────────────────────────────── */
        .lock-btn:active { animation: lockPop 0.35s cubic-bezier(0.34,1.56,0.64,1); }

        /* ── Lock type picker ───────────────────────────────── */
        .lock-type-btn {
          flex: 1; padding: 10px 8px; border-radius: 12px;
          border: 2px solid var(--border);
          background: var(--bg2); color: var(--ink3); font-size: 13px;
          font-weight: 700; cursor: pointer; font-family: var(--font-body);
          transition: all 0.18s; text-align: center; line-height: 1.3;
          box-shadow: 2px 2px 0px var(--border);
        }
        .lock-type-btn.active {
          background: var(--surface);
          border-color: var(--ink);
          color: var(--ink);
          box-shadow: 3px 3px 0px var(--ink);
        }

        /* ── Delete button ──────────────────────────────────── */
        .delete-btn {
          background: #FDE8E8;
          border: 2px solid var(--danger);
          border-radius: 10px;
          color: var(--danger);
          font-size: 13px;
          font-weight: 700;
          padding: 8px 14px;
          cursor: pointer;
          font-family: var(--font-body);
          box-shadow: 2px 2px 0px var(--danger);
          transition: transform 0.1s, box-shadow 0.1s;
        }
        .delete-btn:active {
          transform: translate(1px, 1px);
          box-shadow: 1px 1px 0px var(--danger);
        }

        /* ── Range slider ───────────────────────────────────── */
        ::-webkit-scrollbar { display: none; }
        input[type=range] {
          -webkit-appearance: none;
          width: 100%;
          height: 7px;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          transition: none;
          border: 1.5px solid var(--border);
        }
        input[type=range].bouncing {
          transition: all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          border: 2.5px solid var(--ink);
          box-shadow: 2px 2px 0px rgba(26,18,8,0.2);
          background: white;
          cursor: pointer;
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>

      {/* Status bar spacer */}
      <div style={{ height: 56 }} />

      {/* Header */}
      <div className="dither-bg" style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <Bird size={34} weight="fill" color="var(--accent)" />
          <h1 style={{
            fontSize: 36, fontWeight: 700, margin: 0,
            fontFamily: "var(--font-head)",
            color: "var(--ink)",
            letterSpacing: 0.2,
          }}>Budgie</h1>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {[
              { fn: undo, can: historyState.canUndo, Icon: ArrowCounterClockwise, title: "Undo (⌘Z)" },
              { fn: redo, can: historyState.canRedo, Icon: ArrowClockwise,        title: "Redo (⌘⇧Z)" },
            ].map(({ fn, can, Icon, title }) => (
              <button key={title} onClick={fn} disabled={!can} title={title} style={{
                background: can ? "var(--surface)" : "transparent",
                border: `2px solid ${can ? "var(--border)" : "var(--bg2)"}`,
                borderRadius: 10, padding: "6px 8px",
                cursor: can ? "pointer" : "default",
                color: can ? "var(--ink2)" : "var(--ink3)",
                display: "flex", alignItems: "center",
                boxShadow: can ? "2px 2px 0 var(--border)" : "none",
                transition: "all 0.15s",
                opacity: can ? 1 : 0.35,
              }}>
                <Icon size={17} weight="bold" />
              </button>
            ))}
          </div>
        </div>
        <p style={{ color: "var(--ink3)", fontSize: 14, margin: 0, fontWeight: 600, paddingLeft: 2 }}>
          divide your money with intention <Sparkle size={12} weight="fill" style={{ verticalAlign: "middle", marginLeft: 2 }} />
        </p>
      </div>

      {/* Paycheck Input */}
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{
          background: "var(--surface)",
          border: "2.5px solid var(--ink)",
          borderRadius: "var(--radius-lg)",
          padding: "18px 20px",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Dither accent stripe */}
          <div className="dither-bg" style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 4,
            background: "var(--accent)", opacity: 0.9,
          }} />
          <div style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.2, fontFamily: "var(--font-body)" }}>
            Paycheck Amount
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: "var(--ink3)", fontFamily: "var(--font-head)" }}>$</span>
            <input
              ref={paycheckRef}
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={paycheck}
              onFocus={() => pushHistory(categories, paycheck)}
              onChange={e => handlePaycheckChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--ink)",
                fontSize: 38,
                fontWeight: 700,
                width: "100%",
                outline: "none",
                fontFamily: "var(--font-head)",
                letterSpacing: -0.5,
              }}
            />
          </div>
          {paycheckNum > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1.5px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 600 }}>Unallocated</span>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: overBudget ? "var(--danger)" : total < 100 ? "var(--success)" : "var(--ink2)",
                background: overBudget ? "#FDE8E8" : total < 100 ? "#E6F5EC" : "var(--bg2)",
                padding: "3px 9px", borderRadius: 8,
                border: `1.5px solid ${overBudget ? "var(--danger)" : total < 100 ? "var(--success)" : "var(--border)"}`,
              }}>
                {formatCurrency(paycheckNum * (1 - total / 100))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Segment Control */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{
          display: "flex", background: "var(--bg2)", borderRadius: 14, padding: 3, gap: 3,
          border: "2px solid var(--border)", boxShadow: "2px 2px 0 var(--border)",
        }}>
          {[
            ["split", <CreditCard size={16} weight="bold" />, "Split"],
            ["donut", <ChartDonut size={16} weight="bold" />, "Overview"],
          ].map(([v, icon, label]) => (
            <button key={v} className="seg-btn" onClick={() => setView(v)} style={{
              background: view === v ? "var(--surface)" : "transparent",
              color: view === v ? "var(--ink)" : "var(--ink3)",
              border: view === v ? "2px solid var(--ink)" : "2px solid transparent",
              boxShadow: view === v ? "2px 2px 0 var(--ink)" : "none",
              fontFamily: "var(--font-body)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {view === "donut" ? (
        /* Donut View */
        <div style={{ padding: "0 20px" }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-lg)",
            border: "2.5px solid var(--ink)",
            padding: "24px 20px",
            boxShadow: "var(--shadow-lg)",
          }}>
            <DonutChart />
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {categories.map(c => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--bg2)", borderRadius: 12, padding: "10px 12px",
                  border: "2px solid var(--border)",
                  boxShadow: "2px 2px 0 var(--border)",
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0, border: "1.5px solid rgba(0,0,0,0.1)" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--ink3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-head)" }}>{c.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Export button */}
            <button
              className="ios-btn"
              onClick={() => setShowExport(true)}
              style={{
                width: "100%",
                marginTop: 16,
                background: "var(--bg2)",
                color: "var(--accent)",
                border: "2.5px dashed var(--accent)",
                borderRadius: "var(--radius-md)",
                boxShadow: `3px 3px 0 ${COLORS[4]}44`,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "var(--font-body)",
              }}
            >
              <UploadSimple size={18} weight="bold" />
              Export Summary
            </button>
          </div>
        </div>
      ) : (
        /* Split View */
        <div style={{ padding: "0 20px" }}>
          {/* Total bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, animation: shake ? "shake 0.5s ease" : "none"
          }}>
            <div style={{
              fontSize: 13, color: overBudget ? "var(--danger)" : "var(--ink3)",
              fontWeight: 700, fontFamily: "var(--font-body)",
              background: overBudget ? "#FDE8E8" : "var(--bg2)",
              border: `1.5px solid ${overBudget ? "var(--danger)" : "var(--border)"}`,
              borderRadius: 8, padding: "3px 9px",
            }}>
              {total.toFixed(1)}% of 100%
            </div>
            <button
              className="ios-btn"
              onClick={distributeEvenly}
              style={{
                padding: "6px 14px", fontSize: 13,
                background: "var(--bg2)", color: "var(--ink2)",
                borderRadius: 10, borderColor: "var(--border)",
                boxShadow: "2px 2px 0 var(--border)",
              }}
            >
              Distribute Evenly
            </button>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 10, background: "var(--bg2)", borderRadius: 6,
            marginBottom: 18, overflow: "visible",
            border: "2px solid var(--border)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: overBudget ? "var(--danger)" : total === 100 ? "var(--success)" : "var(--accent)",
              width: `${Math.min(total, 100)}%`,
              transition: "width 0.3s ease, background 0.3s ease",
              animation: progressFlash ? "progressFlash 0.5s ease" : "none",
              backgroundImage: total > 0 ? "repeating-linear-gradient(90deg, transparent 0px, transparent 6px, rgba(255,255,255,0.15) 6px, rgba(255,255,255,0.15) 7px)" : "none",
            }} />
          </div>

          {/* Category cards */}
          <div ref={cardListRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categories.filter(c => !c.inactive).map((cat, idx) => {
              const amount = paycheckNum * cat.percentage / 100;
              const isEditing = editingId === cat.id;
              const isDragging = draggingId === cat.id;

              // Compute how much this card should shift to make room for the dragged card
              let translateY = 0;
              if (draggingId && !isDragging && dragIndex !== null && dragOverIndex !== null) {
                const cardHeightEst = (dragStateRef.current?.cardHeight ?? 72) + 10; // include gap
                if (dragIndex < dragOverIndex) {
                  // Dragged card moving DOWN: cards in range (dragIndex, dragOverIndex] shift UP
                  if (idx > dragIndex && idx <= dragOverIndex) translateY = -cardHeightEst;
                } else if (dragIndex > dragOverIndex) {
                  // Dragged card moving UP: cards in range [dragOverIndex, dragIndex) shift DOWN
                  if (idx >= dragOverIndex && idx < dragIndex) translateY = cardHeightEst;
                }
              }

              return (
                <div
                  key={cat.id}
                  data-card-id={cat.id}
                  className={`cat-card${isDragging ? " is-dragging" : ""}`}
                  style={{
                    animationDelay: `${idx * 0.04}s`,
                    transform: isDragging ? "scale(0.96)" : `translateY(${translateY}px)`,
                    transition: isDragging ? "none" : "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s, background 0.2s",
                    opacity: isDragging ? 0 : 1,
                  }}
                >
                  <div
                    style={{ padding: "14px 16px", cursor: "pointer" }}
                    onClick={() => setEditingId(isEditing ? null : cat.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Drag handle */}
                      <div
                        className="drag-handle"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => startPointerDrag(e, cat.id, idx)}
                        onTouchStart={e => startPointerDrag(e, cat.id, idx)}
                      >
                        <span /><span /><span />
                      </div>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: cat.color + "22",
                        border: `2.5px solid ${cat.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `2px 2px 0 ${cat.color}55`,
                      }}>
                        <CatIcon name={cat.icon} size={22} color={cat.color} weight="duotone" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--font-body)" }}>
                          {cat.name}
                        </div>
                        {paycheckNum > 0 && (
                          <div style={{ fontSize: 13, color: "var(--ink3)", marginTop: 1, fontWeight: 600 }}>
                            {formatCurrency(amount)}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: cat.color, fontFamily: "var(--font-head)" }}>
                          {cat.lockedAmount !== null
                            ? formatCurrency(cat.lockedAmount)
                            : `${cat.percentage}%`}
                        </div>
                        {cat.lockedAmount !== null && (
                          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 1, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                            <Lock size={10} weight="fill" /> {cat.percentage.toFixed(1)}%
                          </div>
                        )}
                        {cat.lockedPct && cat.lockedAmount === null && (
                          <div style={{ fontSize: 11, color: cat.color, marginTop: 1, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                            <Lock size={10} weight="fill" /> fixed %
                          </div>
                        )}
                      </div>
                      <div style={{ color: "var(--ink3)", flexShrink: 0, marginLeft: 2, display: "flex", alignItems: "center" }}>
                        {isEditing ? <CaretUp size={14} weight="bold" /> : <CaretDown size={14} weight="bold" />}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ padding: "0 16px 16px", borderTop: "2px dashed var(--border)", paddingTop: 14 }}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9 }}>Name</div>
                        <input
                          type="text"
                          className="ios-input"
                          value={cat.name}
                          onFocus={() => pushHistory(categories, paycheck)}
                          onChange={e => updateCategory(cat.id, "name", e.target.value)}
                          style={{ fontSize: 15, padding: "11px 14px" }}
                        />
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9 }}>
                            {cat.lockedAmount !== null ? "Fixed Amount" : "Percentage"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {cat.lockedAmount !== null && (
                              <div style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 600 }}>
                                {cat.percentage.toFixed(1)}% of paycheck
                              </div>
                            )}
                            {/* Lock % button */}
                            <button
                              onClick={() => toggleLockPct(cat.id)}
                              title={cat.lockedPct ? "Unlock percentage" : "Lock this percentage"}
                              className="lock-btn"
                              style={{
                                background: cat.lockedPct ? cat.color + "20" : "var(--bg2)",
                                border: `2px solid ${cat.lockedPct ? cat.color : "var(--border)"}`,
                                borderRadius: 8, color: cat.lockedPct ? cat.color : "var(--ink3)",
                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                                padding: "3px 7px", lineHeight: 1.4, transition: "all 0.18s",
                                fontFamily: "var(--font-body)",
                                boxShadow: cat.lockedPct ? `2px 2px 0 ${cat.color}55` : "2px 2px 0 var(--border)",
                              }}
                            >
                              {cat.lockedPct
                                ? <><Lock size={12} weight="fill" />%</>
                                : <><LockOpen size={12} weight="bold" />%</>}
                            </button>
                            {/* Lock $ button */}
                            <button
                              onClick={() => toggleLockAmount(cat.id)}
                              title={cat.lockedAmount !== null ? "Unlock dollar amount" : "Lock to dollar amount"}
                              className="lock-btn"
                              style={{
                                background: cat.lockedAmount !== null ? cat.color + "20" : "var(--bg2)",
                                border: `2px solid ${cat.lockedAmount !== null ? cat.color : "var(--border)"}`,
                                borderRadius: 8, color: cat.lockedAmount !== null ? cat.color : "var(--ink3)",
                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                                padding: "3px 7px", lineHeight: 1.4, transition: "all 0.18s",
                                fontFamily: "var(--font-body)",
                                boxShadow: cat.lockedAmount !== null ? `2px 2px 0 ${cat.color}55` : "2px 2px 0 var(--border)",
                              }}
                            >
                              {cat.lockedAmount !== null
                                ? <><Lock size={12} weight="fill" />$</>
                                : <><LockOpen size={12} weight="bold" />$</>}
                            </button>
                          </div>
                        </div>

                        {cat.lockedAmount !== null ? (
                          /* Dollar amount input */
                          <div style={{ position: "relative" }}>
                            <span style={{
                              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                              fontSize: 17, fontWeight: 700, color: "var(--ink3)"
                            }}>$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="ios-input"
                              value={cat.lockedAmountRaw ?? (cat.lockedAmount ?? "")}
                              onFocus={() => pushHistory(categories, paycheck)}
                              onChange={e => updateLockedAmount(cat.id, e.target.value)}
                              style={{ paddingLeft: 28, fontSize: 17, fontWeight: 600 }}
                            />
                          </div>
                        ) : (
                          /* Percentage input + slider */
                          <>
                            {/* Inline % text input */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <div style={{ position: "relative", width: 88 }}>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="ios-input"
                                  disabled={cat.lockedPct}
                                  value={pctRaw[cat.id] !== undefined ? pctRaw[cat.id] : cat.percentage % 1 === 0 ? String(cat.percentage) : cat.percentage.toFixed(1)}
                                  onChange={e => handlePctInput(cat.id, e.target.value)}
                                  onBlur={() => handlePctBlur(cat.id)}
                                  onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                                  style={{
                                    padding: "9px 28px 9px 12px",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: cat.lockedPct ? "var(--ink3)" : cat.color,
                                    cursor: cat.lockedPct ? "not-allowed" : "text",
                                    width: "100%",
                                  }}
                                />
                                <span style={{
                                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                  fontSize: 14, fontWeight: 700,
                                  color: cat.lockedPct ? "var(--ink3)" : "var(--ink3)",
                                  pointerEvents: "none",
                                }}>%</span>
                              </div>
                              {/* Slider fills remaining space */}
                              <div style={{ flex: 1 }}>
                                <input
                                  type="range"
                                  min="0" max="100" step="0.5"
                                  value={cat.percentage}
                                  disabled={cat.lockedPct}
                                  className={bouncingId === cat.id ? "bouncing" : ""}
                                  onChange={e => updateCategory(cat.id, "percentage", r1(parseFloat(e.target.value)))}
                                  onMouseDown={() => { dragOverCapRef.current[cat.id] = null; sliderPreDragRef.current = { categories, paycheck }; }}
                                  onTouchStart={() => { dragOverCapRef.current[cat.id] = null; sliderPreDragRef.current = { categories, paycheck }; }}
                                  onMouseUp={() => { if (sliderPreDragRef.current) { pushHistory(sliderPreDragRef.current.categories, sliderPreDragRef.current.paycheck); sliderPreDragRef.current = null; } handleSliderRelease(cat.id); }}
                                  onTouchEnd={() => { if (sliderPreDragRef.current) { pushHistory(sliderPreDragRef.current.categories, sliderPreDragRef.current.paycheck); sliderPreDragRef.current = null; } handleSliderRelease(cat.id); }}
                                  style={{
                                    accentColor: cat.lockedPct ? "var(--border)" : cat.color,
                                    opacity: cat.lockedPct ? 0.45 : 1,
                                    cursor: cat.lockedPct ? "not-allowed" : "pointer",
                                    background: `linear-gradient(to right, ${cat.lockedPct ? "var(--border)" : cat.color} 0%, ${cat.lockedPct ? "var(--border)" : cat.color} ${Math.min(cat.percentage, 100)}%, var(--bg2) ${Math.min(cat.percentage, 100)}%, var(--bg2) 100%)`,
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9 }}>Icon</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {ICONS.map(ic => (
                            <button key={ic} onClick={() => { pushHistory(categories, paycheck); updateCategory(cat.id, "icon", ic); }} style={{
                              width: 36, height: 36, borderRadius: 10,
                              border: cat.icon === ic ? `2.5px solid ${cat.color}` : "2px solid var(--border)",
                              background: cat.icon === ic ? cat.color + "20" : "var(--bg2)",
                              cursor: "pointer", transition: "all 0.15s",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: cat.icon === ic ? `2px 2px 0 ${cat.color}55` : "1px 1px 0 var(--border)",
                            }}>
                              <CatIcon name={ic} size={18} color={cat.icon === ic ? cat.color : "var(--ink3)"} weight={cat.icon === ic ? "duotone" : "regular"} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9 }}>Color</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {COLORS.map(col => (
                            <button key={col} onClick={() => { pushHistory(categories, paycheck); updateCategory(cat.id, "color", col); }} style={{
                              width: 32, height: 32, borderRadius: "50%",
                              border: cat.color === col ? `3px solid var(--ink)` : "2.5px solid var(--border)",
                              background: col, cursor: "pointer", transition: "all 0.15s",
                              outline: "none",
                              boxShadow: cat.color === col ? `3px 3px 0 var(--ink)` : "2px 2px 0 var(--border)",
                            }} />
                          ))}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => toggleInactive(cat.id)}
                          style={{
                            flex: 1,
                            background: "var(--bg2)",
                            border: "2px solid var(--border)",
                            borderRadius: 10,
                            color: "var(--ink2)",
                            fontSize: 13,
                            fontWeight: 700,
                            padding: "8px 14px",
                            cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            boxShadow: "2px 2px 0 var(--border)",
                            transition: "transform 0.1s, box-shadow 0.1s",
                          }}
                        >
                          <PauseCircle size={15} weight="bold" style={{ marginRight: 5, verticalAlign: "middle" }} />Deactivate
                        </button>
                        <button className="delete-btn" onClick={() => deleteCategory(cat.id)} style={{ flex: 1 }}>
                          <Trash size={15} weight="bold" style={{ marginRight: 5, verticalAlign: "middle" }} />Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Drag ghost — follows pointer, rendered outside card list flow */}
          {draggingId && ghostRect && (() => {
            const ghost = categories.find(c => c.id === draggingId);
            if (!ghost) return null;
            const ghostAmount = paycheckNum * ghost.percentage / 100;
            return (
              <div
                ref={ghostRef}
                className="cat-card drag-ghost"
                style={{
                  position: "fixed",
                  top: ghostRect.top,
                  left: ghostRect.left,
                  width: ghostRect.width,
                  pointerEvents: "none",
                  zIndex: 50,
                }}
              >
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="drag-handle" style={{ cursor: "grabbing" }}>
                      <span /><span /><span />
                    </div>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: ghost.color + "22",
                      border: `2.5px solid ${ghost.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, flexShrink: 0,
                      boxShadow: `2px 2px 0 ${ghost.color}55`,
                    }}>
                      <CatIcon name={ghost.icon} size={22} color={ghost.color} weight="duotone" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ghost.name}
                      </div>
                      {paycheckNum > 0 && (
                        <div style={{ fontSize: 13, color: "var(--ink3)", marginTop: 1, fontWeight: 600 }}>
                          {formatCurrency(ghostAmount)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: ghost.color, fontFamily: "var(--font-head)" }}>
                        {ghost.lockedAmount !== null ? formatCurrency(ghost.lockedAmount) : `${ghost.percentage}%`}
                      </div>
                    </div>
                    <div style={{ color: "var(--ink3)", flexShrink: 0, display: "flex", alignItems: "center" }}><CaretDown size={14} weight="bold" /></div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Inactive buckets */}
          {categories.some(c => c.inactive) && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "var(--ink3)",
                textTransform: "uppercase", letterSpacing: 0.9, marginBottom: 8, paddingLeft: 4,
                fontFamily: "var(--font-body)",
              }}>
                <PauseCircle size={13} weight="bold" style={{ verticalAlign: "middle", marginRight: 4 }} />Inactive Buckets
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {categories.filter(c => c.inactive).map(cat => (
                  <div key={cat.id} className="cat-card inactive-card" style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: cat.color + "18",
                        border: `2px dashed ${cat.color}70`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <CatIcon name={cat.icon} size={18} color={cat.color + "99"} weight="regular" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--font-body)" }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 1, fontWeight: 600 }}>
                          {cat.lockedAmount !== null
                            ? `${formatCurrency(cat.lockedAmount)} fixed`
                            : cat.lockedPct
                              ? `${cat.percentage}% fixed`
                              : `${cat.percentage.toFixed(1)}% when active`}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleInactive(cat.id)}
                        style={{
                          background: cat.color + "18",
                          border: `2px solid ${cat.color}`,
                          borderRadius: 10,
                          color: cat.color,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          flexShrink: 0,
                          transition: "all 0.15s",
                          boxShadow: `2px 2px 0 ${cat.color}44`,
                        }}
                      >
                        <Play size={12} weight="fill" style={{ marginRight: 4, verticalAlign: "middle" }} />Activate
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--ink3)",
                          fontSize: 16,
                          cursor: "pointer",
                          padding: "4px 6px",
                          flexShrink: 0,
                          lineHeight: 1,
                        }}
                        title="Delete"
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add category button */}
          <button
            className="ios-btn"
            onClick={() => setShowAdd(true)}
            style={{
              width: "100%",
              marginTop: 16,
              background: "var(--surface)",
              color: "var(--accent)",
              border: "2.5px dashed var(--accent)",
              borderRadius: "var(--radius-md)",
              boxShadow: `3px 3px 0 ${COLORS[4]}44`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: "var(--font-body)",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 900 }}>+</span>
            Add Category
          </button>
        </div>
      )}

      {/* Export Sheet */}
      {showExport && (
        <div
          style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(26,18,8,0.55)", display: "flex", alignItems: "flex-end", zIndex: 100, animation: "fadeIn 0.2s ease" }}
          onClick={e => { if (e.target === e.currentTarget) setShowExport(false); }}
        >
          <div className="sheet sheet-scroll" style={{
            width: "100%", maxWidth: 430, margin: "0 auto",
            background: "var(--bg)", borderRadius: "22px 22px 0 0", padding: "24px 20px 48px",
            border: "2.5px solid var(--ink)", borderBottom: "none",
            boxShadow: "0 -4px 0 var(--ink)",
          }}>
            {/* Drag pill */}
            <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 24px" }} />

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: "var(--font-head)", color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}><CreditCard size={22} weight="fill" color="var(--accent)" /> Paycheck Breakdown</h2>
              {paycheckNum > 0 && (
                <div style={{ fontSize: 15, color: "var(--ink3)", fontFamily: "var(--font-body)" }}>{formatCurrency(paycheckNum)} paycheck</div>
              )}
            </div>

            {/* Table */}
            <div style={{ background: "var(--surface)", borderRadius: 16, overflow: "hidden", marginBottom: 20, border: "2px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 64px 90px",
                padding: "10px 14px", borderBottom: "2px solid var(--border)",
                background: "var(--bg2)",
              }}>
                {["Category", "%", "Amount"].map((h, i) => (
                  <div key={h} style={{
                    fontSize: 11, fontWeight: 700, color: "var(--ink3)",
                    textTransform: "uppercase", letterSpacing: 0.6,
                    textAlign: i === 0 ? "left" : "right",
                    fontFamily: "var(--font-body)",
                  }}>{h}</div>
                ))}
              </div>

              {/* Active rows */}
              {categories.filter(c => !c.inactive).map((c, i, arr) => {
                const amt = paycheckNum > 0 ? formatCurrency(paycheckNum * c.percentage / 100) : "—";
                const isLast = i === arr.length - 1;
                return (
                  <div
                    key={c.id}
                    style={{
                      display: "grid", gridTemplateColumns: "1fr 64px 90px",
                      padding: "11px 14px",
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0, border: "1.5px solid var(--border)" }} />
                      <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--ink)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5 }}>
                        <CatIcon name={c.icon} size={14} color={c.color} weight="duotone" /> {c.name}
                      </span>
                      {(c.lockedAmount !== null || c.lockedPct) && (
                        <Lock size={10} weight="fill" color={c.color} style={{ flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink2)", textAlign: "right", fontFamily: "var(--font-body)" }}>
                      {c.percentage.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.color, textAlign: "right", fontFamily: "var(--font-body)" }}>
                      {amt}
                    </div>
                  </div>
                );
              })}

              {/* Divider */}
              <div style={{ height: 2, background: "var(--border)", margin: "0 14px" }} />

              {/* Total row */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 64px 90px",
                padding: "11px 14px", alignItems: "center",
                background: "var(--bg2)",
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-head)", letterSpacing: 0.5 }}>TOTAL</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: total > 100 ? "var(--danger)" : total === 100 ? "var(--success)" : "var(--ink)", textAlign: "right", fontFamily: "var(--font-body)" }}>
                  {total.toFixed(1)}%
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: total > 100 ? "var(--danger)" : "var(--ink)", textAlign: "right", fontFamily: "var(--font-body)" }}>
                  {paycheckNum > 0 ? formatCurrency(paycheckNum * total / 100) : "—"}
                </div>
              </div>

              {/* Unallocated row (if any) */}
              {100 - total > 0.005 && paycheckNum > 0 && (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 64px 90px",
                  padding: "10px 14px", alignItems: "center",
                  borderTop: "1px solid var(--border)",
                  background: `${COLORS[3]}12`,
                }}>
                  <div style={{ fontSize: 13, color: "var(--success)", fontWeight: 600, fontFamily: "var(--font-body)" }}>Unallocated</div>
                  <div style={{ fontSize: 13, color: "var(--success)", textAlign: "right", fontFamily: "var(--font-body)" }}>{(100 - total).toFixed(1)}%</div>
                  <div style={{ fontSize: 13, color: "var(--success)", textAlign: "right", fontFamily: "var(--font-body)" }}>{formatCurrency(paycheckNum * (100 - total) / 100)}</div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button
                className="ios-btn"
                onClick={handleCopyText}
                style={{ flex: 1, background: "var(--surface)", color: "var(--ink)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "2px solid var(--border)", boxShadow: "var(--shadow-sm)", fontFamily: "var(--font-body)" }}
              >
                <ClipboardText size={16} weight="bold" /> Copy
              </button>
              <button
                className="ios-btn"
                onClick={handleDownloadCsv}
                style={{ flex: 1, background: "var(--surface)", color: "var(--ink)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "2px solid var(--border)", boxShadow: "var(--shadow-sm)", fontFamily: "var(--font-body)" }}
              >
                <FileCsv size={16} weight="bold" /> CSV
              </button>
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  className="ios-btn"
                  onClick={handleShare}
                  style={{ flex: 1, background: "var(--accent)", color: "white", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", fontFamily: "var(--font-body)" }}
                >
                  <ShareNetwork size={16} weight="bold" /> Share
                </button>
              )}
            </div>

            {/* Close */}
            <button
              className="ios-btn"
              onClick={() => setShowExport(false)}
              style={{ width: "100%", background: "var(--bg2)", color: "var(--ink3)", border: "2px solid var(--border)", fontFamily: "var(--font-body)" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Category Sheet */}
      {showAdd && (
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(26,18,8,0.55)",
          display: "flex", alignItems: "flex-end", zIndex: 100, animation: "fadeIn 0.2s ease"
        }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="sheet sheet-scroll-lg" style={{
            width: "100%", maxWidth: 430, margin: "0 auto",
            background: "var(--bg)", borderRadius: "22px 22px 0 0", padding: "24px 20px 48px",
            border: "2.5px solid var(--ink)", borderBottom: "none",
            boxShadow: "0 -4px 0 var(--ink)",
          }}>
            <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 24px" }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px", fontFamily: "var(--font-head)", color: "var(--ink)" }}>New Category</h2>

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 6, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: 0.5 }}>NAME</div>
              <input
                type="text"
                className="ios-input"
                placeholder="e.g. Vacation Fund"
                value={newCat.name}
                onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>

            {/* Lock type picker */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 8, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: 0.5 }}>TYPE</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { key: "none", icon: null, label: "Free %", sub: "Adjusts dynamically" },
                  { key: "pct",  icon: <Lock size={11} weight="fill" style={{ verticalAlign: "middle", marginRight: 3 }} />, label: "Fixed %", sub: "Locked percentage" },
                  { key: "amount", icon: <Lock size={11} weight="fill" style={{ verticalAlign: "middle", marginRight: 3 }} />, label: "Fixed $", sub: "Locked dollar amount" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    className={`lock-type-btn${newCat.lockType === opt.key ? " active" : ""}`}
                    onClick={() => setNewCat(p => ({ ...p, lockType: opt.key, value: "" }))}
                    style={newCat.lockType === opt.key ? { borderColor: newCat.color, color: newCat.color, background: newCat.color + "18" } : {}}
                  >
                    {opt.icon}{opt.label}<br />
                    <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Value input — adapts to lock type */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 6, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: 0.5 }}>
                {newCat.lockType === "amount" ? "DOLLAR AMOUNT" : "PERCENTAGE"}
              </div>
              <div style={{ position: "relative" }}>
                {newCat.lockType === "amount" && (
                  <span style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    fontSize: 17, fontWeight: 700, color: "var(--ink3)", pointerEvents: "none"
                  }}>$</span>
                )}
                <input
                  type="text"
                  inputMode="decimal"
                  className="ios-input"
                  placeholder={newCat.lockType === "amount" ? "e.g. 1200" : "e.g. 10"}
                  value={newCat.value}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                    setNewCat(p => ({ ...p, value: cleaned }));
                  }}
                  style={{
                    paddingLeft: newCat.lockType === "amount" ? 28 : 16,
                    paddingRight: newCat.lockType !== "amount" ? 32 : 16,
                    fontSize: 17, fontWeight: 600,
                  }}
                />
                {newCat.lockType !== "amount" && (
                  <span style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    fontSize: 14, fontWeight: 700, color: "var(--ink3)", pointerEvents: "none"
                  }}>%</span>
                )}
              </div>
              {/* Helper: show derived % when amount mode and paycheck is set */}
              {newCat.lockType === "amount" && paycheckNum > 0 && newCat.value && (
                <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 6, paddingLeft: 4 }}>
                  ≈ {((parseFloat(newCat.value) || 0) / paycheckNum * 100).toFixed(1)}% of your paycheck
                </div>
              )}
            </div>

            {/* Icon */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 8, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: 0.5 }}>ICON</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setNewCat(p => ({ ...p, icon: ic }))} style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: newCat.icon === ic ? `2.5px solid ${newCat.color}` : "2px solid var(--border)",
                    background: newCat.icon === ic ? newCat.color + "20" : "var(--surface)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: newCat.icon === ic ? `2px 2px 0 ${newCat.color}66` : "1px 1px 0 var(--border)",
                    transition: "all 0.15s",
                  }}>
                    <CatIcon name={ic} size={18} color={newCat.icon === ic ? newCat.color : "var(--ink3)"} weight={newCat.icon === ic ? "duotone" : "regular"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 8, fontWeight: 700, fontFamily: "var(--font-body)", letterSpacing: 0.5 }}>COLOR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COLORS.map(col => (
                  <button key={col} onClick={() => setNewCat(p => ({ ...p, color: col }))} style={{
                    width: 32, height: 32, borderRadius: "50%",
                    border: newCat.color === col ? `3px solid var(--ink)` : "2.5px solid var(--border)",
                    background: col, cursor: "pointer", outline: "none",
                    boxShadow: newCat.color === col ? `2px 2px 0 var(--ink)` : "1px 1px 0 var(--border)",
                    transition: "all 0.15s",
                  }} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ios-btn" onClick={() => setShowAdd(false)} style={{
                flex: 1, background: "var(--bg2)", color: "var(--ink3)",
                border: "2px solid var(--border)", fontFamily: "var(--font-body)",
              }}>
                Cancel
              </button>
              <button className="ios-btn" onClick={addCategory} style={{
                flex: 2, background: newCat.color, color: "white",
                border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)",
                opacity: newCat.name && newCat.value ? 1 : 0.45,
                fontFamily: "var(--font-body)", fontWeight: 700,
              }}>
                Add <CatIcon name={newCat.icon} size={15} color="white" weight="fill" style={{ verticalAlign: "middle", margin: "0 3px" }} /> {newCat.name || "Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

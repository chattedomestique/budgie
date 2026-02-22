import { useState, useEffect, useRef } from “react”;

const DEFAULT_CATEGORIES = [
{ id: “1”, name: “Federal Taxes”, percentage: 22, color: “#FF3B30”, icon: “🏛️” },
{ id: “2”, name: “State Taxes”, percentage: 6, color: “#FF9500”, icon: “📋” },
{ id: “3”, name: “Rent”, percentage: 25, color: “#007AFF”, icon: “🏠” },
{ id: “4”, name: “Groceries”, percentage: 10, color: “#34C759”, icon: “🛒” },
{ id: “5”, name: “Savings”, percentage: 15, color: “#5856D6”, icon: “💰” },
{ id: “6”, name: “Medical Budget”, percentage: 5, color: “#FF2D55”, icon: “🏥” },
{ id: “7”, name: “Kids”, percentage: 8, color: “#AF52DE”, icon: “👶” },
{ id: “8”, name: “Gear Budget”, percentage: 5, color: “#32ADE6”, icon: “🎒” },
{ id: “9”, name: “Misc”, percentage: 4, color: “#FFCC00”, icon: “✨” },
];

const ICONS = [“🏛️”,“📋”,“🏠”,“🛒”,“💰”,“🏥”,“👶”,“🎒”,“✨”,“🚗”,“🍕”,“💊”,“📱”,“🎮”,“✈️”,“🎓”,“🐾”,“🏋️”,“🎵”,“📚”,“💻”,“👗”,“💇”,“🏖️”,“🍺”,“☕”,“🎁”,“🔧”,“🌿”,“🏦”];
const COLORS = [”#FF3B30”,”#FF9500”,”#FFCC00”,”#34C759”,”#007AFF”,”#5856D6”,”#AF52DE”,”#FF2D55”,”#32ADE6”,”#FF6B35”,”#4ECDC4”,”#45B7D1”,”#96CEB4”,”#FFEAA7”,”#DDA0DD”];

const STORAGE_KEY = “budgie”;

function loadData() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
if (raw) return JSON.parse(raw);
} catch {}
return null;
}

function saveData(data) {
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function formatCurrency(val) {
if (!val && val !== 0) return “$0.00”;
return new Intl.NumberFormat(“en-US”, { style: “currency”, currency: “USD” }).format(val);
}

export default function App() {
const stored = loadData();
const [paycheck, setPaycheck] = useState(stored?.paycheck ?? “”);
const [categories, setCategories] = useState(stored?.categories ?? DEFAULT_CATEGORIES);
const [editingId, setEditingId] = useState(null);
const [showAdd, setShowAdd] = useState(false);
const [newCat, setNewCat] = useState({ name: “”, percentage: “”, color: “#007AFF”, icon: “✨” });
const [view, setView] = useState(“split”); // split | donut
const [shake, setShake] = useState(false);
const paycheckRef = useRef(null);

const total = categories.reduce((s, c) => s + c.percentage, 0);
const overBudget = total > 100;
const paycheckNum = parseFloat(paycheck) || 0;

useEffect(() => {
saveData({ paycheck, categories });
}, [paycheck, categories]);

useEffect(() => {
if (overBudget) {
setShake(true);
setTimeout(() => setShake(false), 500);
}
}, [overBudget]);

function updateCategory(id, field, value) {
setCategories(prev => prev.map(c => c.id === id ? { …c, [field]: value } : c));
}

function deleteCategory(id) {
setCategories(prev => prev.filter(c => c.id !== id));
setEditingId(null);
}

function addCategory() {
if (!newCat.name.trim() || !newCat.percentage) return;
const cat = {
id: Date.now().toString(),
name: newCat.name.trim(),
percentage: parseFloat(newCat.percentage) || 0,
color: newCat.color,
icon: newCat.icon,
};
setCategories(prev => […prev, cat]);
setNewCat({ name: “”, percentage: “”, color: COLORS[Math.floor(Math.random()*COLORS.length)], icon: “✨” });
setShowAdd(false);
}

function distributeEvenly() {
const each = parseFloat((100 / categories.length).toFixed(1));
setCategories(prev => prev.map((c, i) => ({
…c,
percentage: i === categories.length - 1
? parseFloat((100 - each * (categories.length - 1)).toFixed(1))
: each
})));
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
const slice = { …c, dash, gap, offset: offset * circ };
offset += pct;
return slice;
});
return (
<svg width={size} height={size} style={{ display: “block”, margin: “0 auto” }}>
<circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeW} />
{slices.map((s, i) => (
<circle
key={s.id}
cx={cx} cy={cy} r={r}
fill=“none”
stroke={s.color}
strokeWidth={strokeW}
strokeDasharray={`${s.dash} ${s.gap}`}
strokeDashoffset={-s.offset + circ / 4}
strokeLinecap=“round”
style={{ transition: “stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease” }}
/>
))}
<text x={cx} y={cy - 10} textAnchor=“middle” fill=“white” fontSize=“22” fontWeight=“700” fontFamily=”-apple-system, SF Pro Display, sans-serif”>
{paycheckNum ? formatCurrency(paycheckNum) : “—”}
</text>
<text x={cx} y={cy + 14} textAnchor=“middle” fill=“rgba(255,255,255,0.5)” fontSize=“12” fontFamily=”-apple-system, SF Pro Text, sans-serif”>
paycheck
</text>
<text x={cx} y={cy + 34} textAnchor=“middle” fill={overBudget ? “#FF3B30” : “rgba(255,255,255,0.4)”} fontSize=“12” fontWeight=“600” fontFamily=”-apple-system, SF Pro Text, sans-serif”>
{total.toFixed(1)}% {overBudget ? “⚠ over 100%” : “allocated”}
</text>
</svg>
);
};

return (
<div style={{
minHeight: “100vh”,
background: “#000000”,
fontFamily: “-apple-system, ‘SF Pro Display’, ‘SF Pro Text’, ‘Helvetica Neue’, sans-serif”,
color: “white”,
maxWidth: 430,
margin: “0 auto”,
paddingBottom: 100,
}}>
<style>{`* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; } input, textarea { -webkit-appearance: none; } @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } } @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .cat-row { animation: slideUp 0.25s ease both; } .sheet { animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both; } .ios-input { background: rgba(255,255,255,0.09); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 12px; color: white; padding: 14px 16px; font-size: 17px; font-family: -apple-system, sans-serif; width: 100%; outline: none; transition: border-color 0.2s; } .ios-input:focus { border-color: #007AFF; } .ios-input::placeholder { color: rgba(255,255,255,0.3); } .ios-btn { padding: 14px 24px; border-radius: 14px; border: none; font-size: 17px; font-weight: 600; cursor: pointer; font-family: -apple-system, sans-serif; transition: transform 0.1s, opacity 0.2s; -webkit-user-select: none; } .ios-btn:active { transform: scale(0.96); opacity: 0.85; } .seg-btn { flex: 1; padding: 8px; border: none; font-size: 13px; font-weight: 600; font-family: -apple-system, sans-serif; cursor: pointer; border-radius: 9px; transition: all 0.2s; } .cat-card { background: rgba(255,255,255,0.07); border-radius: 16px; transition: background 0.2s; } .cat-card:active { background: rgba(255,255,255,0.11); } .delete-btn { background: #FF3B30; border: none; border-radius: 10px; color: white; font-size: 13px; font-weight: 600; padding: 8px 14px; cursor: pointer; font-family: -apple-system, sans-serif; } .delete-btn:active { opacity: 0.8; } ::-webkit-scrollbar { display: none; } input[type=range] { -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; outline: none; cursor: pointer; } input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }`}</style>

```
  {/* Status bar spacer */}
  <div style={{ height: 56 }} />

  {/* Header */}
  <div style={{ padding: "0 20px 20px" }}>
    <h1 style={{ fontSize: 34, fontWeight: 700, margin: "0 0 4px", letterSpacing: -0.5 }}>Paycheck</h1>
    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: 0 }}>Divide your money with intention</p>
  </div>

  {/* Paycheck Input */}
  <div style={{ padding: "0 20px 24px" }}>
    <div style={{
      background: "linear-gradient(135deg, rgba(0,122,255,0.25) 0%, rgba(88,86,214,0.2) 100%)",
      border: "1.5px solid rgba(0,122,255,0.35)",
      borderRadius: 20,
      padding: "20px"
    }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>
        Paycheck Amount
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>$</span>
        <input
          ref={paycheckRef}
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={paycheck}
          onChange={e => setPaycheck(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: 36,
            fontWeight: 700,
            width: "100%",
            outline: "none",
            fontFamily: "-apple-system, sans-serif",
            letterSpacing: -0.5,
          }}
        />
      </div>
      {paycheckNum > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Unallocated</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: overBudget ? "#FF3B30" : total < 100 ? "#34C759" : "rgba(255,255,255,0.7)" }}>
            {formatCurrency(paycheckNum * (1 - total / 100))}
          </span>
        </div>
      )}
    </div>
  </div>

  {/* Segment Control */}
  <div style={{ padding: "0 20px 20px" }}>
    <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 3, gap: 2 }}>
      {[["split", "💳 Split"], ["donut", "🎯 Overview"]].map(([v, label]) => (
        <button key={v} className="seg-btn" onClick={() => setView(v)} style={{
          background: view === v ? "rgba(255,255,255,0.18)" : "transparent",
          color: view === v ? "white" : "rgba(255,255,255,0.5)",
        }}>
          {label}
        </button>
      ))}
    </div>
  </div>

  {view === "donut" ? (
    /* Donut View */
    <div style={{ padding: "0 20px" }}>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 24, padding: "24px 20px" }}>
        <DonutChart />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {categories.map(c => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px"
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    /* Split View */
    <div style={{ padding: "0 20px" }}>
      {/* Total bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, animation: shake ? "shake 0.5s ease" : "none"
      }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
          {total.toFixed(1)}% of 100%
        </div>
        <button
          className="ios-btn"
          onClick={distributeEvenly}
          style={{ padding: "7px 14px", fontSize: 13, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", borderRadius: 10 }}
        >
          Distribute Evenly
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, marginBottom: 20, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: overBudget ? "#FF3B30" : total === 100 ? "#34C759" : "#007AFF",
          width: `${Math.min(total, 100)}%`,
          transition: "width 0.3s ease, background 0.3s ease"
        }} />
      </div>

      {/* Category cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {categories.map((cat, idx) => {
          const amount = paycheckNum * cat.percentage / 100;
          const isEditing = editingId === cat.id;
          return (
            <div key={cat.id} className="cat-card" style={{ animationDelay: `${idx * 0.04}s` }}>
              <div
                style={{ padding: "14px 16px", cursor: "pointer" }}
                onClick={() => setEditingId(isEditing ? null : cat.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: cat.color + "25",
                    border: `2px solid ${cat.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, flexShrink: 0
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cat.name}
                    </div>
                    {paycheckNum > 0 && (
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
                        {formatCurrency(amount)}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: cat.color }}>{cat.percentage}%</div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, flexShrink: 0 }}>
                    {isEditing ? "▲" : "▼"}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 500 }}>NAME</div>
                    <input
                      type="text"
                      className="ios-input"
                      value={cat.name}
                      onChange={e => updateCategory(cat.id, "name", e.target.value)}
                      style={{ fontSize: 15, padding: "11px 14px" }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>PERCENTAGE</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: cat.color }}>{cat.percentage}%</div>
                    </div>
                    <input
                      type="range"
                      min="0" max="100" step="0.5"
                      value={cat.percentage}
                      onChange={e => updateCategory(cat.id, "percentage", parseFloat(e.target.value))}
                      style={{
                        accentColor: cat.color,
                        background: `linear-gradient(to right, ${cat.color} 0%, ${cat.color} ${cat.percentage}%, rgba(255,255,255,0.15) ${cat.percentage}%, rgba(255,255,255,0.15) 100%)`,
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>0%</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>100%</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>ICON</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ICONS.map(ic => (
                        <button key={ic} onClick={() => updateCategory(cat.id, "icon", ic)} style={{
                          width: 36, height: 36, borderRadius: 10, border: cat.icon === ic ? `2px solid ${cat.color}` : "2px solid transparent",
                          background: cat.icon === ic ? cat.color + "30" : "rgba(255,255,255,0.07)",
                          fontSize: 18, cursor: "pointer", transition: "all 0.15s"
                        }}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>COLOR</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {COLORS.map(col => (
                        <button key={col} onClick={() => updateCategory(cat.id, "color", col)} style={{
                          width: 32, height: 32, borderRadius: "50%", border: cat.color === col ? "3px solid white" : "3px solid transparent",
                          background: col, cursor: "pointer", transition: "all 0.15s",
                          outline: "none", boxShadow: cat.color === col ? `0 0 0 2px ${col}` : "none"
                        }} />
                      ))}
                    </div>
                  </div>

                  <button className="delete-btn" onClick={() => deleteCategory(cat.id)} style={{ width: "100%" }}>
                    Delete Category
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add category button */}
      <button
        className="ios-btn"
        onClick={() => setShowAdd(true)}
        style={{
          width: "100%",
          marginTop: 16,
          background: "rgba(255,255,255,0.07)",
          color: "#007AFF",
          border: "1.5px dashed rgba(0,122,255,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
        Add Category
      </button>
    </div>
  )}

  {/* Add Category Sheet */}
  {showAdd && (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end", zIndex: 100, animation: "fadeIn 0.2s ease"
    }} onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
      <div className="sheet" style={{
        width: "100%", maxWidth: 430, margin: "0 auto",
        background: "#1C1C1E", borderRadius: "24px 24px 0 0", padding: "24px 20px 48px"
      }}>
        <div style={{ width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 24px" }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>New Category</h2>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 500 }}>NAME</div>
          <input
            type="text"
            className="ios-input"
            placeholder="e.g. Vacation Fund"
            value={newCat.name}
            onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 500 }}>PERCENTAGE</div>
          <input
            type="number"
            inputMode="decimal"
            className="ios-input"
            placeholder="e.g. 10"
            value={newCat.percentage}
            onChange={e => setNewCat(p => ({ ...p, percentage: e.target.value }))}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>ICON</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ICONS.map(ic => (
              <button key={ic} onClick={() => setNewCat(p => ({ ...p, icon: ic }))} style={{
                width: 36, height: 36, borderRadius: 10,
                border: newCat.icon === ic ? `2px solid ${newCat.color}` : "2px solid transparent",
                background: newCat.icon === ic ? newCat.color + "30" : "rgba(255,255,255,0.07)",
                fontSize: 18, cursor: "pointer"
              }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>COLOR</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {COLORS.map(col => (
              <button key={col} onClick={() => setNewCat(p => ({ ...p, color: col }))} style={{
                width: 32, height: 32, borderRadius: "50%",
                border: newCat.color === col ? "3px solid white" : "3px solid transparent",
                background: col, cursor: "pointer", outline: "none",
                boxShadow: newCat.color === col ? `0 0 0 2px ${col}` : "none"
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="ios-btn" onClick={() => setShowAdd(false)} style={{
            flex: 1, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)"
          }}>
            Cancel
          </button>
          <button className="ios-btn" onClick={addCategory} style={{
            flex: 2, background: newCat.color, color: "white",
            opacity: newCat.name && newCat.percentage ? 1 : 0.45
          }}>
            Add {newCat.icon} {newCat.name || "Category"}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
```

);
}

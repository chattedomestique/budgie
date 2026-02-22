import { useState, useEffect, useRef } from "react";

const DEFAULT_CATEGORIES = [
{ id: "1", name: "Federal Taxes", percentage: 22, color: "#FF3B30", icon: "🏛️" },
{ id: "2", name: "State Taxes", percentage: 6, color: "#FF9500", icon: "📋" },
{ id: "3", name: "Rent", percentage: 25, color: "#007AFF", icon: "🏠" },
{ id: "4", name: "Groceries", percentage: 10, color: "#34C759", icon: "🛒" },
{ id: "5", name: "Savings", percentage: 15, color: "#5856D6", icon: "💰" },
{ id: "6", name: "Medical Budget", percentage: 5, color: "#FF2D55", icon: "🏥" },
{ id: "7", name: "Kids", percentage: 8, color: "#AF52DE", icon: "👶" },
{ id: "8", name: "Gear Budget", percentage: 5, color: "#32ADE6", icon: "🎒" },
{ id: "9", name: "Misc", percentage: 4, color: "#FFCC00", icon: "✨" },
];

const ICONS = ["🏛️","📋","🏠","🛒","💰","🏥","👶","🎒","✨","🚗","🍕","💊","📱","🎮","✈️","🎓","🐾","🏋️","🎵","📚","💻","👗","💇","🏖️","🍺","☕","🎁","🔧","🌿","🏦"];
const COLORS = ["#FF3B30","#FF9500","#FFCC00","#34C759","#007AFF","#5856D6","#AF52DE","#FF2D55","#32ADE6","#FF6B35","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD"];

const STORAGE_KEY = "paycheck-divider-v1";

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
if (!val && val !== 0) return "$0.00";
return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

export default function App() {
const stored = loadData();
const [paycheck, setPaycheck] = useState(stored?.paycheck ?? "");
const [categories, setCategories] = useState(stored?.categories ?? DEFAULT_CATEGORIES);
const [editingId, setEditingId] = useState(null);
const [showAdd, setShowAdd] = useState(false);
const [newCat, setNewCat] = useState({ name: "", percentage: "", color: "#007AFF", icon: "✨" });
const [view, setView] = useState("split"); // split   donut
const [shake, setShake] = useState(false);
const paycheckRef = useRef(null);

const total = categories.reduce((s, c) => s + c.percentage, 0);
const overBudget = total > 100;
const paycheckNum = parseFloat(paycheck)    0;

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
setCategories(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
}

function deleteCategory(id) {
setCategories(prev => prev.filter(c => c.id !== id));
setEditingId(null);
}

function addCategory() {
if (!newCat.name.trim()    !newCat.percentage) return;
const cat = {
id: Date.now().toString(),
name: newCat.name.trim(),
percentage: parseFloat(newCat.percentage)    0,
color: newCat.color,
icon: newCat.icon,
};
setCategories(prev => [...prev, cat]);
setNewCat({ name: "", percentage: "", color: COLORS[Math.floor(Math.random()*COLORS.length)], icon: "✨" });
setShowAdd(false);
}

function distributeEvenly() {
const each = parseFloat((100 / categories.length).toFixed(1));
setCategories(prev => prev.map((c, i) => ({
...c,
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
const slice = { ...c, dash, gap, offset: offset * circ };
offset += pct;
return slice;
});
return (
{paycheckNum ? formatCurrency(paycheckNum) : "--"}
paycheck
{total.toFixed(1)}% {overBudget ? "⚠ over 100%" : "allocated"}

);
};

return (



```
  {/* Status bar spacer */}
  


  {/* Header */}
  

    
Paycheck


    
Divide your money with intention


  


  {/* Paycheck Input */}
  

    

      

        Paycheck Amount
      

      

        $
         setPaycheck(e.target.value)}
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
      

      {paycheckNum > 0 && (
        

          Unallocated
          
            {formatCurrency(paycheckNum * (1 - total / 100))}
          
        

      )}
    

  


  {/* Segment Control */}
  

    

      {[["split", "💳 Split"], ["donut", "🎯 Overview"]].map(([v, label]) => (
        SETVIEW(V)} STYLE={{ BACKGROUND: VIEW === V ? "RGBA(255,255,255,0.18)" : "TRANSPARENT", COLOR: VIEW === V ? "WHITE" : "RGBA(255,255,255,0.5)", }}> {LABEL}  
      ))}
    

  


  {view === "donut" ? (
    /* Donut View */
    

      

        
        

          {categories.map(c => (
            

              

              

                
{c.name}

                
{c.percentage}%

              

            

          ))}
        

      

    

  ) : (
    /* Split View */
    

      {/* Total bar */}
      

        

          {total.toFixed(1)}% of 100%
        

        DISTRIBUTE EVENLY  
      


      {/* Progress bar */}
      

        

      


      {/* Category cards */}
      

        {categories.map((cat, idx) => {
          const amount = paycheckNum * cat.percentage / 100;
          const isEditing = editingId === cat.id;
          return (
            

              
 setEditingId(isEditing ? null : cat.id)}
              >
                

                  

                    {cat.icon}
                  

                  

                    

                      {cat.name}
                    

                    {paycheckNum > 0 && (
                      

                        {formatCurrency(amount)}
                      

                    )}
                  

                  

                    
{cat.percentage}%

                  

                  

                    {isEditing ? "▲" : "▼"}
                  

                

              


              {isEditing && (
                

                  

                    
NAME

                     updateCategory(cat.id, "name", e.target.value)}
                      style={{ fontSize: 15, padding: "11px 14px" }}
                    />
                  


                  

                    

                      
PERCENTAGE

                      
{cat.percentage}%

                    

                     updateCategory(cat.id, "percentage", parseFloat(e.target.value))}
                      style={{
                        accentColor: cat.color,
                        background: `linear-gradient(to right, ${cat.color} 0%, ${cat.color} ${cat.percentage}%, rgba(255,255,255,0.15) ${cat.percentage}%, rgba(255,255,255,0.15) 100%)`,
                      }}
                    />
                    

                      0%
                      100%
                    

                  


                  

                    
ICON

                    

                      {ICONS.map(ic => (
                        UPDATECATEGORY(CAT.ID, "ICON", IC)} STYLE={{ WIDTH: 36, HEIGHT: 36, BORDERRADIUS: 10, BORDER: CAT.ICON === IC ? `2PX SOLID ${CAT.COLOR}` : "2PX SOLID TRANSPARENT", BACKGROUND: CAT.ICON === IC ? CAT.COLOR + "30" : "RGBA(255,255,255,0.07)", FONTSIZE: 18, CURSOR: "POINTER", TRANSITION: "ALL 0.15S" }}> {IC}  
                      ))}
                    

                  


                  

                    
COLOR

                    

                      {COLORS.map(col => (
                        UPDATECATEGORY(CAT.ID, "COLOR", COL)} STYLE={{ WIDTH: 32, HEIGHT: 32, BORDERRADIUS: "50%", BORDER: CAT.COLOR === COL ? "3PX SOLID WHITE" : "3PX SOLID TRANSPARENT", BACKGROUND: COL, CURSOR: "POINTER", TRANSITION: "ALL 0.15S", OUTLINE: "NONE", BOXSHADOW: CAT.COLOR === COL ? `0 0 0 2PX ${COL}` : "NONE" }} /> ))} 

                  


                  DELETECATEGORY(CAT.ID)} STYLE={{ WIDTH: "100%" }}> DELETE CATEGORY  
                

              )}
            

          );
        })}
      


      {/* Add category button */}
      SETSHOWADD(TRUE)} STYLE={{ WIDTH: "100%", MARGINTOP: 16, BACKGROUND: "RGBA(255,255,255,0.07)", COLOR: "#007AFF", BORDER: "1.5PX DASHED RGBA(0,122,255,0.35)", DISPLAY: "FLEX", ALIGNITEMS: "CENTER", JUSTIFYCONTENT: "CENTER", GAP: 8 }} > + ADD CATEGORY  
    

  )}

  {/* Add Category Sheet */}
  {showAdd && (
    
 { if (e.target === e.currentTarget) setShowAdd(false); }}>
      

        

        
New Category



        

          
NAME

           setNewCat(p => ({ ...p, name: e.target.value }))}
            autoFocus
          />
        


        

          
PERCENTAGE

           setNewCat(p => ({ ...p, percentage: e.target.value }))}
          />
        


        

          
ICON

          

            {ICONS.map(ic => (
              SETNEWCAT(P => ({ ...P, ICON: IC }))} STYLE={{ WIDTH: 36, HEIGHT: 36, BORDERRADIUS: 10, BORDER: NEWCAT.ICON === IC ? `2PX SOLID ${NEWCAT.COLOR}` : "2PX SOLID TRANSPARENT", BACKGROUND: NEWCAT.ICON === IC ? NEWCAT.COLOR + "30" : "RGBA(255,255,255,0.07)", FONTSIZE: 18, CURSOR: "POINTER" }}> {IC}  
            ))}
          

        


        

          
COLOR

          

            {COLORS.map(col => (
              SETNEWCAT(P => ({ ...P, COLOR: COL }))} STYLE={{ WIDTH: 32, HEIGHT: 32, BORDERRADIUS: "50%", BORDER: NEWCAT.COLOR === COL ? "3PX SOLID WHITE" : "3PX SOLID TRANSPARENT", BACKGROUND: COL, CURSOR: "POINTER", OUTLINE: "NONE", BOXSHADOW: NEWCAT.COLOR === COL ? `0 0 0 2PX ${COL}` : "NONE" }} /> ))} 

        


        

          SETSHOWADD(FALSE)} STYLE={{ FLEX: 1, BACKGROUND: "RGBA(255,255,255,0.1)", COLOR: "RGBA(255,255,255,0.8)" }}> CANCEL  
          ADD {NEWCAT.ICON} {NEWCAT.NAME "CATEGORY"}  
        

      

    

  )}

```

);
}

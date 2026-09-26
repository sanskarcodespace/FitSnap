"use client"
import { useEffect, useRef, useState } from "react"
import { Camera, Search, Plus, Trash2, ArrowRight, Check, BookOpen, ScanLine, LoaderCircle, PencilLine, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { searchFoodLibrary, uploadTempFoodPhoto, analyzeFoodPhoto, type SaveMealInput } from "@/app/(authenticated)/client/food/actions"
import { scaleNutrients, type CatalogFood, type FoodProvider, type Nutrients } from "@/lib/food/catalog-types"

type Item = SaveMealInput["foodItems"][number];
type StoredItem = Item & { id?: string; nutritionSource?: string | null; sourceFoodId?: string | null; portionAmount?: number | null; portionUnit?: string | null };
type Props = {
  isOpen: boolean; onClose: () => void; isPending: boolean;
  onSave: (mealType: string, items: Item[], photoReference?: string | null, source?: string) => void;
  initialData?: { id?: string; mealType: string; photoReference?: string | null; source?: string; foodItems: StoredItem[] } | null;
};
const metricLabels: Record<keyof Nutrients, string> = { calories: "Calories (kcal)", proteinGrams: "Protein (g)", carbGrams: "Carbs (g)", fatGrams: "Fat (g)", fiberGrams: "Fiber (g)", sugarGrams: "Sugar (g)", sodiumMg: "Sodium (mg)" };
const emptyManual = () => ({ name: "", portionDescription: "", calories: "", proteinGrams: "", carbGrams: "", fatGrams: "", fiberGrams: "", sugarGrams: "", sodiumMg: "" });

/** Unmounting the form discards drafts and stale lookup results between meals. */
export function AddMealDialog(props: Props) {
  if (!props.isOpen) return null;
  return <MealComposer key={props.initialData?.id || "new"} {...props} />;
}
function MealComposer({ onClose, onSave, isPending, initialData }: Props) {
  const [mode, setMode] = useState<"search" | "photo" | "manual">("search");
  const [mealType, setMealType] = useState(initialData?.mealType || "Breakfast");
  const [items, setItems] = useState<Item[]>(() => (initialData?.foodItems || []).map(item => ({
    ...item,
    catalogRef: (item.nutritionSource === "openfoodfacts" || item.nutritionSource === "usda") &&
      item.sourceFoodId && item.portionAmount && (item.portionUnit === "g" || item.portionUnit === "ml")
      ? { provider: item.nutritionSource, id: item.sourceFoodId, amount: item.portionAmount, unit: item.portionUnit } : undefined,
  })));
  const [photo, setPhoto] = useState(initialData?.photoReference || null);
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<FoodProvider>("openfoodfacts");
  const [results, setResults] = useState<CatalogFood[]>([]);
  const [searched, setSearched] = useState(false);
  const [chosen, setChosen] = useState<CatalogFood | null>(null);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"g" | "ml">("g");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; quantity: number; unit: string }[]>([]);
  const [manual, setManual] = useState(emptyManual);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const working = busy || isPending;
  const preview = (() => { try { return chosen ? scaleNutrients(chosen, Number(amount), unit) : null; } catch { return null; } })();

  async function search(term = query) {
    setError(""); setBusy(true); setChosen(null); setResults([]); setSearched(false);
    try {
      const response = await searchFoodLibrary(term, provider);
      if (!alive.current) return;
      if (response.error) setError(response.error);
      else { setResults(response.foods || []); setSearched(true); }
    } catch { if (alive.current) setError("Could not reach the food library. Please try again."); }
    finally { if (alive.current) setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    setError(""); setBusy(true); setSuggestions([]);
    try {
      const data = new FormData(); data.set("photo", file);
      const uploaded = await uploadTempFoodPhoto(data);
      if (!alive.current) return;
      if (uploaded.error || !uploaded.tempUrl) { setError(uploaded.error || "Could not upload this photo."); return; }
      setPhoto(uploaded.tempUrl);
      const recognized = await analyzeFoodPhoto(uploaded.tempUrl);
      if (!alive.current) return;
      if (recognized.error) setError(recognized.error);
      else if (!recognized.items?.length) setError("No food could be identified confidently. Search by name or enter the label instead.");
      else setSuggestions(recognized.items);
    } catch { if (alive.current) setError("The photo could not be processed. You can still search by name."); }
    finally { if (alive.current) setBusy(false); }
  }
  function addChosen() {
    if (!chosen || !preview || !confirmed) return;
    if (items.length >= 20) { setError("A meal can contain up to 20 foods."); return; }
    setItems(prev => [...prev, { name: chosen.name, ...preview, portionDescription: `${amount} ${unit}`,
      originType: "database", catalogRef: { provider: chosen.provider, id: chosen.id, amount: Number(amount), unit } }]);
    setChosen(null); setConfirmed(false); setAmount(""); setResults([]); setQuery(""); setSearched(false);
  }
  function addManual() {
    if (!manual.name.trim()) { setError("Enter the food name."); return; }
    const required = ["calories", "proteinGrams", "carbGrams", "fatGrams"] as const;
    if (required.some(key => manual[key] === "" || !Number.isInteger(Number(manual[key])) || Number(manual[key]) < 0)) {
      setError("Enter calories, protein, carbs and fat from the label, using non-negative whole numbers."); return;
    }
    const optional = ["fiberGrams", "sugarGrams", "sodiumMg"] as const;
    if (optional.some(key => manual[key] !== "" && (!Number.isInteger(Number(manual[key])) || Number(manual[key]) < 0))) {
      setError("Optional nutrients must be non-negative whole numbers, or left blank."); return;
    }
    if (items.length >= 20) { setError("A meal can contain up to 20 foods."); return; }
    setItems(prev => [...prev, { name: manual.name.trim(), portionDescription: manual.portionDescription,
      calories: Number(manual.calories), proteinGrams: Number(manual.proteinGrams), carbGrams: Number(manual.carbGrams),
      fatGrams: Number(manual.fatGrams), fiberGrams: manual.fiberGrams === "" ? null : Number(manual.fiberGrams),
      sugarGrams: manual.sugarGrams === "" ? null : Number(manual.sugarGrams),
      sodiumMg: manual.sodiumMg === "" ? null : Number(manual.sodiumMg), originType: "manual" }]);
    setManual(emptyManual()); setError("");
  }

  return <Modal isOpen onClose={() => { if (!working) onClose(); }} title={initialData ? "Edit your meal" : "A little nourishment."}
    description="A considered food journal, one meal at a time." className="meal-composer"
    footer={<div className="composer-footer"><span>{items.length} food{items.length !== 1 ? "s" : ""} · {items.reduce((sum, item) => sum + item.calories, 0)} kcal</span><Button onClick={() => onSave(mealType, items, photo, photo ? "ai_assisted" : "manual")} disabled={!items.length || working} isLoading={isPending}>Save meal <ArrowRight size={16}/></Button></div>}>
    <fieldset disabled={working} className="space-y-5 min-w-0">
      <label className="composer-field">Meal<select value={mealType} onChange={event => setMealType(event.target.value)}>{["Breakfast", "Lunch", "Dinner", "Snack"].map(type => <option key={type}>{type}</option>)}</select></label>
      <div className="composer-modes" role="group" aria-label="How to add food">
        {([{ id: "search", label: "Food library", icon: Search }, { id: "photo", label: "Photo", icon: Camera }, { id: "manual", label: "Enter label", icon: PencilLine }] as const).map(tab =>
          <button type="button" key={tab.id} aria-pressed={mode === tab.id} onClick={() => { setMode(tab.id); setError(""); }}><tab.icon size={17}/>{tab.label}</button>)}
      </div>
      {mode === "photo" && <div className="space-y-4">
        <label className="photo-drop"><span className="photo-drop-icon"><ScanLine size={28}/></span><strong>What’s on your plate?</strong><span>Upload a meal photo to suggest food names.</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic" aria-label="Upload meal photo" onChange={event => upload(event.target.files?.[0])}/><small>Up to 5 MB · Processed with Gemini for food suggestions.</small></label>
        {photo && <img src={photo} alt="Your uploaded meal" className="composer-photo" width={120} height={120}/>}
        <p className="nutrition-note">A photo cannot measure ingredients, cooking oils, or weight. Suggestions are estimates. Confirm a food record and a measured portion before saving.</p>
        {suggestions.length > 0 && <div><p className="eyebrow section-label">SUGGESTED FOODS · NOT YET LOGGED</p><div className="food-suggestions">{suggestions.map((item, index) => <button key={index} onClick={() => { setMode("search"); setQuery(item.name); setAmount(""); setChosen(null); setResults([]); setSearched(false); }}><span>{item.name}<small>Visual estimate: {item.quantity} {item.unit}</small></span><Search size={17}/></button>)}</div></div>}
      </div>}
      {mode === "search" && <div className="space-y-4">
        <div className="catalog-provider"><label className="composer-field">Library<select value={provider} onChange={e => { setProvider(e.target.value as FoodProvider); setResults([]); setChosen(null); setSearched(false); setError(""); }}><option value="openfoodfacts">Packaged foods · Open Food Facts</option><option value="usda">General foods · USDA</option></select></label></div>
        <div className="catalog-search"><label className="sr-only" htmlFor="food-search">Food name or barcode</label><input id="food-search" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); search(); } }} placeholder="Search a food, brand, or barcode…" maxLength={120}/><Button onClick={() => search()} disabled={query.trim().length < 2 || working} aria-label="Search food library"><Search size={18}/></Button></div>
        <p className="nutrition-note">Choose the exact food and preparation. Database values can vary; compare the package label when available.</p>
        {searched && !results.length && <div className="catalog-empty"><BookOpen size={26}/><strong>No complete record found</strong><p>Try a brand or barcode. If the library has no match, enter the package label. We won’t invent nutrition.</p></div>}
        <div className="catalog-results">{results.map(food => <button key={food.provider + food.id} className={chosen?.id === food.id ? "selected" : ""} onClick={() => { setChosen(food); setConfirmed(false); setAmount(""); setUnit("g"); }}>
          <span className="catalog-food-icon"><LeafIcon/></span><span><strong>{food.name}</strong><small>{food.brand || (food.provider === "usda" ? "USDA FoodData Central" : "Open Food Facts")}</small><small>{Math.round(food.nutrients.calories)} kcal / {food.basis === "100g" ? "100 g" : "100 g or mL — check label"}</small></span><span>{chosen?.id === food.id ? <Check size={18}/> : <Plus size={18}/>}</span>
        </button>)}</div>
        {chosen && <div className="portion-card">
          <div className="flex justify-between gap-3"><strong>Confirm your portion</strong><a href={chosen.sourceUrl} target="_blank" rel="noreferrer" className="source-link">View source <ExternalLink size={13}/></a></div>
          <div className="portion-inputs"><label className="composer-field">Measured amount<input type="number" min="0.1" max="10000" step="0.1" value={amount} onChange={e => { setAmount(e.target.value); setConfirmed(false); }} placeholder="e.g. 150"/></label><label className="composer-field">Unit<select value={unit} onChange={e => { setUnit(e.target.value as "g" | "ml"); setConfirmed(false); }}><option value="g">grams</option>{chosen.basis !== "100g" && <option value="ml">milliliters</option>}</select></label></div>
          {preview && <div className="portion-nutrients">{Object.entries(metricLabels).map(([key, label]) => <div key={key}><small>{label}</small><strong>{preview[key as keyof Nutrients] ?? "Unknown"}</strong></div>)}</div>}
          <label className="confirm-portion"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/><span>I checked the food, preparation, and portion. The amount uses the same unit as the source label.</span></label>
          <Button onClick={addChosen} disabled={!confirmed || !preview || working} className="w-full"><Plus size={16}/> Add to meal</Button>
        </div>}
        <p className="catalog-attribution">Data: <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a> (<a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL</a>) · <a href="https://fdc.nal.usda.gov" target="_blank" rel="noreferrer">USDA FoodData Central</a> (CC0). Missing optional nutrients remain unknown.</p>
      </div>}
      {mode === "manual" && <div className="space-y-4">
        <p className="nutrition-note">Use the values for the portion you ate, from the package or your own recipe. These entries are labeled “User entered”.</p>
        <label className="composer-field">Food name<input placeholder="e.g. Chicken Breast" value={manual.name} onChange={e => setManual({ ...manual, name: e.target.value })}/></label>
        <label className="composer-field">Portion description<input placeholder="e.g. 150 g, cooked" value={manual.portionDescription} onChange={e => setManual({ ...manual, portionDescription: e.target.value })}/></label>
        <div className="manual-nutrients">{Object.entries(metricLabels).map(([key, label], index) => <label className="composer-field" key={key}>{label}{index < 4 ? " *" : " · optional"}<input type="number" min="0" step="1" placeholder={index < 4 ? "From label" : "Unknown"} value={manual[key as keyof Nutrients]} onChange={e => setManual({ ...manual, [key]: e.target.value })}/></label>)}</div>
        <Button onClick={addManual} variant="outline" className="w-full"><Plus size={16}/> Add label values</Button>
      </div>}
      {busy && <div className="composer-status" role="status"><LoaderCircle className="animate-spin" size={18}/> {mode === "photo" ? "Uploading and identifying foods…" : "Searching the food library…"}</div>}
      {error && <div className="composer-error" role="alert">{error}</div>}
      {items.length > 0 && <div className="meal-items"><p className="eyebrow section-label">IN THIS MEAL</p>{items.map((item,index) => <div key={index}><span><strong>{item.name}</strong><small>{item.portionDescription} · {item.calories} kcal · {item.catalogRef ? (item.catalogRef.provider === "usda" ? "USDA" : "Open Food Facts") : "User entered / previous record"}</small></span><button aria-label={`Remove ${item.name}`} onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 size={17}/></button></div>)}</div>}
    </fieldset>
  </Modal>
}
function LeafIcon() { return <BookOpen size={18}/> }

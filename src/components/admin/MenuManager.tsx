"use client";
import React, { useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";
import type { MenuItem } from "@/lib/api";

// "platters" is excluded from single-item categories — platters are auto-assigned
const SINGLE_CATEGORIES = ["starters", "grills", "karahi", "biryani", "breads", "desserts", "beverages"];
const ALL_CATEGORIES     = [...SINGLE_CATEGORIES, "platters"];

const CAT_LABELS: Record<string, string> = {
  starters:  "Starters",
  grills:    "Grills",
  karahi:    "Karahi & Curries",
  biryani:   "Biryani & Rice",
  breads:    "Breads",
  desserts:  "Desserts",
  beverages: "Beverages",
  platters:  "Platters",
};

interface FormData {
  name:           string;
  category:       string;
  price:          string;
  description:    string;
  image_url:      string;
  image_public_id:string;
  prep_time:      string;
  type:           "single" | "platter";
  components:     string[];
}

const EMPTY_FORM: FormData = {
  name: "", category: "starters", price: "", description: "",
  image_url: "", image_public_id: "", prep_time: "15",
  type: "single", components: [],
};

export default function MenuManager() {
  const [items,       setItems]       = useState<MenuItem[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [catFilter,   setCatFilter]   = useState("all");
  const [showModal,   setShowModal]   = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [form,        setForm]        = useState<FormData>(EMPTY_FORM);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl,  setPreviewUrl]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.fetchAdminMenu().then((res) => {
      const data = res.data as any;
      const list: MenuItem[] = Array.isArray(data) ? data : (data?.items ?? data?.menu ?? []);
      setItems(list.map((i: any) => ({ ...i, price: Number(i.price) })));
    }).finally(() => setIsLoading(false));
  }, []);

  const filtered = catFilter === "all" ? items : items.filter((i) => i.category === catFilter);

  // ── Open Add: always starts as Single Item ─────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPreviewUrl("");
    setShowModal(true);
  };

  // ── Open Edit: pre-fill from item, no type-switching allowed ──────────
  const openEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name:            item.name,
      category:        item.category,
      price:           String(Number(item.price)),
      description:     item.description || "",
      image_url:       item.image_url   || "",
      image_public_id: item.image_public_id || "",
      prep_time:       "15",
      type:            item.type       || "single",
      components:      item.components || [],
    });
    setPreviewUrl(item.image_url || "");
    setShowModal(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    await api.deleteMenuItem(item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res.status === 200 && res.data?.upload?.secureUrl) {
        setForm((f) => ({ ...f, image_url: res.data.upload.secureUrl, image_public_id: res.data.upload.publicId }));
        setPreviewUrl(res.data.upload.secureUrl);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return;
    setIsSaving(true);
    try {
      const payload = {
        name:            form.name.trim(),
        category:        form.category,
        price:           Number(form.price),
        description:     form.description.trim(),
        image_url:       form.image_url,
        image_public_id: form.image_public_id || "",
        type:            form.type,
        components:      form.type === "platter" ? form.components : [],
      };
      if (editingId) {
        const res = await api.updateMenuItem(editingId, payload);
        if (res.status === 200) {
          setItems((prev) => prev.map((i) => i.id === editingId ? { ...i, ...payload } : i));
        }
      } else {
        const res = await api.createMenuItem(payload as any);
        if (res.status === 200 || res.status === 201) {
          const newItem = (res.data as any)?.item || res.data;
          setItems((prev) => [...prev, { ...newItem, price: Number(newItem.price) }]);
        }
      }
      setShowModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Type-tab handler (ADD mode only) ──────────────────────────────────
  const switchType = (t: "single" | "platter") => {
    setForm((f) => ({
      ...f,
      type:       t,
      category:   t === "platter" ? "platters" : "starters",
      components: t === "platter" ? f.components : [],
    }));
  };

  // ── Derived helpers ───────────────────────────────────────────────────
  const isPlatter   = form.type === "platter";
  const isAdding    = !editingId;
  const modalTitle  = isAdding
    ? (isPlatter ? "Add Platter" : "Add Single Item")
    : (isPlatter ? "Edit Platter" : "Edit Item");

  return (
    <section>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
        <div>
          <h1 className="font-cinzel text-[1.3rem] font-semibold text-primary tracking-[.04em]">
            Menu Management
          </h1>
          <p className="text-[0.82rem] text-muted mt-[3px]">
            {items.length} items across {ALL_CATEGORIES.length} categories
          </p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <select
            className="filter-select m-0"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <button className="btn-primary whitespace-nowrap" onClick={openAdd}>
            <i className="ri-add-line"></i> Add Item
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="menu-table-wrap">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th className="text-right">Price (PKR)</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody id="menu-tbody">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={5}>
                  <div style={{ height: "2rem", background: "var(--clr-surface)", borderRadius: "4px", margin: "0.25rem 0", opacity: 0.5 }}></div>
                </td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--clr-muted)" }}>No items found</td></tr>
            ) : filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.image_url && <img src={item.image_url} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {item.name}
                        {item.type === "platter" && (
                          <span className="badge badge-platter" style={{ marginLeft: "6px", fontSize: ".65rem" }}>Platter</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--clr-muted)" }}>{item.description?.slice(0, 60)}</div>
                      {item.type === "platter" && item.components && item.components.length > 0 && (
                        <div style={{ fontSize: ".7rem", color: "var(--clr-muted)", marginTop: "2px" }}>
                          {item.components.map(id => items.find(x => x.id === id)?.name ?? id).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>{CAT_LABELS[item.category] ?? item.category}</td>
                <td className="text-right">PKR {Number(item.price).toLocaleString()}</td>
                <td className="text-center">
                  <span className={`badge ${item.hidden ? "badge-cancelled" : "badge-served"}`}>
                    {item.hidden ? "Hidden" : "Available"}
                  </span>
                </td>
                <td className="text-center">
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button className="btn-icon" onClick={() => openEdit(item)} title="Edit"><i className="ri-edit-line"></i></button>
                    <button className="btn-icon" onClick={() => handleDelete(item)} title="Delete" style={{ color: "var(--clr-error, #e53e3e)" }}><i className="ri-delete-bin-line"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────── */}
      {showModal && (
        <div id="modal-menu-item" className="modal-backdrop" style={{ display: "flex" }}>
          <div className="modal modal-wide">
            <div className="modal-header">
              <h2 className="modal-title">{modalTitle}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="ri-close-line"></i></button>
            </div>

            <div className="modal-body">
              <div className="form-grid">

                {/* ── Type tabs: ONLY shown when ADDING a new item ── */}
                {isAdding && (
                  <div className="form-group form-full">
                    <label className="form-label">Type</label>
                    <div className="type-tabs" id="item-type-tabs">
                      <button
                        type="button"
                        className={`type-tab ${!isPlatter ? "active" : ""}`}
                        onClick={() => switchType("single")}
                      >
                        Single Item
                      </button>
                      <button
                        type="button"
                        className={`type-tab ${isPlatter ? "active" : ""}`}
                        onClick={() => switchType("platter")}
                      >
                        Platter
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Name ─────────────────────────────────────────── */}
                <div className="form-group form-full">
                  <label className="form-label">Name</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={isPlatter ? "e.g. Family Platter" : "e.g. Chicken Karahi"}
                  />
                </div>

                {/* ── Category ─────────────────────────────────────── */}
                <div className="form-group">
                  <label className="form-label">Category</label>
                  {isPlatter ? (
                    // Platters: fixed, no dropdown
                    <div
                      className="form-input"
                      style={{ background: "var(--clr-surface)", color: "var(--clr-muted)", cursor: "not-allowed", display: "flex", alignItems: "center" }}
                    >
                      Platters
                    </div>
                  ) : (
                    // Single: all categories except "platters"
                    <select
                      className="form-input"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {SINGLE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CAT_LABELS[c]}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* ── Price ────────────────────────────────────────── */}
                <div className="form-group">
                  <label className="form-label">Price (PKR)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="1200"
                    min="0"
                  />
                </div>

                {/* ── Prep Time ────────────────────────────────────── */}
                <div className="form-group">
                  <label className="form-label">Prep Time (mins)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.prep_time}
                    onChange={(e) => setForm((f) => ({ ...f, prep_time: e.target.value }))}
                    placeholder="15"
                    min="0"
                  />
                </div>

                {/* ── Description ──────────────────────────────────── */}
                <div className="form-group form-full">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Short description…"
                  ></textarea>
                </div>

                {/* ── Platter components (only for platters) ────────── */}
                {isPlatter && (
                  <div className="form-group form-full" id="platter-components-group">
                    <label className="form-label">Items in this Platter</label>
                    <div className="platter-items-list" id="platter-items-list">
                      {items.filter((m) => m.type !== "platter" && m.id !== editingId).map((m) => (
                        <label key={m.id} className="platter-item-check">
                          <input
                            type="checkbox"
                            value={m.id}
                            checked={form.components.includes(m.id)}
                            onChange={(e) => {
                              if (e.target.checked) setForm((f) => ({ ...f, components: [...f.components, m.id] }));
                              else setForm((f) => ({ ...f, components: f.components.filter((c) => c !== m.id) }));
                            }}
                          />
                          <span className="platter-item-name">{m.name}</span>
                          <span className="platter-item-price">PKR {Number(m.price).toLocaleString()}</span>
                          <span className="platter-item-cat">{CAT_LABELS[m.category] || m.category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Image upload ──────────────────────────────────── */}
                <div className="form-group form-full">
                  <label className="form-label">Image</label>
                  <div className="img-upload-area" onClick={() => fileRef.current?.click()} style={{ cursor: "pointer" }}>
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="preview" style={{ width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "8px" }} />
                    ) : (
                      <div className="upload-placeholder">
                        <i className="ri-image-add-line"></i>
                        <span>{isUploading ? "Uploading..." : "Click to upload image"}</span>
                        <small>JPG, PNG, WEBP</small>
                      </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={isSaving || !form.name || !form.price}
              >
                {isSaving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

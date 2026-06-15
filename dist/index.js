const { useState, useEffect } = React;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatShutter(val) {
  if (!val) return "—";
  if (val >= 1) return `${val}s`;
  return `1/${Math.round(1 / val)}`;
}

function formatFL(mm, crop) {
  if (!mm) return "—";
  if (crop !== 1) {
    const eq = Math.round(mm * crop);
    return `${mm} mm  (${eq} mm KB)`;
  }
  return `${mm} mm`;
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("nl-NL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function evComp(val) {
  if (val == null) return "—";
  return val >= 0 ? `+${val} EV` : `${val} EV`;
}

function cropFactor(make, model) {
  if (!make && !model) return 1;
  const s = `${make || ""} ${model || ""}`.toUpperCase();
  if (s.includes("D5300") || s.includes("D3000") || s.includes("D3200") ||
      s.includes("D3300") || s.includes("D3400") || s.includes("D3500") ||
      s.includes("D5100") || s.includes("D5200") || s.includes("D5500") ||
      s.includes("D5600") || s.includes("D7000") || s.includes("D7100") ||
      s.includes("D7200") || s.includes("D7500") || s.includes("D500"))
    return 1.5;
  if (s.includes("CANON") && !s.includes("5D") && !s.includes("6D") &&
      !s.includes("1D") && !s.includes("R5") && !s.includes("R6"))
    return 1.6;
  return 1;
}

// ── Stijlen ───────────────────────────────────────────────────────────────────
const S = {
  container: {
    background: "#1C1917", color: "#F4F3EE",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 11, padding: "10px 12px",
    height: "100%", overflowY: "auto", boxSizing: "border-box"
  },
  empty: {
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#B1ADA1"
  },
  summary: {
    background: "#292524", borderRadius: 4, padding: "8px 10px",
    marginBottom: 10, color: "#F4F3EE", fontSize: 12,
    textAlign: "center", letterSpacing: "0.03em"
  },
  sectionHeader: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "5px 0 3px", cursor: "pointer",
    color: "#C15F3C", fontSize: 11, fontWeight: 600,
    letterSpacing: "0.04em", textTransform: "uppercase",
    userSelect: "none"
  },
  row: {
    display: "flex", justifyContent: "space-between",
    alignItems: "baseline", padding: "3px 0",
    borderBottom: "1px solid #3C3836"
  },
  label: { color: "#B1ADA1", fontSize: 11, flexShrink: 0, marginRight: 8 },
  value: { fontSize: 11, textAlign: "right", fontVariantNumeric: "tabular-nums" }
};

// ── Row component ─────────────────────────────────────────────────────────────
function Row({ label, value, accent }) {
  if (!value || value === "—") return null;
  return React.createElement("div", { style: S.row },
    React.createElement("span", { style: S.label }, label),
    React.createElement("span", {
      style: { ...S.value, color: accent ? "#C15F3C" : "#F4F3EE" }
    }, value)
  );
}

// ── Section component ─────────────────────────────────────────────────────────
function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return React.createElement("div", { style: { marginBottom: 4 } },
    React.createElement("div", {
      style: S.sectionHeader,
      onClick: () => setOpen(o => !o)
    },
      React.createElement("span", { style: { fontSize: 9 } }, open ? "▾" : "▸"),
      title
    ),
    open ? React.createElement("div", null, children) : null
  );
}

// ── Hoofd panel ───────────────────────────────────────────────────────────────
function ExifPlusPanel({ api }) {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    const store = api.stores.useCatalogStore;
    const unsub = store.subscribe(state => {
      const id = state.activePhotoId;
      if (!id) { setPhoto(null); return; }
      const p = state.photos.find(ph => ph.id === id);
      setPhoto(p || null);
    });
    const state = store.getState();
    const id = state.activePhotoId;
    if (id) setPhoto(state.photos.find(ph => ph.id === id) || null);
    return unsub;
  }, []);

  if (!photo) {
    return React.createElement("div",
      { style: { ...S.container, ...S.empty } },
      "Geen foto geselecteerd"
    );
  }

  const e = photo.exif || {};
  const crop     = cropFactor(e.make, e.model);
  const aperture = e.aperture  ? `f/${e.aperture}` : null;
  const shutter  = e.shutter   ? formatShutter(e.shutter) : null;
  const iso      = e.iso       ? `ISO ${e.iso}` : null;
  const triangle = [aperture, shutter, iso].filter(Boolean).join("  ·  ");
  const dims     = (photo.width && photo.height)
    ? `${photo.width.toLocaleString()} × ${photo.height.toLocaleString()} px` : null;
  const mp       = (photo.width && photo.height)
    ? `${((photo.width * photo.height) / 1e6).toFixed(1)} MP` : null;

  return React.createElement("div", { style: S.container },

    // Belichtingsdriehoek
    triangle && React.createElement("div", { style: S.summary }, triangle),

    // Camera
    React.createElement(Section, { title: "Camera" },
      React.createElement(Row, { label: "Merk",     value: e.make }),
      React.createElement(Row, { label: "Model",    value: e.model, accent: true }),
      React.createElement(Row, { label: "Software", value: e.software })
    ),

    // Belichting
    React.createElement(Section, { title: "Belichting" },
      React.createElement(Row, { label: "Sluitertijd", value: shutter, accent: true }),
      React.createElement(Row, { label: "Diafragma",   value: aperture, accent: true }),
      React.createElement(Row, { label: "ISO",         value: iso, accent: true }),
      React.createElement(Row, { label: "Bel. comp.",  value: e.exposureCompensation != null ? evComp(e.exposureCompensation) : null }),
      React.createElement(Row, { label: "Meting",      value: e.meteringMode }),
      React.createElement(Row, { label: "Programma",   value: e.exposureProgram }),
      React.createElement(Row, { label: "Flits",       value: e.flash })
    ),

    // Lens
    React.createElement(Section, { title: "Lens" },
      React.createElement(Row, { label: "Lens",        value: e.lensModel || e.lens, accent: true }),
      React.createElement(Row, { label: "Brandpunt",   value: formatFL(e.focalLength, crop) }),
      crop !== 1 ? React.createElement(Row, { label: "Crop factor", value: `${crop}×` }) : null,
      React.createElement(Row, { label: "Min. diafr.", value: e.maxApertureValue ? `f/${e.maxApertureValue}` : null })
    ),

    // Bestand
    React.createElement(Section, { title: "Bestand" },
      React.createElement(Row, { label: "Bestandsnaam", value: photo.filename }),
      React.createElement(Row, { label: "Type",         value: photo.mimeType }),
      React.createElement(Row, { label: "Grootte",      value: formatSize(photo.fileSize) }),
      React.createElement(Row, { label: "Afmetingen",   value: dims }),
      React.createElement(Row, { label: "Megapixels",   value: mp, accent: true }),
      React.createElement(Row, { label: "Opnamedatum",  value: formatDate(photo.dateCreated) }),
      React.createElement(Row, { label: "Geïmporteerd", value: formatDate(photo.dateImported) })
    ),

    // Status
    React.createElement(Section, { title: "Status" },
      React.createElement(Row, { label: "Beoordeling", value: photo.rating ? "★".repeat(photo.rating) : null, accent: true }),
      React.createElement(Row, { label: "Label",       value: photo.colorLabel !== "none" ? photo.colorLabel : null }),
      React.createElement(Row, { label: "Vlag",        value: photo.flag !== "none" ? photo.flag : null }),
      React.createElement(Row, { label: "Rotatie",     value: photo.rotation ? `${photo.rotation}°` : null }),
      React.createElement(Row, { label: "Keywords",    value: photo.keywords?.length ? photo.keywords.join(", ") : null })
    )
  );
}

// ── Activatie ─────────────────────────────────────────────────────────────────
export function activate(api) {
  api.registerPanel({
    id:              "exif-plus.panel",
    title:           "EXIF Plus",
    component:       (props) => ExifPlusPanel({ api, ...props }),
    defaultLocation: "right",
  });
}

export function deactivate() {}

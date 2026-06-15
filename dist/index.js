// ── Helpers ──────────────────────────────────────────────────────────────────

function formatShutter(val) {
  if (!val) return "—";
  if (val >= 1) return `${val}s`;
  return `1/${Math.round(1 / val)}`;
}

function formatFL(mm, crop) {
  if (!mm) return "—";
  if (crop !== 1) return `${mm} mm  (${Math.round(mm * crop)} mm KB)`;
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
  labelStyle: { color: "#B1ADA1", fontSize: 11, flexShrink: 0, marginRight: 8 },
  valueStyle: { fontSize: 11, textAlign: "right", fontVariantNumeric: "tabular-nums" }
};

// ── Activatie ─────────────────────────────────────────────────────────────────
export function activate(api) {
  // React komt altijd van de app zelf — nooit zelf bundelen
  const { react: React } = api;
  const { useState, useEffect } = React;

  // ── Row ──
  function Row({ label, value, accent }) {
    if (!value || value === "—") return null;
    return React.createElement("div", { style: S.row },
      React.createElement("span", { style: S.labelStyle }, label),
      React.createElement("span", {
        style: { ...S.valueStyle, color: accent ? "#C15F3C" : "#F4F3EE" }
      }, value)
    );
  }

  // ── Section ──
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

  // ── Hoofd panel ──
  function ExifPlusPanel() {
    const [photo, setPhoto] = useState(null);

    useEffect(() => {
      const store = api.stores.useCatalogStore;
      const sync = state => {
        const id = state.activePhotoId;
        if (!id) { setPhoto(null); return; }
        setPhoto(state.photos.find(ph => ph.id === id) || null);
      };
      const unsub = store.subscribe(sync);
      sync(store.getState());
      return unsub;
    }, []);

    if (!photo) {
      return React.createElement("div",
        { style: { ...S.container, ...S.empty } },
        "Geen foto geselecteerd"
      );
    }

    const e      = photo.exif || {};
    const crop   = cropFactor(e.make, e.model);
    const ap     = e.aperture ? `f/${e.aperture}` : null;
    const sh     = e.shutter  ? formatShutter(e.shutter) : null;
    const iso    = e.iso      ? `ISO ${e.iso}` : null;
    const tri    = [ap, sh, iso].filter(Boolean).join("  ·  ");
    const dims   = (photo.width && photo.height)
      ? `${photo.width.toLocaleString()} × ${photo.height.toLocaleString()} px` : null;
    const mp     = (photo.width && photo.height)
      ? `${((photo.width * photo.height) / 1e6).toFixed(1)} MP` : null;

    const ce = (type, props, ...children) => React.createElement(type, props, ...children);

    return ce("div", { style: S.container },

      tri && ce("div", { style: S.summary }, tri),

      ce(Section, { title: "Camera" },
        ce(Row, { label: "Merk",     value: e.make }),
        ce(Row, { label: "Model",    value: e.model, accent: true }),
        ce(Row, { label: "Software", value: e.software })
      ),

      ce(Section, { title: "Belichting" },
        ce(Row, { label: "Sluitertijd", value: sh,  accent: true }),
        ce(Row, { label: "Diafragma",   value: ap,  accent: true }),
        ce(Row, { label: "ISO",         value: iso, accent: true }),
        ce(Row, { label: "Bel. comp.",  value: e.exposureCompensation != null ? evComp(e.exposureCompensation) : null }),
        ce(Row, { label: "Meting",      value: e.meteringMode }),
        ce(Row, { label: "Programma",   value: e.exposureProgram }),
        ce(Row, { label: "Flits",       value: e.flash })
      ),

      ce(Section, { title: "Lens" },
        ce(Row, { label: "Lens",        value: e.lensModel || e.lens, accent: true }),
        ce(Row, { label: "Brandpunt",   value: formatFL(e.focalLength, crop) }),
        crop !== 1 ? ce(Row, { label: "Crop factor", value: `${crop}×` }) : null,
        ce(Row, { label: "Min. diafr.", value: e.maxApertureValue ? `f/${e.maxApertureValue}` : null })
      ),

      ce(Section, { title: "Bestand" },
        ce(Row, { label: "Bestandsnaam", value: photo.filename }),
        ce(Row, { label: "Type",         value: photo.mimeType }),
        ce(Row, { label: "Grootte",      value: formatSize(photo.fileSize) }),
        ce(Row, { label: "Afmetingen",   value: dims }),
        ce(Row, { label: "Megapixels",   value: mp, accent: true }),
        ce(Row, { label: "Opnamedatum",  value: formatDate(photo.dateCreated) }),
        ce(Row, { label: "Geïmporteerd", value: formatDate(photo.dateImported) })
      ),

      ce(Section, { title: "Status" },
        ce(Row, { label: "Beoordeling", value: photo.rating ? "★".repeat(photo.rating) : null, accent: true }),
        ce(Row, { label: "Label",       value: photo.colorLabel !== "none" ? photo.colorLabel : null }),
        ce(Row, { label: "Vlag",        value: photo.flag !== "none" ? photo.flag : null }),
        ce(Row, { label: "Rotatie",     value: photo.rotation ? `${photo.rotation}°` : null }),
        ce(Row, { label: "Keywords",    value: photo.keywords?.length ? photo.keywords.join(", ") : null })
      )
    );
  }

  api.registerPanel({
    id:              "exif-plus.panel",
    title:           "EXIF Plus",
    component:       ExifPlusPanel,
    defaultLocation: "right",
  });
}

export function deactivate() {}

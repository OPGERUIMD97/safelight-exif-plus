import { useState, useEffect } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatShutter(val) {
  if (!val) return "—";
  if (val >= 1) return `${val}s`;
  return `1/${Math.round(1 / val)}`;
}

function formatFL(mm, crop = 1) {
  if (!mm) return "—";
  const eq = Math.round(mm * crop);
  return crop !== 1
    ? `${mm} mm  (${eq} mm KB)`
    : `${mm} mm`;
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

// Nikon D5300 crop factor
function cropFactor(make, model) {
  if (!make && !model) return 1;
  const s = `${make} ${model}`.toUpperCase();
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

// ── Rij component ─────────────────────────────────────────────────────────────
function Row({ label, value, accent }) {
  if (!value || value === "—") return null;
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "3px 0",
      borderBottom: "1px solid #3C3836"
    }}>
      <span style={{ color: "#B1ADA1", fontSize: 11, flexShrink: 0, marginRight: 8 }}>
        {label}
      </span>
      <span style={{
        color: accent ? "#C15F3C" : "#F4F3EE",
        fontSize: 11,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums"
      }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 0 3px",
          cursor: "pointer",
          color: "#C15F3C",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          userSelect: "none"
        }}
      >
        <span style={{ fontSize: 9 }}>{open ? "▾" : "▸"}</span>
        {title}
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

// ── Hoofd panel ───────────────────────────────────────────────────────────────
function ExifPlusPanel({ api }) {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    // Laad actieve foto uit catalog store
    const unsub = api.stores.useCatalogStore.subscribe(state => {
      const id = state.activePhotoId;
      if (!id) { setPhoto(null); return; }
      const p = state.photos.find(ph => ph.id === id);
      setPhoto(p || null);
    });
    // Initieel laden
    const state = api.stores.useCatalogStore.getState();
    const id = state.activePhotoId;
    if (id) {
      const p = state.photos.find(ph => ph.id === id);
      setPhoto(p || null);
    }
    return unsub;
  }, []);

  const containerStyle = {
    background: "#1C1917",
    color: "#F4F3EE",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 11,
    padding: "10px 12px",
    height: "100%",
    overflowY: "auto",
    boxSizing: "border-box"
  };

  if (!photo) {
    return (
      <div style={{ ...containerStyle, display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#B1ADA1" }}>
        Geen foto geselecteerd
      </div>
    );
  }

  const e = photo.exif || {};
  const crop = cropFactor(e.make, e.model);

  // Belichting info
  const aperture  = e.aperture  ? `f/${e.aperture}` : null;
  const shutter   = e.shutter   ? formatShutter(e.shutter) : null;
  const iso       = e.iso       ? `ISO ${e.iso}` : null;
  const triangle  = [aperture, shutter, iso].filter(Boolean).join("  ·  ");

  // Dimensies
  const dims = (photo.width && photo.height)
    ? `${photo.width.toLocaleString()} × ${photo.height.toLocaleString()} px`
    : null;
  const mp = (photo.width && photo.height)
    ? `${((photo.width * photo.height) / 1e6).toFixed(1)} MP`
    : null;

  return (
    <div style={containerStyle}>

      {/* Belichting samenvatting bovenaan */}
      {triangle && (
        <div style={{
          background: "#292524",
          borderRadius: 4,
          padding: "8px 10px",
          marginBottom: 10,
          color: "#F4F3EE",
          fontSize: 12,
          textAlign: "center",
          letterSpacing: "0.03em"
        }}>
          {triangle}
        </div>
      )}

      {/* Camera */}
      <Section title="Camera">
        <Row label="Merk"     value={e.make} />
        <Row label="Model"    value={e.model} accent />
        <Row label="Software" value={e.software} />
      </Section>

      {/* Belichting */}
      <Section title="Belichting">
        <Row label="Sluitertijd"  value={shutter} accent />
        <Row label="Diafragma"    value={aperture} accent />
        <Row label="ISO"          value={iso} accent />
        <Row label="Bel. comp."   value={e.exposureCompensation != null
                                        ? evComp(e.exposureCompensation) : null} />
        <Row label="Meting"       value={e.meteringMode} />
        <Row label="Programma"    value={e.exposureProgram} />
        <Row label="Flits"        value={e.flash} />
      </Section>

      {/* Lens */}
      <Section title="Lens">
        <Row label="Lens"         value={e.lensModel || e.lens} accent />
        <Row label="Brandpunt"    value={formatFL(e.focalLength, crop)} />
        {crop !== 1 && (
          <Row label="Crop factor" value={`${crop}×`} />
        )}
        <Row label="Min. diafr."  value={e.maxApertureValue
                                        ? `f/${e.maxApertureValue}` : null} />
      </Section>

      {/* Bestand */}
      <Section title="Bestand">
        <Row label="Bestandsnaam" value={photo.filename} />
        <Row label="Type"         value={photo.mimeType} />
        <Row label="Grootte"      value={formatSize(photo.fileSize)} />
        <Row label="Afmetingen"   value={dims} />
        <Row label="Megapixels"   value={mp} accent />
        <Row label="Opnamedatum"  value={formatDate(photo.dateCreated)} />
        <Row label="Geïmporteerd" value={formatDate(photo.dateImported)} />
      </Section>

      {/* Status */}
      <Section title="Status">
        <Row label="Beoordeling"  value={photo.rating ? "★".repeat(photo.rating) : null} accent />
        <Row label="Label"        value={photo.colorLabel !== "none" ? photo.colorLabel : null} />
        <Row label="Vlag"         value={photo.flag !== "none" ? photo.flag : null} />
        <Row label="Rotatie"      value={photo.rotation ? `${photo.rotation}°` : null} />
        <Row label="Keywords"     value={photo.keywords?.length
                                        ? photo.keywords.join(", ") : null} />
      </Section>

    </div>
  );
}

// ── Activatie ─────────────────────────────────────────────────────────────────
export function activate(api) {
  api.registerPanel({
    id:        "exif-plus.panel",
    title:     "EXIF Plus",
    component: (props) => <ExifPlusPanel api={api} {...props} />,
    defaultLocation: "right",
  });
}

export function deactivate() {}

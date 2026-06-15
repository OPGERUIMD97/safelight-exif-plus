# EXIF Plus for Safelight

An extended EXIF metadata panel for [Safelight](https://github.com/anthonyreimche/SafeLight), showing far more detail than the built-in INFO panel.

## What it shows

### 📷 Camera
- Make, model, software

### 📸 Exposure (with summary bar at the top)
- Shutter speed, aperture, ISO
- Exposure compensation, metering mode, exposure program, flash

### 🔭 Lens
- Lens model/name
- Focal length with **35mm equivalent** (auto-detected crop factor for Nikon APS-C, Canon APS-C, and full-frame cameras)
- Maximum aperture

### 📁 File
- Filename, MIME type, file size
- Pixel dimensions + megapixel count
- Capture date, import date

### 🏷 Status
- Star rating, color label, pick/reject flag, rotation, keywords

## Installation

In Safelight → **View → Extensions**, enter:

```
OPGERUIMD97/safelight-exif-plus
```

## Notes

- Sections are collapsible — click the section title to toggle
- Crop factor is auto-detected from camera make/model (Nikon DX = 1.5×, Canon APS-C = 1.6×)
- Empty fields are hidden automatically
- If an EXIF field you need is missing, please open an issue — we'll add it

## License

MIT

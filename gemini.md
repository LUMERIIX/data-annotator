# Annotator - Umsetzungsplan

Das Tool ermöglicht die versatile Datenannotierung auf flexiblen Schemas (JSON-Blueprints) mit integriertem Mediaplayer. Fokus liegt auf Ergonomie durch Keyboard-Shortcuts und hierarchische Datenstrukturen.

## 🛠 Architektur & Komponenten
- **`MediaController`**: Zentrale Steuerung (Play/Pause/Seek) für Audio, Video und Text.
- **`AnnotationEngine`**: 
    - **`SchemaRenderer`**: Dynamische Formulare basierend auf JSON-Schema (inspiriert durch `annotations.json`).
    - **`Timeline`**: Visualisierung von hierarchischen Annotationen (`Sections`, `Events`, `Cues`).
- **`ShortcutManager`**: Konfigurierbare Keyboard-Bindings für effizientes Arbeiten.

## 📊 Datenmodell
Basierend auf dem Theater Play Inventory Schema:
- **Hierarchie**: Play -> Variants -> Sections -> (Events | Cues).
- **Einheiten**: Millisekunden (ms) für alle Zeitstempel.
- **Validierung**: Laufzeitprüfung gegen das JSON-Schema.

## 🚀 Tech-Stack
- **Frontend**: React (TypeScript), Vanilla CSS.
- **Visualisierung**: `wavesurfer.js` (Audio Waveform & Regions).
- **Formulare**: `@rjsf/core` (React JSON Schema Form).
- **State**: `Zustand` (Performantes State-Management für Echtzeit-Annotationen).
## 📁 Dateistruktur
```text
annotator/
├── frontend/           # React + Vite (UI)
│   ├── src/
│   │   ├── components/ # UI-Komponenten
│   │   ├── hooks/      # Custom Hooks
│   │   ├── store/      # Zustand Stores
│   │   ├── types/      # TS Interfaces
│   │   └── App.tsx     # App Entry
├── backend/            # Express (API & File Access)
│   ├── src/
│   │   ├── routes/     # API Endpunkte
│   │   ├── controllers/# Business Logik
│   │   └── index.ts    # Server Entry
└── shared/             # Gemeinsame Typen & Schemata
```

## 🔄 Progress Tracking & Conventional Commits

Wir nutzen **Conventional Commits** für eine klare Historie und automatisierte Dokumentation. Jede Änderung wird mit einem der folgenden Präfixe committed:

- `feat:` Neue Features (z.B. `feat: add waveform zoom`)
- `fix:` Bugfixes (z.B. `fix: shortcut overlap in input fields`)
- `docs:` Dokumentation (z.B. `docs: update setup guide`)
- `style:` Formatierung, CSS-Anpassungen ohne Logikänderung
- `refactor:` Code-Optimierung ohne neue Features oder Fixes
- `chore:` Maintenance-Tasks (z.B. `chore: update dependencies`)

**Workflow:**
1. Task in `gemini.md` abhaken.
2. Änderungen implementieren und testen.
3. Commit mit entsprechendem Präfix (z.B. `git commit -m "feat: add timeline regions for events"`).

## 📅 Phasen & Fortschritt
- [x] **Phase 0: Project Restructuring**
    - [x] Setup `frontend/` (Vite, React, TypeScript).
    - [x] Setup `backend/` (Node.js, Express, TypeScript).
- [x] **Phase 1: Foundation (Frontend)**
...
- [x] **Phase 1: Schema-Driven UI**
    - [x] Integration von `annotations.json`.
    - [x] Dynamische Formular-Generierung für `PlayVariant` und `Section`.
    - [x] Hierarchische Baum-Navigation in der Sidebar.
- [x] **Phase 3: Interactive Timeline**
    - [x] Implementierung der Waveform-Visualisierung.
    - [x] Mapping von `Sections` und `Events` als interaktive Regionen auf der Timeline.
    - [x] Drag & Drop für Start/Stop Zeiten.
- [x] **Phase 4: Ergonomics & Shortcuts**
    - [x] Globaler Shortcut-Listener.
    - [x] Implementierung von Navigationsmustern (+/- 1s, Marker setzen).
- [x] **Phase 5: Persistence**
    - [x] Laden/Speichern von lokalen JSON-Dateien.
    - [x] Export-Validierung gegen das Schema.

---
*Status: Prototyp Phase 1-5 abgeschlossen.*

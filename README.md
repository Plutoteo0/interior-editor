# Interior AI Editor

A web-based editor for interior designers: upload photos/video of a real room →
get an interactive 3D model → click on a surface (wall, floor) → describe a
material in text ("18th century style wallpaper", "dark oak flooring") → AI
generates and applies a matching texture directly onto the 3D model.

**Difference from existing AI interior tools** (RoomGPT, Interior AI,
ReimagineHome) — they work with a flat photo and redraw the whole image. We
work with real 3D geometry: the room can be rotated, and materials can be
changed precisely on a chosen surface without regenerating the whole scene.

Detailed idea, stack, and pipeline description — in [`docs/architecture.md`](./docs/architecture.md).

## Project status

🚧 Early stage — MVP in development.

## Repository structure

```
interior-ai-editor/
├── frontend/
│   ├── src/
│   │   ├── scene/          # Three.js — scene, camera, rendering, interaction
│   │   ├── ai/              # Prompt UI, calls to the AI service
│   │   └── components/      # React components for the editor UI
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── ai-service/      # wrapper around Stable Diffusion (self-hosted/API)
│   │   └── reconstruction/  # integration with COLMAP/photogrammetry API
│   └── package.json
├── docs/
│   └── architecture.md
└── README.md
```

## Stack

- **Frontend:** React, Vite, Three.js
- **3D reconstruction:** COLMAP (self-hosted) or a ready-made API (Polycam/KIRI Engine)
- **AI material generation:** Stable Diffusion (self-hosted via AUTOMATIC1111/Forge)
- **Backend:** Node.js, Express

## Team

- Development — see the `@dev` role on the Discord server
- UI/UX — see the `@design` role

## Running the project

_TODO: fill in once the first working version of frontend/backend is ready_

## Contributing

We work through Discord channels — `#3d-scene`, `#ai-integration`,
`#reconstruction`, `#backend`, `#design`. Bugs go in `#bugs`. PR notifications
are automatically posted to `#pr-review`.


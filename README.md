# DWG/PDF/GLTF Viewer

This project is a simple single page web application that can display **DWG**, **PDF** and **GLTF** files. It was built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) with a minimal Node.js backend.

## Architecture

The app is completely client side. DWG parsing is handled by [`@mlightcad/libredwg-web`](https://www.npmjs.com/package/@mlightcad/libredwg-web), which runs libredwg compiled to WebAssembly. PDF files are rendered with `pdfjs-dist` and GLTF models are displayed with `three.js` via `@react-three/fiber`.

```
User File → Browser → React Components
         ├─ DWG → libredwg-web → SVG
         ├─ PDF → pdf.js → Canvas
         └─ GLTF → three.js
```

## Running the application

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser. Use the **Load File** button to select a `.dwg`, `.pdf` or `.gltf/.glb` file from your computer.

## Features

- Fixed size viewer window (800×600)
- Zoom in/out controls with percentage label
- For DWG files: layer list with the ability to toggle visibility or select all
- Basic rendering for PDF and GLTF files

## Notes

DWG support relies on WebAssembly. After installing dependencies, a postinstall script copies `libredwg.wasm` from `@mlightcad/libredwg-web` into the app's `public` folder so it can be served with the app.

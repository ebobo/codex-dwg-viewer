import { useRef, useState, useEffect } from 'react';
import { Box, Button, Drawer, FormControlLabel, Checkbox, FormGroup, Typography, Toolbar } from '@mui/material';
import { LibreDwg, Dwg_File_Type } from '@mlightcad/libredwg-web';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const ZOOM_STEP = 0.1;

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'gltf' | 'dwg' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dwgSvg, setDwgSvg] = useState('');
  const [layers, setLayers] = useState<string[]>([]);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const gltfUrlRef = useRef<string>('');
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      setFileType('pdf');
      const reader = new FileReader();
      reader.onload = async () => {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = pdfCanvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d')!;
        await page.render({ canvasContext: context, viewport }).promise;
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'gltf' || ext === 'glb') {
      setFileType('gltf');
      if (gltfUrlRef.current) URL.revokeObjectURL(gltfUrlRef.current);
      gltfUrlRef.current = URL.createObjectURL(file);
    } else if (ext === 'dwg') {
      setFileType('dwg');
      (async () => {
        const buffer = await file.arrayBuffer();
        const libredwg = await LibreDwg.create();
        const data = libredwg.dwg_read_data(buffer as any, Dwg_File_Type.DWG)!;
        const db = libredwg.convert(data as any) as any;
        const svg = libredwg.dwg_to_svg(db);
        libredwg.dwg_free(data);
        // Add layer attribute
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        db.entities.forEach((e: any) => {
          const el = doc.getElementById(String(e.handle));
          if (el) el.setAttribute('data-layer', e.layer);
        });
        setDwgSvg(doc.documentElement.outerHTML);
        const uniqueLayers: string[] = Array.from(new Set(db.tables.LAYER.entries.map((l: any) => l.name))) as string[];
        setLayers(uniqueLayers);
        const visibility: Record<string, boolean> = {};
        uniqueLayers.forEach(l => (visibility[l] = true));
        setLayerVisibility(visibility);
      })();
    }
  }, [file]);

  useEffect(() => {
    if (fileType === 'dwg' && viewerRef.current) {
      Object.entries(layerVisibility).forEach(([layer, visible]) => {
        viewerRef.current!.querySelectorAll(`[data-layer="${layer}"]`).forEach(el => {
          (el as HTMLElement).style.display = visible ? 'inherit' : 'none';
        });
      });
    }
  }, [layerVisibility, fileType, dwgSvg]);

  const handleLayerToggle = (layer: string) => {
    setLayerVisibility(v => ({ ...v, [layer]: !v[layer] }));
  };

  const handleSelectAll = () => {
    const all = Object.fromEntries(layers.map(l => [l, true]));
    setLayerVisibility(all);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer variant="permanent" anchor="left">
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Button variant="contained" component="label">
            Load File
            <input type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
          </Button>
          {fileType === 'dwg' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Layers</Typography>
              <Button onClick={handleSelectAll}>Select All</Button>
              <FormGroup>
                {layers.map(layer => (
                  <FormControlLabel key={layer} control={<Checkbox checked={layerVisibility[layer]} onChange={() => handleLayerToggle(layer)} />} label={layer} />
                ))}
              </FormGroup>
            </Box>
          )}
        </Box>
      </Drawer>
      <Box sx={{ ml: 30, p: 2 }}>
        <Box sx={{ mb: 1 }}>
          <Button variant="outlined" onClick={() => setZoom(z => z + ZOOM_STEP)}>Zoom In</Button>
          <Button variant="outlined" sx={{ ml: 1 }} onClick={() => setZoom(z => Math.max(ZOOM_STEP, z - ZOOM_STEP))}>Zoom Out</Button>
          <Typography component="span" sx={{ ml: 2 }}>{Math.round(zoom * 100)}%</Typography>
        </Box>
        <Box ref={viewerRef} sx={{ width: VIEW_WIDTH, height: VIEW_HEIGHT, border: '1px solid #ccc', overflow: 'auto' }}>
          {fileType === 'pdf' && <canvas ref={pdfCanvasRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} />}
          {fileType === 'gltf' && gltfUrlRef.current && (
            <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [0, 0, 5], zoom }}>
              <ambientLight />
              <pointLight position={[10, 10, 10]} />
              <GLTFModel url={gltfUrlRef.current} />
              <OrbitControls />
            </Canvas>
          )}
          {fileType === 'dwg' && dwgSvg && (
            <div dangerouslySetInnerHTML={{ __html: dwgSvg }} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default App;

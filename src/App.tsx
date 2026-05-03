import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { Home } from './pages/Home/Home';
import { AspectRatioTool } from './pages/Tools/AspectRatioTool/AspectRatioTool';
import { OptimizerTool } from './pages/Tools/OptimizerTool/OptimizerTool';
import { ConverterTool } from './pages/Tools/ConverterTool/ConverterTool';
import { RotateFlipTool } from './pages/Tools/RotateFlipTool/RotateFlipTool';
import { WatermarkTool } from './pages/Tools/WatermarkTool/WatermarkTool';
import { ColorPaletteTool } from './pages/Tools/ColorPaletteTool/ColorPaletteTool';
import { Base64Tool } from './pages/Tools/Base64Tool/Base64Tool';
import { BackgroundRemoverTool } from './pages/Tools/BackgroundRemoverTool/BackgroundRemoverTool';
import './App.css'; // Mantenemos variables de envoltura si quedan

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Index Route es el Home Page */}
          <Route index element={<Home />} />
          
          {/* Rutas de las Herramientas */}
          <Route path="herramientas/recorte-aspect-ratio" element={<AspectRatioTool />} />
          <Route path="herramientas/optimizar-peso" element={<OptimizerTool />} />
          <Route path="herramientas/cambiar-formato" element={<ConverterTool />} />
          <Route path="herramientas/girar-voltear" element={<RotateFlipTool />} />
          <Route path="herramientas/marca-de-agua" element={<WatermarkTool />} />
          <Route path="herramientas/paleta-colores" element={<ColorPaletteTool />} />
          <Route path="herramientas/base64" element={<Base64Tool />} />
          <Route path="herramientas/quitar-fondo" element={<BackgroundRemoverTool />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

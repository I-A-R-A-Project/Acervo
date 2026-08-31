import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Literatura from './pages/Literatura.jsx'
import Arquitectura from './pages/Arquitectura.jsx'
import Escultura from './pages/Escultura.jsx'
import Pintura from './pages/Pintura.jsx'
import Musica from './pages/Musica.jsx'
import Danza from './pages/Danza.jsx'
import Cine from './pages/Cine.jsx'
import Fotografia from './pages/Fotografia.jsx'
import Comics from './pages/Comics.jsx'
import Videojuegos from './pages/Videojuegos.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/literatura" element={<Literatura />} />
        <Route path="/arquitectura" element={<Arquitectura />} />
        <Route path="/escultura" element={<Escultura />} />
        <Route path="/pintura" element={<Pintura />} />
        <Route path="/musica" element={<Musica />} />
        <Route path="/danza" element={<Danza />} />
        <Route path="/cine" element={<Cine />} />
        <Route path="/fotografia" element={<Fotografia />} />
        <Route path="/comics" element={<Comics />} />
        <Route path="/videojuegos" element={<Videojuegos />} />
      </Routes>
    </BrowserRouter>
  )
}

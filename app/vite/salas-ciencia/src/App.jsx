import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SciencePage from './pages/SciencePage.jsx'

export default function App() {
  return (
    <BrowserRouter basename="/salas-ciencia">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:branchId" element={<SciencePage />} />
      </Routes>
    </BrowserRouter>
  )
}

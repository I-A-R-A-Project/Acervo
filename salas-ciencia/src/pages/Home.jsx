import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BRANCHES } from '../data/scienceData.js'
import './Home.css'

const FONTS = 'Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600'

export default function Home() {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${FONTS}&display=swap`
    document.head.appendChild(link)
    return () => document.head.removeChild(link)
  }, [])

  return (
    <div className="page-home">
      <div className="home-header">
        <div className="eyebrow">Salas de Ciencia — prototipo de UI</div>
        <h1>Una sala distinta para cada ciencia</h1>
        <p>Ocho maneras de navegar y guardar referencias — cada rama con sus propias subclasificaciones, su propia ficha de detalle, y el mismo objetivo: armar una biblioteca de consulta reutilizable.</p>
      </div>
      <div className="grid">
        {BRANCHES.map((b) => (
          <Link key={b.id} to={`/${b.id}`} className="tile" style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}>
            <div className="name">{b.name}</div>
            <div className="tag">— {b.tag}</div>
          </Link>
        ))}
      </div>
      <div className="footer-note">
        Los datos de cada rama son de ejemplo (mock), listos para reemplazar por datos reales.
      </div>
    </div>
  )
}

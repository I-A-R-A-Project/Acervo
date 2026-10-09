import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const FONTS = 'Fraunces:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600'

const ARTS = [
  { path: '/literatura', name: 'Literatura', tag: 'la sala de lectura', from: '#14231B', to: '#2A1220' },
  { path: '/arquitectura', name: 'Arquitectura', tag: 'la mesa de dibujo', from: '#0B2A4A', to: '#12385c' },
  { path: '/escultura', name: 'Escultura', tag: 'la sala de vitrinas', from: '#3a3a34', to: '#232323' },
  { path: '/pintura', name: 'Pintura', tag: 'el salón', from: '#2A1220', to: '#3A1A2C' },
  { path: '/musica', name: 'Música', tag: 'la discoteca', from: '#241812', to: '#3a2414' },
  { path: '/danza', name: 'Danza', tag: 'el escenario', from: '#141014', to: '#3a1220' },
  { path: '/cine', name: 'Cine', tag: 'sala de proyección', from: '#0D0D0F', to: '#3a1015' },
  { path: '/fotografia', name: 'Fotografía', tag: 'el cuarto oscuro', from: '#0A0A0A', to: '#3D0F0F' },
  { path: '/videojuegos', name: 'Videojuegos', tag: 'la cartucho-teca', from: '#0B0E1A', to: '#141c33' },
]

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
        <div className="eyebrow">Salas de Arte — prototipos de UI</div>
        <h1>Una sala distinta para cada arte</h1>
      </div>
      <div className="grid">
        {ARTS.map((a) => (
          <Link key={a.path} to={a.path} className="tile" style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }}>
            <div className="name">{a.name}</div>
            <div className="tag">— {a.tag}</div>
          </Link>
        ))}
      </div>
      <div className="footer-note">
      </div>
    </div>
  )
}

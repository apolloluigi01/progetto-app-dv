import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage    from './components/HomePage.jsx'
import Regolamento from './components/Regolamento.jsx'
import Lobby       from './components/Lobby.jsx'
import Game        from './components/Game.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<HomePage />}    />
        <Route path="/regolamento"      element={<Regolamento />} />
        <Route path="/lobby"            element={<Lobby />}       />
        <Route path="/game/:roomCode"   element={<Game />}        />
      </Routes>
    </BrowserRouter>
  )
}

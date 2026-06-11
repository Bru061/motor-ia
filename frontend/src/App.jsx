import { Routes, Route } from 'react-router-dom'

// Las páginas se irán añadiendo conforme avance el desarrollo
// import Login from './pages/Login'
// import Register from './pages/Register'
// import SkillAssessment from './pages/SkillAssessment'
// import Roadmap from './pages/Roadmap'
// import Dashboard from './pages/Dashboard'
// import Admin from './pages/Admin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">MotorIA</h1><p className="text-gray-500 mt-2">En desarrollo...</p></div>} />
    </Routes>
  )
}

export default App

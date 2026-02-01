import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import MainStage from './components/MainStage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stage" element={<MainStage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

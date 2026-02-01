import { Link } from 'react-router-dom'
import ThreeScene from './ThreeScene'

function MainStage() {
  return (
    <div className="main-stage">
      <div className="stage-header">
        <Link to="/" className="back-button">← Back to Home</Link>
        <h2>Main Stage</h2>
      </div>
      <ThreeScene />
    </div>
  )
}

export default MainStage
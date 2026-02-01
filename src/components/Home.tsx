import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Three.js Project</h1>
        <p>Welcome to the Three.js interactive experience</p>
        <div className="navigation-buttons">
          <Link to="/stage" className="nav-button">
            Enter Main Stage
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
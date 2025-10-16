import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'

// Components
import Navigation from './components/Navigation'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import CampaignList from './pages/CampaignList'
import CampaignCreate from './pages/CampaignCreate'
import CampaignDetail from './pages/CampaignDetail'
import AssetReport from './pages/AssetReport'
import Cost from './pages/Cost'
import CreativeIntegrations from './pages/CreativeIntegrations'
import CrossAnalytics from './pages/CrossAnalytics'
import Translation from './pages/Translation'

function App() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <Navigation handleDrawerToggle={handleDrawerToggle} />
        <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 240px)` },
            minHeight: '100vh',
            backgroundColor: 'background.default',
          }}
        >
          <Toolbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns" element={<CampaignList />} />
            <Route path="/campaigns/new" element={<CampaignCreate />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/reports" element={<AssetReport />} />
            <Route path="/cost" element={<Cost />} />
            <Route path="/integrations" element={<CreativeIntegrations />} />
            <Route path="/analytics" element={<CrossAnalytics />} />
            <Route path="/translation" element={<Translation />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  )
}

export default App


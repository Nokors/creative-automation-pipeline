import { useNavigate, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon,
  AddCircle as AddIcon,
  Assessment as ReportIcon,
  Extension as IntegrationsIcon,
  BarChart as AnalyticsIcon,
  Translate as TranslateIcon,
  AttachMoney as CostIcon,
} from '@mui/icons-material'

const drawerWidth = 240

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
  { text: 'Create Campaign', icon: <AddIcon />, path: '/campaigns/new' },
  { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
]

const mockupItems = [
  { text: 'Cost Management', icon: <CostIcon />, path: '/cost', badge: 'Soon' },
  { text: 'Creative Integrations', icon: <IntegrationsIcon />, path: '/integrations', badge: 'Soon' },
  { text: 'Cross Analytics', icon: <AnalyticsIcon />, path: '/analytics', badge: 'Soon' },
  { text: 'Translation', icon: <TranslateIcon />, path: '/translation', badge: 'Soon' },
]

function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const navigate = useNavigate()
  const location = useLocation()

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CampaignIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h6" noWrap component="div" color="primary" fontWeight="bold">
            Campaigns
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (handleDrawerToggle) handleDrawerToggle()
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          COMING SOON
        </Typography>
      </Box>
      <List>
        {mockupItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (handleDrawerToggle) handleDrawerToggle()
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                }}
              />
              {item.badge && (
                <Chip 
                  label={item.badge} 
                  size="small" 
                  color="info"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}

export default Sidebar

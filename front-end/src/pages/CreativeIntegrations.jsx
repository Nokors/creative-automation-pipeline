import { useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material'
import {
  CloudSync,
  PhotoLibrary,
  VideoLibrary,
  Palette,
  AutoAwesome,
  CheckCircle,
  Settings,
  Link as LinkIcon,
} from '@mui/icons-material'

function CreativeIntegrations() {
  const [integrations, setIntegrations] = useState({
    adobeCreativeCloud: true,
    canva: false,
    figma: false,
    unsplash: true,
    pexels: false,
    shutterstock: false,
  })

  const handleToggle = (key) => {
    setIntegrations((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const availableIntegrations = [
    {
      id: 'adobeCreativeCloud',
      name: 'Adobe Creative Cloud',
      description: 'Sync designs from Photoshop, Illustrator, and Adobe Firefly',
      icon: <Palette sx={{ fontSize: 40 }} />,
      color: '#FF0000',
      status: 'active',
      features: ['AI Image Generation', 'Direct Upload', 'Asset Library'],
    },
    {
      id: 'canva',
      name: 'Canva',
      description: 'Import templates and designs directly from Canva',
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      color: '#00C4CC',
      status: 'available',
      features: ['Template Import', 'Brand Kit Sync', 'Design Export'],
    },
    {
      id: 'figma',
      name: 'Figma',
      description: 'Export frames and components from Figma projects',
      icon: <Palette sx={{ fontSize: 40 }} />,
      color: '#F24E1E',
      status: 'available',
      features: ['Frame Export', 'Component Library', 'Version Control'],
    },
    {
      id: 'unsplash',
      name: 'Unsplash',
      description: 'Access millions of high-quality free stock photos',
      icon: <PhotoLibrary sx={{ fontSize: 40 }} />,
      color: '#000000',
      status: 'active',
      features: ['Free Photos', 'High Resolution', 'Commercial Use'],
    },
    {
      id: 'pexels',
      name: 'Pexels',
      description: 'Browse and use free stock photos and videos',
      icon: <VideoLibrary sx={{ fontSize: 40 }} />,
      color: '#05A081',
      status: 'available',
      features: ['Photos & Videos', 'Curated Collections', 'Free License'],
    },
    {
      id: 'shutterstock',
      name: 'Shutterstock',
      description: 'Premium stock photos, vectors, and illustrations',
      icon: <PhotoLibrary sx={{ fontSize: 40 }} />,
      color: '#EE2B24',
      status: 'premium',
      features: ['Premium Content', 'Vectors & Illustrations', 'Enterprise Plans'],
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Creative Integrations
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect your favorite creative tools and asset libraries to streamline your campaign creation workflow
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Coming Soon!</strong> This is a preview of upcoming creative integrations. 
          Connect external design tools and asset libraries to enhance your campaign creation experience.
        </Typography>
      </Alert>

      {/* Active Integrations Summary */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CloudSync color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Active Connections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Object.values(integrations).filter(Boolean).length} of {Object.keys(integrations).length} integrations enabled
              </Typography>
            </Box>
          </Box>
          <Button variant="outlined" startIcon={<Settings />}>
            Manage All
          </Button>
        </Box>
      </Paper>

      {/* Integrations Grid */}
      <Grid container spacing={3}>
        {availableIntegrations.map((integration) => {
          const isEnabled = integrations[integration.id]

          return (
            <Grid item xs={12} md={6} key={integration.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Integration Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: integration.color }}>
                        {integration.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {integration.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          {integration.status === 'active' && (
                            <Chip
                              label="Active"
                              size="small"
                              color="success"
                              icon={<CheckCircle />}
                            />
                          )}
                          {integration.status === 'premium' && (
                            <Chip label="Premium" size="small" color="warning" />
                          )}
                          {integration.status === 'available' && (
                            <Chip label="Available" size="small" color="default" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {integration.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Features */}
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                    Features:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {integration.features.map((feature) => (
                      <Chip key={feature} label={feature} size="small" variant="outlined" />
                    ))}
                  </Box>

                  {/* Toggle */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isEnabled}
                          onChange={() => handleToggle(integration.id)}
                          color="primary"
                        />
                      }
                      label={isEnabled ? 'Enabled' : 'Disabled'}
                    />
                    {isEnabled && (
                      <Button size="small" variant="outlined" startIcon={<LinkIcon />}>
                        Configure
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Call to Action */}
      <Paper sx={{ p: 4, mt: 4, textAlign: 'center', bgcolor: 'background.default' }}>
        <AutoAwesome sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Need a Custom Integration?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We can build custom integrations with your existing creative tools and workflows
        </Typography>
        <Button variant="contained" size="large">
          Request Integration
        </Button>
      </Paper>
    </Container>
  )
}

export default CreativeIntegrations


import { useState } from 'react'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Button,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  Cloud as CloudIcon,
  Psychology as AIIcon,
  Storage as StorageIcon,
  Download,
  Info as InfoIcon,
} from '@mui/icons-material'

function Cost() {
  // Mock data for demonstration
  const [timeRange] = useState('This Month')
  
  const monthlyCosts = {
    imageProcessing: 145.50,
    aiGeneration: 89.30,
    storage: 23.75,
    dropboxBackup: 12.00,
    total: 270.55,
    budget: 500.00,
  }

  const campaignCosts = [
    {
      id: '1',
      name: 'Summer Collection Launch',
      date: '2025-10-10',
      imageProcessing: 12.50,
      aiGeneration: 25.00,
      storage: 2.30,
      dropbox: 1.50,
      total: 41.30,
      status: 'completed',
    },
    {
      id: '2',
      name: 'Fall Fashion Campaign',
      date: '2025-10-08',
      imageProcessing: 15.75,
      aiGeneration: 0,
      storage: 3.10,
      dropbox: 1.50,
      total: 20.35,
      status: 'completed',
    },
    {
      id: '3',
      name: 'Holiday Special Promo',
      date: '2025-10-05',
      imageProcessing: 18.25,
      aiGeneration: 30.00,
      storage: 4.20,
      dropbox: 2.00,
      total: 54.45,
      status: 'completed',
    },
    {
      id: '4',
      name: 'Back to School Sale',
      date: '2025-10-02',
      imageProcessing: 10.00,
      aiGeneration: 15.50,
      storage: 1.85,
      dropbox: 1.00,
      total: 28.35,
      status: 'completed',
    },
  ]

  const pricingTiers = [
    {
      name: 'Image Processing',
      description: 'Resize and optimize images into multiple aspect ratios',
      unit: 'per campaign',
      price: '$10-20',
      included: [
        '3 aspect ratios (1:1, 9:16, 16:9)',
        'High-quality JPEG compression',
        'Automatic color optimization',
        'Brand color validation',
      ],
    },
    {
      name: 'AI Image Generation',
      description: 'Generate custom images using Adobe Firefly AI',
      unit: 'per generation',
      price: '$15-35',
      included: [
        '2048x2048 base resolution',
        'Professional style presets',
        'Multiple variations',
        'Commercial usage rights',
      ],
    },
    {
      name: 'Storage',
      description: 'Secure cloud storage for campaign assets',
      unit: 'per GB/month',
      price: '$0.10',
      included: [
        'Unlimited campaign storage',
        'Automatic backup',
        'Fast CDN delivery',
        '99.9% uptime SLA',
      ],
    },
    {
      name: 'Dropbox Integration',
      description: 'Automatic backup to your Dropbox account',
      unit: 'per campaign',
      price: '$1-2',
      included: [
        'All image variations',
        'Shareable links',
        'Folder organization',
        'Version history',
      ],
    },
  ]

  const budgetUsage = (monthlyCosts.total / monthlyCosts.budget) * 100

  const StatCard = ({ title, value, icon, trend, trendValue, color = 'primary.main' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
          {trend && (
            <Chip
              icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
              label={trendValue}
              color={trend === 'up' ? 'error' : 'success'}
              size="small"
            />
          )}
        </Box>
        <Typography color="text.secondary" gutterBottom variant="overline">
          {title}
        </Typography>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  )

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Cost Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage your campaign costs and pricing
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Mockup Page:</strong> This is a demonstration of cost tracking features. 
        Data shown here is for illustration purposes only.
      </Alert>

      {/* Monthly Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Costs"
            value={`$${monthlyCosts.total.toFixed(2)}`}
            icon={<MoneyIcon />}
            trend="up"
            trendValue="+12%"
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Image Processing"
            value={`$${monthlyCosts.imageProcessing.toFixed(2)}`}
            icon={<ImageIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="AI Generation"
            value={`$${monthlyCosts.aiGeneration.toFixed(2)}`}
            icon={<AIIcon />}
            trend="down"
            trendValue="-5%"
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Storage & Backup"
            value={`$${(monthlyCosts.storage + monthlyCosts.dropboxBackup).toFixed(2)}`}
            icon={<StorageIcon />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Budget Usage */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Monthly Budget Usage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {timeRange}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ${monthlyCosts.total.toFixed(2)} of ${monthlyCosts.budget.toFixed(2)}
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={budgetUsage > 80 ? 'error.main' : 'success.main'}>
              {budgetUsage.toFixed(1)}% Used
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={budgetUsage} 
            sx={{ 
              height: 10, 
              borderRadius: 1,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: budgetUsage > 80 ? 'error.main' : 'success.main',
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Remaining Budget
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="success.main">
              ${(monthlyCosts.budget - monthlyCosts.total).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Projected Total
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              ${(monthlyCosts.total * 1.15).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Avg. per Campaign
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              ${(monthlyCosts.total / campaignCosts.length).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Campaign Costs Table */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Campaign Cost Breakdown
          </Typography>
          <Button startIcon={<Download />} variant="outlined" size="small">
            Export CSV
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Campaign</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="right"><strong>Processing</strong></TableCell>
                <TableCell align="right"><strong>AI Gen</strong></TableCell>
                <TableCell align="right"><strong>Storage</strong></TableCell>
                <TableCell align="right"><strong>Backup</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaignCosts.map((campaign) => (
                <TableRow key={campaign.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {campaign.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(campaign.date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">${campaign.imageProcessing.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {campaign.aiGeneration > 0 ? (
                      `$${campaign.aiGeneration.toFixed(2)}`
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">${campaign.storage.toFixed(2)}</TableCell>
                  <TableCell align="right">${campaign.dropbox.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${campaign.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={campaign.status} 
                      color="success" 
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pricing Tiers */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Pricing Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Transparent pricing for all campaign features
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {pricingTiers.map((tier, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {tier.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {tier.description}
                      </Typography>
                    </Box>
                    <Tooltip title="Pricing details">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {tier.price}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tier.unit}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    INCLUDES:
                  </Typography>
                  {tier.included.map((feature, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        backgroundColor: 'success.main', 
                        mr: 1 
                      }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Cost Breakdown Chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Cost Distribution
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Breakdown of costs by category ({timeRange})
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: 1, 
                backgroundColor: 'info.main',
                mr: 2
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  Image Processing
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(monthlyCosts.imageProcessing / monthlyCosts.total) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'info.main',
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ ml: 2, minWidth: 70, textAlign: 'right' }}>
                ${monthlyCosts.imageProcessing.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: 1, 
                backgroundColor: 'success.main',
                mr: 2
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  AI Generation
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(monthlyCosts.aiGeneration / monthlyCosts.total) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'success.main',
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ ml: 2, minWidth: 70, textAlign: 'right' }}>
                ${monthlyCosts.aiGeneration.toFixed(2)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: 1, 
                backgroundColor: 'warning.main',
                mr: 2
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  Storage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(monthlyCosts.storage / monthlyCosts.total) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'warning.main',
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ ml: 2, minWidth: 70, textAlign: 'right' }}>
                ${monthlyCosts.storage.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                width: 16, 
                height: 16, 
                borderRadius: 1, 
                backgroundColor: 'error.main',
                mr: 2
              }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  Dropbox Backup
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(monthlyCosts.dropboxBackup / monthlyCosts.total) * 100}
                  sx={{ 
                    height: 8, 
                    borderRadius: 1,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'error.main',
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ ml: 2, minWidth: 70, textAlign: 'right' }}>
                ${monthlyCosts.dropboxBackup.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default Cost


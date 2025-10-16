import { useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Timeline,
  Language,
  Campaign,
  Visibility,
  TouchApp,
  Share,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material'

function CrossAnalytics() {
  const [timeRange, setTimeRange] = useState('30days')

  const metrics = [
    {
      title: 'Total Campaigns',
      value: '247',
      change: '+12.5%',
      trend: 'up',
      icon: <Campaign />,
      color: 'primary.main',
    },
    {
      title: 'Total Impressions',
      value: '2.4M',
      change: '+28.3%',
      trend: 'up',
      icon: <Visibility />,
      color: 'success.main',
    },
    {
      title: 'Engagement Rate',
      value: '8.7%',
      change: '-2.1%',
      trend: 'down',
      icon: <TouchApp />,
      color: 'warning.main',
    },
    {
      title: 'Share Rate',
      value: '4.2%',
      change: '+5.8%',
      trend: 'up',
      icon: <Share />,
      color: 'info.main',
    },
  ]

  const campaignPerformance = [
    {
      id: 1,
      name: 'Summer Sale 2025',
      platform: 'Multi-Platform',
      impressions: '450K',
      engagement: '9.2%',
      conversions: 1240,
      roi: '+320%',
      status: 'active',
    },
    {
      id: 2,
      name: 'Winter Collection Launch',
      platform: 'Social Media',
      impressions: '380K',
      engagement: '7.8%',
      conversions: 980,
      roi: '+245%',
      status: 'completed',
    },
    {
      id: 3,
      name: 'Spring Campaign',
      platform: 'Email + Web',
      impressions: '290K',
      engagement: '11.5%',
      conversions: 1560,
      roi: '+412%',
      status: 'active',
    },
    {
      id: 4,
      name: 'Product Launch Q1',
      platform: 'Display Ads',
      impressions: '520K',
      engagement: '6.3%',
      conversions: 850,
      roi: '+198%',
      status: 'completed',
    },
  ]

  const channelBreakdown = [
    { channel: 'Social Media', percentage: 42, campaigns: 104 },
    { channel: 'Email Marketing', percentage: 28, campaigns: 69 },
    { channel: 'Display Ads', percentage: 18, campaigns: 44 },
    { channel: 'Content Marketing', percentage: 12, campaigns: 30 },
  ]

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Cross-Channel Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track and analyze campaign performance across all channels
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={timeRange === '7days' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTimeRange('7days')}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === '30days' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTimeRange('30days')}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === '90days' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTimeRange('90days')}
            >
              90 Days
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Coming Soon!</strong> Comprehensive analytics dashboard with real-time data from all your marketing channels.
          Track performance, measure ROI, and optimize campaigns based on data-driven insights.
        </Typography>
      </Alert>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ color: metric.color, mb: 2 }}>
                    {metric.icon}
                  </Box>
                  <Chip
                    icon={metric.trend === 'up' ? <ArrowUpward /> : <ArrowDownward />}
                    label={metric.change}
                    size="small"
                    color={metric.trend === 'up' ? 'success' : 'error'}
                  />
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Channel Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <PieChart color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Channel Distribution
              </Typography>
            </Box>
            <Box>
              {channelBreakdown.map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {item.channel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.percentage}% ({item.campaigns} campaigns)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Performance Trends */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Timeline color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Performance Trends
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="success">
                <Typography variant="body2" fontWeight="bold">
                  📈 Engagement Up 28%
                </Typography>
                <Typography variant="caption">
                  Compared to previous period
                </Typography>
              </Alert>
              <Alert severity="info">
                <Typography variant="body2" fontWeight="bold">
                  🎯 Top Performing Channel: Social Media
                </Typography>
                <Typography variant="caption">
                  42% of total campaigns with highest ROI
                </Typography>
              </Alert>
              <Alert severity="warning">
                <Typography variant="body2" fontWeight="bold">
                  ⚠️ Display Ads Declining
                </Typography>
                <Typography variant="caption">
                  2.1% decrease in engagement rate
                </Typography>
              </Alert>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Campaign Performance Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BarChart color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Top Performing Campaigns
            </Typography>
          </Box>
          <Button variant="outlined" size="small">
            View All
          </Button>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Campaign</strong></TableCell>
                <TableCell><strong>Platform</strong></TableCell>
                <TableCell align="right"><strong>Impressions</strong></TableCell>
                <TableCell align="right"><strong>Engagement</strong></TableCell>
                <TableCell align="right"><strong>Conversions</strong></TableCell>
                <TableCell align="right"><strong>ROI</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {campaignPerformance.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Chip label={row.platform} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{row.impressions}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={row.engagement}
                      size="small"
                      color={parseFloat(row.engagement) > 8 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{row.conversions.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Typography color="success.main" fontWeight="bold">
                      {row.roi}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={row.status === 'active' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Export & Reports */}
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
        <Language sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Advanced Analytics & Reports
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Export detailed reports, set up automated insights, and integrate with your favorite analytics platforms
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained">
            Export Report
          </Button>
          <Button variant="outlined">
            Schedule Reports
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}

export default CrossAnalytics


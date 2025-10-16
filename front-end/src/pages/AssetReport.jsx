import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import { Refresh, Image, Cloud, Computer } from '@mui/icons-material'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { campaignAPI } from '../services/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

function AssetReport() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await campaignAPI.getAssetReport()
      setReport(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch asset report')
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    )
  }

  if (!report) return null

  // Prepare chart data
  const pieData = [
    { name: 'AI Generated', value: report.ai_generated, icon: '🤖' },
    { name: 'Local Uploads', value: report.local_uploads, icon: '💻' },
  ]

  // Prepare status breakdown data
  const statusData = Object.keys(report.by_status).map((status) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    'AI Generated': report.by_status[status].ai_generated,
    'Local': report.by_status[status].local_uploads,
  }))

  const StatCard = ({ title, value, icon, color, percentage }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h3" component="div">
              {value}
            </Typography>
            {percentage !== undefined && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {percentage}% of total
              </Typography>
            )}
          </Box>
          <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  )

  const totalCampaigns = report.total_campaigns
  const aiPercentage = totalCampaigns > 0 ? ((report.ai_generated / totalCampaigns) * 100).toFixed(1) : 0
  const localPercentage = totalCampaigns > 0 ? ((report.local_uploads / totalCampaigns) * 100).toFixed(1) : 0

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Asset Report
        </Typography>
        <Button startIcon={<Refresh />} onClick={fetchReport} variant="outlined">
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Total Campaigns"
            value={report.total_campaigns}
            icon={<Image />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="AI Generated"
            value={report.ai_generated}
            icon="🤖"
            color="success.main"
            percentage={aiPercentage}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Local Uploads"
            value={report.local_uploads}
            icon={<Computer />}
            color="info.main"
            percentage={localPercentage}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Image Source Distribution
            </Typography>
            <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {totalCampaigns > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">No data available</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Bar Chart - Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Sources by Campaign Status
            </Typography>
            <Box sx={{ height: 400 }}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="AI Generated" fill="#0088FE" />
                    <Bar dataKey="Local" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Detailed Breakdown Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Detailed Breakdown by Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              {Object.keys(report.by_status).map((status) => (
                <Box
                  key={status}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        AI Generated
                      </Typography>
                      <Typography variant="h6">
                        {report.by_status[status].ai_generated}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Local Uploads
                      </Typography>
                      <Typography variant="h6">
                        {report.by_status[status].local_uploads}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Insights */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📊 Insights
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Most Used Source
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {report.ai_generated >= report.local_uploads
                      ? '🤖 AI Generated'
                      : '💻 Local Uploads'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    AI Adoption Rate
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {aiPercentage}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Manual Uploads
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {report.local_uploads} ({localPercentage}%)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AssetReport


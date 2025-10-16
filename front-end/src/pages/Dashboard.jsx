import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import {
  Campaign as CampaignIcon,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  PlayArrow,
  Add,
} from '@mui/icons-material'
import { campaignAPI } from '../services/api'

function Dashboard() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    active: 0,
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await campaignAPI.list()
      const data = response.data
      setCampaigns(data)

      // Calculate stats
      const newStats = {
        total: data.length,
        pending: data.filter((c) => c.status === 'pending').length,
        processing: data.filter((c) => c.status === 'processing').length,
        completed: data.filter((c) => c.status === 'completed').length,
        failed: data.filter((c) => c.status === 'failed').length,
        active: data.filter((c) => c.status === 'active').length,
      }
      setStats(newStats)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch campaigns')
      console.error('Error fetching campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color }) => (
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
          </Box>
          <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/campaigns/new')}
          size="large"
        >
          Create Campaign
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Total Campaigns"
            value={stats.total}
            icon={<CampaignIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Active"
            value={stats.active}
            icon={<PlayArrow />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Processing"
            value={stats.processing}
            icon={<CircularProgress size={40} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Pending />}
            color="grey.500"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={<ErrorIcon />}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Recent Campaigns */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Recent Campaigns
          </Typography>
          <Button onClick={() => navigate('/campaigns')}>View All</Button>
        </Box>

        {campaigns.slice(0, 5).map((campaign) => (
          <Box
            key={campaign.id}
            sx={{
              p: 2,
              mb: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {campaign.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {campaign.target_market}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={campaign.status}
                  color={
                    campaign.status === 'completed'
                      ? 'success'
                      : campaign.status === 'active'
                      ? 'info'
                      : campaign.status === 'failed'
                      ? 'error'
                      : 'default'
                  }
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        ))}

        {campaigns.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">No campaigns yet</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/campaigns/new')}
              sx={{ mt: 2 }}
            >
              Create Your First Campaign
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  )
}

export default Dashboard


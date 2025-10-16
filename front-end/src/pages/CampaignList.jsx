import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
} from '@mui/material'
import { Add, Refresh } from '@mui/icons-material'
import { campaignAPI } from '../services/api'
import { format } from 'date-fns'

function CampaignList() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState([])
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    filterCampaigns()
  }, [campaigns, statusFilter, searchQuery])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await campaignAPI.list()
      setCampaigns(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch campaigns')
      console.error('Error fetching campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterCampaigns = () => {
    let filtered = [...campaigns]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.description.toLowerCase().includes(query) ||
          c.target_market.toLowerCase().includes(query) ||
          c.campaign_message.toLowerCase().includes(query)
      )
    }

    setFilteredCampaigns(filtered)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'active':
        return 'info'
      case 'processing':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
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

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Campaigns
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<Refresh />} onClick={fetchCampaigns} variant="outlined">
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/campaigns/new')}
          >
            Create Campaign
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search campaigns"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, market, or message..."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Campaign Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Description</strong></TableCell>
                <TableCell><strong>Target Market</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Products</strong></TableCell>
                <TableCell><strong>Languages</strong></TableCell>
                <TableCell><strong>Created</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCampaigns
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((campaign) => (
                  <TableRow
                    key={campaign.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {campaign.description.substring(0, 50)}
                        {campaign.description.length > 50 ? '...' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>{campaign.target_market.substring(0, 40)}</TableCell>
                    <TableCell>
                      <Chip
                        label={campaign.status}
                        color={getStatusColor(campaign.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {campaign.products?.length || 0} products
                    </TableCell>
                    <TableCell>
                      {campaign.item_metadata?.languages?.length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {campaign.item_metadata.languages.map((lang) => (
                            <Chip key={lang} label={lang.toUpperCase()} size="small" color="primary" />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.created_at
                        ? format(new Date(campaign.created_at), 'MMM dd, yyyy')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/campaigns/${campaign.id}`)
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredCampaigns.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {searchQuery || statusFilter !== 'all'
                ? 'No campaigns match your filters'
                : 'No campaigns yet'}
            </Typography>
          </Box>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCampaigns.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  )
}

// Missing import
import Grid from '@mui/material/Grid'

export default CampaignList


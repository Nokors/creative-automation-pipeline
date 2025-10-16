import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Divider,
  Card,
  CardMedia,
  CardContent,
  Snackbar,
} from '@mui/material'
import { ArrowBack, Refresh, CloudUpload, CloudDone, Link as LinkIcon } from '@mui/icons-material'
import { campaignAPI } from '../services/api'
import { format } from 'date-fns'
import api from '../services/api'

function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploadingToDropbox, setUploadingToDropbox] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Helper function to convert Dropbox shared link to direct image URL
  const getDropboxImageUrl = (sharedLink) => {
    if (!sharedLink) return null
    // Convert Dropbox shared link to direct download link
    // From: https://www.dropbox.com/s/xxxxx/file.jpg?dl=0
    // To: https://dl.dropboxusercontent.com/s/xxxxx/file.jpg (direct content)
    return sharedLink.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '')
  }

  // Helper function to get brand validation data (from dedicated columns or item_metadata fallback)
  const getBrandValidation = () => {
    // Prefer dedicated columns (new campaigns)
    if (campaign?.brand_validation_status || campaign?.brand_validation_result) {
      return {
        status: campaign.brand_validation_status,
        message: campaign.brand_validation_message,
        details: campaign.brand_validation_result
      }
    }
    // Fallback to item_metadata (old campaigns or backward compatibility)
    if (campaign?.item_metadata?.brand_validation) {
      return campaign.item_metadata.brand_validation
    }
    return null
  }

  useEffect(() => {
    fetchCampaign()
    // Poll for updates every 5 seconds if status is pending or processing
    const interval = setInterval(() => {
      if (campaign?.status === 'pending' || campaign?.status === 'processing') {
        fetchCampaign(true)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [id, campaign?.status])

  const fetchCampaign = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await campaignAPI.get(id)
      setCampaign(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch campaign')
      console.error('Error fetching campaign:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleUploadToDropbox = async () => {
    try {
      setUploadingToDropbox(true)
      const response = await api.post(`/campaigns/${id}/upload-to-dropbox`)
      
      // Refresh campaign data to get updated Dropbox links
      await fetchCampaign(true)
      
      setSnackbar({
        open: true,
        message: response.data.message || 'Images uploaded to Dropbox successfully!',
        severity: 'success'
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to upload to Dropbox',
        severity: 'error'
      })
      console.error('Error uploading to Dropbox:', err)
    } finally {
      setUploadingToDropbox(false)
    }
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
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/campaigns')} sx={{ mt: 2 }}>
          Back to Campaigns
        </Button>
      </Container>
    )
  }

  if (!campaign) return null

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/campaigns')}>
          Back to Campaigns
        </Button>
        <Button startIcon={<Refresh />} onClick={() => fetchCampaign()} variant="outlined">
          Refresh
        </Button>
      </Box>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {campaign.description}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              ID: {campaign.id}
            </Typography>
          </Box>
          <Chip
            label={campaign.status}
            color={getStatusColor(campaign.status)}
            size="large"
          />
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {campaign.item_metadata?.languages && campaign.item_metadata.languages.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Language:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                {campaign.item_metadata.languages.map((lang) => (
                  <Chip key={lang} label={lang.toUpperCase()} size="small" color="primary" />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Campaign Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Campaign Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Target Market
              </Typography>
              <Typography variant="body1">{campaign.target_market}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Campaign Message
              </Typography>
              <Typography variant="body1">{campaign.campaign_message}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Products Description
              </Typography>
              <Typography variant="body1">{campaign.products_description}</Typography>
            </Box>

            {campaign.marketing_channel && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Marketing Channel
                </Typography>
                <Chip 
                  label={campaign.marketing_channel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Campaign Type
              </Typography>
              <Typography variant="body1">
                {campaign.item_metadata?.campaign_type || 'Not specified'}
              </Typography>
            </Box>

            {/* Content Validation Status */}
            {campaign.content_validation_status && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Content Validation
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={campaign.content_validation_status.toUpperCase()}
                    size="small"
                    color={
                      campaign.content_validation_status === 'passed'
                        ? 'success'
                        : campaign.content_validation_status === 'skipped'
                        ? 'default'
                        : 'warning'
                    }
                  />
                </Box>
                {campaign.content_validation_message && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {campaign.content_validation_message}
                  </Typography>
                )}
              </Box>
            )}

            {/* Brand Validation Status */}
            {campaign.status === 'completed' && (() => {
              const brandValidation = getBrandValidation();
              return (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Brand Color Compliance
                </Typography>
                {brandValidation ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={brandValidation.status.toUpperCase()}
                        size="small"
                        color={
                          brandValidation.status === 'passed'
                            ? 'success'
                            : brandValidation.status === 'warning'
                            ? 'warning'
                            : brandValidation.status === 'skipped'
                            ? 'default'
                            : 'error'
                        }
                      />
                      {brandValidation.details?.compliance_percentage !== undefined && (
                        <Chip
                          label={`${brandValidation.details.compliance_percentage}% Brand Colors`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    {brandValidation.message && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {brandValidation.message}
                      </Typography>
                    )}
                    {/* Matched Brand Colors */}
                    {brandValidation.details?.brand_color_matches && 
                     brandValidation.details.brand_color_matches.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Matched Brand Colors:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {brandValidation.details.brand_color_matches.map((color, index) => (
                            <Box
                              key={index}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                backgroundColor: color,
                                border: '1px solid',
                                borderColor: 'divider',
                                title: color
                              }}
                              title={color}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {/* Dominant Colors in Image */}
                    {brandValidation.details?.dominant_colors && 
                     brandValidation.details.dominant_colors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Dominant Colors in Image:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          {brandValidation.details.dominant_colors.map((color, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  backgroundColor: color,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  title: color
                                }}
                                title={color}
                              />
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                {color}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {/* Non-Brand Colors */}
                    {brandValidation.details?.non_brand_colors && 
                     brandValidation.details.non_brand_colors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Non-Brand Colors Detected:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {brandValidation.details.non_brand_colors.map((color, index) => (
                            <Box
                              key={index}
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: 1,
                                backgroundColor: color,
                                border: '1px solid',
                                borderColor: 'divider',
                                opacity: 0.7,
                                title: color
                              }}
                              title={color}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label="NOT AVAILABLE"
                      size="small"
                      color="default"
                    />
                    <Typography variant="caption" color="text.secondary">
                      This campaign was processed before brand validation was enabled
                    </Typography>
                  </Box>
                )}
              </Box>
              );
            })()}
          </Paper>
        </Grid>

        {/* Products */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Products ({campaign.products?.length || 0})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {campaign.products && campaign.products.length > 0 ? (
              campaign.products.map((product, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 1,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {product.sku}
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    ${product.price.toFixed(2)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No products</Typography>
            )}
          </Paper>
        </Grid>

        {/* Image Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Image Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Source Type
                </Typography>
                <Chip
                  label={campaign.image_metadata.source_type}
                  size="small"
                  color={campaign.image_metadata.source_type === 'ai_generated' ? 'primary' : 'default'}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Generated by AI
                </Typography>
                <Typography variant="body1">
                  {campaign.generate_by_ai === 'true' ? 'Yes' : 'No'}
                </Typography>
              </Grid>

              {campaign.image_metadata.ai_prompt && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    AI Prompt
                  </Typography>
                  <Typography variant="body1">{campaign.image_metadata.ai_prompt}</Typography>
                </Grid>
              )}

              {campaign.image_metadata.source_path && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Source Path
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {campaign.image_metadata.source_path}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Processed Images */}
            {campaign.processed_images && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Processed Image Variations
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {campaign.processed_images.ratio_1_1 && (
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="280"
                          image={`http://localhost:8000/storage/${campaign.processed_images.ratio_1_1}`}
                          alt="Square (1:1) variation"
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                              Square (1:1) - 1080x1080
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              href={`http://localhost:8000/storage/${campaign.processed_images.ratio_1_1}`}
                              download
                              target="_blank"
                            >
                              Download
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', fontSize: '0.65rem' }}>
                            {campaign.processed_images.ratio_1_1}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  {campaign.processed_images.ratio_9_16 && (
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="280"
                          image={`http://localhost:8000/storage/${campaign.processed_images.ratio_9_16}`}
                          alt="Vertical (9:16) variation"
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                              Vertical (9:16) - 1080x1920
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              href={`http://localhost:8000/storage/${campaign.processed_images.ratio_9_16}`}
                              download
                              target="_blank"
                            >
                              Download
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', fontSize: '0.65rem' }}>
                            {campaign.processed_images.ratio_9_16}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  {campaign.processed_images.ratio_16_9 && (
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="280"
                          image={`http://localhost:8000/storage/${campaign.processed_images.ratio_16_9}`}
                          alt="Horizontal (16:9) variation"
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">
                              Horizontal (16:9) - 1920x1080
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              href={`http://localhost:8000/storage/${campaign.processed_images.ratio_16_9}`}
                              download
                              target="_blank"
                            >
                              Download
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', fontSize: '0.65rem' }}>
                            {campaign.processed_images.ratio_16_9}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Dropbox Backup Section */}
        {campaign.status === 'completed' && campaign.processed_images && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Dropbox Backup
                </Typography>
                {campaign.dropbox_uploaded === 'true' ? (
                  <Chip
                    icon={<CloudDone />}
                    label="Uploaded"
                    color="success"
                    size="small"
                  />
                ) : (
                  <Button
                    variant="contained"
                    startIcon={uploadingToDropbox ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                    onClick={handleUploadToDropbox}
                    disabled={uploadingToDropbox}
                  >
                    {uploadingToDropbox ? 'Uploading...' : 'Upload to Dropbox'}
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />

              {campaign.dropbox_uploaded === 'true' && campaign.dropbox_links ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Campaign images have been backed up to Dropbox. Preview images below or click to open in Dropbox:
                  </Typography>
                  <Grid container spacing={2}>
                    {campaign.dropbox_links.ratio_1_1 && campaign.dropbox_links.ratio_1_1.shared_link && (
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="280"
                            image={getDropboxImageUrl(campaign.dropbox_links.ratio_1_1.shared_link)}
                            alt="Square (1:1) variation - Dropbox"
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                Square (1:1) - 1080x1080
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LinkIcon />}
                                href={campaign.dropbox_links.ratio_1_1.shared_link}
                                target="_blank"
                              >
                                Dropbox
                              </Button>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', fontSize: '0.65rem' }}>
                              {campaign.dropbox_links.ratio_1_1.dropbox_path}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    {campaign.dropbox_links.ratio_9_16 && campaign.dropbox_links.ratio_9_16.shared_link && (
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="280"
                            image={getDropboxImageUrl(campaign.dropbox_links.ratio_9_16.shared_link)}
                            alt="Vertical (9:16) variation - Dropbox"
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                Vertical (9:16) - 1080x1920
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LinkIcon />}
                                href={campaign.dropbox_links.ratio_9_16.shared_link}
                                target="_blank"
                              >
                                Dropbox
                              </Button>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', fontSize: '0.65rem' }}>
                              {campaign.dropbox_links.ratio_9_16.dropbox_path}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    {campaign.dropbox_links.ratio_16_9 && campaign.dropbox_links.ratio_16_9.shared_link && (
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="280"
                            image={getDropboxImageUrl(campaign.dropbox_links.ratio_16_9.shared_link)}
                            alt="Horizontal (16:9) variation - Dropbox"
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                Horizontal (16:9) - 1920x1080
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LinkIcon />}
                                href={campaign.dropbox_links.ratio_16_9.shared_link}
                                target="_blank"
                              >
                                Dropbox
                              </Button>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', fontSize: '0.65rem' }}>
                              {campaign.dropbox_links.ratio_16_9.dropbox_path}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ) : (
                <Alert severity="info">
                  Upload your processed campaign images to Dropbox for backup and easy sharing. Click the "Upload to Dropbox" button above to get started.
                </Alert>
              )}
            </Paper>
          </Grid>
        )}

        {/* Timestamps */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {campaign.created_at
                    ? format(new Date(campaign.created_at), 'PPpp')
                    : 'N/A'}
                </Typography>
              </Grid>

              {campaign.updated_at && (
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(campaign.updated_at), 'PPpp')}
                  </Typography>
                </Grid>
              )}

              {campaign.completed_at && (
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Completed At
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(campaign.completed_at), 'PPpp')}
                  </Typography>
                </Grid>
              )}
            </Grid>

            {campaign.error_message && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Error Message:
                </Typography>
                <Typography variant="body2">{campaign.error_message}</Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default CampaignDetail


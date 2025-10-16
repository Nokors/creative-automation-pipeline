import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Chip,
  IconButton,
  Grid,
  Divider,
  Autocomplete,
} from '@mui/material'
import { Add, Delete, ArrowBack, CloudUpload, Image as ImageIcon } from '@mui/icons-material'
import { campaignAPI, imageLibraryAPI } from '../services/api'

// Supported languages (90+ languages)
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'cs', name: 'Czech' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'et', name: 'Estonian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'eu', name: 'Basque' },
  { code: 'gl', name: 'Galician' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'my', name: 'Burmese' },
  { code: 'km', name: 'Khmer' },
  { code: 'ka', name: 'Georgian' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ha', name: 'Hausa' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'jv', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'ne', name: 'Nepali' },
  { code: 'or', name: 'Odia' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'so', name: 'Somali' },
  { code: 'sw', name: 'Swahili' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
]

function CampaignCreate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [imageLibrary, setImageLibrary] = useState([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedLibraryImage, setSelectedLibraryImage] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    target_market: '',
    campaign_message: '',
    products_description: '',
    marketing_channel: '',
    products: [{ sku: '', price: '' }],
    language: null, // Single language selection
    item_metadata: {
      campaign_type: '',
    },
    generate_by_ai: true,
    auto_upload_to_dropbox: false,
    image_metadata: {
      source_type: 'ai_generated',
      ai_prompt: '',
      source_path: '',
    },
  })

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMetadataChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      item_metadata: { ...prev.item_metadata, [field]: value },
    }))
  }

  const handleLanguageChange = (event, newValue) => {
    setFormData((prev) => ({ ...prev, language: newValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setSelectedFile(file)
      setError(null)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Update form data with file name
      handleImageMetadataChange('source_path', file.name)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    setSelectedLibraryImage(null)
    handleImageMetadataChange('source_path', '')
  }

  const loadImageLibrary = async () => {
    setLoadingLibrary(true)
    try {
      const response = await imageLibraryAPI.list()
      setImageLibrary(response.data.images || [])
    } catch (err) {
      console.error('Failed to load image library:', err)
    } finally {
      setLoadingLibrary(false)
    }
  }

  const handleUploadToLibrary = async () => {
    if (!selectedFile) return

    setUploadingImage(true)
    setError(null)

    try {
      const response = await imageLibraryAPI.upload(selectedFile)
      
      // Add to library list
      setImageLibrary([response.data, ...imageLibrary])
      
      // Select the uploaded image
      setSelectedLibraryImage(response.data.filename)
      handleImageMetadataChange('source_path', response.data.filename)
      
      // Clear file selection
      setSelectedFile(null)
      setFilePreview(null)
      
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err.response?.data?.detail || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSelectLibraryImage = (filename) => {
    setSelectedLibraryImage(filename)
    handleImageMetadataChange('source_path', filename)
  }

  // Load image library when local file upload is selected
  useEffect(() => {
    if (!formData.generate_by_ai && formData.image_metadata.source_type === 'local') {
      loadImageLibrary()
    }
  }, [formData.generate_by_ai, formData.image_metadata.source_type])

  const handleImageMetadataChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      image_metadata: { ...prev.image_metadata, [field]: value },
    }))
  }

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products]
    newProducts[index][field] = value
    setFormData((prev) => ({ ...prev, products: newProducts }))
  }

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { sku: '', price: '' }],
    }))
  }

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, products: newProducts }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate language selection
      if (!formData.language) {
        setError('Please select a language for the campaign')
        setLoading(false)
        return
      }

      // Validate local file selection from library
      if (!formData.generate_by_ai && formData.image_metadata.source_type === 'local' && !selectedLibraryImage) {
        setError('Please select an image from the library')
        setLoading(false)
        return
      }

      // Prepare data
      const submitData = {
        ...formData,
        products: formData.products.map((p) => ({
          sku: p.sku,
          price: parseFloat(p.price),
        })),
        item_metadata: {
          ...formData.item_metadata,
          languages: [formData.language.code], // Convert to array with single language
        },
      }

      // Remove language field (it's now in item_metadata)
      delete submitData.language

      // Remove empty fields from item_metadata
      if (!submitData.item_metadata.campaign_type) {
        delete submitData.item_metadata.campaign_type
      }

      const response = await campaignAPI.create(submitData)
      setSuccess(true)
      setTimeout(() => {
        navigate(`/campaigns/${response.data.id}`)
      }, 1500)
    } catch (err) {
      const errorMessage = err.response?.data?.detail
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.map((e) => e.msg || e.message || JSON.stringify(e)).join(', '))
      } else {
        setError(errorMessage || 'Failed to create campaign')
      }
      console.error('Error creating campaign:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/campaigns')}>
          Back to Campaigns
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Create New Campaign
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Campaign created successfully! Redirecting...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* Basic Information */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TextField
            fullWidth
            required
            label="Campaign Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            helperText="At least 10 characters"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Target Market"
            multiline
            rows={2}
            value={formData.target_market}
            onChange={(e) => handleChange('target_market', e.target.value)}
            helperText="Describe your target audience"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Campaign Message"
            multiline
            rows={3}
            value={formData.campaign_message}
            onChange={(e) => handleChange('campaign_message', e.target.value)}
            helperText="Your campaign's main message"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required
            label="Products Description"
            multiline
            rows={3}
            value={formData.products_description}
            onChange={(e) => handleChange('products_description', e.target.value)}
            helperText="Describe the products in this campaign"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Marketing Channel</InputLabel>
            <Select
              value={formData.marketing_channel}
              onChange={(e) => handleChange('marketing_channel', e.target.value)}
              label="Marketing Channel"
            >
              <MenuItem value="">
                <em>Select a channel</em>
              </MenuItem>
              <MenuItem value="social_media">📱 Social Media</MenuItem>
              <MenuItem value="email">📧 Email Marketing</MenuItem>
              <MenuItem value="display_ads">🖼️ Display Ads</MenuItem>
              <MenuItem value="search_ads">🔍 Search Ads</MenuItem>
              <MenuItem value="content_marketing">📝 Content Marketing</MenuItem>
              <MenuItem value="video_marketing">🎬 Video Marketing</MenuItem>
              <MenuItem value="influencer">⭐ Influencer Marketing</MenuItem>
              <MenuItem value="print">📰 Print Media</MenuItem>
              <MenuItem value="outdoor">🏙️ Outdoor/Billboard</MenuItem>
              <MenuItem value="direct_mail">✉️ Direct Mail</MenuItem>
              <MenuItem value="events">🎪 Events</MenuItem>
              <MenuItem value="other">🔧 Other</MenuItem>
            </Select>
          </FormControl>

          {/* Products */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Products
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {formData.products.map((product, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                required
                label="SKU / Product Code"
                value={product.sku}
                onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                required
                label="Price"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={product.price}
                onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton
                color="error"
                onClick={() => removeProduct(index)}
                disabled={formData.products.length === 1}
              >
                <Delete />
              </IconButton>
            </Box>
          ))}

          <Button startIcon={<Add />} onClick={addProduct} variant="outlined" sx={{ mb: 2 }}>
            Add Product
          </Button>

          {/* Metadata */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Campaign Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={LANGUAGES}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                value={formData.language}
                onChange={handleLanguageChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Campaign Language *"
                    required
                    helperText="Select the primary language for this campaign"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={option.code.toUpperCase()} size="small" />
                      <Typography>{option.name}</Typography>
                    </Box>
                  </Box>
                )}
                isOptionEqualToValue={(option, value) => option.code === value.code}
                sx={{ mb: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Type"
                value={formData.item_metadata.campaign_type}
                onChange={(e) => handleMetadataChange('campaign_type', e.target.value)}
                helperText="e.g., seasonal, promotional, brand awareness"
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>

          {/* Image Settings */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Image Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <FormControlLabel
            control={
              <Switch
                checked={formData.generate_by_ai}
                onChange={(e) => {
                  const isAI = e.target.checked
                  handleChange('generate_by_ai', isAI)
                  handleImageMetadataChange(
                    'source_type',
                    isAI ? 'ai_generated' : 'local'
                  )
                }}
              />
            }
            label="Generate Image with AI (Adobe Firefly)"
            sx={{ mb: 2 }}
          />

          {formData.generate_by_ai ? (
            <TextField
              fullWidth
              required
              label="AI Image Prompt"
              multiline
              rows={3}
              value={formData.image_metadata.ai_prompt}
              onChange={(e) => handleImageMetadataChange('ai_prompt', e.target.value)}
              helperText="Describe the image you want to generate"
              sx={{ mb: 2 }}
            />
          ) : (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Image Source Type</InputLabel>
                <Select
                  value={formData.image_metadata.source_type}
                  onChange={(e) => {
                    handleImageMetadataChange('source_type', e.target.value)
                    // Clear file selection when changing source type
                    if (e.target.value !== 'local') {
                      handleRemoveFile()
                    }
                  }}
                >
                  <MenuItem value="local">Local File Upload</MenuItem>
                </Select>
              </FormControl>

              {formData.image_metadata.source_type === 'local' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Image Library
                  </Typography>

                  {/* Upload New Image Section */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                      Upload New Image
                    </Typography>
                    
                    {!selectedFile ? (
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={<CloudUpload />}
                      >
                        Select Image to Upload
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </Button>
                    ) : (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleRemoveFile}
                          >
                            Cancel
                          </Button>
                        </Box>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleUploadToLibrary}
                          disabled={uploadingImage}
                          startIcon={<CloudUpload />}
                        >
                          {uploadingImage ? 'Uploading...' : 'Upload to Library'}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {/* Image Library Grid */}
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                    Select from Library {selectedLibraryImage && '(1 selected)'}
                  </Typography>

                  {loadingLibrary ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading images...
                      </Typography>
                    </Box>
                  ) : imageLibrary.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                      <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No images in library. Upload your first image above.
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {imageLibrary.map((image) => (
                        <Grid item xs={6} sm={4} md={3} key={image.filename}>
                          <Box
                            onClick={() => handleSelectLibraryImage(image.filename)}
                            sx={{
                              position: 'relative',
                              cursor: 'pointer',
                              border: '2px solid',
                              borderColor: selectedLibraryImage === image.filename ? 'primary.main' : 'divider',
                              borderRadius: 1,
                              overflow: 'hidden',
                              '&:hover': {
                                borderColor: 'primary.light',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                paddingTop: '100%',
                                position: 'relative',
                                bgcolor: 'background.default',
                              }}
                            >
                              <img
                                src={imageLibraryAPI.getThumbnailUrl(image.filename)}
                                alt={image.filename}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>
                            {selectedLibraryImage === image.filename && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 24,
                                  height: 24,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 16,
                                }}
                              >
                                ✓
                              </Box>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} noWrap>
                            {image.filename}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  {!selectedLibraryImage && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Please select an image from the library or upload a new one
                    </Alert>
                  )}
                </Box>
              )}
            </>
          )}

          {/* Dropbox Auto-Upload Option */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.auto_upload_to_dropbox}
                  onChange={(e) => handleChange('auto_upload_to_dropbox', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    Auto-Upload to Dropbox
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically upload processed images to Dropbox after campaign completion
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Submit Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/campaigns')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
            >
              {loading ? 'Creating Campaign...' : 'Create Campaign'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default CampaignCreate


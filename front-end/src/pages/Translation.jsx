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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import {
  Translate,
  Language,
  AutoAwesome,
  CheckCircle,
  Pending,
  Upload,
  Download,
  Delete,
  ContentCopy,
  Public,
} from '@mui/icons-material'

function Translation() {
  const [sourceLanguage, setSourceLanguage] = useState('en')
  const [targetLanguages, setTargetLanguages] = useState(['es', 'fr', 'de'])

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  ]

  const translationStats = [
    {
      title: 'Languages Supported',
      value: '90+',
      icon: <Language />,
      color: 'primary.main',
    },
    {
      title: 'Active Projects',
      value: '24',
      icon: <Pending />,
      color: 'warning.main',
    },
    {
      title: 'Completed',
      value: '156',
      icon: <CheckCircle />,
      color: 'success.main',
    },
    {
      title: 'Total Words',
      value: '2.4M',
      icon: <Public />,
      color: 'info.main',
    },
  ]

  const recentTranslations = [
    {
      id: 1,
      project: 'Summer Campaign 2025',
      source: 'en',
      target: ['es', 'fr', 'de'],
      status: 'completed',
      progress: 100,
      words: 1250,
    },
    {
      id: 2,
      project: 'Product Launch Q2',
      source: 'en',
      target: ['ja', 'zh', 'ko'],
      status: 'in_progress',
      progress: 67,
      words: 2100,
    },
    {
      id: 3,
      project: 'Holiday Campaign',
      source: 'en',
      target: ['es', 'pt'],
      status: 'pending',
      progress: 0,
      words: 890,
    },
    {
      id: 4,
      project: 'Newsletter March',
      source: 'en',
      target: ['fr', 'de', 'it'],
      status: 'completed',
      progress: 100,
      words: 650,
    },
  ]

  const translationServices = [
    {
      name: 'AI Translation',
      description: 'Fast, automated translation powered by advanced AI',
      features: ['Instant Results', 'Cost Effective', '90+ Languages'],
      recommended: true,
    },
    {
      name: 'Professional Translation',
      description: 'Human translators for accuracy and cultural nuances',
      features: ['Native Speakers', 'Quality Assurance', 'Cultural Adaptation'],
      recommended: false,
    },
    {
      name: 'Hybrid Approach',
      description: 'AI translation with human review and editing',
      features: ['Best of Both', 'Quality + Speed', 'Cost Balance'],
      recommended: false,
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'warning'
      case 'pending':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Translation & Localization
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Translate your campaigns into multiple languages and reach global audiences
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Coming Soon!</strong> Automated translation service with support for 90+ languages. 
          Translate campaign content, product descriptions, and marketing materials instantly using AI or professional translators.
        </Typography>
      </Alert>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {translationStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ color: stat.color, mb: 2 }}>
                  {stat.icon}
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Translation */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AutoAwesome color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Quick Translation
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Source Language</InputLabel>
              <Select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                label="Source Language"
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Enter text to translate..."
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Target Languages</InputLabel>
              <Select
                multiple
                value={targetLanguages}
                onChange={(e) => setTargetLanguages(e.target.value)}
                label="Target Languages"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const lang = languages.find((l) => l.code === value)
                      return (
                        <Chip
                          key={value}
                          label={`${lang?.flag} ${lang?.name}`}
                          size="small"
                        />
                      )
                    })}
                  </Box>
                )}
              >
                {languages
                  .filter((lang) => lang.code !== sourceLanguage)
                  .map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Paper sx={{ p: 2, minHeight: 200, bgcolor: 'background.default', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 8 }}>
                Translation will appear here...
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" size="large" startIcon={<Translate />}>
            Translate Now
          </Button>
          <Button variant="outlined" startIcon={<ContentCopy />}>
            Copy Result
          </Button>
        </Box>
      </Paper>

      {/* Translation Services */}
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Translation Services
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {translationServices.map((service, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                {service.recommended && (
                  <Chip
                    label="Recommended"
                    color="primary"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {service.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {service.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  {service.features.map((feature, idx) => (
                    <Chip
                      key={idx}
                      label={feature}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
                <Button variant="outlined" fullWidth>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Translations */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold">
            Recent Translation Projects
          </Typography>
          <Button variant="outlined" size="small">
            View All
          </Button>
        </Box>
        <Divider />
        <List>
          {recentTranslations.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {item.project}
                    </Typography>
                    <Chip
                      label={item.status.replace('_', ' ')}
                      size="small"
                      color={getStatusColor(item.status)}
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {languages.find((l) => l.code === item.source)?.flag} → 
                      </Typography>
                      {item.target.map((code) => {
                        const lang = languages.find((l) => l.code === code)
                        return (
                          <Chip
                            key={code}
                            label={lang?.flag}
                            size="small"
                            variant="outlined"
                          />
                        )
                      })}
                      <Typography variant="caption" color="text.secondary">
                        • {item.words} words
                      </Typography>
                    </Box>
                    {item.status === 'in_progress' && (
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">Progress</Typography>
                          <Typography variant="caption">{item.progress}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={item.progress} />
                      </Box>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" sx={{ mr: 1 }}>
                  <Download />
                </IconButton>
                <IconButton edge="end" size="small">
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Call to Action */}
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
        <Translate sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Batch Translation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Upload multiple files or select campaigns to translate in bulk
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" startIcon={<Upload />}>
            Upload Files
          </Button>
          <Button variant="outlined">
            Select Campaigns
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}

export default Translation


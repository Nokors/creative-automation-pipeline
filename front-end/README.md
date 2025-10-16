# Campaign Manager - React Frontend

A modern React application for managing marketing campaigns with the Headless Content Delivery API.

## Features

- 🎨 **Modern UI** - Built with Material-UI (MUI) components
- 🔐 **Authentication** - HTTP Basic Auth integration
- 📊 **Dashboard** - Real-time campaign statistics
- 📝 **Campaign Management** - Create, view, and list campaigns
- 🌍 **Multi-Language Support** - Select multiple languages per campaign
- 📦 **Product Management** - Add multiple products with SKU and pricing
- 🤖 **AI Image Generation** - Adobe Firefly integration
- 📈 **Asset Reporting** - Visual analytics with charts
- 🔄 **Real-time Updates** - Auto-refresh for processing campaigns
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **React 18** - Modern React with Hooks
- **Vite** - Fast build tool and dev server
- **Material-UI (MUI)** - React component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **date-fns** - Date formatting

## Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running on `http://localhost:8000`

## Installation

1. **Navigate to frontend directory:**
   ```bash
   cd front-end
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:3000
   ```

## Default Credentials

- **Username:** `admin`
- **Password:** `changeme`

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
front-end/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable components
│   │   └── Navigation.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CampaignList.jsx
│   │   ├── CampaignCreate.jsx
│   │   ├── CampaignDetail.jsx
│   │   └── AssetReport.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── utils/           # Utilities
│   │   └── AuthContext.jsx
│   ├── App.jsx          # Root component
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Features Overview

### 1. Dashboard
- Campaign statistics (total, completed, active, pending, processing, failed)
- Recent campaigns list
- Quick access to create campaigns

### 2. Campaign List
- View all campaigns in a table
- Filter by status (pending, processing, completed, failed, active)
- Search campaigns by description, market, or message
- Pagination support
- View campaign details

### 3. Create Campaign
- Multi-step form with validation
- Basic information (description, target market, message, products)
- Product management (add/remove products with SKU and price)
- Multi-language selection (90+ languages supported)
- Metadata fields (priority, campaign type, custom fields)
- Image source selection:
  - AI Generated (Adobe Firefly with prompt)
  - Local file upload
  - Dropbox link

### 4. Campaign Detail
- Full campaign information
- Product list
- Image processing status
- Auto-refresh for processing campaigns
- Timeline (created, updated, completed)
- Error messages if failed

### 5. Asset Report
- Visual analytics dashboard
- Pie chart showing image source distribution
- Bar chart showing sources by campaign status
- Detailed breakdown by status
- Key insights and statistics

## API Integration

The frontend communicates with the backend API through Axios:

```javascript
// Base URL configuration
const API_BASE_URL = '/api'  // Proxied in development

// Endpoints
POST   /campaigns           - Create campaign
GET    /campaigns           - List campaigns
GET    /campaigns/:id       - Get campaign details
GET    /reports/assets      - Get asset report
GET    /health              - Health check
```

### Proxy Configuration

In development, API requests are proxied to avoid CORS issues:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

## Authentication

Authentication is handled via HTTP Basic Auth:

1. Credentials are stored in localStorage
2. Auth header is added to all API requests
3. User is redirected to login if not authenticated
4. Logout clears credentials and redirects to login

## Form Validation

Forms include client-side validation:

- Required fields
- Minimum/maximum length
- Number validation (prices > 0)
- Language code validation (ISO 639-1)
- No duplicate SKUs
- No duplicate languages

## Responsive Design

The application is fully responsive:

- Mobile-first design
- Collapsible navigation on mobile
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for all screen sizes

## Production Build

To build for production:

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Deployment

You can deploy the `dist/` folder to any static hosting service:

- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- nginx
- Apache

### Environment Variables

For production, update the API base URL:

```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-api-domain.com' 
  : '/api'
```

Or use environment variables:

```bash
# .env.production
VITE_API_BASE_URL=https://your-api-domain.com
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues

If you can't connect to the API:

1. Ensure backend is running on `http://localhost:8000`
2. Check CORS configuration on backend
3. Verify proxy configuration in `vite.config.js`

### Build Errors

If you encounter build errors:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Authentication Issues

If authentication isn't working:

1. Check credentials (default: admin/changeme)
2. Verify backend authentication is enabled
3. Check browser console for errors
4. Clear localStorage: `localStorage.clear()`

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes are reflected immediately without full page reload.

### React DevTools

Install React DevTools browser extension for debugging:
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### Code Formatting

Consider adding Prettier for code formatting:

```bash
npm install -D prettier
```

Create `.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Headless Content Delivery system.

## Support

For issues or questions:
- Check the backend API documentation
- Review the code comments
- Check browser console for errors
- Verify backend is running and accessible

---

**Last Updated:** October 10, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready


import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
// Documentation: https://vercel.com/docs/analytics/quickstart
inject({
  mode: 'auto', // Automatically detects environment (development/production)
  debug: false  // Set to true to enable console logging of analytics events
});
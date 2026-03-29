export const environment = {
   production: true,
   apiUrl: 'https://jobflow-api-staging.azurewebsites.net/api',
   baseUrl: 'https://jobflow-api-staging.azurewebsites.net',
   firebase: {
      apiKey: 'AIzaSyCyQtD7ukgjwfONtjeemVtvFa2OKTtq1d4',
      authDomain: 'jobflow-ui-web-staging.firebaseapp.com',
      projectId: 'jobflow-ui-web-staging',
      storageBucket: 'jobflow-ui-web-staging.firebasestorage.app',
      messagingSenderId: '112219216879',
      appId: '1:112219216879:web:9a18d4c8227bed9f3cf41a',
      measurementId: 'G-EHCS9QNK26'
   },
   stripeSettings: {
      goMonthlyPrice: 'price_1SobyQPJ5wQELwxd5uiFaLNS',
      goYearlyPrice: 'price_1SobyQPJ5wQELwxdXH3aVLw3',
      flowMonthlyPrice: 'price_1Soc2wPJ5wQELwxdBgvedMCN',
      flowYearlyPrice: 'price_1Soc2wPJ5wQELwxdhxwiRboy',
      maxMonthlyPrice: 'price_1SocGCPJ5wQELwxduGNSAkFW',
      maxYearlyPrice: 'price_1SocGCPJ5wQELwxdLOPsoKHv',
      cancelUrl: 'https://jobflow-ui-web-staging.web.app/auth/register',
      successUrl: 'https://jobflow-ui-web-staging.web.app/auth/register',
   },
   stripePublicKey: 'pk_test_51SobefPJ5wQELwxdrEqMzIyiPmxISvVrNua4BX7UgY5iQsx1Xasl7655KSERJ8K8GPw2CQVGFz2AjflvYGjztJlO00s8bwhu2S',
   turnstileSiteKey: '0x4AAAAAACs7ehVs9_8KtriE'
};
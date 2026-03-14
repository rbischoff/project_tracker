// Branding and Asset Configuration
// Update the values below to customize the app branding
// Assets should be placed in the public/ folder and referenced by filename

export const branding = {
  // Logo shown on login page
  loginLogo: typeof __VITE_LOGO_PATH__ !== 'undefined' ? __VITE_LOGO_PATH__ : '/logo.png',
  
  // Logo/icon shown in the sidebar after login
  sidebarLogo: typeof __VITE_LOGO_PATH__ !== 'undefined' ? __VITE_LOGO_PATH__ : '/logo.png',
  
  // App title (shown on login page)
  title: 'Home Projects',
  
  // App subtitle (shown on login page)
  subtitle: 'Track your home improvement journey',
  
  // Sidebar title - first line
  sidebarTitleLine1: 'Home',
  
  // Sidebar title - second line
  sidebarTitleLine2: 'Projects',
};

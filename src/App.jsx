import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Tabs,
  Tab,
  Box,
  CssBaseline,
  ThemeProvider,
  IconButton,
  useMediaQuery
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

// Themes
import { lightTheme, darkTheme } from './theme/theme';

// Components
import Sidebar from './components/layout/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import TodayContent from './components/TodayContent';
import CategoryManager from './components/CategoryManager';
import DailyAffirmationsManager from './components/DailyAffirmationsManager';
import GuidedAudioManager from './components/GuidedAudioManager';
import GuidedMeditationsManager from './components/GuidedMeditationsManager';
import GuidedVisualizationsManager from './components/GuidedVisualizationsManager';
import DailyNotificationsManager from './components/DailyNotificationsManager';

// Services
import { getCategories } from './services/api';
import LoginPage from './components/LoginPage';

// Main App Layout Component (used inside Router)
function AppLayout() {
  const location = useLocation();
  // State Management
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [Login, setLogin] = useState(true); // Temporarily set to true for debugging
  
  // Responsive Design
  const isMobile = useMediaQuery('(max-width: 768px)');
  const theme = darkMode ? darkTheme : lightTheme;

  // Menu Items Configuration with routes
  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: "Today's Content", path: '/todays-content', icon: 'today' },
    { label: 'Categories', path: '/categories', icon: 'category' },
    { label: 'Daily Affirmations', path: '/daily-affirmations', icon: 'affirmation' },
    { label: 'Guided Audio', path: '/guided-audio', icon: 'audio' },
    { label: 'Guided Meditations', path: '/guided-meditations', icon: 'meditation' },
    { label: 'Guided Visualizations', path: '/guided-visualization', icon: 'visualization' },
    { label: 'Daily Notifications', path: '/daily-notification', icon: 'notifications' },
  ];

  // Get current active route index
  const getCurrentRouteIndex = () => {
    const currentPath = location.pathname;
    const index = menuItems.findIndex(item => item.path === currentPath);
    return index >= 0 ? index : 0;
  };

  // Effects
  useEffect(() => {
    loadCategories();
    // Check system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    // Auto-close sidebar on mobile, keep open on desktop
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Data Loading Functions
  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Event Handlers
  const handleSidebarNavigation = () => {
    // Close sidebar on mobile when navigating
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  const drawerWidth = 260;
  function submit() {
    setLogin(true);
  }

  return (
    <>
   {!Login && <LoginPage onLogin={submit} />}
    {Login && <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Main Layout Container */}
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        backgroundColor: 'background.default'
      }}>
        
        {/* Sidebar Navigation */}
        <Sidebar
          open={sidebarOpen}
          onClose={handleSidebarClose}
          menuItems={menuItems}
          currentPath={location.pathname}
          onNavigation={handleSidebarNavigation}
          darkMode={darkMode}
          isMobile={isMobile}
          drawerWidth={drawerWidth}
        />

        {/* Main Content Area */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: 0, // Important for responsive behavior
                ml: { xs: 0, md: sidebarOpen ? `${drawerWidth}px` : 0 },
          transition: 'margin-left 0.3s ease-in-out',
        }}>
          
          {/* Top App Bar */}
          <AppBar
            position="static"
            elevation={0}
            color="primary"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              zIndex: (theme) => theme.zIndex.drawer + 1,
              position: 'relative'
            }}
          >
            <Toolbar>
              {/* Sidebar Toggle Button */}
              <IconButton
                edge="start"
                color="inherit"
                onClick={toggleSidebar}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>

              {/* App Title */}
              <Typography
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                  fontWeight: 700,
                  color: 'white',
                  display: { xs: 'block', sm: 'none' },
                  fontSize: { xs: '0.8rem', sm: '1.25rem' }
                }}
              >
                Visually Becoming Admin
              </Typography>

              {/* Dark Mode Toggle */}
              <IconButton
                color="inherit"
                onClick={toggleDarkMode}
                aria-label="toggle dark mode"
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {darkMode ? <LightIcon /> : <DarkIcon />}
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Tab Navigation */}
          {/* <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.appBar - 1
          }}>
            <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 500,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    minWidth: { xs: 'auto', sm: 120 },
                    px: { xs: 1.5, sm: 3 }
                  }
                }}
              >
                {menuItems.map((item) => (
                  <Tab 
                    key={item.index} 
                    label={item.label}
                    aria-controls={`tabpanel-${item.index}`}
                    id={`tab-${item.index}`}
                  />
                ))}
              </Tabs>
            </Container>
          </Box> */}

          {/* Main Content Container */}
          <Box sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            overflow: 'auto',
            width: '100%'
          }}>
            <Container
              maxWidth="xl"
              sx={{
                py: { xs: 2, sm: 3 },
                px: { xs: 1, sm: 2, md: 3 },
                width: '100%',
                maxWidth: '100%'
              }}
            >
              
              {/* Routes */}
              <Routes>
                <Route path="/dashboard" element={
                  <DashboardOverview 
                    categories={categories} 
                    onCategoriesUpdate={loadCategories}
                  />
                } />
                
                <Route path="/todays-content" element={
                  <TodayContent 
                    categories={categories} 
                  />
                } />
                
                <Route path="/categories" element={
                  <CategoryManager 
                    categories={categories} 
                    onCategoriesUpdate={loadCategories} 
                  />
                } />
                
                <Route path="/daily-affirmations" element={
                  <DailyAffirmationsManager 
                    categories={categories} 
                    onDataUpdate={loadCategories}
                  />
                } />
                
                <Route path="/guided-audio" element={
                  <GuidedAudioManager />
                } />
                
                <Route path="/guided-meditations" element={
                  <GuidedMeditationsManager 
                    categories={categories} 
                    onDataUpdate={loadCategories}
                  />
                } />
                
                <Route path="/guided-visualization" element={
                  <GuidedVisualizationsManager 
                    categories={categories} 
                    onDataUpdate={loadCategories}
                  />
                } />
                
                <Route path="/daily-notification" element={
                  <DailyNotificationsManager 
                    categories={categories} 
                    onDataUpdate={loadCategories}
                  />
                } />
                
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              
            </Container>
          </Box>

          {/* Footer (Optional) */}
          <Box
            component="footer"
            sx={{
              py: { xs: .4, sm: 0.4 },
              px: { xs: 2, sm: 3 },
              mt: 'auto',
              backgroundColor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider'
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ fontSize: { xs: '0.65rem', sm: '0.675rem' } }}
            >
              Visually Becoming Admin Dashboard • {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>}
    </>
  );
}

// Main App Component with Router
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
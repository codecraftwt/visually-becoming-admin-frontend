import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Today as TodayIcon,
  Category as CategoryIcon,
  FormatQuote as QuoteIcon,
  Audiotrack as AudioIcon,
  SelfImprovement as MeditationIcon,
  Visibility as VisualizationIcon,
  Notifications as NotificationsIcon,
  Spa as SpaIcon
} from '@mui/icons-material';

import logo from '../../assets/vblogo.png';

const Sidebar = ({ open, onClose, menuItems, currentTab, onTabChange, darkMode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getIcon = (index) => {
    const icons = [
      <DashboardIcon />,
      <TodayIcon />,
      <CategoryIcon />,
      <QuoteIcon />,
      <AudioIcon />,
      <MeditationIcon />,
      <VisualizationIcon />,
      <NotificationsIcon />
    ];
    return icons[index];
  };

  const drawerWidth = 260;

  const drawerContent = (
    <Box sx={{
      width: drawerWidth,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
           pt: 0,    
          // background: theme.palette.gradient.sidebar,
          color: 'white',
          textAlign: 'center',
          flexShrink: 0
        }}
      >
        {/* <SpaIcon sx={{ fontSize: 40, mb: 1 }} /> */}
        <img src={logo} alt="logo" height={120} width={120} style={{margin : "auto"}}/>
        <Typography variant="h6" fontWeight="700" sx={{color: theme.palette.text.primary,}}>
          Visually Becoming
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, color: theme.palette.text.primary, }}>
          Admin Dashboard
        </Typography>

      </Box>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, p: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={currentTab === item.index}
              onClick={() => onTabChange(null, item.index)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon sx={{
                color: currentTab === item.index ? 'white' : 'inherit',
                minWidth: 40,
                flexShrink: 0
              }}>
                {getIcon(item.index)}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: currentTab === item.index ? 600 : 400,
                  noWrap: true
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      {/* <Box sx={{ p: 1.2, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Mindful Administration
        </Typography>
      </Box> */}
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true,
            BackdropProps: {
              sx: {
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 10,
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              overflowX: 'hidden',
              height: '100vh'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              overflowX: 'hidden'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
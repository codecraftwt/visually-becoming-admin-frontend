import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Spa as SpaIcon,
  Notifications as NotificationsIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { getTodayContent } from '../services/api';

const StatCard = ({ title, value, subtitle, icon, color }) => {
  const theme = useTheme();

  return (
    <Card sx={{
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="overline"
              sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              fontWeight="600"
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
            >
              {value}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {subtitle}
            </Typography>
          </Box>
          <Avatar sx={{
            bgcolor: color,
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            flexShrink: 0,
            ml: 1
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardOverview = ({ categories }) => {
  const [todayContent, setTodayContent] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    loadTodayContent();
  }, []);

  const loadTodayContent = async () => {
    try {
      const data = await getTodayContent();
      setTodayContent(data);
    } catch (error) {
      console.error('Error loading today\'s content:', error);
    }
  };

  if (!todayContent) {
    return <LinearProgress />;
  }

  const stats = [
    {
      title: 'Active Categories',
      value: todayContent.categories.length,
      subtitle: 'Total published',
      icon: <SpaIcon />,
      color: theme.palette.primary.main
    },
    {
      title: 'Daily Affirmations',
      value: todayContent.dailyAffirmations.length,
      subtitle: 'Ready for today',
      icon: <ViewIcon />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Audio Sessions',
      value: todayContent.guidedAudio.length + todayContent.guidedMeditations.length,
      subtitle: 'Guided content',
      icon: <PlayIcon />,
      color: theme.palette.accent.main
    },
    {
      title: 'Notifications',
      value: todayContent.dailyNotifications.length,
      subtitle: 'Scheduled for today',
      icon: <NotificationsIcon />,
      color: theme.palette.success.main
    }
  ];

  return (
    <Box>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight="600"
        sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
      >
        Dashboard Overview
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: { xs: 3, sm: 4 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
      >
        Welcome to your mindfulness content management dashboard
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Quick Overview */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                gutterBottom
                fontWeight="600"
                sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
              >
                Today's Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {todayContent.categories.map(category => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography
                variant="h6"
                gutterBottom
                fontWeight="600"
                sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
              >
                Content Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Affirmations Published</Typography>
                  <Chip 
                    label={todayContent.dailyAffirmations.filter(a => a.published).length} 
                    size="small" 
                    color="primary"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Audio Sessions</Typography>
                  <Chip
                    label={todayContent.guidedAudio.filter(a => a.published).length}
                    size="small"
                    color="secondary"
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Meditations Ready</Typography>
                  <Chip 
                    label={todayContent.guidedMeditations.filter(m => m.published).length} 
                    size="small" 
                    color="accent"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
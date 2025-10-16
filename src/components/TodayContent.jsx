import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Spa as SpaIcon,
  FormatQuote as QuoteIcon,
  Audiotrack as AudioIcon,
  SelfImprovement as MeditationIcon,
  Visibility as VisualizationIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { getTodayContent } from '../services/api';

const TodayContent = ({ categories }) => {
  const [todayContent, setTodayContent] = useState(null);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (!todayContent) {
    return <Alert severity="error">Failed to load today's content</Alert>;
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
          Today's Content - {todayContent.date}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preview of what users will receive today
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Categories */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SpaIcon color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Categories ({todayContent.categories.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {todayContent.categories.map(category => (
                  <Chip 
                    key={category.id} 
                    label={category.name}
                    color={category.published ? 'primary' : 'default'}
                    variant={category.published ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotificationIcon color="secondary" />
                <Typography variant="h6" fontWeight="600">
                  Notifications ({todayContent.dailyNotifications.length})
                </Typography>
              </Box>
              {todayContent.dailyNotifications.map(notification => (
                <Box key={notification.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="600">{notification.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Chip 
                    label={getCategoryName(notification.categoryId)}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Affirmations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <QuoteIcon color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Daily Affirmations ({todayContent.dailyAffirmations.length})
                </Typography>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Text</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todayContent.dailyAffirmations.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="subtitle2">{item.title}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            "{item.text}"
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getCategoryName(item.categoryId)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.published ? 'Published' : 'Unpublished'}
                            color={item.published ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Guided Audio */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AudioIcon color="secondary" />
                <Typography variant="h6" fontWeight="600">
                  Guided Audio ({todayContent.guidedAudio.length})
                </Typography>
              </Box>
              {todayContent.guidedAudio.map(item => (
                <Box key={item.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Audio: {item.audioUrl}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={getCategoryName(item.categoryId)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={item.published ? 'Published' : 'Unpublished'}
                      color={item.published ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Guided Meditations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MeditationIcon sx={{ color: theme.palette.accent.main }} />
                <Typography variant="h6" fontWeight="600">
                  Guided Meditations ({todayContent.guidedMeditations.length})
                </Typography>
              </Box>
              {todayContent.guidedMeditations.map(item => (
                <Box key={item.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Audio: {item.audioUrl}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip 
                      label={getCategoryName(item.categoryId)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip 
                      label={item.published ? 'Published' : 'Unpublished'}
                      color={item.published ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Guided Visualizations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VisualizationIcon color="primary" />
                <Typography variant="h6" fontWeight="600">
                  Guided Visualizations ({todayContent.guidedVisualizations.length})
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {todayContent.guidedVisualizations.map(item => (
                  <Grid item xs={12} md={6} key={item.id}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="600">{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Media: {item.mediaUrl}
                      </Typography>
                      {item.script && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Script: {item.script}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={getCategoryName(item.categoryId)}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={item.published ? 'Published' : 'Unpublished'}
                          color={item.published ? 'primary' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TodayContent;
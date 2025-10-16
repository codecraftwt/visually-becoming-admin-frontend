import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme
} from '@mui/material';
import { Add as AddIcon, Notifications as NotificationIcon } from '@mui/icons-material';
import { getDailyNotifications, createDailyNotification } from '../services/api';

const DailyNotificationsManager = ({ categories }) => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    categoryId: '',
    contentType: '',
    contentId: '',
    published: true
  });
  const theme = useTheme();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getDailyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleOpen = () => {
    setFormData({
      title: '',
      message: '',
      categoryId: '',
      contentType: '',
      contentId: '',
      published: true
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDailyNotification(formData);
      loadNotifications();
      handleClose();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
            Daily Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule daily notifications for users
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          // onClick={handleOpen}
        >
          Add Notification
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Content Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationIcon color="primary" fontSize="small" />
                    <Typography fontWeight="500">{item.title}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {item.message}
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
                    label={item.contentType || 'General'} 
                    size="small" 
                    color="secondary"
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

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          Add Daily Notification
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              margin="dense"
              name="title"
              label="Title"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="message"
              label="Message"
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.message}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              placeholder="Your daily affirmation is ready..."
            />
            <TextField
              select
              margin="dense"
              name="categoryId"
              label="Category"
              fullWidth
              variant="outlined"
              value={formData.categoryId}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              margin="dense"
              name="contentType"
              label="Content Type"
              fullWidth
              variant="outlined"
              value={formData.contentType}
              onChange={handleChange}
              sx={{ mb: 2 }}
            >
              <MenuItem value="affirmation">Daily Affirmation</MenuItem>
              <MenuItem value="audio">Guided Audio</MenuItem>
              <MenuItem value="meditation">Guided Meditation</MenuItem>
              <MenuItem value="visualization">Guided Visualization</MenuItem>
              <MenuItem value="general">General</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              name="contentId"
              label="Content ID (Optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.contentId}
              onChange={handleChange}
              sx={{ mb: 2 }}
              placeholder="ID of specific content item"
            />
            <FormControlLabel
              control={
                <Switch
                  name="published"
                  checked={formData.published}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Published"
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DailyNotificationsManager;
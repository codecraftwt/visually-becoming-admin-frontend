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
  IconButton,
  Chip,
  useTheme
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Visibility as VisualizationIcon } from '@mui/icons-material';
import { getGuidedVisualizations, createGuidedVisualization, updateGuidedVisualization } from '../services/api';

const GuidedVisualizationsManager = ({ categories }) => {
  const [visualizations, setVisualizations] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    script: '',
    categoryId: '',
    published: true
  });
  const theme = useTheme();

  useEffect(() => {
    loadVisualizations();
  }, []);

  const loadVisualizations = async () => {
    try {
      const data = await getGuidedVisualizations();
      setVisualizations(data);
    } catch (error) {
      console.error('Error loading visualizations:', error);
    }
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '',
        description: item.description || '',
        mediaUrl: item.mediaUrl || '',
        script: item.script || '',
        categoryId: item.categoryId || '',
        published: item.published !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        mediaUrl: '',
        script: '',
        categoryId: '',
        published: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateGuidedVisualization(editingItem.id, formData);
      } else {
        await createGuidedVisualization(formData);
      }
      loadVisualizations();
      handleClose();
    } catch (error) {
      console.error('Error saving visualization:', error);
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
            Guided Visualizations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage visual content with guided scripts
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          // onClick={() => handleOpen()}
        >
          Add Visualization
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Media URL</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visualizations.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VisualizationIcon color="primary" fontSize="small" />
                    <Typography fontWeight="500">{item.title}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {item.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.mediaUrl}
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
                <TableCell>
                  <IconButton 
                    onClick={() => handleOpen(item)}
                    color="primary"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
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
          {editingItem ? 'Edit Guided Visualization' : 'Add New Guided Visualization'}
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
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              value={formData.description}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="mediaUrl"
              label="Media URL (Image/Video)"
              type="url"
              fullWidth
              variant="outlined"
              value={formData.mediaUrl}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              placeholder="https://example.com/image.jpg or https://example.com/video.mp4"
            />
            <TextField
              margin="dense"
              name="script"
              label="Script/Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={formData.script}
              onChange={handleChange}
              sx={{ mb: 2 }}
              placeholder="Close your eyes and imagine yourself in a peaceful forest..."
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
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GuidedVisualizationsManager;
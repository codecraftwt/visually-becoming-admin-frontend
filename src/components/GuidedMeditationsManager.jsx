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
import { Edit as EditIcon, Add as AddIcon, SelfImprovement as MeditationIcon } from '@mui/icons-material';
import { getGuidedMeditations, createGuidedMeditation, updateGuidedMeditation } from '../services/api';

const GuidedMeditationsManager = ({ categories }) => {
  const [meditations, setMeditations] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    audioUrl: '',
    categoryId: '',
    published: true
  });
  const theme = useTheme();

  useEffect(() => {
    loadMeditations();
  }, []);

  const loadMeditations = async () => {
    try {
      const data = await getGuidedMeditations();
      setMeditations(data);
    } catch (error) {
      console.error('Error loading meditations:', error);
    }
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '',
        description: item.description || '',
        audioUrl: item.audioUrl || '',
        categoryId: item.categoryId || '',
        published: item.published !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        audioUrl: '',
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
        await updateGuidedMeditation(editingItem.id, formData);
      } else {
        await createGuidedMeditation(formData);
      }
      loadMeditations();
      handleClose();
    } catch (error) {
      console.error('Error saving meditation:', error);
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
            Guided Meditations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage meditation sessions and audio content
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          // onClick={() => handleOpen()}
        >
          Add Meditation
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Audio URL</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {meditations.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MeditationIcon color="accent" fontSize="small" />
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
                    {item.audioUrl}
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
          {editingItem ? 'Edit Guided Meditation' : 'Add New Guided Meditation'}
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
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="audioUrl"
              label="Audio URL"
              type="url"
              fullWidth
              variant="outlined"
              value={formData.audioUrl}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              placeholder="https://example.com/meditation-file.mp3"
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

export default GuidedMeditationsManager;
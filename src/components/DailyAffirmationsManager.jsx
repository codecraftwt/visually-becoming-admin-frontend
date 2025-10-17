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
  useTheme,
  Grid,
  Card,
  CardContent,
  Menu,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Add as AddIcon, 
  FormatQuote as QuoteIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  TableChart as TableIcon,
  Dashboard as CardIcon
} from '@mui/icons-material';
import { 
  getDailyAffirmations, 
  createDailyAffirmation, 
  updateDailyAffirmation,
  deleteDailyAffirmation 
} from '../services/api';

const DailyAffirmationsManager = ({ categories }) => {
  const [affirmations, setAffirmations] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [affirmationToDelete, setAffirmationToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedAffirmation, setSelectedAffirmation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    categoryId: '',
    published: true
  });
  const theme = useTheme();

  useEffect(() => {
    loadAffirmations();
  }, []);

  const loadAffirmations = async () => {
    try {
      const data = await getDailyAffirmations();
      setAffirmations(data);
    } catch (error) {
      console.error('Error loading affirmations:', error);
      setSnackbar({
        open: true,
        message: 'Error loading affirmations',
        severity: 'error'
      });
    }
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '',
        text: item.text || '',
        categoryId: item.categoryId || '',
        published: item.published !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        text: '',
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

  const handleMenuOpen = (event, affirmation) => {
    setMenuAnchor(event.currentTarget);
    setSelectedAffirmation(affirmation);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedAffirmation(null);
  };

  const handleDeleteClick = (affirmation) => {
    setAffirmationToDelete(affirmation);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDailyAffirmation(affirmationToDelete.id);
      setSnackbar({
        open: true,
        message: 'Affirmation deleted successfully',
        severity: 'success'
      });
      loadAffirmations();
      setDeleteDialogOpen(false);
      setAffirmationToDelete(null);
    } catch (error) {
      console.error('Error deleting affirmation:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting affirmation',
        severity: 'error'
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAffirmationToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateDailyAffirmation(editingItem.id, formData);
        setSnackbar({
          open: true,
          message: 'Affirmation updated successfully',
          severity: 'success'
        });
      } else {
        await createDailyAffirmation(formData);
        setSnackbar({
          open: true,
          message: 'Affirmation created successfully',
          severity: 'success'
        });
      }
      loadAffirmations();
      handleClose();
    } catch (error) {
      console.error('Error saving affirmation:', error);
      setSnackbar({
        open: true,
        message: 'Error saving affirmation',
        severity: 'error'
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? theme.palette.primary.main : theme.palette.text.secondary;
  };

  return (
    <Box>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: { xs: 3, sm: 4 }
      }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            fontWeight="600"
            sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
          >
            Daily Affirmations
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Manage positive affirmations for daily motivation
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
            sx={{ 
              minWidth: { xs: '100%', sm: 'auto' },
              '& .MuiToggleButtonGroup-grouped': {
                border: 0,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  }
                }
              }
            }}
          >
            <ToggleButton value="card" aria-label="card view">
              <CardIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <TableIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            fullWidth={false}
            sx={{
              minWidth: { xs: '100%', sm: 'auto' },
              whiteSpace: 'nowrap'
            }}
          >
            Add Affirmation
          </Button>
        </Box>
      </Box>

      {/* Card View */}
      {viewMode === 'card' && (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {affirmations.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <QuoteIcon
                      sx={{
                        fontSize: { xs: 32, sm: 40 },
                        color: item.published ? getCategoryColor(item.categoryId) : theme.palette.text.disabled,
                        mb: 1
                      }}
                    />
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, item)}
                      size="small"
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography
                    variant="h6"
                    gutterBottom
                    fontWeight="600"
                    sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      mb: 2, 
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      fontStyle: 'italic',
                      lineHeight: 1.6
                    }}
                  >
                    "{item.text}"
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                      label={getCategoryName(item.categoryId)}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: getCategoryColor(item.categoryId) }}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.published}
                          onChange={async () => {
                            try {
                              await updateDailyAffirmation(item.id, { published: !item.published });
                              setSnackbar({
                                open: true,
                                message: `Affirmation ${!item.published ? 'published' : 'unpublished'}`,
                                severity: 'success'
                              });
                              loadAffirmations();
                            } catch (error) {
                              console.error('Error updating affirmation:', error);
                              setSnackbar({
                                open: true,
                                message: 'Error updating affirmation',
                                severity: 'error'
                              });
                            }
                          }}
                          color="primary"
                          size="small"
                        />
                      }
                      label=""
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Affirmation Text</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {affirmations.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuoteIcon color="primary" fontSize="small" />
                      <Typography fontWeight="500">{item.title}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300, fontStyle: 'italic' }}>
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
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        onClick={() => handleOpen(item)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteClick(item)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Affirmation Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleOpen(selectedAffirmation);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick(selectedAffirmation)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)',
            color: 'white',
            fontWeight: 600
          }}
        >
          {editingItem ? 'Edit Daily Affirmation' : 'Add New Daily Affirmation'}
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
              name="text"
              label="Affirmation Text"
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.text}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              placeholder="I am worthy of love and happiness..."
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          backgroundColor: 'error.main',
          color: 'white',
          fontWeight: 600
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography>
            Are you sure you want to delete the affirmation "{affirmationToDelete?.title}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DailyAffirmationsManager;
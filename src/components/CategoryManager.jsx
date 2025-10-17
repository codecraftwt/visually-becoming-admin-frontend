import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Add as AddIcon,
  Spa as CategoryIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { createCategory, updateCategory, deleteCategory } from '../services/api';

const CategoryManager = ({ categories, onCategoriesUpdate }) => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    published: true
  });
  const theme = useTheme();

  const handleOpen = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        published: category.published
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        published: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
  };

  const handleMenuOpen = (event, category) => {
    setMenuAnchor(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCategory(null);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory(categoryToDelete.id);
      setSnackbar({
        open: true,
        message: 'Category deleted successfully',
        severity: 'success'
      });
      onCategoriesUpdate();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      setSnackbar({
        open: true,
        message: 'Error deleting category',
        severity: 'error'
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        setSnackbar({
          open: true,
          message: 'Category updated successfully',
          severity: 'success'
        });
      } else {
        await createCategory(formData);
        setSnackbar({
          open: true,
          message: 'Category created successfully',
          severity: 'success'
        });
      }
      onCategoriesUpdate();
      handleClose();
    } catch (error) {
      console.error('Error saving category:', error);
      setSnackbar({
        open: true,
        message: 'Error saving category',
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

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
            Categories
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Manage your mindfulness content categories
          </Typography>
        </Box>
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
          Add Category
        </Button>
      </Box>

      {/* Categories Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
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
                  <CategoryIcon
                    sx={{
                      fontSize: { xs: 32, sm: 40 },
                      color: category.published ? theme.palette.primary.main : theme.palette.text.disabled,
                      mb: 1
                    }}
                  />
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, category)}
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
                  {category.name}
                </Typography>

                {category.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                  >
                    {category.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={category.published ? 'Published' : 'Unpublished'}
                    color={category.published ? 'primary' : 'default'}
                    size="small"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={category.published}
                        onChange={async () => {
                          try {
                            await updateCategory(category.id, { published: !category.published });
                            setSnackbar({
                              open: true,
                              message: `Category ${!category.published ? 'published' : 'unpublished'}`,
                              severity: 'success'
                            });
                            onCategoriesUpdate();
                          } catch (error) {
                            console.error('Error updating category:', error);
                            setSnackbar({
                              open: true,
                              message: 'Error updating category',
                              severity: 'error'
                            });
                          }
                        }}
                        color="primary"
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

      {/* Category Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleOpen(selectedCategory);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick(selectedCategory)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={false}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)',
          color: 'white',
          fontWeight: 600,
          fontSize: { xs: '1.125rem', sm: '1.25rem' }
        }}>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Category Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.name}
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
              sx={{ mb: 2 }}
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
          <DialogActions sx={{ p: { xs: 2, sm: 3 }, gap: 1 }}>
            <Button onClick={handleClose} sx={{ minWidth: { xs: 80, sm: 'auto' } }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{
                minWidth: { xs: 80, sm: 'auto' }
              }}
            >
              {editingCategory ? 'Update' : 'Create'}
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
            Are you sure you want to delete the category "{categoryToDelete?.name}"? 
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

export default CategoryManager;
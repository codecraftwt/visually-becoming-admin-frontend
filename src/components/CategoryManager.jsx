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
  useTheme
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Add as AddIcon,
  Spa as CategoryIcon 
} from '@mui/icons-material';
import { createCategory, updateCategory } from '../services/api';

const CategoryManager = ({ categories, onCategoriesUpdate }) => {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      onCategoriesUpdate();
      handleClose();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
                    onClick={() => handleOpen(category)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
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
                          await updateCategory(category.id, { published: !category.published });
                          onCategoriesUpdate();
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
    </Box>
  );
};

export default CategoryManager;
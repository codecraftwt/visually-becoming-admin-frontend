import React, { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  useTheme,
  Breadcrumbs,
  Link,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  RadioGroup,
  Radio,
  FormLabel,
  Slider
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Audiotrack as AudioIcon,
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import {
  getAudioCategories,
  createAudioCategory,
  updateAudioCategory,
  deleteAudioCategory,
  getGuidedAudioByCategory,
  createGuidedAudio,
  updateGuidedAudio,
  deleteGuidedAudio
} from '../services/api';

const GuidedAudioManager = () => {
  const [audioCategories, setAudioCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [audioItems, setAudioItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [audioMenuAnchor, setAudioMenuAnchor] = useState(null);
  const [selectedAudioItem, setSelectedAudioItem] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioMuted, setAudioMuted] = useState(false);
  const audioRef = useRef(null);
  
  // State for card audio players
  const [cardAudioStates, setCardAudioStates] = useState({});
  const cardAudioRefs = useRef({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    categoryName: '',
    audioUrl: '',
    isPublished: true,
    isPremium: false,
    audio: [],
    selectedFiles: [],
    genders: []
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    isPublished: true,
    isPremium: false
  });
  const theme = useTheme();
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('GuidedAudioManager mounted');
    loadAudioCategories();
  }, []);

  // Reset audio state when audioUrl changes
  useEffect(() => {
    if (!formData.audioUrl && audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
    }
  }, [formData.audioUrl]);

  const loadAudioCategories = async () => {
    try {
      console.log('Loading audio categories...');
      const data = await getAudioCategories();
      console.log('Audio categories loaded:', data);
      setAudioCategories(data);
    } catch (error) {
      console.error('Error loading audio categories:', error);
    }
  };

  const loadAudioItems = async (categoryId) => {
    try {
      console.log('Loading audio items for category:', categoryId);
      const data = await getGuidedAudioByCategory(categoryId);
      console.log('Audio items loaded:', data);
      setAudioItems(data);
      
      // Initialize audio states for all items
      const newStates = {};
      data.forEach(item => {
        if (item.audio && Array.isArray(item.audio)) {
          item.audio.forEach((audio, index) => {
            const key = getCardAudioKey(item.id, index);
            newStates[key] = {
              playing: false,
              currentTime: 0,
              duration: 0,
              muted: false
            };
          });
        }
      });
      setCardAudioStates(newStates);
    } catch (error) {
      console.error('Error loading audio items:', error);
    }
  };

  // Category Management
  const handleCategoryOpen = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name || '',
        description: category.description || '',
        isPublished: category.isPublished !== false,
        isPremium: category.isPremium || false
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        description: '',
        isPublished: true,
        isPremium: false
      });
    }
    setCategoryOpen(true);
  };

  const handleCategoryClose = () => {
    setCategoryOpen(false);
    setEditingCategory(null);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    if (editingCategory) {
      // Optimistic update for editing category
      const updatedCategory = {
        ...editingCategory,
        ...categoryFormData
      };
      setAudioCategories(prev => prev.map(cat => cat.id === editingCategory.id ? updatedCategory : cat));

      try {
        await updateAudioCategory(editingCategory.id, categoryFormData);
      } catch (error) {
        // If update fails, revert the optimistic change
        setAudioCategories(prev => prev.map(cat => cat.id === editingCategory.id ? editingCategory : cat));
        console.error('Error updating category:', error);
        return;
      }
    } else {
      // Optimistic creation for new category
      const tempId = `temp-cat-${Date.now()}`;
      const newCategory = {
        id: tempId,
        ...categoryFormData
      };

      setAudioCategories(prev => [...prev, newCategory]);

      try {
        const createdCategory = await createAudioCategory(categoryFormData);
        // Replace temp category with real category
        setAudioCategories(prev => prev.map(cat => cat.id === tempId ? createdCategory : cat));
      } catch (error) {
        // If creation fails, remove the temp category
        setAudioCategories(prev => prev.filter(cat => cat.id !== tempId));
        console.error('Error creating category:', error);
        return;
      }
    }

    handleCategoryClose();
  };

  const handleCategoryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Audio Management
  const handleAudioOpen = (item = null) => {
    // Check if we're adding a new item and no category is selected
    if (!item && !selectedCategory) {
      alert('Please select an audio category first before adding audio.');
      return;
    }

    if (item) {
      setEditingItem(item);
      const existingAudio = item.audio || [];
      const existingGenders = existingAudio.map(audioItem => {
        // Map short gender codes to full names
        const gender = audioItem.gender;
        if (gender === 'm' || gender === 'male') return 'male';
        if (gender === 'f' || gender === 'female') return 'female';
        return 'male'; // default
      });

      setFormData({
        title: item.title || '',
        description: item.description || '',
        categoryId: item.categoryId || selectedCategory?.id || '',
        categoryName: item.categoryName || selectedCategory?.name || '',
        audioUrl: item.audioUrl || item.audio?.[0]?.audioUrl || '',
        isPublished: item.isPublished === true || item.isPublished === "true" || item.published === true || item.published === "true" || false,
        isPremium: item.isPremium === true || item.isPremium === "true" || false,
        audio: existingAudio,
        selectedFiles: [],
        genders: existingGenders
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        categoryId: selectedCategory?.id || '',
        categoryName: selectedCategory?.name || '',
        audioUrl: '',
        isPublished: true,
        isPremium: false,
        audio: [],
        selectedFiles: [],
        genders: []
      });
    }
    setOpen(true);
  };

  const handleAudioClose = () => {
    // Stop audio playback when closing dialog
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setAudioMuted(false);
    }
    setOpen(false);
    setEditingItem(null);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    loadAudioItems(category.id);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setAudioItems([]);
  };

  const handleAudioSubmit = async (e) => {
    e.preventDefault();

    // Validate that a category is selected
    if (!formData.categoryId) {
      alert('Please select a category before adding audio.');
      return;
    }

    setUploading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('categoryId', formData.categoryId);
      submitData.append('categoryName', formData.categoryName);
      submitData.append('audioUrl', formData.audioUrl);
      submitData.append('isPublished', formData.isPublished);
      submitData.append('isPremium', formData.isPremium);

      // Handle existing audio files and their updated genders
      const existingAudio = formData.audio || [];
      const genders = formData.genders || [];

      // Send existing audio data with updated genders
      existingAudio.forEach((audioItem, index) => {
        const updatedGender = genders[index] || audioItem.gender || 'male';
        submitData.append('existingAudio', JSON.stringify({
          ...audioItem,
          gender: updatedGender === 'male' ? 'm' : 'f' // Convert back to short form for Firebase
        }));
      });


      // Handle newly selected files
      const selectedFiles = formData.selectedFiles || [];
      const existingAudioCount = existingAudio.length;

      selectedFiles.forEach((file, index) => {
        const adjustedIndex = existingAudioCount + index;
        submitData.append('audioFiles', file);
        submitData.append('genders', genders[adjustedIndex] || 'male');
      });

      if (editingItem) {
        // Optimistic update for editing
        const updatedItem = {
          ...editingItem,
          title: formData.title,
          description: formData.description,
          audioUrl: formData.audioUrl,
          isPublished: formData.isPublished,
          isPremium: formData.isPremium,
          audio: formData.audio
        };
        setAudioItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));

        // Update in background
        try {
          await updateGuidedAudio(editingItem.id, submitData);
        } catch (error) {
          // If update fails, revert the optimistic change
          setAudioItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
          throw error;
        }
      } else {
        // Optimistic creation
        const tempId = `temp-${Date.now()}`;
        const newItem = {
          id: tempId,
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          audioUrl: formData.audioUrl,
          isPublished: formData.isPublished,
          isPremium: formData.isPremium,
          audio: formData.audio
        };

        setAudioItems(prev => [...prev, newItem]);

        try {
          const createdItem = await createGuidedAudio(submitData);
          // Replace temp item with real item
          setAudioItems(prev => prev.map(item => item.id === tempId ? createdItem : item));
        } catch (error) {
          // If creation fails, remove the temp item
          setAudioItems(prev => prev.filter(item => item.id !== tempId));
          throw error;
        }
      }

      handleAudioClose();
    } catch (error) {
      console.error('Error saving audio item:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAudioChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newGenders = files.map(() => 'male'); // Default to male for each file

    setFormData(prev => {
      // Keep existing genders from audio array and append new ones for selected files
      const existingGenders = prev.genders || [];
      const combinedGenders = [
        ...existingGenders.slice(0, prev.audio?.length || 0), // Keep existing audio genders
        ...newGenders // Add new genders for selected files
      ];

      return {
        ...prev,
        selectedFiles: files,
        genders: combinedGenders
      };
    });
  };

  const handleGenderChange = (index, gender) => {
    const newGenders = [...(formData.genders || [])];
    newGenders[index] = gender;
    setFormData(prev => ({
      ...prev,
      genders: newGenders
    }));
  };


  const getCategoryName = (categoryId) => {
    const category = audioCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  // Audio Menu Handlers
  const handleAudioMenuOpen = (event, audioItem) => {
    event.stopPropagation();
    setAudioMenuAnchor(event.currentTarget);
    setSelectedAudioItem(audioItem);
  };

  const handleAudioMenuClose = () => {
    setAudioMenuAnchor(null);
    setSelectedAudioItem(null);
  };

  const handleAudioDelete = async () => {
    if (!selectedAudioItem) return;

    if (window.confirm(`Are you sure you want to delete "${selectedAudioItem.title}"? This action cannot be undone.`)) {
      // Optimistically remove the item from UI immediately
      const itemToDelete = selectedAudioItem;
      setAudioItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      handleAudioMenuClose();

      try {
        // Delete from backend (happens in background)
        await deleteGuidedAudio(itemToDelete.id);
        // Success - item is already removed from UI
      } catch (error) {
        console.error('Error deleting audio item:', error);
        // If delete fails, add the item back to the list
        setAudioItems(prev => [...prev, itemToDelete].sort((a, b) => a.title.localeCompare(b.title)));
        alert('Error deleting audio item. Please try again.');
      }
    }
  };

  const normalizeGender = (gender) => {
    if (gender === 'm') return 'male';
    if (gender === 'f') return 'female';
    return gender;
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (event, newValue) => {
    if (audioRef.current) {
      const newTime = (newValue / 100) * audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioMuted;
      setAudioMuted(!audioMuted);
    }
  };

  // Card audio player handlers
  const getCardAudioKey = (itemId, audioIndex) => `${itemId}-${audioIndex}`;

  const handleCardAudioPlay = (itemId, audioIndex, audioUrl) => {
    const key = getCardAudioKey(itemId, audioIndex);
    const audioElement = cardAudioRefs.current[key];
    
    if (audioElement) {
      if (cardAudioStates[key]?.playing) {
        audioElement.pause();
      } else {
        // Pause all other audios
        Object.keys(cardAudioStates).forEach(k => {
          if (k !== key && cardAudioStates[k]?.playing) {
            const otherAudio = cardAudioRefs.current[k];
            if (otherAudio) {
              otherAudio.pause();
            }
          }
        });
        audioElement.play();
      }
    }
  };

  const handleCardAudioTimeUpdate = (itemId, audioIndex) => {
    const key = getCardAudioKey(itemId, audioIndex);
    const audioElement = cardAudioRefs.current[key];
    if (audioElement) {
      setCardAudioStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          currentTime: audioElement.currentTime
        }
      }));
    }
  };

  const handleCardAudioLoadedMetadata = (itemId, audioIndex) => {
    const key = getCardAudioKey(itemId, audioIndex);
    const audioElement = cardAudioRefs.current[key];
    if (audioElement) {
      setCardAudioStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          duration: audioElement.duration
        }
      }));
    }
  };

  const handleCardAudioProgressChange = (itemId, audioIndex, newValue) => {
    const key = getCardAudioKey(itemId, audioIndex);
    const audioElement = cardAudioRefs.current[key];
    if (audioElement && cardAudioStates[key]?.duration) {
      const newTime = (newValue / 100) * cardAudioStates[key].duration;
      audioElement.currentTime = newTime;
      setCardAudioStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          currentTime: newTime
        }
      }));
    }
  };

  const handleCardAudioMuteToggle = (itemId, audioIndex) => {
    const key = getCardAudioKey(itemId, audioIndex);
    const audioElement = cardAudioRefs.current[key];
    if (audioElement) {
      audioElement.muted = !cardAudioStates[key]?.muted;
      setCardAudioStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          muted: !prev[key]?.muted
        }
      }));
    }
  };

  // Debug: Simple test render
  console.log('Rendering GuidedAudioManager, selectedCategory:', selectedCategory?.name, 'categories:', audioCategories.length, 'audioItems:', audioItems.length);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        {selectedCategory ? (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              component="button"
              variant="body1"
              onClick={handleBackToCategories}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <CategoryIcon sx={{ mr: 0.5 }} fontSize="small" />
              Audio Categories
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <AudioIcon sx={{ mr: 0.5 }} fontSize="small" />
              {selectedCategory.name}
            </Typography>
          </Breadcrumbs>
        ) : null}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="600">
              {selectedCategory ? `${selectedCategory.name} Audio Files` : 'Audio Categories'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {selectedCategory
                ? 'Manage audio files within this category'
                : 'Manage audio categories and files for guided affirmations'
              }
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<CategoryIcon />}
              onClick={() => handleCategoryOpen()}
            >
              Add Category
            </Button>
            <Button
              variant="outlined"
              startIcon={<AudioIcon />}
              onClick={() => handleAudioOpen()}
            >
              Add Audio
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Audio Categories Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
          Audio Categories
        </Typography>
        <Grid container spacing={3}>
          {audioCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: selectedCategory?.id === category.id ? '2px solid' : '1px solid',
                  borderColor: selectedCategory?.id === category.id ? theme.palette.primary.main : theme.palette.divider,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                  }
                }}
                onClick={() => handleCategorySelect(category)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <CategoryIcon
                      sx={{
                        fontSize: 40,
                        color: category.isPublished ? theme.palette.primary.main : theme.palette.text.disabled,
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryOpen(category);
                      }}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography variant="h6" gutterBottom fontWeight="600">
                    {category.name}
                  </Typography>

                  {category.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {category.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={category.isPublished ? 'Published' : 'Unpublished'}
                      color={category.isPublished ? 'primary' : 'default'}
                      size="small"
                    />
                    {category.isPremium && (
                      <Chip
                        label="Premium"
                        color="secondary"
                        size="small"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Audio Files Section */}
      {selectedCategory && (
        <Box>
          <Typography variant="h5" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
            Audio Files for "{selectedCategory.name}"
          </Typography>
          <Grid container spacing={3}>
            {audioItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <AudioIcon
                        sx={{
                          fontSize: 40,
                          color: item.isPublished ? theme.palette.primary.main : theme.palette.text.disabled,
                        }}
                      />
                    <IconButton
                      onClick={(e) => handleAudioMenuOpen(e, item)}
                      size="small"
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                    </Box>

                    <Typography variant="h6" gutterBottom fontWeight="600">
                      {item.title}
                    </Typography>

                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>
                    )}

                    {/* Audio files display with players */}
                    {item.audio && item.audio.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {item.audio.map((audio, index) => {
                          const normalizedGender = normalizeGender(audio.gender);
                          const audioKey = getCardAudioKey(item.id, index);
                          const audioState = cardAudioStates[audioKey] || { playing: false, currentTime: 0, duration: 0, muted: false };
                          
                          return (
                            <Box key={index} sx={{ mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                {normalizedGender === 'male' ? <MaleIcon fontSize="small" /> : <FemaleIcon fontSize="small" />}
                                <Typography variant="caption" color="text.secondary">
                                  {normalizedGender.charAt(0).toUpperCase() + normalizedGender.slice(1)} Voice
                                </Typography>
                              </Box>
                              
                              <audio
                                ref={(el) => {
                                  if (el) cardAudioRefs.current[audioKey] = el;
                                }}
                                src={audio.audioUrl}
                                onPlay={() => {
                                  setCardAudioStates(prev => ({
                                    ...prev,
                                    [audioKey]: { ...prev[audioKey], playing: true }
                                  }));
                                }}
                                onPause={() => {
                                  setCardAudioStates(prev => ({
                                    ...prev,
                                    [audioKey]: { ...prev[audioKey], playing: false }
                                  }));
                                }}
                                onEnded={() => {
                                  setCardAudioStates(prev => ({
                                    ...prev,
                                    [audioKey]: { ...prev[audioKey], playing: false, currentTime: 0 }
                                  }));
                                }}
                                onTimeUpdate={() => handleCardAudioTimeUpdate(item.id, index)}
                                onLoadedMetadata={() => handleCardAudioLoadedMetadata(item.id, index)}
                                muted={audioState.muted}
                                style={{ display: 'none' }}
                              />
                              
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  p: 1.5,
                                  bgcolor: 'grey.200',
                                  borderRadius: '50px',
                                  border: 'none',
                                  boxShadow: 'none'
                                }}
                              >
                                {/* Play/Pause Button */}
                                <IconButton
                                  onClick={() => handleCardAudioPlay(item.id, index, audio.audioUrl)}
                                  size="small"
                                  sx={{
                                    bgcolor: 'transparent',
                                    color: '#000',
                                    width: 36,
                                    height: 36,
                                    p: 0,
                                    '&:hover': {
                                      bgcolor: 'rgba(0, 0, 0, 0.05)'
                                    },
                                    '& svg': {
                                      fontSize: '1.2rem'
                                    }
                                  }}
                                >
                                  {audioState.playing ? <PauseIcon /> : <PlayIcon />}
                                </IconButton>

                                {/* Time Display */}
                                <Box
                                  component="span"
                                  sx={{
                                    minWidth: 90,
                                    fontFamily: 'monospace',
                                    color: '#000',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                    lineHeight: 1.5,
                                    flexShrink: 0,
                                    fontWeight: 400,
                                    visibility: audioState.duration > 0 ? 'visible' : 'visible'
                                  }}
                                >
                                  {formatTime(audioState.currentTime || 0)} / {formatTime(audioState.duration || 0)}
                                </Box>

                                {/* Progress Bar */}
                                <Slider
                                  value={audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}
                                  onChange={(e, newValue) => handleCardAudioProgressChange(item.id, index, newValue)}
                                  sx={{
                                    flexGrow: 1,
                                    color: 'grey.700',
                                    height: 4,
                                    cursor: 'pointer',
                                    '& .MuiSlider-thumb': {
                                      width: 0,
                                      height: 0,
                                      '&:hover': {
                                        width: 12,
                                        height: 12,
                                        boxShadow: '0 0 0 8px rgba(0, 0, 0, 0.04)'
                                      }
                                    },
                                    '& .MuiSlider-track': {
                                      height: 4,
                                      borderRadius: 2,
                                      bgcolor: 'grey.700',
                                      border: 'none'
                                    },
                                    '& .MuiSlider-rail': {
                                      height: 4,
                                      borderRadius: 2,
                                      bgcolor: 'grey.300',
                                      opacity: 1
                                    },
                                    '&:hover .MuiSlider-thumb': {
                                      width: 12,
                                      height: 12
                                    }
                                  }}
                                />

                                {/* Mute Button */}
                                <IconButton
                                  onClick={() => handleCardAudioMuteToggle(item.id, index)}
                                  size="small"
                                  sx={{
                                    color: '#000',
                                    width: 32,
                                    height: 32,
                                    '&:hover': {
                                      bgcolor: 'rgba(0, 0, 0, 0.05)'
                                    },
                                    '& svg': {
                                      fontSize: '1.1rem'
                                    }
                                  }}
                                >
                                  {audioState.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                                </IconButton>

                                {/* More Options */}
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: '#000',
                                    width: 32,
                                    height: 32,
                                    '&:hover': {
                                      bgcolor: 'rgba(0, 0, 0, 0.05)'
                                    },
                                    '& svg': {
                                      fontSize: '1.1rem'
                                    }
                                  }}
                                >
                                  <MoreIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={item.isPublished ? 'Published' : 'Unpublished'}
                        color={item.isPublished ? 'primary' : 'default'}
                        size="small"
                      />
                      {item.isPremium && (
                        <Chip
                          label="Premium"
                          color="secondary"
                          size="small"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Audio Menu */}
      <Menu
        anchorEl={audioMenuAnchor}
        open={Boolean(audioMenuAnchor)}
        onClose={handleAudioMenuClose}
      >
        <MenuItem onClick={() => {
          handleAudioOpen(selectedAudioItem);
          handleAudioMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          onClick={handleAudioDelete}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Category Dialog */}
      <Dialog open={categoryOpen} onClose={handleCategoryClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <form onSubmit={handleCategorySubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Category Name"
              type="text"
              fullWidth
              variant="outlined"
              value={categoryFormData.name}
              onChange={handleCategoryChange}
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
              value={categoryFormData.description}
              onChange={handleCategoryChange}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  name="isPublished"
                  checked={categoryFormData.isPublished}
                  onChange={handleCategoryChange}
                  color="primary"
                />
              }
              label="Published"
            />
            <FormControlLabel
              control={
                <Switch
                  name="isPremium"
                  checked={categoryFormData.isPremium}
                  onChange={handleCategoryChange}
                  color="secondary"
                />
              }
              label="Premium"
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={handleCategoryClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Audio Dialog */}
      <Dialog open={open} onClose={handleAudioClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          {editingItem ? 'Edit Audio' : 'Add New Audio'}
        </DialogTitle>
        <form onSubmit={handleAudioSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Audio Title"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={handleAudioChange}
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
              onChange={handleAudioChange}
              sx={{ mb: 2 }}
            />

            {/* Category Selection */}
            <FormControl fullWidth sx={{ mb: 2 }} required>
              <InputLabel>Category *</InputLabel>
              <Select
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => {
                  const selectedCat = audioCategories.find(cat => cat.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    categoryId: e.target.value,
                    categoryName: selectedCat ? selectedCat.name : ''
                  }));
                }}
                label="Category *"
                required
              >
                {audioCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Audio URL Input */}
            <TextField
              margin="dense"
              name="audioUrl"
              label="Audio URL (Optional)"
              type="url"
              fullWidth
              variant="outlined"
              value={formData.audioUrl}
              onChange={handleAudioChange}
              placeholder="https://example.com/audio.mp3"
              helperText="Enter a direct audio URL or upload files below"
              sx={{ mb: 2 }}
            />

            {/* Audio Playback Controls */}
            {editingItem && formData.audioUrl && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Audio Preview
                </Typography>
                <audio
                  ref={audioRef}
                  src={formData.audioUrl}
                  onPlay={() => setAudioPlaying(true)}
                  onPause={() => setAudioPlaying(false)}
                  onEnded={() => {
                    setAudioPlaying(false);
                    setAudioCurrentTime(0);
                  }}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onLoadedMetadata={handleAudioLoadedMetadata}
                  muted={audioMuted}
                  style={{ display: 'none' }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    bgcolor: 'grey.200',
                    borderRadius: '50px',
                    border: 'none',
                    boxShadow: 'none',
                    flexWrap: 'nowrap'
                  }}
                >
                  {/* Play/Pause Button */}
                  <IconButton
                    onClick={() => {
                      if (audioPlaying) {
                        audioRef.current?.pause();
                      } else {
                        audioRef.current?.play();
                      }
                    }}
                    sx={{
                      bgcolor: 'transparent',
                      color: '#000',
                      width: 40,
                      height: 40,
                      p: 0,
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.05)'
                      },
                      '& svg': {
                        fontSize: '1.3rem'
                      }
                    }}
                  >
                    {audioPlaying ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>

                  {/* Time Display */}
                  <Box
                    component="span"
                    sx={{
                      minWidth: 90,
                      fontFamily: 'monospace',
                      color: '#000',
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                      lineHeight: 1.5,
                      flexShrink: 0,
                      fontWeight: 400,
                      visibility: 'visible'
                    }}
                  >
                    {formatTime(audioCurrentTime || 0)} / {formatTime(audioDuration || 0)}
                  </Box>

                  {/* Progress Bar */}
                  <Slider
                    value={audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0}
                    onChange={handleProgressChange}
                    onChangeCommitted={handleProgressChange}
                    sx={{
                      flexGrow: 1,
                      color: 'grey.700',
                      height: 4,
                      cursor: 'pointer',
                      '& .MuiSlider-thumb': {
                        width: 0,
                        height: 0,
                        '&:hover': {
                          width: 12,
                          height: 12,
                          boxShadow: '0 0 0 8px rgba(0, 0, 0, 0.04)'
                        }
                      },
                      '& .MuiSlider-track': {
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'grey.700',
                        border: 'none'
                      },
                      '& .MuiSlider-rail': {
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'grey.300',
                        opacity: 1
                      },
                      '&:hover .MuiSlider-thumb': {
                        width: 12,
                        height: 12
                      }
                    }}
                  />

                  {/* Mute Button */}
                  <IconButton
                    onClick={handleMuteToggle}
                    size="small"
                    sx={{
                      color: '#000',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.05)'
                      },
                      '& svg': {
                        fontSize: '1.1rem'
                      }
                    }}
                  >
                    {audioMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  </IconButton>

                  {/* More Options Menu */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      // For now, show delete option directly
                      if (window.confirm('Delete this audio URL?')) {
                        if (audioPlaying) {
                          audioRef.current?.pause();
                          setAudioPlaying(false);
                        }
                        setFormData(prev => ({ ...prev, audioUrl: '' }));
                        setAudioCurrentTime(0);
                        setAudioDuration(0);
                      }
                    }}
                    size="small"
                    sx={{
                      color: '#000',
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.05)'
                      },
                      '& svg': {
                        fontSize: '1.1rem'
                      }
                    }}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Audio Files Upload */}
            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{ mb: 1 }}
              >
                Upload Audio Files
              </Button>

              {formData.selectedFiles && formData.selectedFiles.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {formData.selectedFiles.length} file(s) selected
                </Alert>
              )}

              {/* Gender selection for existing audio files (when editing) */}
              {editingItem && formData.audio && formData.audio.map((audioItem, index) => (
                <Box key={`existing-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 100 }}>
                    Existing Audio {index + 1}
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={formData.genders?.[index] || normalizeGender(audioItem.gender) || 'male'}
                      onChange={(e) => handleGenderChange(index, e.target.value)}
                    >
                      <FormControlLabel value="male" control={<Radio />} label="Male" />
                      <FormControlLabel value="female" control={<Radio />} label="Female" />
                    </RadioGroup>
                  </FormControl>
                </Box>
              ))}

              {/* Gender selection for newly selected files */}
              {formData.selectedFiles && formData.selectedFiles.map((file, index) => {
                const adjustedIndex = (formData.audio?.length || 0) + index;
                return (
                  <Box key={`new-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 100 }}>
                      {file.name}
                    </Typography>
                    <FormControl component="fieldset">
                      <RadioGroup
                        row
                        value={formData.genders?.[adjustedIndex] || 'male'}
                        onChange={(e) => handleGenderChange(adjustedIndex, e.target.value)}
                      >
                        <FormControlLabel value="male" control={<Radio />} label="Male" />
                        <FormControlLabel value="female" control={<Radio />} label="Female" />
                      </RadioGroup>
                    </FormControl>
                  </Box>
                );
              })}
            </Box>


            <FormControlLabel
              control={
                <Switch
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleAudioChange}
                  color="primary"
                />
              }
              label="Published"
            />
            <FormControlLabel
              control={
                <Switch
                  name="isPremium"
                  checked={formData.isPremium}
                  onChange={handleAudioChange}
                  color="secondary"
                />
              }
              label="Premium"
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={handleAudioClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : (editingItem ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GuidedAudioManager;
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
  MusicNote as MusicIcon,
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
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
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
  const [selectedCategoryItem, setSelectedCategoryItem] = useState(null);
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
  
  // State for local file previews and management
  const [localFilePreviews, setLocalFilePreviews] = useState([]);
  const [localFileStates, setLocalFileStates] = useState({}); // For audio playback states
  const localFileRefs = useRef({});
  
  // State for existing audio files (when editing)
  const [existingAudioStates, setExistingAudioStates] = useState({}); // For audio playback states
  const existingAudioRefs = useRef({});
  const [deletedExistingAudio, setDeletedExistingAudio] = useState([]); // Track deleted existing audio indices
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

  // Category Menu Handlers
  const handleCategoryMenuOpen = (event, category) => {
    event.stopPropagation();
    setCategoryMenuAnchor(event.currentTarget);
    setSelectedCategoryItem(category);
  };

  const handleCategoryMenuClose = () => {
    setCategoryMenuAnchor(null);
    setSelectedCategoryItem(null);
  };

  const handleCategoryDelete = async () => {
    if (!selectedCategoryItem) return;

    if (window.confirm(`Are you sure you want to delete "${selectedCategoryItem.name}"? This action cannot be undone.`)) {
      // Optimistically remove the category from UI immediately
      const categoryToDelete = selectedCategoryItem;
      setAudioCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      
      // If the deleted category was selected, clear selection
      if (selectedCategory?.id === categoryToDelete.id) {
        setSelectedCategory(null);
        setAudioItems([]);
      }
      
      handleCategoryMenuClose();

      try {
        // Delete from backend (happens in background)
        await deleteAudioCategory(categoryToDelete.id);
        // Success - category is already removed from UI
      } catch (error) {
        console.error('Error deleting category:', error);
        // If delete fails, add the category back to the list
        setAudioCategories(prev => [...prev, categoryToDelete].sort((a, b) => a.name.localeCompare(b.name)));
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const handleCategoryTogglePublished = async (category) => {
    const newPublishedStatus = !category.isPublished;
    
    // Optimistic update
    const updatedCategory = {
      ...category,
      isPublished: newPublishedStatus
    };
    setAudioCategories(prev => prev.map(cat => cat.id === category.id ? updatedCategory : cat));

    try {
      await updateAudioCategory(category.id, { isPublished: newPublishedStatus });
    } catch (error) {
      // If update fails, revert the optimistic change
      setAudioCategories(prev => prev.map(cat => cat.id === category.id ? category : cat));
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };

  const handleCategoryTogglePremium = async (category) => {
    const newPremiumStatus = !category.isPremium;
    
    // Optimistic update
    const updatedCategory = {
      ...category,
      isPremium: newPremiumStatus
    };
    setAudioCategories(prev => prev.map(cat => cat.id === category.id ? updatedCategory : cat));

    try {
      await updateAudioCategory(category.id, { isPremium: newPremiumStatus });
    } catch (error) {
      // If update fails, revert the optimistic change
      setAudioCategories(prev => prev.map(cat => cat.id === category.id ? category : cat));
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };

  // Audio Item Toggle Handlers
  const handleAudioTogglePublished = async (audioItem) => {
    const newPublishedStatus = !audioItem.isPublished;
    
    // Optimistic update
    const updatedItem = {
      ...audioItem,
      isPublished: newPublishedStatus
    };
    setAudioItems(prev => prev.map(item => item.id === audioItem.id ? updatedItem : item));

    try {
      await updateGuidedAudio(audioItem.id, { isPublished: newPublishedStatus });
    } catch (error) {
      // If update fails, revert the optimistic change
      setAudioItems(prev => prev.map(item => item.id === audioItem.id ? audioItem : item));
      console.error('Error updating audio item:', error);
      alert('Error updating audio item. Please try again.');
    }
  };

  const handleAudioTogglePremium = async (audioItem) => {
    const newPremiumStatus = !audioItem.isPremium;
    
    // Optimistic update
    const updatedItem = {
      ...audioItem,
      isPremium: newPremiumStatus
    };
    setAudioItems(prev => prev.map(item => item.id === audioItem.id ? updatedItem : item));

    try {
      await updateGuidedAudio(audioItem.id, { isPremium: newPremiumStatus });
    } catch (error) {
      // If update fails, revert the optimistic change
      setAudioItems(prev => prev.map(item => item.id === audioItem.id ? audioItem : item));
      console.error('Error updating audio item:', error);
      alert('Error updating audio item. Please try again.');
    }
  };

  // Audio Management
  const handleAudioOpen = async (item = null) => {
    // Refresh categories when opening dialog to show newly added categories
    await loadAudioCategories();

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

      // Initialize audio states for existing audio files
      const newStates = {};
      existingAudio.forEach((audioItem, index) => {
        newStates[index] = {
          playing: false,
          currentTime: 0,
          duration: 0,
          muted: false
        };
      });
      setExistingAudioStates(newStates);
      setDeletedExistingAudio([]);

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
      setExistingAudioStates({});
      setDeletedExistingAudio([]);
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
    // Stop all local audio playback
    Object.keys(localFileStates).forEach(id => {
      const audioElement = localFileRefs.current[id];
      if (audioElement) {
        audioElement.pause();
      }
    });
    
    // Stop all existing audio playback
    Object.keys(existingAudioStates).forEach(index => {
      const audioElement = existingAudioRefs.current[index];
      if (audioElement) {
        audioElement.pause();
      }
    });
    
    // Cleanup preview URLs
    localFilePreviews.forEach(preview => {
      if (preview.previewUrl) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    });

    // Reset local file states
    setLocalFilePreviews([]);
    setLocalFileStates({});
    setExistingAudioStates({});
    setDeletedExistingAudio([]);
    
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

      // Handle existing audio files and their updated genders (exclude deleted ones)
      const existingAudio = formData.audio || [];
      const genders = formData.genders || [];

      // Send existing audio data with updated genders (only non-deleted ones)
      existingAudio.forEach((audioItem, index) => {
        // Skip deleted audio files
        if (deletedExistingAudio.includes(index)) {
          return;
        }
        const updatedGender = genders[index] || audioItem.gender || 'male';
        submitData.append('existingAudio', JSON.stringify({
          ...audioItem,
          gender: updatedGender === 'male' ? 'm' : 'f' // Convert back to short form for Firebase
        }));
      });
      
      // Send deleted audio indices
      if (deletedExistingAudio.length > 0) {
        submitData.append('deletedAudioIndices', JSON.stringify(deletedExistingAudio));
      }


      // Handle newly selected files (only active ones)
      const activePreviews = localFilePreviews.filter(p => p.status === 'active');
      const existingAudioCount = existingAudio.length;

      activePreviews.forEach((preview, index) => {
        const adjustedIndex = existingAudioCount + index;
        submitData.append('audioFiles', preview.file);
        submitData.append('genders', preview.gender === 'male' ? 'm' : 'f');
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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create preview objects for each file
    const newPreviews = await Promise.all(
      files.map(async (file, index) => {
        const previewUrl = URL.createObjectURL(file);
        const audioElement = new Audio(previewUrl);
        
        return new Promise((resolve) => {
          audioElement.addEventListener('loadedmetadata', () => {
            resolve({
              id: `local-${Date.now()}-${index}`,
              file,
              previewUrl,
              name: file.name,
              duration: audioElement.duration || 0,
              gender: 'male', // Default gender
              status: 'active', // 'active' or 'deleted'
              size: file.size
            });
            audioElement.remove();
          });
          audioElement.addEventListener('error', () => {
            resolve({
              id: `local-${Date.now()}-${index}`,
              file,
              previewUrl,
              name: file.name,
              duration: 0,
              gender: 'male',
              status: 'active',
              size: file.size
            });
          });
        });
      })
    );

    // Initialize audio states for new files
    const newStates = { ...localFileStates };
    newPreviews.forEach(preview => {
      newStates[preview.id] = {
        playing: false,
        currentTime: 0,
        duration: preview.duration,
        muted: false
      };
    });

    setLocalFilePreviews(prev => [...prev, ...newPreviews]);
    setLocalFileStates(newStates);

    // Update formData
    setFormData(prev => {
      const existingGenders = prev.genders || [];
      const newGenders = newPreviews.map(() => 'male');
      const combinedGenders = [
        ...existingGenders.slice(0, prev.audio?.length || 0),
        ...newGenders
      ];

      return {
        ...prev,
        selectedFiles: [...(prev.selectedFiles || []), ...files],
        genders: combinedGenders
      };
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLocalFileDelete = (previewId) => {
    setLocalFilePreviews(prev => 
      prev.map(preview => 
        preview.id === previewId 
          ? { ...preview, status: 'deleted' }
          : preview
      )
    );
    
    // Stop audio if playing
    const audioRef = localFileRefs.current[previewId];
    if (audioRef) {
      audioRef.pause();
      setLocalFileStates(prev => ({
        ...prev,
        [previewId]: { ...prev[previewId], playing: false, currentTime: 0 }
      }));
    }
  };

  const handleLocalFileRestore = (previewId) => {
    setLocalFilePreviews(prev => 
      prev.map(preview => 
        preview.id === previewId 
          ? { ...preview, status: 'active' }
          : preview
      )
    );
  };

  const handleLocalFileGenderChange = (previewId, gender) => {
    setLocalFilePreviews(prev => 
      prev.map(preview => 
        preview.id === previewId 
          ? { ...preview, gender }
          : preview
      )
    );

    // Update formData genders array
    setFormData(prev => {
      const previewIndex = localFilePreviews.findIndex(p => p.id === previewId);
      if (previewIndex === -1) return prev;
      
      const existingAudioCount = prev.audio?.length || 0;
      const adjustedIndex = existingAudioCount + previewIndex;
      const newGenders = [...(prev.genders || [])];
      newGenders[adjustedIndex] = gender;
      
      return {
        ...prev,
        genders: newGenders
      };
    });
  };

  // Local file audio player handlers
  const handleLocalFilePlay = (previewId) => {
    const audioElement = localFileRefs.current[previewId];
    if (!audioElement) return;

    // Pause all other local files
    Object.keys(localFileStates).forEach(id => {
      if (id !== previewId && localFileStates[id]?.playing) {
        const otherAudio = localFileRefs.current[id];
        if (otherAudio) {
          otherAudio.pause();
          setLocalFileStates(prev => ({
            ...prev,
            [id]: { ...prev[id], playing: false }
          }));
        }
      }
    });

    if (localFileStates[previewId]?.playing) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  };

  const handleLocalFileTimeUpdate = (previewId) => {
    const audioElement = localFileRefs.current[previewId];
    if (audioElement) {
      setLocalFileStates(prev => ({
        ...prev,
        [previewId]: {
          ...prev[previewId],
          currentTime: audioElement.currentTime
        }
      }));
    }
  };

  const handleLocalFileLoadedMetadata = (previewId) => {
    const audioElement = localFileRefs.current[previewId];
    if (audioElement) {
      setLocalFileStates(prev => ({
        ...prev,
        [previewId]: {
          ...prev[previewId],
          duration: audioElement.duration
        }
      }));
    }
  };

  const handleLocalFileProgressChange = (previewId, newValue) => {
    const audioElement = localFileRefs.current[previewId];
    const state = localFileStates[previewId];
    if (audioElement && state?.duration) {
      const newTime = (newValue / 100) * state.duration;
      audioElement.currentTime = newTime;
      setLocalFileStates(prev => ({
        ...prev,
        [previewId]: {
          ...prev[previewId],
          currentTime: newTime
        }
      }));
    }
  };

  const handleLocalFileMuteToggle = (previewId) => {
    const audioElement = localFileRefs.current[previewId];
    if (audioElement) {
      audioElement.muted = !localFileStates[previewId]?.muted;
      setLocalFileStates(prev => ({
        ...prev,
        [previewId]: {
          ...prev[previewId],
          muted: !prev[previewId]?.muted
        }
      }));
    }
  };

  // Cleanup preview URLs when component unmounts or dialog closes
  useEffect(() => {
    return () => {
      localFilePreviews.forEach(preview => {
        if (preview.previewUrl) {
          URL.revokeObjectURL(preview.previewUrl);
        }
      });
    };
  }, [localFilePreviews]);

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
        
        {/* Published Categories */}
        {audioCategories.filter(cat => cat.isPublished).length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" color="primary">
                Published
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {audioCategories
                .filter(category => category.isPublished)
                .map((category) => (
                  <Grid item xs={12} sm={6} md={4} key={category.id}>
                    <Card
                      sx={{
                        height: '100%',
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
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <MusicIcon
                            sx={{
                              fontSize: 40,
                              color: category.isPublished ? theme.palette.primary.main : theme.palette.text.disabled,
                              mb: 1
                            }}
                          />
                          <IconButton
                            onClick={(e) => handleCategoryMenuOpen(e, category)}
                            size="small"
                          >
                            <MoreIcon fontSize="small" />
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

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                          <Chip
                            label={category.isPublished ? 'Published' : 'Unpublished'}
                            color={category.isPublished ? 'primary' : 'default'}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryTogglePublished(category);
                            }}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Chip
                            label="Premium"
                            color={category.isPremium ? 'secondary' : 'default'}
                            size="small"
                            variant={category.isPremium ? 'filled' : 'outlined'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryTogglePremium(category);
                            }}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {/* Unpublished Categories */}
        {audioCategories.filter(cat => !cat.isPublished).length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" color="text.secondary">
                Unpublished
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {audioCategories
                .filter(category => !category.isPublished)
                .map((category) => (
                  <Grid item xs={12} sm={6} md={4} key={category.id}>
                    <Card
                      sx={{
                        height: '100%',
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
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                          <MusicIcon
                            sx={{
                              fontSize: 40,
                              color: category.isPublished ? theme.palette.primary.main : theme.palette.text.disabled,
                              mb: 1
                            }}
                          />
                          <IconButton
                            onClick={(e) => handleCategoryMenuOpen(e, category)}
                            size="small"
                          >
                            <MoreIcon fontSize="small" />
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

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                          <Chip
                            label={category.isPublished ? 'Published' : 'Unpublished'}
                            color={category.isPublished ? 'primary' : 'default'}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryTogglePublished(category);
                            }}
                            sx={{ cursor: 'pointer' }}
                          />
                          <Chip
                            label="Premium"
                            color={category.isPremium ? 'secondary' : 'default'}
                            size="small"
                            variant={category.isPremium ? 'filled' : 'outlined'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryTogglePremium(category);
                            }}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}
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
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <AudioIcon
                        sx={{
                          fontSize: 40,
                          color: item.isPublished ? theme.palette.primary.main : theme.palette.text.disabled,
                          mb: 1
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

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      <Chip
                        label={item.isPublished ? 'Published' : 'Unpublished'}
                        color={item.isPublished ? 'primary' : 'default'}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudioTogglePublished(item);
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
                      <Chip
                        label="Premium"
                        color={item.isPremium ? 'secondary' : 'default'}
                        size="small"
                        variant={item.isPremium ? 'filled' : 'outlined'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAudioTogglePremium(item);
                        }}
                        sx={{ cursor: 'pointer' }}
                      />
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

      {/* Category Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={handleCategoryMenuClose}
      >
        <MenuItem onClick={() => {
          handleCategoryOpen(selectedCategoryItem);
          handleCategoryMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          onClick={handleCategoryDelete}
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
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
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
                label="Category"
              >
                {audioCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Audio URL Input - Only show when adding new audio */}
            {!editingItem && (
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
            )}

            {/* Audio Playback Controls for URL - Only when adding */}
            {!editingItem && formData.audioUrl && (
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
                sx={{ mb: 2 }}
              >
                Select Audio Files
              </Button>

              {/* Existing Audio Files (when editing) */}
              {editingItem && formData.audio && formData.audio.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, color: 'text.secondary' }}>
                    Existing Audio Files
                  </Typography>
                  {formData.audio.map((audioItem, index) => {
                    const normalizedGender = normalizeGender(audioItem.gender);
                    const isDeleted = deletedExistingAudio.includes(index);
                    const audioState = existingAudioStates[index] || { playing: false, currentTime: 0, duration: 0, muted: false };
                    const audioUrl = audioItem.audioUrl;
                    
                    return (
                      <Card 
                        key={`existing-${index}`} 
                        sx={{ 
                          mb: 2, 
                          border: '1px solid',
                          borderColor: isDeleted ? 'error.light' : 'divider',
                          bgcolor: isDeleted ? 'error.light' : 'background.paper',
                          opacity: isDeleted ? 0.6 : 1,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          {/* Header with Gender Selection and Delete Button */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {normalizedGender === 'male' ? (
                                <MaleIcon color="primary" fontSize="small" />
                              ) : (
                                <FemaleIcon color="secondary" fontSize="small" />
                              )}
                              <Typography variant="body2" fontWeight="600">
                                {normalizedGender.charAt(0).toUpperCase() + normalizedGender.slice(1)} Voice
                              </Typography>
                            </Box>
                            <Box sx={{ flexGrow: 1 }} />
                            {!isDeleted && (
                              <FormControl size="small">
                                <RadioGroup
                                  row
                                  value={formData.genders?.[index] || normalizedGender || 'male'}
                                  onChange={(e) => handleGenderChange(index, e.target.value)}
                                >
                                  <FormControlLabel 
                                    value="male" 
                                    control={<Radio size="small" />} 
                                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <MaleIcon fontSize="small" /> Male
                                    </Box>} 
                                  />
                                  <FormControlLabel 
                                    value="female" 
                                    control={<Radio size="small" />} 
                                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <FemaleIcon fontSize="small" /> Female
                                    </Box>} 
                                  />
                                </RadioGroup>
                              </FormControl>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isDeleted ? (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setDeletedExistingAudio(prev => prev.filter(i => i !== index));
                                  }}
                                  color="success"
                                >
                                  <RestoreIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    // Stop audio if playing
                                    const audioElement = existingAudioRefs.current[index];
                                    if (audioElement) {
                                      audioElement.pause();
                                      setExistingAudioStates(prev => ({
                                        ...prev,
                                        [index]: { ...prev[index], playing: false, currentTime: 0 }
                                      }));
                                    }
                                    setDeletedExistingAudio(prev => [...prev, index]);
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          {/* Audio Player */}
                          {!isDeleted && audioUrl && (
                            <Box>
                              <audio
                                ref={(el) => {
                                  if (el) existingAudioRefs.current[index] = el;
                                }}
                                src={audioUrl}
                                onPlay={() => {
                                  // Pause all other existing audios
                                  Object.keys(existingAudioStates).forEach(i => {
                                    if (i !== index.toString() && existingAudioStates[i]?.playing) {
                                      const otherAudio = existingAudioRefs.current[i];
                                      if (otherAudio) {
                                        otherAudio.pause();
                                        setExistingAudioStates(prev => ({
                                          ...prev,
                                          [i]: { ...prev[i], playing: false }
                                        }));
                                      }
                                    }
                                  });
                                  setExistingAudioStates(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], playing: true }
                                  }));
                                }}
                                onPause={() => {
                                  setExistingAudioStates(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], playing: false }
                                  }));
                                }}
                                onEnded={() => {
                                  setExistingAudioStates(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], playing: false, currentTime: 0 }
                                  }));
                                }}
                                onTimeUpdate={() => {
                                  const audioElement = existingAudioRefs.current[index];
                                  if (audioElement) {
                                    setExistingAudioStates(prev => ({
                                      ...prev,
                                      [index]: {
                                        ...prev[index],
                                        currentTime: audioElement.currentTime
                                      }
                                    }));
                                  }
                                }}
                                onLoadedMetadata={() => {
                                  const audioElement = existingAudioRefs.current[index];
                                  if (audioElement) {
                                    setExistingAudioStates(prev => ({
                                      ...prev,
                                      [index]: {
                                        ...prev[index],
                                        duration: audioElement.duration
                                      }
                                    }));
                                  }
                                }}
                                muted={audioState.muted}
                                style={{ display: 'none' }}
                              />
                              
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  p: 1.5,
                                  bgcolor: 'grey.100',
                                  borderRadius: '8px',
                                  border: '1px solid',
                                  borderColor: 'divider'
                                }}
                              >
                                {/* Play/Pause Button */}
                                <IconButton
                                  onClick={() => {
                                    const audioElement = existingAudioRefs.current[index];
                                    if (audioElement) {
                                      if (audioState.playing) {
                                        audioElement.pause();
                                      } else {
                                        audioElement.play();
                                      }
                                    }
                                  }}
                                  size="small"
                                  sx={{
                                    bgcolor: 'white',
                                    color: 'primary.main',
                                    width: 36,
                                    height: 36,
                                    '&:hover': {
                                      bgcolor: 'grey.200'
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
                                    color: 'text.primary',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {formatTime(audioState.currentTime || 0)} / {formatTime(audioState.duration || 0)}
                                </Box>

                                {/* Progress Bar */}
                                <Slider
                                  value={audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}
                                  onChange={(e, newValue) => {
                                    const audioElement = existingAudioRefs.current[index];
                                    if (audioElement && audioState.duration) {
                                      const newTime = (newValue / 100) * audioState.duration;
                                      audioElement.currentTime = newTime;
                                      setExistingAudioStates(prev => ({
                                        ...prev,
                                        [index]: {
                                          ...prev[index],
                                          currentTime: newTime
                                        }
                                      }));
                                    }
                                  }}
                                  size="small"
                                  sx={{
                                    flexGrow: 1,
                                    color: 'primary.main',
                                    height: 4,
                                    '& .MuiSlider-thumb': {
                                      width: 0,
                                      height: 0,
                                      '&:hover': {
                                        width: 12,
                                        height: 12
                                      }
                                    },
                                    '&:hover .MuiSlider-thumb': {
                                      width: 12,
                                      height: 12
                                    }
                                  }}
                                />

                                {/* Mute Button */}
                                <IconButton
                                  onClick={() => {
                                    const audioElement = existingAudioRefs.current[index];
                                    if (audioElement) {
                                      audioElement.muted = !audioState.muted;
                                      setExistingAudioStates(prev => ({
                                        ...prev,
                                        [index]: {
                                          ...prev[index],
                                          muted: !prev[index]?.muted
                                        }
                                      }));
                                    }
                                  }}
                                  size="small"
                                  sx={{
                                    color: 'text.secondary',
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  {audioState.muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                                </IconButton>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}

              {/* Local File Previews */}
              {localFilePreviews.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, color: 'text.secondary' }}>
                    Selected Audio Files ({localFilePreviews.filter(f => f.status === 'active').length} active)
                  </Typography>
                  {localFilePreviews.map((preview) => {
                    const audioState = localFileStates[preview.id] || { playing: false, currentTime: 0, duration: preview.duration || 0, muted: false };
                    const isDeleted = preview.status === 'deleted';
                    
                    return (
                      <Card 
                        key={preview.id}
                        sx={{ 
                          mb: 2,
                          border: '1px solid',
                          borderColor: isDeleted ? 'error.light' : 'divider',
                          bgcolor: isDeleted ? 'error.light' : 'background.paper',
                          opacity: isDeleted ? 0.6 : 1,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          {/* File Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight="600" 
                                sx={{ 
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {preview.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  label={preview.status === 'active' ? 'Active' : 'Deleted'}
                                  color={preview.status === 'active' ? 'success' : 'error'}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                {preview.duration > 0 && (
                                  <Typography variant="caption" color="text.secondary">
                                    {formatTime(preview.duration)}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {(preview.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isDeleted ? (
                                <IconButton
                                  size="small"
                                  onClick={() => handleLocalFileRestore(preview.id)}
                                  color="success"
                                >
                                  <RestoreIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton
                                  size="small"
                                  onClick={() => handleLocalFileDelete(preview.id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>

                          {/* Gender Selection */}
                          {!isDeleted && (
                            <Box sx={{ mb: 2 }}>
                              <FormControl component="fieldset" size="small">
                                <FormLabel component="legend" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                  Voice Gender
                                </FormLabel>
                                <RadioGroup
                                  row
                                  value={preview.gender}
                                  onChange={(e) => handleLocalFileGenderChange(preview.id, e.target.value)}
                                >
                                  <FormControlLabel 
                                    value="male" 
                                    control={<Radio size="small" />} 
                                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <MaleIcon fontSize="small" color="primary" /> Male
                                    </Box>} 
                                  />
                                  <FormControlLabel 
                                    value="female" 
                                    control={<Radio size="small" />} 
                                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <FemaleIcon fontSize="small" color="secondary" /> Female
                                    </Box>} 
                                  />
                                </RadioGroup>
                              </FormControl>
                            </Box>
                          )}

                          {/* Audio Player */}
                          {!isDeleted && (
                            <Box>
                              <audio
                                ref={(el) => {
                                  if (el) localFileRefs.current[preview.id] = el;
                                }}
                                src={preview.previewUrl}
                                onPlay={() => {
                                  setLocalFileStates(prev => ({
                                    ...prev,
                                    [preview.id]: { ...prev[preview.id], playing: true }
                                  }));
                                }}
                                onPause={() => {
                                  setLocalFileStates(prev => ({
                                    ...prev,
                                    [preview.id]: { ...prev[preview.id], playing: false }
                                  }));
                                }}
                                onEnded={() => {
                                  setLocalFileStates(prev => ({
                                    ...prev,
                                    [preview.id]: { ...prev[preview.id], playing: false, currentTime: 0 }
                                  }));
                                }}
                                onTimeUpdate={() => handleLocalFileTimeUpdate(preview.id)}
                                onLoadedMetadata={() => handleLocalFileLoadedMetadata(preview.id)}
                                muted={audioState.muted}
                                style={{ display: 'none' }}
                              />
                              
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  p: 1.5,
                                  bgcolor: 'grey.100',
                                  borderRadius: '8px',
                                  border: '1px solid',
                                  borderColor: 'divider'
                                }}
                              >
                                {/* Play/Pause Button */}
                                <IconButton
                                  onClick={() => handleLocalFilePlay(preview.id)}
                                  size="small"
                                  sx={{
                                    bgcolor: 'white',
                                    color: 'primary.main',
                                    width: 36,
                                    height: 36,
                                    '&:hover': {
                                      bgcolor: 'grey.200'
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
                                    color: 'text.primary',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {formatTime(audioState.currentTime || 0)} / {formatTime(audioState.duration || 0)}
                                </Box>

                                {/* Progress Bar */}
                                <Slider
                                  value={audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}
                                  onChange={(e, newValue) => handleLocalFileProgressChange(preview.id, newValue)}
                                  size="small"
                                  sx={{
                                    flexGrow: 1,
                                    color: 'primary.main',
                                    height: 4,
                                    '& .MuiSlider-thumb': {
                                      width: 0,
                                      height: 0,
                                      '&:hover': {
                                        width: 12,
                                        height: 12
                                      }
                                    },
                                    '&:hover .MuiSlider-thumb': {
                                      width: 12,
                                      height: 12
                                    }
                                  }}
                                />

                                {/* Mute Button */}
                                <IconButton
                                  onClick={() => handleLocalFileMuteToggle(preview.id)}
                                  size="small"
                                  sx={{
                                    color: 'text.secondary',
                                    width: 32,
                                    height: 32
                                  }}
                                >
                                  {audioState.muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                                </IconButton>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Published and Premium Toggles */}
            <Box sx={{ display: 'flex', gap: 6, mt: 3, mb: 1, alignItems: 'center' }}>
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
                labelPlacement="start"
                sx={{ m: 0 }}
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
                labelPlacement="start"
                sx={{ m: 0 }}
              />
            </Box>
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
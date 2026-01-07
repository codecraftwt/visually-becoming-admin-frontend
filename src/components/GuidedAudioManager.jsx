import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  Slider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Skeleton,
  LinearProgress,
  CircularProgress,
  Backdrop,
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
  VolumeUp as VolumeUpIcon,
  ViewModule as CardViewIcon,
  ViewList as TableViewIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
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

// Maximum file size: 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes

const GuidedAudioManager = () => {
  const [audioCategories, setAudioCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [audioItems, setAudioItems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAudioItems, setLoadingAudioItems] = useState(false);
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // bytes per second
  const [timeRemaining, setTimeRemaining] = useState(0); // seconds
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [uploadCancelController, setUploadCancelController] = useState(null);
  const [totalFileSize, setTotalFileSize] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
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
  const [fileSizeErrors, setFileSizeErrors] = useState([]); // Track files that exceed size limit
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

  // View and search state
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

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
      setLoadingCategories(true);
      console.log('Loading audio categories...');
      const data = await getAudioCategories();
      console.log('Audio categories loaded:', data);
      // Verify itemCount is present
      data.forEach(cat => {
        if (cat.itemCount === undefined) {
          console.warn(`Category ${cat.name} (${cat.id}) missing itemCount`);
        }
      });
      setAudioCategories(data);
    } catch (error) {
      console.error('Error loading audio categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadAudioItems = async (categoryId) => {
    try {
      setLoadingAudioItems(true);
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
    } finally {
      setLoadingAudioItems(false);
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

  const handleCancelUpload = () => {
    if (uploadCancelController) {
      uploadCancelController.abort();
      setUploadCancelController(null);
    }
    setUploading(false);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);
    setUploadedBytes(0);
    setTotalFileSize(0);
    setUploadStartTime(null);
  };

  const handleAudioSubmit = async (e) => {
    e.preventDefault();

    // Calculate total file size for progress tracking
    const activePreviews = localFilePreviews.filter(p => p.status === 'active');
    const totalSize = activePreviews.reduce((sum, preview) => sum + (preview.file?.size || 0), 0);
    
    if (totalSize === 0 && activePreviews.length === 0) {
      // No files to upload, proceed without progress tracking
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

        const existingAudio = formData.audio || [];
        const genders = formData.genders || [];

        existingAudio.forEach((audioItem, index) => {
          if (deletedExistingAudio.includes(index)) return;
          const updatedGender = genders[index] || audioItem.gender || 'male';
          submitData.append('existingAudio', JSON.stringify({
            ...audioItem,
            gender: updatedGender === 'male' ? 'm' : 'f'
          }));
        });
        
        if (deletedExistingAudio.length > 0) {
          submitData.append('deletedAudioIndices', JSON.stringify(deletedExistingAudio));
        }

        if (editingItem) {
          await updateGuidedAudio(editingItem.id, submitData);
        } else {
          await createGuidedAudio(submitData);
        }

        handleAudioClose();
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Error saving audio item:', error);
          alert('Error saving audio item. Please try again.');
        }
      } finally {
        setUploading(false);
      }
      return;
    }

    // Initialize upload progress tracking
    setTotalFileSize(totalSize);
    setUploadedBytes(0);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);
    setUploadStartTime(Date.now());
    setUploading(true);

    // Create AbortController for cancel functionality
    const abortController = new AbortController();
    setUploadCancelController(abortController);

    // Track upload progress
    let lastLoaded = 0;
    let lastTime = Date.now();

    const onUploadProgress = (progressEvent) => {
      // Handle both lengthComputable and non-lengthComputable cases
      if (progressEvent.lengthComputable && progressEvent.total > 0) {
        const loaded = progressEvent.loaded;
        const total = progressEvent.total;
        
        // Cap progress at 90% until we get the response (remaining 10% is for server processing/Firebase upload)
        const rawPercent = (loaded / total) * 100;
        const percentCompleted = Math.min(Math.round(rawPercent * 0.9), 90);
        
        setUploadedBytes(loaded);
        setUploadProgress(percentCompleted);

        // Calculate upload speed
        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTime) / 1000; // seconds
        const bytesDiff = loaded - lastLoaded;
        
        if (timeDiff > 0 && bytesDiff > 0) {
          const speed = bytesDiff / timeDiff; // bytes per second
          setUploadSpeed(speed);
          
          // Calculate time remaining (accounting for 90% cap)
          const remaining = total - loaded;
          if (speed > 0) {
            const remainingSeconds = (remaining / speed) * 1.1; // Add 10% buffer for server processing
            setTimeRemaining(remainingSeconds);
          }
        }
        
        lastLoaded = loaded;
        lastTime = currentTime;
      } else if (progressEvent.loaded > 0) {
        // Fallback: estimate progress based on loaded bytes if total is unknown
        const loaded = progressEvent.loaded;
        const estimatedTotal = totalSize || loaded * 2; // Rough estimate
        const rawPercent = (loaded / estimatedTotal) * 100;
        const percentCompleted = Math.min(Math.round(rawPercent * 0.9), 90);
        
        setUploadedBytes(loaded);
        setUploadProgress(percentCompleted);
      }
    };

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
          await updateGuidedAudio(editingItem.id, submitData, onUploadProgress, abortController.signal);
          // Set to 100% when upload completes
          setUploadProgress(100);
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
          const createdItem = await createGuidedAudio(submitData, onUploadProgress, abortController.signal);
          // Set to 100% when upload completes
          setUploadProgress(100);
          // Replace temp item with real item
          setAudioItems(prev => prev.map(item => item.id === tempId ? createdItem : item));
        } catch (error) {
          // If creation fails, remove the temp item
          setAudioItems(prev => prev.filter(item => item.id !== tempId));
          throw error;
        }
      }

      // Small delay to show 100% before closing
      setTimeout(() => {
        handleAudioClose();
      }, 300);
    } catch (error) {
      if (error.name !== 'CanceledError' && !axios.isCancel(error)) {
        console.error('Error saving audio item:', error);
        alert('Error saving audio item. Please try again.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setTimeRemaining(0);
      setUploadedBytes(0);
      setTotalFileSize(0);
      setUploadStartTime(null);
      setUploadCancelController(null);
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

    // Validate file sizes
    const invalidFiles = [];
    const validFiles = [];
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push({
          name: file.name,
          size: file.size,
          sizeMB: (file.size / (1024 * 1024)).toFixed(2)
        });
      } else {
        validFiles.push(file);
      }
    });

    // Set error messages for invalid files
    if (invalidFiles.length > 0) {
      setFileSizeErrors(invalidFiles);
      // Still allow valid files to be processed
      if (validFiles.length === 0) {
        // Reset file input if all files are invalid
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    } else {
      setFileSizeErrors([]);
    }

    // Only process valid files
    if (validFiles.length === 0) return;

    // Create preview objects for each valid file
    const newPreviews = await Promise.all(
      validFiles.map(async (file, index) => {
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
        selectedFiles: [...(prev.selectedFiles || []), ...validFiles],
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
      <Box sx={{ mb: 4, position: 'relative' }}>
        {selectedCategory ? (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              component="button"
              variant="body1"
              onClick={() => {
                setSelectedCategory(null);
                setAudioItems([]);
                setSearchQuery('');
              }}
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
        ) : (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              Audio Categories
            </Typography>
          </Breadcrumbs>
        )}

        <Box sx={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          display: 'flex',
          gap: 2
        }}>
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

      {/* Audio Categories Section */}
      {!selectedCategory && (
        <Box sx={{ mb: 6 }}>
          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search audio categories..."
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>

          {/* Loading Skeleton */}
          {loadingCategories && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
                      <Skeleton variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Published Categories */}
          {!loadingCategories && audioCategories
            .filter(cat => {
              if (!categorySearchQuery) return cat.isPublished;
              const query = categorySearchQuery.toLowerCase();
              return cat.isPublished && (
                cat.name.toLowerCase().includes(query) || 
                (cat.description && cat.description.toLowerCase().includes(query))
              );
            })
            .length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="600" color="primary">
                Published
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {audioCategories
                .filter(category => {
                  if (!categorySearchQuery) return category.isPublished;
                  const query = categorySearchQuery.toLowerCase();
                  return category.isPublished && (
                    category.name.toLowerCase().includes(query) || 
                    (category.description && category.description.toLowerCase().includes(query))
                  );
                })
                .map((category) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: selectedCategory?.id === category.id 
                          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(14, 165, 233, 0.4) 50%, rgba(139, 92, 246, 0.4) 100%)'
                          : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(14, 165, 233, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)',
                        border: selectedCategory?.id === category.id ? '2px solid' : '1px solid',
                        borderColor: selectedCategory?.id === category.id 
                          ? 'primary.main' 
                          : 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(34, 197, 94, 0.2)',
                          background: selectedCategory?.id === category.id 
                            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.5) 0%, rgba(14, 165, 233, 0.5) 50%, rgba(139, 92, 246, 0.5) 100%)'
                            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(14, 165, 233, 0.15) 50%, rgba(139, 92, 246, 0.15) 100%)',
                        }
                      }}
                      onClick={() => handleCategorySelect(category)}
                    >
                      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="600" 
                            sx={{ 
                              color: 'text.primary'
                            }}
                          >
                            {category.name}
                          </Typography>
                          <Chip
                            label={`${category.itemCount ?? 0} items`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        </Box>

                        {category.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 1.5,
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              flexGrow: 1
                            }}
                          >
                            {category.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip
                              label={category.isPublished ? 'Published' : 'Unpublished'}
                              color={category.isPublished ? 'primary' : 'default'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryTogglePublished(category);
                              }}
                              sx={{ 
                                cursor: 'pointer', 
                                height: 24,
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 1 }
                              }}
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
                              sx={{ 
                                cursor: 'pointer', 
                                height: 24,
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryOpen(category);
                              }}
                              sx={{ 
                                p: 0.5,
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategoryItem(category);
                                if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
                                  const categoryToDelete = category;
                                  setAudioCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
                                  if (selectedCategory?.id === categoryToDelete.id) {
                                    setSelectedCategory(null);
                                    setAudioItems([]);
                                  }
                                  deleteAudioCategory(categoryToDelete.id).catch(error => {
                                    console.error('Error deleting category:', error);
                                    setAudioCategories(prev => [...prev, categoryToDelete].sort((a, b) => a.name.localeCompare(b.name)));
                                    alert('Error deleting category. Please try again.');
                                  });
                                }
                              }}
                              sx={{ 
                                p: 0.5,
                                color: 'error.main',
                                '&:hover': { bgcolor: 'error.light' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

          {/* Unpublished Categories */}
          {!loadingCategories && audioCategories
            .filter(cat => {
              if (!categorySearchQuery) return !cat.isPublished;
              const query = categorySearchQuery.toLowerCase();
              return !cat.isPublished && (
                cat.name.toLowerCase().includes(query) || 
                (cat.description && cat.description.toLowerCase().includes(query))
              );
            })
            .length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="600" color="text.secondary">
                  Unpublished
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {audioCategories
                  .filter(category => {
                    if (!categorySearchQuery) return !category.isPublished;
                    const query = categorySearchQuery.toLowerCase();
                    return !category.isPublished && (
                      category.name.toLowerCase().includes(query) || 
                      (category.description && category.description.toLowerCase().includes(query))
                    );
                  })
                  .map((category) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: selectedCategory?.id === category.id 
                          ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.3) 0%, rgba(71, 85, 105, 0.3) 100%)'
                          : 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(71, 85, 105, 0.1) 100%)',
                        border: selectedCategory?.id === category.id ? '2px solid' : '1px solid',
                        borderColor: selectedCategory?.id === category.id 
                          ? 'grey.600' 
                          : 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(100, 116, 139, 0.2)',
                          background: selectedCategory?.id === category.id 
                            ? 'linear-gradient(135deg, rgba(100, 116, 139, 0.4) 0%, rgba(71, 85, 105, 0.4) 100%)'
                            : 'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(71, 85, 105, 0.15) 100%)',
                        }
                      }}
                      onClick={() => handleCategorySelect(category)}
                    >
                      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="600" 
                            sx={{ 
                              color: 'text.primary'
                            }}
                          >
                            {category.name}
                          </Typography>
                          <Chip
                            label={`${category.itemCount ?? 0} items`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        </Box>

                        {category.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 1.5,
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              flexGrow: 1
                            }}
                          >
                            {category.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip
                              label={category.isPublished ? 'Published' : 'Unpublished'}
                              color={category.isPublished ? 'primary' : 'default'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryTogglePublished(category);
                              }}
                              sx={{ 
                                cursor: 'pointer', 
                                height: 24,
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 1 }
                              }}
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
                              sx={{ 
                                cursor: 'pointer', 
                                height: 24,
                                fontSize: '0.7rem',
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryOpen(category);
                              }}
                              sx={{ 
                                p: 0.5,
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategoryItem(category);
                                if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
                                  const categoryToDelete = category;
                                  setAudioCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
                                  if (selectedCategory?.id === categoryToDelete.id) {
                                    setSelectedCategory(null);
                                    setAudioItems([]);
                                  }
                                  deleteAudioCategory(categoryToDelete.id).catch(error => {
                                    console.error('Error deleting category:', error);
                                    setAudioCategories(prev => [...prev, categoryToDelete].sort((a, b) => a.name.localeCompare(b.name)));
                                    alert('Error deleting category. Please try again.');
                                  });
                                }
                              }}
                              sx={{ 
                                p: 0.5,
                                color: 'error.main',
                                '&:hover': { bgcolor: 'error.light' }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
          )}

          {!loadingCategories && audioCategories.filter(cat => {
            if (!categorySearchQuery) return true;
            const query = categorySearchQuery.toLowerCase();
            return cat.name.toLowerCase().includes(query) || 
                   (cat.description && cat.description.toLowerCase().includes(query));
          }).length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {categorySearchQuery 
                  ? `No categories found matching "${categorySearchQuery}"`
                  : 'No categories found'
                }
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Audio Files Section */}
      {selectedCategory && (
        <Box>
          {/* Search Bar with View Toggle */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Search audio files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  onClick={() => setViewMode('card')}
                  color={viewMode === 'card' ? 'primary' : 'default'}
                  size="small"
                  title="Card View"
                >
                  <CardViewIcon />
                </IconButton>
                <IconButton
                  onClick={() => setViewMode('table')}
                  color={viewMode === 'table' ? 'primary' : 'default'}
                  size="small"
                  title="Table View"
                >
                  <TableViewIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Loading Skeleton for Audio Items */}
          {loadingAudioItems && (
            <Grid container spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card>
                    <CardContent>
                      <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} />
                      <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Filter items by search */}
          {!loadingAudioItems && (() => {
            const filteredItems = audioItems.filter(item => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return item.title?.toLowerCase().includes(query) || 
                     item.description?.toLowerCase().includes(query);
            });

            return filteredItems.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8, 
                px: 3,
                borderRadius: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'grey.50',
                border: '2px dashed',
                borderColor: 'divider',
                transition: 'background-color 0.3s ease'
              }}>
                <AudioIcon sx={{ 
                  fontSize: 64, 
                  color: 'text.disabled', 
                  mb: 2,
                  opacity: 0.5
                }} />
                <Typography 
                  variant="h6" 
                  color="text.primary" 
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  {audioItems.length === 0 
                    ? 'No audio files yet'
                    : `No audio files found matching "${searchQuery}"`
                  }
                </Typography>
                {audioItems.length === 0 && (
                  <>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
                    >
                      Get started by adding your first audio file to this category
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleAudioOpen()}
                      sx={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #16a34a 0%, #0284c7 50%, #7c3aed 100%)',
                        }
                      }}
                    >
                      Add Audio
                    </Button>
                  </>
                )}
              </Box>
            ) : viewMode === 'card' ? (
              <Grid container spacing={2}>
                {filteredItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="600" sx={{ flexGrow: 1 }}>
                          {item.title}
                        </Typography>
                        <IconButton
                          onClick={(e) => handleAudioMenuOpen(e, item)}
                          size="small"
                          sx={{ 
                            p: 0.5,
                            ml: 1,
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {item.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {item.description}
                        </Typography>
                      )}

                      {/* Audio files display with players */}
                      {item.audio && item.audio.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          {item.audio.map((audio, index) => {
                            const normalizedGender = normalizeGender(audio.gender);
                            const audioKey = getCardAudioKey(item.id, index);
                            const audioState = cardAudioStates[audioKey] || { playing: false, currentTime: 0, duration: 0, muted: false };
                            
                            return (
                              <Box key={index} sx={{ mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  {normalizedGender === 'male' ? (
                                    <MaleIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                  ) : (
                                    <FemaleIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                                  )}
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {normalizedGender.charAt(0).toUpperCase() + normalizedGender.slice(1)}
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
                                    gap: 0.75,
                                    p: 0.75,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                  }}
                                >
                                  {/* Play/Pause Button */}
                                  <IconButton
                                    onClick={() => handleCardAudioPlay(item.id, index, audio.audioUrl)}
                                    size="small"
                                    sx={{
                                      bgcolor: 'white',
                                      color: 'primary.main',
                                      width: 28,
                                      height: 28,
                                      p: 0,
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      '&:hover': {
                                        bgcolor: 'grey.100',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                      },
                                      '& svg': {
                                        fontSize: '1rem'
                                      }
                                    }}
                                  >
                                    {audioState.playing ? <PauseIcon /> : <PlayIcon />}
                                  </IconButton>

                                  {/* Time Display */}
                                  <Box
                                    component="span"
                                    sx={{
                                      minWidth: 70,
                                      fontFamily: 'monospace',
                                      color: 'text.secondary',
                                      fontSize: '0.7rem',
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0
                                    }}
                                  >
                                    {formatTime(audioState.currentTime || 0)} / {formatTime(audioState.duration || 0)}
                                  </Box>

                                  {/* Progress Bar */}
                                  <Slider
                                    value={audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}
                                    onChange={(e, newValue) => handleCardAudioProgressChange(item.id, index, newValue)}
                                    size="small"
                                    sx={{
                                      flexGrow: 1,
                                      color: 'primary.main',
                                      height: 3,
                                      cursor: 'pointer',
                                      '& .MuiSlider-thumb': {
                                        width: 0,
                                        height: 0,
                                        '&:hover': {
                                          width: 10,
                                          height: 10
                                        }
                                      },
                                      '& .MuiSlider-track': {
                                        height: 3,
                                        borderRadius: 1.5
                                      },
                                      '& .MuiSlider-rail': {
                                        height: 3,
                                        borderRadius: 1.5,
                                        bgcolor: 'grey.300',
                                        opacity: 1
                                      },
                                      '&:hover .MuiSlider-thumb': {
                                        width: 10,
                                        height: 10
                                      }
                                    }}
                                  />

                                  {/* Mute Button */}
                                  <IconButton
                                    onClick={() => handleCardAudioMuteToggle(item.id, index)}
                                    size="small"
                                    sx={{
                                      color: 'text.secondary',
                                      width: 24,
                                      height: 24,
                                      p: 0,
                                      '&:hover': {
                                        bgcolor: 'action.hover',
                                        color: 'text.primary'
                                      },
                                      '& svg': {
                                        fontSize: '0.875rem'
                                      }
                                    }}
                                  >
                                    {audioState.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                                  </IconButton>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 'auto', pt: 1 }}>
                        <Chip
                          label={item.isPublished ? 'Published' : 'Unpublished'}
                          color={item.isPublished ? 'primary' : 'default'}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAudioTogglePublished(item);
                          }}
                          sx={{ 
                            cursor: 'pointer',
                            height: 22,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 }
                          }}
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
                          sx={{ 
                            cursor: 'pointer',
                            height: 22,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            ) : (
              <AudioTableView
                items={filteredItems}
                onEdit={handleAudioOpen}
                onDelete={(item) => {
                  if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
                    setSelectedAudioItem(item);
                    handleAudioDelete();
                  }
                }}
                onTogglePublished={handleAudioTogglePublished}
                onTogglePremium={handleAudioTogglePremium}
              />
            );
          })()}

          {/* Back to Categories Button - Bottom Right */}
          <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
            <Button
              variant="contained"
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                setSelectedCategory(null);
                setAudioItems([]);
                setSearchQuery('');
              }}
              sx={{
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                }
              }}
            >
              Back to Categories
            </Button>
          </Box>
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
              
              {/* File size limit note */}
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Maximum file size: 200MB per file
              </Typography>

              {/* File size error messages */}
              {fileSizeErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
                    The following files exceed the 200MB limit and were not added:
                  </Typography>
                  {fileSizeErrors.map((error, index) => (
                    <Typography key={index} variant="body2" component="div">
                      • {error.name} ({error.sizeMB}MB)
                    </Typography>
                  ))}
                </Alert>
              )}

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

      {/* Upload Progress Modal */}
      <Backdrop
        open={uploading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1, // Higher than Dialog (modal z-index is 1300)
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <Paper
          sx={{
            p: 4,
            minWidth: 400,
            maxWidth: 600,
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Uploading Files...
          </Typography>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                },
              }}
            />
          </Box>

          {/* Progress Percentage */}
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            {uploadProgress}%
          </Typography>

          {/* File Size Info */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {formatFileSize(uploadedBytes)} / {formatFileSize(totalFileSize)}
          </Typography>

          {/* Upload Speed */}
          {uploadSpeed > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Speed: {formatFileSize(uploadSpeed)}/s
            </Typography>
          )}

          {/* Time Remaining */}
          {timeRemaining > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Estimated time remaining: {formatTime(timeRemaining)}
            </Typography>
          )}

          {/* Cancel Button */}
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={handleCancelUpload}
            sx={{ mt: 2 }}
          >
            Cancel Upload
          </Button>
        </Paper>
      </Backdrop>
    </Box>
  );
};

// Audio Table View Component
const AudioTableView = ({ items, onEdit, onDelete, onTogglePublished, onTogglePremium }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Audio Files</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography fontWeight="500">{item.title}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.description || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {item.audio?.length || 0} {item.audio?.length === 1 ? 'file' : 'files'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={item.isPublished ? 'Published' : 'Unpublished'}
                    color={item.isPublished ? 'primary' : 'default'}
                    size="small"
                    onClick={() => onTogglePublished(item)}
                    sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem' }}
                  />
                  <Chip
                    label="Premium"
                    color={item.isPremium ? 'secondary' : 'default'}
                    size="small"
                    variant={item.isPremium ? 'filled' : 'outlined'}
                    onClick={() => onTogglePremium(item)}
                    sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem' }}
                  />
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => onEdit(item)}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(item)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GuidedAudioManager;
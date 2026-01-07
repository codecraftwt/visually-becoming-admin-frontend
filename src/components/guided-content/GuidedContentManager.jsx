/**
 * Generic Guided Content Manager Component
 * 
 * This component works for any content type (audio, meditation, visualization, etc.)
 * It adapts its UI and behavior based on the contentType prop and contentTypeConfig.
 * 
 * Usage:
 *   <GuidedContentManager contentType="audio" />
 *   <GuidedContentManager contentType="meditation" />
 *   <GuidedContentManager contentType="visualization" />
 */

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
  Breadcrumbs,
  Link,
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
  Backdrop,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  Category as CategoryIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
  ArrowBack as ArrowBackIcon,
  ViewModule as CardViewIcon,
  ViewList as TableViewIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getContentByCategory,
  createContent,
  updateContent,
  deleteContent,
} from '../../services/guidedContentApi';
import { getContentTypeConfig } from '../../config/contentTypeConfig';
import GuidedMediaRenderer from './GuidedMediaRenderer';

// Maximum file size: 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes

const GuidedContentManager = ({ contentType }) => {
  // Validate contentType
  if (!contentType) {
    throw new Error('contentType prop is required');
  }

  const config = getContentTypeConfig(contentType);
  const Icon = config.icon;

  // State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [contentItems, setContentItems] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingContentItems, setLoadingContentItems] = useState(false);
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
  const [fileSizeErrors, setFileSizeErrors] = useState([]); // Track files that exceed size limit
  const [itemMenuAnchor, setItemMenuAnchor] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
  const [selectedCategoryItem, setSelectedCategoryItem] = useState(null);
  
  // View and search state
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // State for card media players
  const [cardMediaStates, setCardMediaStates] = useState({});
  const cardMediaRefs = useRef({});

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    categoryName: '',
    isPublished: true,
    isPremium: false,
    media: [],
    selectedFiles: [],
    genders: [],
    youtubeUrls: [],
  });

  // State for local file previews
  const [localFilePreviews, setLocalFilePreviews] = useState([]);
  const [localFileStates, setLocalFileStates] = useState({});
  const localFileRefs = useRef({});

  // State for existing media (when editing)
  const [existingMediaStates, setExistingMediaStates] = useState({});
  const existingMediaRefs = useRef({});
  const [deletedExistingMedia, setDeletedExistingMedia] = useState([]);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    isPublished: true,
    isPremium: false,
  });

  const fileInputRef = useRef(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [contentType]);

  // Load content items when category is selected
  useEffect(() => {
    if (selectedCategory) {
      loadContentItems(selectedCategory.id);
    }
  }, [selectedCategory, contentType]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await getCategories(contentType);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadContentItems = async (categoryId) => {
    try {
      setLoadingContentItems(true);
      const data = await getContentByCategory(contentType, categoryId);
      setContentItems(data);

      // Initialize media states for all items
      const newStates = {};
      data.forEach(item => {
        if (item.media && Array.isArray(item.media)) {
          item.media.forEach((media, index) => {
            const key = getCardMediaKey(item.id, index);
            newStates[key] = {
              playing: false,
              currentTime: 0,
              duration: 0,
              muted: false,
            };
          });
        }
      });
      setCardMediaStates(newStates);
    } catch (error) {
      console.error('Error loading content items:', error);
    } finally {
      setLoadingContentItems(false);
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
        isPremium: category.isPremium || false,
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        description: '',
        isPublished: true,
        isPremium: false,
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

    try {
      if (editingCategory) {
        await updateCategory(contentType, editingCategory.id, categoryFormData);
      } else {
        await createCategory(contentType, categoryFormData);
      }
      await loadCategories();
      handleCategoryClose();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    }
  };

  const handleCategoryDelete = async () => {
    if (!selectedCategoryItem) return;

    if (window.confirm(`Are you sure you want to delete "${selectedCategoryItem.name}"?`)) {
      try {
        await deleteCategory(contentType, selectedCategoryItem.id);
        await loadCategories();
        if (selectedCategory?.id === selectedCategoryItem.id) {
          setSelectedCategory(null);
          setContentItems([]);
        }
        handleCategoryMenuClose();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const handleCategoryTogglePublished = async (category) => {
    try {
      await updateCategory(contentType, category.id, {
        isPublished: !category.isPublished,
      });
      await loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };

  const handleCategoryTogglePremium = async (category) => {
    try {
      await updateCategory(contentType, category.id, {
        isPremium: !category.isPremium,
      });
      await loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category. Please try again.');
    }
  };

  // Content Item Management
  const handleItemOpen = async (item = null) => {
    await loadCategories();

    if (item) {
      setEditingItem(item);
      const existingMedia = item.media || [];
      const existingGenders = existingMedia.map(mediaItem => {
        const gender = mediaItem.gender;
        if (gender === 'm' || gender === 'male') return 'male';
        if (gender === 'f' || gender === 'female') return 'female';
        return 'male';
      });

      const newStates = {};
      existingMedia.forEach((mediaItem, index) => {
        newStates[index] = {
          playing: false,
          currentTime: 0,
          duration: 0,
          muted: false,
        };
      });
      setExistingMediaStates(newStates);
      setDeletedExistingMedia([]);

      setFormData({
        title: item.title || '',
        description: item.description || '',
        categoryId: item.categoryId || selectedCategory?.id || '',
        categoryName: item.categoryName || selectedCategory?.name || '',
        isPublished: item.isPublished !== false,
        isPremium: item.isPremium || false,
        media: existingMedia,
        selectedFiles: [],
        genders: existingGenders,
        youtubeUrls: [],
      });
    } else {
      setEditingItem(null);
      setExistingMediaStates({});
      setDeletedExistingMedia([]);
      setFormData({
        title: '',
        description: '',
        categoryId: selectedCategory?.id || '',
        categoryName: selectedCategory?.name || '',
        isPublished: true,
        isPremium: false,
        media: [],
        selectedFiles: [],
        genders: [],
        youtubeUrls: [],
      });
    }
    setOpen(true);
  };

  const handleItemClose = () => {
    // Stop all audio playback
    Object.keys(localFileStates).forEach(id => {
      const audioElement = localFileRefs.current[id];
      if (audioElement) audioElement.pause();
    });

    Object.keys(existingMediaStates).forEach(index => {
      const audioElement = existingMediaRefs.current[index];
      if (audioElement) audioElement.pause();
    });

    // Cleanup preview URLs
    localFilePreviews.forEach(preview => {
      if (preview.previewUrl) {
        URL.revokeObjectURL(preview.previewUrl);
      }
    });

    setLocalFilePreviews([]);
    setLocalFileStates({});
    setExistingMediaStates({});
    setDeletedExistingMedia([]);
    setOpen(false);
    setEditingItem(null);
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

  const handleItemSubmit = async (e) => {
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
        submitData.append('isPublished', formData.isPublished);
        submitData.append('isPremium', formData.isPremium);

        const existingMedia = formData.media || [];
        const genders = formData.genders || [];

        existingMedia.forEach((mediaItem, index) => {
          if (!deletedExistingMedia.includes(index)) {
            const updatedGender = genders[index] || mediaItem.gender || 'male';
            submitData.append('existingMedia', JSON.stringify({
              ...mediaItem,
              gender: updatedGender === 'male' ? 'm' : 'f',
            }));
          }
        });

        if (deletedExistingMedia.length > 0) {
          submitData.append('deletedMediaIndices', JSON.stringify(deletedExistingMedia));
        }

        if (config.supportsYouTube && formData.youtubeUrls && formData.youtubeUrls.length > 0) {
          formData.youtubeUrls.forEach(url => {
            if (url) submitData.append('youtubeUrls', url);
          });
        }

        if (editingItem) {
          await updateContent(contentType, editingItem.id, submitData);
        } else {
          await createContent(contentType, submitData);
        }

        await loadContentItems(selectedCategory.id);
        handleItemClose();
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Error saving content item:', error);
          alert('Error saving content item. Please try again.');
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
      submitData.append('isPublished', formData.isPublished);
      submitData.append('isPremium', formData.isPremium);

      // Handle existing media
      const existingMedia = formData.media || [];
      const genders = formData.genders || [];

      existingMedia.forEach((mediaItem, index) => {
        if (!deletedExistingMedia.includes(index)) {
          const updatedGender = genders[index] || mediaItem.gender || 'male';
          submitData.append('existingMedia', JSON.stringify({
            ...mediaItem,
            gender: updatedGender === 'male' ? 'm' : 'f',
          }));
        }
      });

      if (deletedExistingMedia.length > 0) {
        submitData.append('deletedMediaIndices', JSON.stringify(deletedExistingMedia));
      }

      // Handle new file uploads
      const existingMediaCount = existingMedia.length;
      activePreviews.forEach((preview, index) => {
        submitData.append('mediaFiles', preview.file);
        if (config.supportsGender) {
          submitData.append('genders', preview.gender === 'male' ? 'm' : 'f');
        }
      });

      // Handle YouTube URLs
      if (config.supportsYouTube && formData.youtubeUrls && formData.youtubeUrls.length > 0) {
        formData.youtubeUrls.forEach(url => {
          if (url) submitData.append('youtubeUrls', url);
        });
      }

      if (editingItem) {
        await updateContent(contentType, editingItem.id, submitData, onUploadProgress, abortController.signal);
        // Set to 100% when upload completes
        setUploadProgress(100);
      } else {
        await createContent(contentType, submitData, onUploadProgress, abortController.signal);
        // Set to 100% when upload completes
        setUploadProgress(100);
      }

      // Small delay to show 100% before closing
      setTimeout(() => {
        loadContentItems(selectedCategory.id).then(() => {
          handleItemClose();
        });
      }, 300);
    } catch (error) {
      if (error.name !== 'CanceledError' && !axios.isCancel(error)) {
        console.error('Error saving content item:', error);
        alert('Error saving content item. Please try again.');
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

  const handleItemDelete = async () => {
    if (!selectedItem) return;

    if (window.confirm(`Are you sure you want to delete "${selectedItem.title}"?`)) {
      try {
        await deleteContent(contentType, selectedItem.id);
        await loadContentItems(selectedCategory.id);
        handleItemMenuClose();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
      }
    }
  };

  const handleItemTogglePublished = async (item) => {
    try {
      await updateContent(contentType, item.id, {
        isPublished: !item.isPublished,
      });
      await loadContentItems(selectedCategory.id);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item. Please try again.');
    }
  };

  const handleItemTogglePremium = async (item) => {
    try {
      await updateContent(contentType, item.id, {
        isPremium: !item.isPremium,
      });
      await loadContentItems(selectedCategory.id);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item. Please try again.');
    }
  };

  // Helper functions
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // File handling
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
              gender: 'male',
              status: 'active',
              size: file.size,
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
              size: file.size,
            });
          });
        });
      })
    );

    const newStates = { ...localFileStates };
    newPreviews.forEach(preview => {
      newStates[preview.id] = {
        playing: false,
        currentTime: 0,
        duration: preview.duration,
        muted: false,
      };
    });

    setLocalFilePreviews(prev => [...prev, ...newPreviews]);
    setLocalFileStates(newStates);

    setFormData(prev => ({
      ...prev,
      selectedFiles: [...(prev.selectedFiles || []), ...validFiles],
      genders: [
        ...(prev.genders || []).slice(0, prev.media?.length || 0),
        ...newPreviews.map(() => 'male'),
      ],
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Local file management handlers
  const handleLocalFileDelete = (previewId) => {
    setLocalFilePreviews(prev => 
      prev.map(preview => 
        preview.id === previewId 
          ? { ...preview, status: 'deleted' }
          : preview
      )
    );
    
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

    setFormData(prev => {
      const previewIndex = localFilePreviews.findIndex(p => p.id === previewId);
      if (previewIndex === -1) return prev;
      
      const existingMediaCount = prev.media?.length || 0;
      const adjustedIndex = existingMediaCount + previewIndex;
      const newGenders = [...(prev.genders || [])];
      newGenders[adjustedIndex] = gender;
      
      return {
        ...prev,
        genders: newGenders
      };
    });
  };

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

  // Existing media handlers
  const handleGenderChange = (index, gender) => {
    const newGenders = [...(formData.genders || [])];
    newGenders[index] = gender;
    setFormData(prev => ({
      ...prev,
      genders: newGenders
    }));
  };

  const handleExistingMediaDelete = (index) => {
    const audioElement = existingMediaRefs.current[index];
    if (audioElement) {
      audioElement.pause();
      setExistingMediaStates(prev => ({
        ...prev,
        [index]: { ...prev[index], playing: false, currentTime: 0 }
      }));
    }
    setDeletedExistingMedia(prev => [...prev, index]);
  };

  const handleExistingMediaRestore = (index) => {
    setDeletedExistingMedia(prev => prev.filter(i => i !== index));
  };

  const handleExistingMediaPlay = (index) => {
    const audioElement = existingMediaRefs.current[index];
    if (audioElement) {
      // Pause all other existing audios
      Object.keys(existingMediaStates).forEach(i => {
        if (i !== index.toString() && existingMediaStates[i]?.playing) {
          const otherAudio = existingMediaRefs.current[i];
          if (otherAudio) {
            otherAudio.pause();
            setExistingMediaStates(prev => ({
              ...prev,
              [i]: { ...prev[i], playing: false }
            }));
          }
        }
      });

      if (existingMediaStates[index]?.playing) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
    }
  };

  // Menu handlers
  const handleItemMenuOpen = (event, item) => {
    event.stopPropagation();
    setItemMenuAnchor(event.currentTarget);
    setSelectedItem(item);
  };

  const handleItemMenuClose = () => {
    setItemMenuAnchor(null);
    setSelectedItem(null);
  };

  const handleCategoryMenuOpen = (event, category) => {
    event.stopPropagation();
    setCategoryMenuAnchor(event.currentTarget);
    setSelectedCategoryItem(category);
  };

  const handleCategoryMenuClose = () => {
    setCategoryMenuAnchor(null);
    setSelectedCategoryItem(null);
  };

  // Helper functions
  const getCardMediaKey = (itemId, mediaIndex) => `${itemId}-${mediaIndex}`;

  const normalizeGender = (gender) => {
    if (gender === 'm') return 'male';
    if (gender === 'f') return 'female';
    return gender;
  };

  // Render categories section
  const renderCategories = () => {
    // Filter categories by search query
    const filteredCategories = categories.filter(cat => {
      if (!categorySearchQuery) return true;
      const query = categorySearchQuery.toLowerCase();
      return cat.name.toLowerCase().includes(query) || 
             (cat.description && cat.description.toLowerCase().includes(query));
    });

    const publishedCategories = filteredCategories.filter(cat => cat.isPublished);
    const unpublishedCategories = filteredCategories.filter(cat => !cat.isPublished);

    return (
      <Box sx={{ mb: 6 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder={`Search ${config.categoryLabel.toLowerCase()}...`}
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
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

        {!loadingCategories && publishedCategories.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="600" color="primary" sx={{ mb: 2 }}>
              Published
            </Typography>
            <Grid container spacing={2}>
              {publishedCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                  <CategoryCard
                    category={category}
                    selected={selectedCategory?.id === category.id}
                    onSelect={() => setSelectedCategory(category)}
                    onEdit={() => handleCategoryOpen(category)}
                    onDelete={() => {
                      setSelectedCategoryItem(category);
                      handleCategoryDelete();
                    }}
                    onTogglePublished={() => handleCategoryTogglePublished(category)}
                    onTogglePremium={() => handleCategoryTogglePremium(category)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {!loadingCategories && unpublishedCategories.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight="600" color="text.secondary" sx={{ mb: 2 }}>
              Unpublished
            </Typography>
            <Grid container spacing={2}>
              {unpublishedCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                  <CategoryCard
                    category={category}
                    selected={selectedCategory?.id === category.id}
                    onSelect={() => setSelectedCategory(category)}
                    onEdit={() => handleCategoryOpen(category)}
                    onDelete={() => {
                      setSelectedCategoryItem(category);
                      handleCategoryDelete();
                    }}
                    onTogglePublished={() => handleCategoryTogglePublished(category)}
                    onTogglePremium={() => handleCategoryTogglePremium(category)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {!loadingCategories && filteredCategories.length === 0 && (
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
    );
  };

  // Render content items section
  const renderContentItems = () => {
    if (!selectedCategory) return null;

    // Filter items by search query
    const filteredItems = contentItems.filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return item.title?.toLowerCase().includes(query) || 
             item.description?.toLowerCase().includes(query);
    });

    return (
      <Box>
        {/* Search Bar with View Toggle */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              placeholder={`Search ${config.itemLabel.toLowerCase()}...`}
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

        {/* Loading Skeleton for Content Items */}
        {loadingContentItems && (
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

        {!loadingContentItems && filteredItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 3, borderRadius: 2, bgcolor: 'grey.50', border: '2px dashed', borderColor: 'divider' }}>
            <Icon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 500 }}>
              {contentItems.length === 0 
                ? `No ${config.itemLabel.toLowerCase()} yet`
                : `No ${config.itemLabel.toLowerCase()} found matching "${searchQuery}"`
              }
            </Typography>
            {contentItems.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleItemOpen()}
                sx={{ mt: 3 }}
              >
                {config.addItemLabel}
              </Button>
            )}
          </Box>
        ) : viewMode === 'card' ? (
          <Grid container spacing={2}>
            {filteredItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <ContentCard
                  item={item}
                  contentType={contentType}
                  config={config}
                  onEdit={() => handleItemOpen(item)}
                  onDelete={() => {
                    setSelectedItem(item);
                    handleItemDelete();
                  }}
                  onTogglePublished={() => handleItemTogglePublished(item)}
                  onTogglePremium={() => handleItemTogglePremium(item)}
                  cardMediaStates={cardMediaStates}
                  cardMediaRefs={cardMediaRefs}
                  getCardMediaKey={getCardMediaKey}
                  setCardMediaStates={setCardMediaStates}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <ContentTableView
            items={filteredItems}
            contentType={contentType}
            config={config}
            onEdit={handleItemOpen}
            onDelete={(item) => {
              if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
                setSelectedItem(item);
                handleItemDelete();
              }
            }}
            onTogglePublished={handleItemTogglePublished}
            onTogglePremium={handleItemTogglePremium}
          />
        )}

        {/* Back to Categories Button - Bottom Right */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              setSelectedCategory(null);
              setContentItems([]);
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
    );
  };

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
                setContentItems([]);
              }}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <CategoryIcon sx={{ mr: 0.5 }} fontSize="small" />
              {config.categoryLabel}
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <Icon sx={{ mr: 0.5 }} fontSize="small" />
              {selectedCategory.name}
            </Typography>
          </Breadcrumbs>
        ) : (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              {config.categoryLabel}
            </Typography>
          </Breadcrumbs>
        )}

        <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CategoryIcon />}
            onClick={() => handleCategoryOpen()}
          >
            {config.addCategoryLabel}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon />}
            onClick={() => handleItemOpen()}
          >
            {config.addItemLabel}
          </Button>
        </Box>
      </Box>

      {/* Categories Section - Only show when no category is selected */}
      {!selectedCategory && renderCategories()}

      {/* Content Items Section - Only show when category is selected */}
      {selectedCategory && renderContentItems()}

      {/* Category Dialog */}
      <Dialog open={categoryOpen} onClose={handleCategoryClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)', color: 'white', fontWeight: 600 }}>
          {editingCategory ? config.editCategoryLabel : config.addCategoryLabel}
        </DialogTitle>
        <form onSubmit={handleCategorySubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Category Name"
              fullWidth
              variant="outlined"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={categoryFormData.description}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={categoryFormData.isPublished}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                  color="primary"
                />
              }
              label="Published"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={categoryFormData.isPremium}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, isPremium: e.target.checked }))}
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

      {/* Content Item Dialog - Simplified version, can be expanded */}
      <Dialog open={open} onClose={handleItemClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 50%, #8b5cf6 100%)', color: 'white', fontWeight: 600 }}>
          {editingItem ? config.editItemLabel : config.addItemLabel}
        </DialogTitle>
        <form onSubmit={handleItemSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.categoryId}
                onChange={(e) => {
                  const selectedCat = categories.find(cat => cat.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    categoryId: e.target.value,
                    categoryName: selectedCat ? selectedCat.name : '',
                  }));
                }}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Media Upload Section */}
            <Box sx={{ mb: 2 }}>
              {/* File Upload Button */}
              <input
                type="file"
                multiple
                accept={config.uploadAccept}
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
                {config.uploadLabel}
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

              {/* YouTube URL Input (for visualization type) */}
              {config.supportsYouTube && (
                <TextField
                  margin="dense"
                  label="YouTube URL (optional)"
                  type="url"
                  fullWidth
                  variant="outlined"
                  value={formData.youtubeUrls?.[0] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    youtubeUrls: e.target.value ? [e.target.value] : []
                  }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  sx={{ mb: 2 }}
                />
              )}

              {/* Existing Media Files (when editing) */}
              {editingItem && formData.media && formData.media.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, color: 'text.secondary' }}>
                    Existing Media Files
                  </Typography>
                  {formData.media.map((mediaItem, index) => {
                    if (mediaItem.type === 'youtube') {
                      // YouTube media
                      return (
                        <Card key={`existing-youtube-${index}`} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" fontWeight="600">YouTube Video</Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleExistingMediaDelete(index)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                              {mediaItem.url}
                            </Typography>
                          </CardContent>
                        </Card>
                      );
                    }

                    // Audio media
                    const normalizedGender = normalizeGender(mediaItem.gender);
                    const isDeleted = deletedExistingMedia.includes(index);
                    const audioState = existingMediaStates[index] || { playing: false, currentTime: 0, duration: 0, muted: false };
                    const audioUrl = mediaItem.url;
                    
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
                            {!isDeleted && config.supportsGender && (
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
                                  onClick={() => handleExistingMediaRestore(index)}
                                  color="success"
                                >
                                  <RestoreIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <IconButton
                                  size="small"
                                  onClick={() => handleExistingMediaDelete(index)}
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
                                  if (el) existingMediaRefs.current[index] = el;
                                }}
                                src={audioUrl}
                                onPlay={() => {
                                  Object.keys(existingMediaStates).forEach(i => {
                                    if (i !== index.toString() && existingMediaStates[i]?.playing) {
                                      const otherAudio = existingMediaRefs.current[i];
                                      if (otherAudio) {
                                        otherAudio.pause();
                                        setExistingMediaStates(prev => ({
                                          ...prev,
                                          [i]: { ...prev[i], playing: false }
                                        }));
                                      }
                                    }
                                  });
                                  setExistingMediaStates(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], playing: true }
                                  }));
                                }}
                                onPause={() => {
                                  setExistingMediaStates(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], playing: false }
                                  }));
                                }}
                                onEnded={() => {
                                  setExistingMediaStates(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], playing: false, currentTime: 0 }
                                  }));
                                }}
                                onTimeUpdate={() => {
                                  const audioElement = existingMediaRefs.current[index];
                                  if (audioElement) {
                                    setExistingMediaStates(prev => ({
                                      ...prev,
                                      [index]: {
                                        ...prev[index],
                                        currentTime: audioElement.currentTime
                                      }
                                    }));
                                  }
                                }}
                                onLoadedMetadata={() => {
                                  const audioElement = existingMediaRefs.current[index];
                                  if (audioElement) {
                                    setExistingMediaStates(prev => ({
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
                                <IconButton
                                  onClick={() => handleExistingMediaPlay(index)}
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

                                <Slider
                                  value={audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}
                                  onChange={(e, newValue) => {
                                    const audioElement = existingMediaRefs.current[index];
                                    if (audioElement && audioState.duration) {
                                      const newTime = (newValue / 100) * audioState.duration;
                                      audioElement.currentTime = newTime;
                                      setExistingMediaStates(prev => ({
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

                                <IconButton
                                  onClick={() => {
                                    const audioElement = existingMediaRefs.current[index];
                                    if (audioElement) {
                                      audioElement.muted = !audioState.muted;
                                      setExistingMediaStates(prev => ({
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
                          {!isDeleted && config.supportsGender && (
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

            <Box sx={{ display: 'flex', gap: 6, mt: 3, mb: 1, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublished}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Published"
                labelPlacement="start"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPremium}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPremium: e.target.checked }))}
                    color="secondary"
                  />
                }
                label="Premium"
                labelPlacement="start"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={handleItemClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={uploading}>
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

// Category Card Component
const CategoryCard = ({ category, selected, onSelect, onEdit, onDelete, onTogglePublished, onTogglePremium }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: selected
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(14, 165, 233, 0.4) 50%, rgba(139, 92, 246, 0.4) 100%)'
        : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(14, 165, 233, 0.1) 50%, rgba(139, 92, 246, 0.1) 100%)',
      border: selected ? '2px solid' : '1px solid',
      borderColor: selected ? 'primary.main' : 'divider',
      borderRadius: 2,
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(34, 197, 94, 0.2)',
      },
    }}
    onClick={onSelect}
  >
    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight="600">
          {category.name}
        </Typography>
        {category.itemCount !== undefined && (
          <Chip
            label={`${category.itemCount} items`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 20, fontSize: '0.65rem' }}
          />
        )}
      </Box>
      {category.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
              onTogglePublished();
            }}
            sx={{ cursor: 'pointer', height: 24, fontSize: '0.7rem' }}
          />
          <Chip
            label="Premium"
            color={category.isPremium ? 'secondary' : 'default'}
            size="small"
            variant={category.isPremium ? 'filled' : 'outlined'}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePremium();
            }}
            sx={{ cursor: 'pointer', height: 24, fontSize: '0.7rem' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            sx={{ p: 0.5, color: 'text.secondary' }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{ p: 0.5, color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Content Card Component
const ContentCard = ({ item, contentType, config, onEdit, onDelete, onTogglePublished, onTogglePremium, cardMediaStates, cardMediaRefs, getCardMediaKey, setCardMediaStates }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', border: '1px solid', borderColor: 'divider', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="600" sx={{ flexGrow: 1 }}>
          {item.title}
        </Typography>
        <IconButton onClick={(e) => onEdit()} size="small" sx={{ p: 0.5, ml: 1, color: 'text.secondary' }}>
          <MoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {item.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.description}
        </Typography>
      )}

      {/* Media Renderer */}
      {item.media && item.media.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          {item.media.map((media, index) => {
            const mediaKey = getCardMediaKey(item.id, index);
            const mediaState = cardMediaStates[mediaKey] || { playing: false, currentTime: 0, duration: 0, muted: false };
            return (
              <Box key={index} sx={{ mb: 1 }}>
                <GuidedMediaRenderer
                  media={media}
                  contentType={contentType}
                  config={config}
                  isPlaying={mediaState.playing}
                  currentTime={mediaState.currentTime}
                  duration={mediaState.duration}
                  muted={mediaState.muted}
                  onTimeUpdate={(time) => {
                    setCardMediaStates(prev => ({
                      ...prev,
                      [mediaKey]: { ...prev[mediaKey], currentTime: time }
                    }));
                  }}
                  onMuteToggle={() => {
                    setCardMediaStates(prev => ({
                      ...prev,
                      [mediaKey]: { ...prev[mediaKey], muted: !prev[mediaKey]?.muted }
                    }));
                  }}
                  onProgressChange={(time) => {
                    setCardMediaStates(prev => ({
                      ...prev,
                      [mediaKey]: { ...prev[mediaKey], currentTime: time }
                    }));
                  }}
                />
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
            onTogglePublished();
          }}
          sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem' }}
        />
        <Chip
          label="Premium"
          color={item.isPremium ? 'secondary' : 'default'}
          size="small"
          variant={item.isPremium ? 'filled' : 'outlined'}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePremium();
          }}
          sx={{ cursor: 'pointer', height: 22, fontSize: '0.7rem' }}
        />
      </Box>
    </CardContent>
  </Card>
);

// Content Table View Component
const ContentTableView = ({ items, contentType, config, onEdit, onDelete, onTogglePublished, onTogglePremium }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Media</TableCell>
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
                  {item.media?.length || 0} {item.media?.length === 1 ? 'file' : 'files'}
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

export default GuidedContentManager;

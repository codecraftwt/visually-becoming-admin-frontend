/**
 * Frontend Content Type Configuration
 * 
 * This configuration drives the UI behavior for different content types.
 * To add a new content type, simply add an entry here!
 */

import {
  Audiotrack as AudioIcon,
  SelfImprovement as MeditationIcon,
  Visibility as VisualizationIcon,
} from '@mui/icons-material';

export const CONTENT_TYPE_CONFIG = {
  audio: {
    label: 'Guided Audio',
    icon: AudioIcon,
    supportsGender: true,
    mediaRenderer: 'AudioPlayer',
    uploadAccept: 'audio/*',
    uploadLabel: 'Select Audio Files',
    categoryLabel: 'Audio Categories',
    itemLabel: 'Audio Files',
    addItemLabel: 'Add Audio',
    editItemLabel: 'Edit Audio',
    addCategoryLabel: 'Add Audio Category',
    editCategoryLabel: 'Edit Audio Category',
  },
  meditation: {
    label: 'Guided Meditation',
    icon: MeditationIcon,
    supportsGender: true,
    mediaRenderer: 'AudioPlayer',
    uploadAccept: 'audio/*',
    uploadLabel: 'Select Audio Files',
    categoryLabel: 'Meditation Categories',
    itemLabel: 'Meditation Files',
    addItemLabel: 'Add Meditation',
    editItemLabel: 'Edit Meditation',
    addCategoryLabel: 'Add Meditation Category',
    editCategoryLabel: 'Edit Meditation Category',
  },
  visualization: {
    label: 'Guided Visualization',
    icon: VisualizationIcon,
    supportsGender: true,
    mediaRenderer: 'MixedMedia', // Supports YouTube + Audio
    uploadAccept: 'audio/*',
    uploadLabel: 'Select Audio Files',
    categoryLabel: 'Visualization Categories',
    itemLabel: 'Visualizations',
    addItemLabel: 'Add Visualization',
    editItemLabel: 'Edit Visualization',
    addCategoryLabel: 'Add Visualization Category',
    editCategoryLabel: 'Edit Visualization Category',
    supportsYouTube: true,
  },
};

/**
 * Get configuration for a content type
 * @param {string} contentType - The content type
 * @returns {object} Configuration object
 */
export const getContentTypeConfig = (contentType) => {
  const config = CONTENT_TYPE_CONFIG[contentType];
  if (!config) {
    throw new Error(`Invalid content type: ${contentType}. Valid types: ${Object.keys(CONTENT_TYPE_CONFIG).join(', ')}`);
  }
  return config;
};

/**
 * Check if content type is valid
 * @param {string} contentType - The content type to validate
 * @returns {boolean}
 */
export const isValidContentType = (contentType) => {
  return contentType in CONTENT_TYPE_CONFIG;
};

/**
 * Get all valid content types
 * @returns {string[]}
 */
export const getValidContentTypes = () => {
  return Object.keys(CONTENT_TYPE_CONFIG);
};

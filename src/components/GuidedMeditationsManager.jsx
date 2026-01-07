/**
 * Guided Meditations Manager
 * 
 * This component uses the generic GuidedContentManager with contentType="meditation"
 * This provides the same UI and functionality as Guided Audio, but for meditations.
 * 
 * Features:
 * - Category management (same as audio)
 * - Audio file uploads (same as audio)
 * - Gender selection (same as audio)
 * - Same add/edit forms as audio
 * - Fully reusable code
 */

import React from 'react';
import GuidedContentManager from './guided-content/GuidedContentManager';

const GuidedMeditationsManager = ({ categories, onDataUpdate }) => {
  // This component is now just a wrapper that uses the generic component
  // All the UI, categories, file uploads, etc. are handled by GuidedContentManager
  return <GuidedContentManager contentType="meditation" />;
};

export default GuidedMeditationsManager;

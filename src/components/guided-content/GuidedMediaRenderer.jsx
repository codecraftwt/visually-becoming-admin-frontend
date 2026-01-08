import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  VideoLibrary as YouTubeIcon
} from '@mui/icons-material';

/**
 * Format time in seconds to MM:SS
 */
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Extract YouTube video ID from URL
 */
const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

/**
 * Audio Player Component
 */
const AudioPlayer = ({ media, onPlay, onPause, isPlaying, currentTime, duration, muted, onTimeUpdate, onMuteToggle, onProgressChange, audioRefCallback, onLoadedMetadata }) => {
  const audioRef = useRef(null);

  // Call the callback to pass the ref to parent
  // Store callback in ref to avoid dependency issues
  const callbackRef = useRef(audioRefCallback);
  useEffect(() => {
    callbackRef.current = audioRefCallback;
  });

  // Only call callback when audio element is ready, and only once
  useEffect(() => {
    if (audioRef.current && callbackRef.current) {
      callbackRef.current(audioRef);
    }
  }, []); // Empty deps - only run once on mount

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (onTimeUpdate) onTimeUpdate(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (onLoadedMetadata) {
        onLoadedMetadata();
      }
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate, onLoadedMetadata]);

  return (
    <Box>
      <audio
        ref={audioRef}
        src={media.url}
        onPlay={() => onPlay && onPlay()}
        onPause={() => onPause && onPause()}
        muted={muted}
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
        <IconButton
          onClick={() => {
            const audio = audioRef.current;
            if (audio) {
              if (isPlaying) {
                audio.pause();
              } else {
                audio.play();
              }
            }
          }}
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
            }
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>

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
          {formatTime(currentTime || 0)} / {formatTime(duration || 0)}
        </Box>

        <Slider
          value={duration > 0 ? (currentTime / duration) * 100 : 0}
          onChange={(e, newValue) => {
            if (onProgressChange) {
              const audio = audioRef.current;
              if (audio && duration) {
                const newTime = (newValue / 100) * duration;
                audio.currentTime = newTime;
                onProgressChange(newTime);
              }
            }
          }}
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

        <IconButton
          onClick={onMuteToggle}
          size="small"
          sx={{
            color: 'text.secondary',
            width: 24,
            height: 24,
            p: 0,
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'text.primary'
            }
          }}
        >
          {muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
      </Box>
    </Box>
  );
};

/**
 * YouTube Player Component
 */
const YouTubePlayer = ({ media }) => {
  const videoId = media.videoId || extractYouTubeId(media.url);
  
  if (!videoId) {
    return (
      <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
        <Typography variant="body2" color="error">
          Invalid YouTube URL
        </Typography>
      </Box>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <Box
      sx={{
        position: 'relative',
        paddingBottom: '56.25%', // 16:9 aspect ratio
        height: 0,
        overflow: 'hidden',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <iframe
        src={embedUrl}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 0
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={`YouTube video ${videoId}`}
      />
    </Box>
  );
};

/**
 * Main Media Renderer Component
 * Renders appropriate player based on media type
 */
const GuidedMediaRenderer = ({ media, contentType, config, onPlay, onPause, isPlaying, currentTime, duration, muted, onTimeUpdate, onMuteToggle, onProgressChange, audioRefCallback, onLoadedMetadata }) => {
  const normalizeGender = (gender) => {
    if (gender === 'm') return 'male';
    if (gender === 'f') return 'female';
    return gender;
  };

  if (media.type === 'youtube') {
    return (
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <YouTubeIcon sx={{ fontSize: 14, color: 'error.main' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            YouTube Video
          </Typography>
        </Box>
        <YouTubePlayer media={media} />
      </Box>
    );
  }

  if (media.type === 'audio') {
    const normalizedGender = normalizeGender(media.gender);
    const showGender = config?.supportsGender && media.gender;

    return (
      <Box sx={{ mb: 1 }}>
        {showGender && (
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
        )}
        <AudioPlayer
          media={media}
          onPlay={onPlay}
          onPause={onPause}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          muted={muted}
          onTimeUpdate={onTimeUpdate}
          onMuteToggle={onMuteToggle}
          onProgressChange={onProgressChange}
          audioRefCallback={audioRefCallback}
          onLoadedMetadata={onLoadedMetadata}
        />
      </Box>
    );
  }

  return null;
};

export default GuidedMediaRenderer;

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Link,
  CircularProgress,
  useTheme,
  AppBar,
  Toolbar,
  Switch,
  FormGroup
} from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import logo from '../assets/vblogo.png';

const LoginPage = (props) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (formData.email !== "vbadmun@gmail.com" || formData.password !== "123456") {
        setErrors({ submit: 'Login failed. Please try again.' });
        return;
      }
      props.onLogin();
    } catch (error) {
      setErrors({ submit: 'Login failed. Please try again.' });
      console.log("printing err",error)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.gradient?.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          background: theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.palette.mode === 'light' ? '#f1f5f9' : '#27272a'}`,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src={logo}
              alt="VB Logo"
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${theme.palette.primary.main}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                mb: 2
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                background: theme.palette.gradient?.primary,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Mindful Moments
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
            >
              Welcome back! Please sign in to your account.
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              placeholder="Enter your email"
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              placeholder="Enter your password"
              sx={{ mb: 1 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    sx={{
                      color: theme.palette.primary.main,
                      '&.Mui-checked': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  />
                }
                label="Remember me"
                sx={{ color: 'text.secondary' }}
              />
              <Link 
                href="#" 
                variant="body2"
                sx={{ 
                  textDecoration: 'none',
                  color: 'primary.main',
                  '&:hover': {
                    color: 'primary.dark'
                  }
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {errors.submit && (
              <Typography
                color="error"
                variant="body2"
                sx={{
                  textAlign: 'center',
                  mb: 2,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: 'error.light',
                  color: 'error.dark'
                }}
              >
                {errors.submit}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'uppercase',
                fontWeight: 500,
                fontSize: '0.875rem',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                },
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Signing in...
                </Box>
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link 
                href="#" 
                sx={{ 
                  textDecoration: 'none',
                  color: 'primary.main',
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.dark'
                  }
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>

          {/* Theme Toggle */}
          <FormGroup sx={{ textAlign: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={theme.palette.mode === 'dark'}
                  onChange={props.toggleTheme}
                  icon={<LightMode sx={{ fontSize: 16 }} />}
                  checkedIcon={<DarkMode sx={{ fontSize: 16 }} />}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  {theme.palette.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Typography>
              }
            />
          </FormGroup>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      const settingsData = response.data.settings;
      setSettings(settingsData);
      
      // Apply colors to CSS variables
      if (settingsData.colors) {
        applyColors(settingsData.colors);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Set default settings
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (colors) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for Tailwind compatibility
    const hexToHSL = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '0 0% 0%';
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
          default: h = 0;
        }
      }
      
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      
      return `${h} ${s}% ${l}%`;
    };
    
    // Apply primary color (used for pink-600, pink-700, etc.)
    if (colors.primary) {
      root.style.setProperty('--color-primary', colors.primary);
      // For Tailwind custom colors
      root.style.setProperty('--color-pink-600', colors.primary);
      // Darker shade for hover
      const primaryHSL = hexToHSL(colors.primary);
      root.style.setProperty('--color-pink-700', adjustBrightness(colors.primary, -10));
    }
    
    // Apply secondary color
    if (colors.secondary) {
      root.style.setProperty('--color-secondary', colors.secondary);
    }
  };

  const adjustBrightness = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  };

  const getDefaultSettings = () => ({
    siteName: 'En Ucuza Kargo',
    logo: '',
    tagline: 'Kargo yönetiminde yeni nesil çözümler',
    description: 'Tek üyelikle tüm kargo firmalarıyla çalışın, uygun fiyatlarla kargo gönderin',
    colors: {
      primary: '#DB2777',
      secondary: '#10B981'
    },
    contact: {
      phone: '0850 308 52 94',
      email: 'info@enucuzakargo.com'
    },
    hero: {
      title: 'Tüm Kargo Firmaları tek platformda',
      subtitle: 'Hala kargo firmaları ile tek tek anlaşma mı yapıyorsunuz? En Ucuza Kargo tüm kargo hizmetlerini tek platformda toplayarak en iyi fiyatları sunuyor!',
      buttonText: 'Ücretsiz Kayıt Ol'
    },
    features: [],
    howItWorks: [],
    faqs: []
  });

  const refreshSettings = () => {
    fetchSettings();
  };

  const value = {
    settings,
    loading,
    refreshSettings
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

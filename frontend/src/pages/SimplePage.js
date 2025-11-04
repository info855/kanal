import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, Package } from 'lucide-react';

const SimplePage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { page } = useParams();

  const pageContent = {
    kariyer: {
      title: 'Kariyer',
      content: 'Kariyer fırsatları hakkında bilgi yakında eklenecektir.'
    },
    yardim: {
      title: 'Yardım Merkezi',
      content: 'Yardım dokümantasyonu yakında eklenecektir.'
    },
    'api-docs': {
      title: 'API Dokümantasyon',
      content: 'API dokümantasyonu yakında eklenecektir.'
    }
  };

  const currentPage = pageContent[page] || { title: 'Sayfa', content: 'İçerik yakında eklenecektir.' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                {settings?.logo ? (
                  <img src={settings.logo} alt={settings.siteName} className="h-8 w-auto" />
                ) : (
                  <Package className="w-8 h-8 text-pink-600" />
                )}
                <span className="text-2xl font-bold text-gray-900">{settings?.siteName || 'En Ucuza Kargo'}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')}>Giriş Yap</Button>
              <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => navigate('/register')}>Kayıt Ol</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{currentPage.title}</h1>
            <p className="text-gray-600">{currentPage.content}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimplePage;

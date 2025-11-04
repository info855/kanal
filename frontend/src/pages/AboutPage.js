import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft, Package } from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

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
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Hakkımızda</h1>
            {settings?.aboutPage ? (
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">{settings.aboutPage}</p>
              </div>
            ) : (
              <div className="space-y-4 text-gray-600">
                <p>
                  {settings?.siteName || 'En Ucuza Kargo'}, kargo sektöründe yenilikçi çözümler sunan bir platformdur. 
                  Tüm kargo firmalarını tek bir platformda toplayan sistemimizle, müşterilerimize en uygun fiyatları 
                  ve en hızlı teslimat seçeneklerini sunuyoruz.
                </p>
                <p>
                  Misyonumuz, e-ticaret işletmelerinin ve bireysel kullanıcıların kargo gönderim süreçlerini 
                  kolaylaştırmak ve optimize etmektir. Teknoloji odaklı yaklaşımımızla, kargo yönetimini basit, 
                  hızlı ve ekonomik hale getiriyoruz.
                </p>
                <p>
                  Vizyonumuz, Türkiye'nin en güvenilir ve tercih edilen kargo yönetim platformu olmaktır.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutPage;

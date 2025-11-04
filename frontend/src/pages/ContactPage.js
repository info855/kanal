import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Package, Phone, Mail, MapPin } from 'lucide-react';

const ContactPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('İletişim formu gönderildi! (Demo)');
  };

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
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-pink-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Telefon</h3>
                  <p className="text-gray-600">{settings?.contact?.phone || '0850 308 52 94'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-pink-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">E-posta</h3>
                  <p className="text-gray-600">{settings?.contact?.email || 'info@enucuzakargo.com'}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-pink-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Adres</h3>
                  <p className="text-gray-600">{settings?.contact?.address || 'Türkiye'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Bize Ulaşın</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <Input placeholder="Adınız Soyadınız" required />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input type="email" placeholder="ornek@email.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Konu</Label>
                  <Input placeholder="Konu" required />
                </div>
                <div className="space-y-2">
                  <Label>Mesaj</Label>
                  <Textarea placeholder="Mesajınız" rows={5} required />
                </div>
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
                  Gönder
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

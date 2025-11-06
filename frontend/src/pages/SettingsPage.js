import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Lock, Mail, Phone, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { profileAPI } from '../services/api';
import { toast } from '../hooks/use-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: siteSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [updateRequests, setUpdateRequests] = useState([]);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Email/Phone update state
  const [emailUpdate, setEmailUpdate] = useState('');
  const [phoneUpdate, setPhoneUpdate] = useState('');

  useEffect(() => {
    fetchUpdateRequests();
  }, []);
  
  const fetchUpdateRequests = async () => {
    try {
      const response = await profileAPI.getUpdateRequests();
      setUpdateRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching update requests:', error);
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Hata',
        description: 'Yeni şifreler eşleşmiyor',
        variant: 'destructive'
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Hata',
        description: 'Şifre en az 6 karakter olmalıdır',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      await profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast({
        title: 'Başarılı',
        description: 'Şifreniz başarıyla değiştirildi'
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Şifre değiştirilemedi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailUpdateRequest = async () => {
    if (!emailUpdate || !emailUpdate.includes('@')) {
      toast({
        title: 'Hata',
        description: 'Geçerli bir email adresi girin',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      await profileAPI.createUpdateRequest({
        updateType: 'email',
        newValue: emailUpdate
      });
      
      toast({
        title: 'Başarılı',
        description: 'Email güncelleme talebiniz oluşturuldu. Admin onayı bekleniyor.'
      });
      
      setEmailUpdate('');
      fetchUpdateRequests();
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Talep oluşturulamadı',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhoneUpdateRequest = async () => {
    if (!phoneUpdate || phoneUpdate.length < 10) {
      toast({
        title: 'Hata',
        description: 'Geçerli bir telefon numarası girin',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      await profileAPI.createUpdateRequest({
        updateType: 'phone',
        newValue: phoneUpdate
      });
      
      toast({
        title: 'Başarılı',
        description: 'Telefon güncelleme talebiniz oluşturuldu. Admin onayı bekleniyor.'
      });
      
      setPhoneUpdate('');
      fetchUpdateRequests();
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Talep oluşturulamadı',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Beklemede</Badge>;
      case 'approved':
        return <Badge variant="success" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Onaylandı</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Reddedildi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                {siteSettings?.logo ? (
                  <img src={siteSettings.logo} alt={siteSettings.siteName || 'Logo'} className="h-8 w-auto" />
                ) : (
                  <User className="w-8 h-8 text-pink-600" />
                )}
                <span className="text-2xl font-bold text-gray-900">Profil Ayarları</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="password" className="space-y-6">
          <TabsList>
            <TabsTrigger value="password">Şifre Değiştir</TabsTrigger>
            <TabsTrigger value="contact">İletişim Bilgileri</TabsTrigger>
            <TabsTrigger value="requests">Taleplerim</TabsTrigger>
          </TabsList>

          {/* Password Change Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Şifre Değiştir
                </CardTitle>
                <CardDescription>Hesap güvenliğiniz için güçlü bir şifre kullanın</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mevcut Şifre</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Yeni Şifre</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500">En az 6 karakter olmalıdır</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Yeni Şifre (Tekrar)</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
                    {loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Info Tab */}
          <TabsContent value="contact">
            <div className="space-y-6">
              {/* Current Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Mevcut Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user?.email || 'Belirtilmemiş'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Telefon</p>
                        <p className="font-medium">{user?.phone || 'Belirtilmemiş'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Email Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Güncelleme
                  </CardTitle>
                  <CardDescription>Email değişikliği admin onayı gerektirir</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Yeni Email Adresi</Label>
                    <Input
                      type="email"
                      value={emailUpdate}
                      onChange={(e) => setEmailUpdate(e.target.value)}
                      placeholder="yeni@email.com"
                    />
                  </div>
                  <Button 
                    onClick={handleEmailUpdateRequest} 
                    disabled={loading}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    {loading ? 'Gönderiliyor...' : 'Güncelleme Talebi Gönder'}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Phone Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Telefon Güncelleme
                  </CardTitle>
                  <CardDescription>Telefon değişikliği admin onayı gerektirir</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Yeni Telefon Numarası</Label>
                    <Input
                      type="tel"
                      value={phoneUpdate}
                      onChange={(e) => setPhoneUpdate(e.target.value)}
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <Button 
                    onClick={handlePhoneUpdateRequest} 
                    disabled={loading}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    {loading ? 'Gönderiliyor...' : 'Güncelleme Talebi Gönder'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Update Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Güncelleme Taleplerim</CardTitle>
                <CardDescription>Email ve telefon güncelleme taleplerinizin durumu</CardDescription>
              </CardHeader>
              <CardContent>
                {updateRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Henüz güncelleme talebiniz bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updateRequests.map((request) => (
                      <div key={request._id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {request.updateType === 'email' ? (
                              <Mail className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Phone className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="font-medium capitalize">{request.updateType === 'email' ? 'Email' : 'Telefon'} Güncelleme</span>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><span className="font-medium">Mevcut:</span> {request.currentValue}</p>
                          <p><span className="font-medium">Yeni:</span> {request.newValue}</p>
                        </div>
                        {request.adminNote && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <p className="font-medium text-gray-700">Admin Notu:</p>
                            <p className="text-gray-600">{request.adminNote}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(request.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;

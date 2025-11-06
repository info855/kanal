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
import { ArrowLeft, Settings, Lock, Mail, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';
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
                <Settings className="w-8 h-8 text-pink-600" />
                <span className="text-2xl font-bold text-gray-900">Ayarlar</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>Hesap bilgileriniz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ad Soyad</Label>
                <p className="mt-1 text-sm text-gray-700">{user?.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="mt-1 text-sm text-gray-700">{user?.email}</p>
              </div>
              <div>
                <Label>Telefon</Label>
                <p className="mt-1 text-sm text-gray-700">{user?.phone}</p>
              </div>
              <div>
                <Label>Şirket</Label>
                <p className="mt-1 text-sm text-gray-700">{user?.company}</p>
              </div>
              <div>
                <Label>Vergi No</Label>
                <p className="mt-1 text-sm text-gray-700">{user?.taxId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Bakiye Yönetimi</CardTitle>
              <CardDescription>Hesabınıza bakiye yükleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Mevcut Bakiye</p>
                    <p className="text-2xl font-bold text-green-600">{user?.balance?.toFixed(2)} TL</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <form onSubmit={handleBalanceUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Yüklenecek Tutar</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  disabled={loading}
                >
                  {loading ? 'Yükleniyor...' : 'Bakiye Yükle'}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  * Bakiye yükleme işlemi demo amaçlıdır. Gerçek ödeme entegrasyonu eklenmemiştir.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
              <CardDescription>Hesap aktiviteleriniz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Toplam Gönderi</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{user?.totalShipments || 0}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Üyelik Tarihi</p>
                  <p className="text-lg font-bold text-purple-600 mt-2">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <p className="text-sm text-gray-600">Hesap Tipi</p>
                  <p className="text-lg font-bold text-pink-600 mt-2">
                    {user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

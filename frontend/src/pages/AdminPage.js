import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Package, Users, TrendingUp, LogOut, Search, MoreVertical, Settings, Wallet, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { mockOrders, mockUsers, mockStats } from '../mock/mockData';
import { adminWalletAPI } from '../services/api';
import { toast } from '../hooks/use-toast';
import AdminChatPanel from '../components/AdminChatPanel';

const AdminPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Wallet states
  const [depositRequests, setDepositRequests] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [manualAdjustment, setManualAdjustment] = useState({
    userId: '',
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (selectedTab === 'wallet') {
      fetchDepositRequests();
    }
  }, [selectedTab]);

  const fetchDepositRequests = async () => {
    setWalletLoading(true);
    try {
      const response = await adminWalletAPI.getDepositRequests({ status: 'pending', limit: 50 });
      setDepositRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching deposit requests:', error);
      toast({
        title: 'Hata',
        description: 'Ödeme bildirimleri yüklenemedi',
        variant: 'destructive'
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const handleApproveDeposit = async (requestId) => {
    try {
      await adminWalletAPI.approveDeposit(requestId, { adminNote });
      toast({
        title: 'Başarılı',
        description: 'Ödeme onaylandı ve bakiye yüklendi'
      });
      setAdminNote('');
      setSelectedRequest(null);
      fetchDepositRequests();
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Ödeme onaylanamadı',
        variant: 'destructive'
      });
    }
  };

  const handleRejectDeposit = async (requestId) => {
    if (!adminNote) {
      toast({
        title: 'Hata',
        description: 'Lütfen red sebebini yazın',
        variant: 'destructive'
      });
      return;
    }

    try {
      await adminWalletAPI.rejectDeposit(requestId, { adminNote });
      toast({
        title: 'Başarılı',
        description: 'Ödeme reddedildi'
      });
      setAdminNote('');
      setSelectedRequest(null);
      fetchDepositRequests();
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Ödeme reddedilemedi',
        variant: 'destructive'
      });
    }
  };

  const handleManualAdjustment = async (e) => {
    e.preventDefault();
    
    if (!manualAdjustment.userId || !manualAdjustment.amount || !manualAdjustment.description) {
      toast({
        title: 'Hata',
        description: 'Tüm alanları doldurun',
        variant: 'destructive'
      });
      return;
    }

    try {
      await adminWalletAPI.manualBalanceAdjustment({
        userId: manualAdjustment.userId,
        amount: parseFloat(manualAdjustment.amount),
        description: manualAdjustment.description
      });
      
      toast({
        title: 'Başarılı',
        description: 'Bakiye güncellendi'
      });
      
      setManualAdjustment({ userId: '', amount: '', description: '' });
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Bakiye güncellenemedi',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      delivered: 'bg-green-100 text-green-700',
      in_transit: 'bg-blue-100 text-blue-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      pending: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || colors.pending;
  };

  const filteredOrders = mockOrders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.trackingCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = mockUsers.filter(user =>
    user.role !== 'admin' && (
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {settings?.logo ? (
                <img src={settings.logo} alt={settings.siteName || 'Logo'} className="h-8 w-auto" />
              ) : (
                <Package className="w-8 h-8 text-pink-600" />
              )}
              <span className="text-2xl font-bold text-gray-900">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/admin/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Site Ayarları
              </Button>
              <Badge className="bg-purple-100 text-purple-700">Administrator</Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="orders">Tüm Siparishler</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="chat">Canlı Destek</TabsTrigger>
            <TabsTrigger value="wallet">Cüzdan Yönetimi</TabsTrigger>
            <TabsTrigger value="profile-requests">Profil Talepleri</TabsTrigger>
            <TabsTrigger value="analytics">Analizler</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Gönderi</CardTitle>
                  <Package className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalShipments}</div>
                  <p className="text-xs text-green-600 mt-1">+{mockStats.monthlyGrowth}% bu ay</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aktif Gönderiler</CardTitle>
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.activeShipments}</div>
                  <p className="text-xs text-gray-500 mt-1">Devam eden</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                  <span className="text-sm font-semibold text-gray-500">₺</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalRevenue.toLocaleString()} TL</div>
                  <p className="text-xs text-gray-500 mt-1">Bu ay</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Kullanıcılar</CardTitle>
                  <Users className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockUsers.filter(u => u.role !== 'admin').length}</div>
                  <p className="text-xs text-gray-500 mt-1">Aktif kullanıcı</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Son Gönderiler</CardTitle>
                  <CardDescription>En son oluşturulan gönderiler</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{order.id}</p>
                          <p className="text-xs text-gray-500">{order.recipient}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>{order.statusText}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aktif Kullanıcılar</CardTitle>
                  <CardDescription>En aktif kullanıcılar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUsers.filter(u => u.role !== 'admin').map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.company}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{user.totalShipments} gönderi</p>
                          <p className="text-xs text-gray-500">{user.balance?.toFixed(2)} TL</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tüm Siparishler</CardTitle>
                    <CardDescription>Sistemdeki tüm gönderiler</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Ara..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Sipariş No</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Alıcı</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Kargo</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Durum</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Tarih</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-900">Tutar</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-900"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{order.id}</td>
                          <td className="py-3 px-4 text-sm">{order.recipient}</td>
                          <td className="py-3 px-4 text-sm">{order.shippingCompany}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(order.status)}>{order.statusText}</Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{order.createdAt}</td>
                          <td className="py-3 px-4 text-sm text-right">{order.price} TL</td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Kullanıcılar</CardTitle>
                    <CardDescription>Tüm kayıtlı kullanıcılar</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Kullanıcı ara..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Ad Soyad</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Şirket</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Email</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-900">Telefon</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-900">Gönderi Sayısı</th>
                        <th className="py-3 px-4 text-right text-sm font-medium text-gray-900">Bakiye</th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-900"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium">{user.name}</td>
                          <td className="py-3 px-4 text-sm">{user.company}</td>
                          <td className="py-3 px-4 text-sm">{user.email}</td>
                          <td className="py-3 px-4 text-sm">{user.phone}</td>
                          <td className="py-3 px-4 text-sm text-right">{user.totalShipments}</td>
                          <td className="py-3 px-4 text-sm text-right">{user.balance?.toFixed(2)} TL</td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gönderi Performansı</CardTitle>
                  <CardDescription>Son 6 aylık gönderi trendi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {[
                      { month: 'Tem', value: 890 },
                      { month: 'Ağu', value: 1050 },
                      { month: 'Eyl', value: 1200 },
                      { month: 'Eki', value: 1150 },
                      { month: 'Kas', value: 1300 },
                      { month: 'Ara', value: 1450 }
                    ].map((data, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full bg-pink-200 rounded-t relative" style={{ height: `${(data.value / 1500) * 100}%` }}>
                          <div className="absolute inset-0 bg-pink-600 rounded-t" style={{ height: '70%' }} />
                          <p className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium">{data.value}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{data.month}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gelir Analizi</CardTitle>
                  <CardDescription>Aylık gelir trendi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Bu Ay</p>
                        <p className="text-2xl font-bold text-green-600">125,430 TL</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Geçen Ay</p>
                        <p className="text-2xl font-bold text-blue-600">108,920 TL</p>
                      </div>
                      <span className="text-3xl font-bold text-blue-600">₺</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Artış Oranı</p>
                        <p className="text-2xl font-bold text-purple-600">+15.2%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Kargo Firması Dağılımı</CardTitle>
                  <CardDescription>En çok kullanılan kargo firmaları</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'PTT Kargo', percentage: 35, count: 437 },
                      { name: 'Aras Kargo', percentage: 28, count: 349 },
                      { name: 'Yurtiçi Kargo', percentage: 22, count: 274 },
                      { name: 'MNG Kargo', percentage: 10, count: 125 },
                      { name: 'Diğerleri', percentage: 5, count: 62 }
                    ].map((company, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">{company.name}</p>
                          <p className="text-sm text-gray-500">{company.count} gönderi ({company.percentage}%)</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${company.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Canlı Destek Yönetimi</CardTitle>
                <CardDescription>
                  Kullanıcılarla canlı destek sohbetleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminChatPanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Management Tab */}
          <TabsContent value="wallet" className="space-y-6">
            {/* Pending Deposit Requests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Wallet className="w-5 h-5 mr-2" />
                      Bekleyen Ödeme Bildirimleri
                    </CardTitle>
                    <CardDescription>Kullanıcıların onay bekleyen ödeme bildirimleri</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchDepositRequests}>
                    Yenile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {walletLoading ? (
                  <div className="text-center py-8">Yükleniyor...</div>
                ) : depositRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Bekleyen ödeme bildirimi yok</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {depositRequests.map((request) => (
                      <Card key={request._id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Request Details */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold">{request.amount} TL</h4>
                                <Badge className="bg-yellow-100 text-yellow-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Bekliyor
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <p><strong>Kullanıcı:</strong> {request.userName} ({request.userEmail})</p>
                                <p><strong>Gönderen:</strong> {request.senderName}</p>
                                <p><strong>Açıklama:</strong> {request.description}</p>
                                <p><strong>Tarih:</strong> {new Date(request.createdAt).toLocaleString('tr-TR')}</p>
                                {request.paymentDate && (
                                  <p><strong>Ödeme Tarihi:</strong> {new Date(request.paymentDate).toLocaleString('tr-TR')}</p>
                                )}
                              </div>
                            </div>

                            {/* Admin Actions */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Admin Notu (Opsiyonel)</Label>
                                <Textarea
                                  placeholder="Onay/Red nedeni..."
                                  value={selectedRequest === request._id ? adminNote : ''}
                                  onChange={(e) => {
                                    setSelectedRequest(request._id);
                                    setAdminNote(e.target.value);
                                  }}
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveDeposit(request._id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Onayla
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleRejectDeposit(request._id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reddet
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Balance Adjustment */}
            <Card>
              <CardHeader>
                <CardTitle>Manuel Bakiye Düzeltmesi</CardTitle>
                <CardDescription>Kullanıcı bakiyesini manuel olarak artırın veya azaltın</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualAdjustment} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Kullanıcı ID *</Label>
                      <Input
                        placeholder="Kullanıcı ID"
                        value={manualAdjustment.userId}
                        onChange={(e) => setManualAdjustment({ ...manualAdjustment, userId: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500">Kullanıcılar sekmesinden ID'yi alabilirsiniz</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Tutar (TL) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Pozitif veya negatif"
                        value={manualAdjustment.amount}
                        onChange={(e) => setManualAdjustment({ ...manualAdjustment, amount: e.target.value })}
                        required
                      />
                      <p className="text-xs text-gray-500">Örn: 500 veya -100</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Açıklama *</Label>
                      <Input
                        placeholder="Düzeltme nedeni"
                        value={manualAdjustment.description}
                        onChange={(e) => setManualAdjustment({ ...manualAdjustment, description: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                    Bakiye Güncelle
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Bekleyen Bildirimler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{depositRequests.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Bekleyen Toplam</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {depositRequests.reduce((sum, req) => sum + req.amount, 0).toFixed(2)} TL
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Durum</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-green-600">
                    {depositRequests.length === 0 ? 'Temiz' : 'İşlem Bekliyor'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;

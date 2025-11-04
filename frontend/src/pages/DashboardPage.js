import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package, TrendingUp, DollarSign, Clock, Bell, Plus, LogOut, Settings, User, MapPin } from 'lucide-react';
import { ordersAPI, notificationsAPI } from '../services/api';
import { mockChartData } from '../mock/mockData';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, notifRes] = await Promise.all([
        ordersAPI.getAll({ limit: 5 }),
        notificationsAPI.getAll()
      ]);
      setOrders(ordersRes.data.orders || []);
      setNotifications(notifRes.data.notifications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-pink-600" />
              <span className="text-2xl font-bold text-gray-900">Basit Kargo</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.company}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gönderi</CardTitle>
                <Package className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.totalShipments || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Bu ay +12.5%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Gönderiler</CardTitle>
                <Clock className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockOrders.filter(o => o.status !== 'delivered').length}</div>
                <p className="text-xs text-gray-500 mt-1">Yolda olan gönderiler</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bakiye</CardTitle>
                <DollarSign className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.balance?.toFixed(2)} TL</div>
                <Button variant="link" className="text-xs px-0 text-pink-600" onClick={() => navigate('/dashboard/balance')}>
                  Bakiye Yükle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
                <TrendingUp className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-gray-500 mt-1">Gönderi sayısı</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Button className="bg-pink-600 hover:bg-pink-700 h-20" onClick={() => navigate('/dashboard/new-shipment')}>
                  <Plus className="w-5 h-5 mr-2" />
                  Yeni Gönderi
                </Button>
                <Button variant="outline" className="h-20" onClick={() => navigate('/dashboard/tracking')}>
                  <MapPin className="w-5 h-5 mr-2" />
                  Kargo Takip
                </Button>
                <Button variant="outline" className="h-20" onClick={() => navigate('/dashboard/orders')}>
                  <Package className="w-5 h-5 mr-2" />
                  Gönderilerim
                </Button>
                <Button variant="outline" className="h-20" onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="w-5 h-5 mr-2" />
                  Ayarlar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Son Gönderiler</CardTitle>
                  <CardDescription>Son gönderilerinizin durumu</CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate('/dashboard/orders')}>
                  Tümünü Gör
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Henüz gönderi yok</div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/tracking/${order.orderId}`)}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.orderId}</p>
                          <p className="text-sm text-gray-500">{order.recipient.name} - {order.shippingCompany}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>{order.statusText}</Badge>
                        <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Haftalık Gönderim Trendi</CardTitle>
                <CardDescription>Son 7 gün</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {mockChartData.daily.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-pink-200 rounded-t" style={{ height: `${(data.shipments / 70) * 100}%` }}>
                        <div className="w-full bg-pink-600 rounded-t" style={{ height: '60%' }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{data.date.split(' ')[0]}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bildirimler</CardTitle>
                <CardDescription>Son bildirimler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.slice(0, 4).map((notif) => (
                    <div key={notif.id} className={`p-3 rounded-lg border ${notif.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        </div>
                        {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

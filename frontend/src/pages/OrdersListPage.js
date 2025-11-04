import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { ordersAPI } from '../services/api';

const OrdersListPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll({ limit: 50 });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      delivered: 'bg-green-100 text-green-700',
      in_transit: 'bg-blue-100 text-blue-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      created: 'bg-gray-100 text-gray-700',
      picked: 'bg-purple-100 text-purple-700'
    };
    return colors[status] || colors.created;
  };

  const filteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.recipient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <Package className="w-8 h-8 text-pink-600" />
                <span className="text-2xl font-bold text-gray-900">Gönderilerim</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tüm Gönderiler</CardTitle>
                <CardDescription>Tüm gönderilerinizin listesi</CardDescription>
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
            {loading ? (
              <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'Sonuç bulunamadı' : 'Henüz gönderi yok'}
              </div>
            ) : (
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/dashboard/tracking/${order.orderId}`)}
                      >
                        <td className="py-3 px-4 text-sm font-medium">{order.orderId}</td>
                        <td className="py-3 px-4 text-sm">{order.recipient.name}</td>
                        <td className="py-3 px-4 text-sm">{order.shippingCompany}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(order.status)}>{order.statusText}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">{order.price} TL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersListPage;

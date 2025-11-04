import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ArrowLeft, Package, MapPin, Phone, Calendar, Truck, CheckCircle2 } from 'lucide-react';
import { mockOrders } from '../mock/mockData';

const TrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState('');
  const [order, setOrder] = useState(orderId ? mockOrders.find(o => o.id === orderId) : null);

  const handleSearch = () => {
    const found = mockOrders.find(o => o.trackingCode === trackingCode || o.id === trackingCode);
    setOrder(found);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Package className="w-8 h-8 text-pink-600" />
                <span className="text-2xl font-bold text-gray-900">Kargo Takip</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        {!orderId && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Kargo Takip</CardTitle>
              <CardDescription>Takip kodunu veya sipariş numarasını girin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Takip kodu veya sipariş numarası"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleSearch}>
                  Sorgula
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {order ? (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Order Details */}
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gönderi Detayları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Sipariş No</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Takip Kodu</p>
                    <p className="font-medium">{order.trackingCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kargo Firması</p>
                    <p className="font-medium">{order.shippingCompany}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durum</p>
                    <Badge className={`mt-1 ${getStatusColor(order.status)}`}>{order.statusText}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ağırlık / Desi</p>
                    <p className="font-medium">{order.weight} kg / {order.desi} desi</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ücret</p>
                    <p className="font-medium">{order.price} TL</p>
                  </div>
                  {order.paymentType === 'cod' && (
                    <div>
                      <p className="text-sm text-gray-500">Tahsilat Tutarı</p>
                      <p className="font-medium text-green-600">{order.codAmount} TL</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alıcı Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Alıcı</p>
                      <p className="font-medium">{order.recipient}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium">{order.recipientPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Adres</p>
                      <p className="font-medium">{order.recipientAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline and Map */}
            <div className="md:col-span-2 space-y-6">
              {/* Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kargo Konumu</CardTitle>
                  <CardDescription>Son bilinen konum: {order.currentLocation?.city}, {order.currentLocation?.district}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {/* Simple map representation */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center animate-pulse">
                          <Truck className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-center mt-2 font-medium text-gray-900">{order.currentLocation?.city}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gönderi Geçmişi</CardTitle>
                  <CardDescription>Kargonuzun yolculuğu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {order.timeline?.map((event, idx) => (
                      <div key={idx} className="flex items-start space-x-4">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            event.status === order.status ? 'bg-pink-600' : 'bg-gray-300'
                          }`}>
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          {idx < order.timeline.length - 1 && (
                            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{event.description}</p>
                              <p className="text-sm text-gray-500 mt-1">{event.date}</p>
                            </div>
                            {event.status === order.status && (
                              <Badge className="bg-pink-600 text-white">Güncel</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Gönderi bulunamadı. Lütfen takip kodunuzu kontrol edin.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Package, Search } from 'lucide-react';
import { shippingAPI, ordersAPI, recipientsAPI } from '../services/api';
import { toast } from '../hooks/use-toast';

const NewShipmentPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientCity: '',
    recipientDistrict: '',
    recipientAddress: '',
    weight: '',
    desi: '',
    shippingCompanyId: '',
    paymentType: 'prepaid',
    codAmount: '',
    description: ''
  });
  
  // Autocomplete states
  const [searchResults, setSearchResults] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const autocompleteRef = useRef(null);

  useEffect(() => {
    fetchShippingCompanies();
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchShippingCompanies = async () => {
    try {
      const response = await shippingAPI.getAll();
      setShippingCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error fetching shipping companies:', error);
      toast({
        title: 'Hata',
        description: 'Kargo firmaları yüklenemedi',
        variant: 'destructive'
      });
    }
  };
  
  // Search recipients
  const searchRecipients = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowAutocomplete(false);
      return;
    }
    
    try {
      const response = await recipientsAPI.search(query);
      setSearchResults(response.data.recipients || []);
      setShowAutocomplete(true);
    } catch (error) {
      console.error('Error searching recipients:', error);
    }
  };
  
  // Handle recipient name change
  const handleRecipientNameChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setFormData({ ...formData, recipientName: value });
    searchRecipients(value);
  };
  
  // Select recipient from autocomplete
  const selectRecipient = (recipient) => {
    setFormData({
      ...formData,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      recipientCity: recipient.city,
      recipientDistrict: recipient.district,
      recipientAddress: recipient.address
    });
    setSearchQuery(recipient.name);
    setShowAutocomplete(false);
    setSearchResults([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await ordersAPI.create(formData);
      if (response.data.success) {
        toast({
          title: 'Gönderi Oluşturuldu!',
          description: `Takip Kodu: ${response.data.order.trackingCode}`,
        });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Gönderi oluşturulamadı',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                {settings?.logo ? (
                  <img src={settings.logo} alt={settings.siteName} className="h-8 w-auto" />
                ) : (
                  <Package className="w-8 h-8 text-pink-600" />
                )}
                <span className="text-2xl font-bold text-gray-900">Yeni Gönderi</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Recipient Information */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alıcı Bilgileri</CardTitle>
                  <CardDescription>Kargonun gönderileceği kişinin bilgileri</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative" ref={autocompleteRef}>
                      <Label htmlFor="recipientName">Ad Soyad * <span className="text-xs text-gray-500">(Kayıtlı alıcı aramak için yazın)</span></Label>
                      <div className="relative">
                        <Input
                          id="recipientName"
                          name="recipientName"
                          value={formData.recipientName}
                          onChange={handleRecipientNameChange}
                          placeholder="Alıcı adı soyadı"
                          required
                          autoComplete="off"
                        />
                        {searchQuery && searchQuery.length >= 2 && (
                          <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Autocomplete Dropdown */}
                      {showAutocomplete && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((recipient) => (
                            <button
                              key={recipient._id}
                              type="button"
                              onClick={() => selectRecipient(recipient)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 focus:outline-none focus:bg-gray-50"
                            >
                              <div className="font-medium text-gray-900">{recipient.name}</div>
                              <div className="text-sm text-gray-500">{recipient.phone}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {recipient.city} / {recipient.district}
                              </div>
                              <div className="text-xs text-gray-400">
                                Kullanım: {recipient.usageCount} kez
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {showAutocomplete && searchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4">
                          <p className="text-sm text-gray-500 text-center">Kayıtlı alıcı bulunamadı</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientPhone">Telefon *</Label>
                      <Input
                        id="recipientPhone"
                        name="recipientPhone"
                        value={formData.recipientPhone}
                        onChange={handleChange}
                        placeholder="+90 5XX XXX XX XX"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientCity">İl *</Label>
                      <Input
                        id="recipientCity"
                        name="recipientCity"
                        value={formData.recipientCity}
                        onChange={handleChange}
                        placeholder="İl seçiniz"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recipientDistrict">İlçe *</Label>
                      <Input
                        id="recipientDistrict"
                        name="recipientDistrict"
                        value={formData.recipientDistrict}
                        onChange={handleChange}
                        placeholder="İlçe seçiniz"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Adres *</Label>
                    <Textarea
                      id="recipientAddress"
                      name="recipientAddress"
                      value={formData.recipientAddress}
                      onChange={handleChange}
                      placeholder="Tam adres"
                      rows={3}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gönderi Detayları</CardTitle>
                  <CardDescription>Kargonuzun özellikleri</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Ağırlık (kg) *</Label>
                      <Input
                        id="weight"
                        name="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="0.0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desi">Desi *</Label>
                      <Input
                        id="desi"
                        name="desi"
                        type="number"
                        value={formData.desi}
                        onChange={handleChange}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Gönderi hakkında notlar"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shipping Company Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kargo Firması</CardTitle>
                  <CardDescription>Kargo firmanızı seçin</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shippingCompanies.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">Yükleniyor...</div>
                  ) : (
                    <div className="space-y-3">
                      {shippingCompanies.map((company) => (
                        <div
                          key={company._id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.shippingCompanyId === company._id
                              ? 'border-pink-600 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleSelectChange('shippingCompanyId', company._id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{company.name}</p>
                            <p className="text-lg font-bold text-pink-600">{company.price} TL</p>
                          </div>
                          <p className="text-sm text-gray-500">Teslimat: {company.deliveryTime}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ödeme Tipi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Ödeme Şekli</Label>
                    <Select value={formData.paymentType} onValueChange={(value) => handleSelectChange('paymentType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prepaid">Ön Ödemeli</SelectItem>
                        <SelectItem value="cod">Kapıda Ödeme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.paymentType === 'cod' && (
                    <div className="space-y-2">
                      <Label htmlFor="codAmount">Tahsilat Tutarı</Label>
                      <Input
                        id="codAmount"
                        name="codAmount"
                        type="number"
                        step="0.01"
                        value={formData.codAmount}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" size="lg" disabled={loading}>
                {loading ? 'Oluşturuluyor...' : 'Gönderiyi Oluştur'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewShipmentPage;

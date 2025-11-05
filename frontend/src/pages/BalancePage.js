import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Package, CreditCard, History, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { walletAPI, settingsAPI } from '../services/api';
import { toast } from '../hooks/use-toast';

const BalancePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings: siteSettings } = useSettings();
  const [balance, setBalance] = useState(0);
  const [minBalance, setMinBalance] = useState(100);
  const [transactions, setTransactions] = useState([]);
  const [depositRequests, setDepositRequests] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    senderName: '',
    description: '',
    paymentDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, transactionsRes, depositRequestsRes, settingsRes] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions({ limit: 10 }),
        walletAPI.getDepositRequests({ limit: 10 }),
        settingsAPI.get()
      ]);
      
      setBalance(balanceRes.data.balance || 0);
      setMinBalance(balanceRes.data.minimumBalance || 100);
      setTransactions(transactionsRes.data.transactions || []);
      setDepositRequests(depositRequestsRes.data.requests || []);
      setBankInfo(settingsRes.data.settings?.bankInfo || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Hata',
        description: 'Veriler yüklenemedi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositRequest = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Hata',
        description: 'Geçerli bir tutar girin',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.senderName || !formData.description) {
      toast({
        title: 'Hata',
        description: 'Tüm alanları doldurun',
        variant: 'destructive'
      });
      return;
    }

    try {
      await walletAPI.createDepositRequest({
        amount: parseFloat(formData.amount),
        senderName: formData.senderName,
        description: formData.description,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate).toISOString() : null
      });
      
      toast({
        title: 'Başarılı',
        description: 'Ödeme bildirimi gönderildi'
      });
      
      setFormData({
        amount: '',
        senderName: '',
        description: '',
        paymentDate: ''
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: 'Hata',
        description: error.response?.data?.detail || 'Bildirim gönderilemedi',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Reddedildi', color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    const { label, color, icon: Icon } = statusMap[status] || statusMap.pending;
    
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'payment':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'refund':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
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
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                {siteSettings?.logo ? (
                  <img src={siteSettings.logo} alt={siteSettings.siteName} className="h-8 w-auto" />
                ) : (
                  <Package className="w-8 h-8 text-pink-600" />
                )}
                <span className="text-2xl font-bold text-gray-900">Bakiye Yönetimi</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Balance Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mevcut Bakiye</span>
              <CreditCard className="w-6 h-6 text-pink-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {balance.toFixed(2)} TL
            </div>
            {balance < minBalance && (
              <div className="flex items-center text-orange-600 text-sm mt-2">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>Minimum bakiye: {minBalance} TL. Lütfen bakiye yükleyin.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit">Bakiye Yükle</TabsTrigger>
            <TabsTrigger value="requests">Bildirimlerim</TabsTrigger>
            <TabsTrigger value="transactions">İşlem Geçmişi</TabsTrigger>
          </TabsList>

          {/* Deposit Request Tab */}
          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Bildirimi</CardTitle>
                <CardDescription>
                  Banka hesabımıza ödeme yaptıktan sonra bu formu doldurun
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bank Info */}
                {bankInfo && (
                  <div className="p-4 bg-gray-100 rounded-lg space-y-2">
                    <h4 className="font-semibold text-gray-900">Banka Bilgileri</h4>
                    {bankInfo.bankName && <p className="text-sm"><strong>Banka:</strong> {bankInfo.bankName}</p>}
                    {bankInfo.accountHolder && <p className="text-sm"><strong>Hesap Sahibi:</strong> {bankInfo.accountHolder}</p>}
                    {bankInfo.iban && <p className="text-sm"><strong>IBAN:</strong> {bankInfo.iban}</p>}
                    {bankInfo.accountNumber && <p className="text-sm"><strong>Hesap No:</strong> {bankInfo.accountNumber}</p>}
                    {bankInfo.description && <p className="text-sm text-gray-600 mt-2">{bankInfo.description}</p>}
                  </div>
                )}

                <form onSubmit={handleDepositRequest} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Yatırılan Tutar (TL) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="Örn: 500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gönderen Adı *</Label>
                      <Input
                        value={formData.senderName}
                        onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                        placeholder="Örn: Ahmet Yılmaz"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Açıklama/Referans Kodu *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Örn: KARGO-USER123"
                      rows={3}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Lütfen bir referans kodu yazın (Örn: KARGO-{user?.email?.split('@')[0]?.toUpperCase()})
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Ödeme Tarihi (Opsiyonel)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
                    Ödeme Bildirimi Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deposit Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Bildirimlerim</CardTitle>
                <CardDescription>Gönderdiğiniz ödeme bildirimleri</CardDescription>
              </CardHeader>
              <CardContent>
                {depositRequests.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Henüz bildirim yok</p>
                ) : (
                  <div className="space-y-4">
                    {depositRequests.map((req) => (
                      <div key={req._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">{req.amount} TL</span>
                          {getStatusBadge(req.status)}
                        </div>
                        <div className="text-sm space-y-1 text-gray-600">
                          <p><strong>Gönderen:</strong> {req.senderName}</p>
                          <p><strong>Açıklama:</strong> {req.description}</p>
                          <p><strong>Tarih:</strong> {new Date(req.createdAt).toLocaleString('tr-TR')}</p>
                          {req.adminNote && (
                            <p className="text-orange-600"><strong>Admin Notu:</strong> {req.adminNote}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>İşlem Geçmişi</CardTitle>
                <CardDescription>Tüm bakiye hareketleriniz</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Henüz işlem yok</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(tx.createdAt).toLocaleString('tr-TR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)} TL
                          </p>
                          <p className="text-xs text-gray-500">
                            Bakiye: {tx.balanceAfter.toFixed(2)} TL
                          </p>
                        </div>
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

export default BalancePage;

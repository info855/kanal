import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Settings, Save, Upload, Plus, Edit, Trash2 } from 'lucide-react';
import { settingsAPI, shippingAPI } from '../services/api';
import { toast } from '../hooks/use-toast';
import MediaPicker from '../components/MediaPicker';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [shippingCompanies, setShippingCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [settingsRes, companiesRes] = await Promise.all([
        settingsAPI.get(),
        shippingAPI.getAll({ include_inactive: true })
      ]);
      setSettings(settingsRes.data.settings);
      setShippingCompanies(companiesRes.data.companies || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Hata',
        description: 'Ayarlar yüklenemedi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      // Refresh settings globally
      await refreshSettings();
      toast({
        title: 'Başarılı',
        description: 'Ayarlar kaydedildi ve yayınlandı'
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Ayarlar kaydedilemedi',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await settingsAPI.uploadLogo(file);
      setSettings({ ...settings, logo: response.data.logoUrl });
      toast({
        title: 'Başarılı',
        description: 'Logo yüklendi'
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Logo yüklenemedi',
        variant: 'destructive'
      });
    }
  };

  const handleSaveCompany = async () => {
    if (!editingCompany) return;

    try {
      if (editingCompany._id && editingCompany._id !== 'new') {
        await shippingAPI.update(editingCompany._id, editingCompany);
      } else {
        await shippingAPI.create(editingCompany);
      }
      toast({
        title: 'Başarılı',
        description: 'Kargo firması kaydedildi'
      });
      setEditingCompany(null);
      fetchData();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kargo firması kaydedilemedi',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Kargo firmasını silmek istediğinize emin misiniz?')) return;

    try {
      await shippingAPI.delete(id);
      toast({
        title: 'Başarılı',
        description: 'Kargo firması silindi'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kargo firması silinemedi',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                {settings?.logo ? (
                  <img src={settings.logo} alt={settings.siteName || 'Logo'} className="h-8 w-auto" />
                ) : (
                  <Settings className="w-8 h-8 text-pink-600" />
                )}
                <span className="text-2xl font-bold text-gray-900">Site Ayarları</span>
              </div>
            </div>
            <Button className="bg-pink-600 hover:bg-pink-700" onClick={handleSaveSettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Genel</TabsTrigger>
            <TabsTrigger value="colors">Renkler</TabsTrigger>
            <TabsTrigger value="content">İçerik</TabsTrigger>
            <TabsTrigger value="bank">Banka Bilgileri</TabsTrigger>
            <TabsTrigger value="footer">Footer & Sayfalar</TabsTrigger>
            <TabsTrigger value="shipping">Kargo Firmaları</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Genel Ayarlar</CardTitle>
                <CardDescription>Site temel bilgileri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Adı</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {settings.logo && (
                      <img src={settings.logo} alt="Logo" className="h-12 w-auto" />
                    )}
                    <MediaPicker
                      value={settings.logo}
                      onSelect={(url) => setSettings({ ...settings, logo: url })}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Medya kütüphanesinden logo seçin veya yükleyin</p>
                </div>

                <div className="space-y-2">
                  <Label>Slogan</Label>
                  <Input
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Textarea
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={settings.contact?.phone || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        contact: { ...settings.contact, phone: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={settings.contact?.email || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        contact: { ...settings.contact, email: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Renk Şeması</CardTitle>
                <CardDescription>Site renklerini özelleştirin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ana Renk (Primary)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.colors?.primary || '#DB2777'}
                        onChange={(e) => setSettings({
                          ...settings,
                          colors: { ...settings.colors, primary: e.target.value }
                        })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.colors?.primary || '#DB2777'}
                        onChange={(e) => setSettings({
                          ...settings,
                          colors: { ...settings.colors, primary: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>İkincil Renk (Secondary)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.colors?.secondary || '#10B981'}
                        onChange={(e) => setSettings({
                          ...settings,
                          colors: { ...settings.colors, secondary: e.target.value }
                        })}
                        className="w-20 h-10"
                      />
                      <Input
                        value={settings.colors?.secondary || '#10B981'}
                        onChange={(e) => setSettings({
                          ...settings,
                          colors: { ...settings.colors, secondary: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Önizleme:</p>
                  <div className="flex gap-2">
                    <div
                      className="w-20 h-20 rounded-lg"
                      style={{ backgroundColor: settings.colors?.primary }}
                    />
                    <div
                      className="w-20 h-20 rounded-lg"
                      style={{ backgroundColor: settings.colors?.secondary }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ana Sayfa Başlık</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Başlık</Label>
                  <Input
                    value={settings.hero?.title || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      hero: { ...settings.hero, title: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alt Başlık</Label>
                  <Textarea
                    value={settings.hero?.subtitle || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      hero: { ...settings.hero, subtitle: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Buton Metni</Label>
                  <Input
                    value={settings.hero?.buttonText || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      hero: { ...settings.hero, buttonText: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Özellikler (4 Adet)</CardTitle>
                <CardDescription>Neden Biz bölümündeki özellikler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Özellik {index + 1}</h4>
                    <div className="space-y-2">
                      <Label>Başlık</Label>
                      <Input
                        value={settings.features?.[index]?.title || ''}
                        onChange={(e) => {
                          const newFeatures = [...(settings.features || [])];
                          newFeatures[index] = { ...newFeatures[index], title: e.target.value };
                          setSettings({ ...settings, features: newFeatures });
                        }}
                        placeholder="Örn: Kargo Anlaşması"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Açıklama</Label>
                      <Textarea
                        value={settings.features?.[index]?.description || ''}
                        onChange={(e) => {
                          const newFeatures = [...(settings.features || [])];
                          newFeatures[index] = { ...newFeatures[index], description: e.target.value };
                          setSettings({ ...settings, features: newFeatures });
                        }}
                        rows={2}
                        placeholder="Özellik açıklaması"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>İkon (Lucide React ismi)</Label>
                      <Input
                        value={settings.features?.[index]?.icon || ''}
                        onChange={(e) => {
                          const newFeatures = [...(settings.features || [])];
                          newFeatures[index] = { ...newFeatures[index], icon: e.target.value };
                          setSettings({ ...settings, features: newFeatures });
                        }}
                        placeholder="Örn: Package, Clock, Shield"
                      />
                      <p className="text-xs text-gray-500">Kullanılabilir ikonlar: Package, TrendingUp, Shield, Zap, BarChart3, Clock, CheckCircle2, Users</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Veya Kendi Görselinizi Yükleyin</Label>
                      <div className="flex items-center gap-4">
                        {settings.features?.[index]?.imageUrl && (
                          <img src={settings.features[index].imageUrl} alt="Feature" className="h-12 w-12 object-cover rounded" />
                        )}
                        <MediaPicker
                          value={settings.features?.[index]?.imageUrl || ''}
                          onSelect={(url) => {
                            const newFeatures = [...(settings.features || [])];
                            newFeatures[index] = { ...newFeatures[index], imageUrl: url };
                            setSettings({ ...settings, features: newFeatures });
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Görsel yüklenirse icon yerine görsel kullanılır</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nasıl Çalışır (3 Adım)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Adım {index + 1}</h4>
                    <div className="space-y-2">
                      <Label>Başlık</Label>
                      <Input
                        value={settings.howItWorks?.[index]?.title || ''}
                        onChange={(e) => {
                          const newSteps = [...(settings.howItWorks || [])];
                          newSteps[index] = { ...newSteps[index], title: e.target.value };
                          setSettings({ ...settings, howItWorks: newSteps });
                        }}
                        placeholder="Örn: Kayıt Ol"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Açıklama</Label>
                      <Textarea
                        value={settings.howItWorks?.[index]?.description || ''}
                        onChange={(e) => {
                          const newSteps = [...(settings.howItWorks || [])];
                          newSteps[index] = { ...newSteps[index], description: e.target.value };
                          setSettings({ ...settings, howItWorks: newSteps });
                        }}
                        rows={2}
                        placeholder="Adım açıklaması"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>İkon (Lucide React ismi - opsiyonel)</Label>
                      <Input
                        value={settings.howItWorks?.[index]?.icon || ''}
                        onChange={(e) => {
                          const newSteps = [...(settings.howItWorks || [])];
                          newSteps[index] = { ...newSteps[index], icon: e.target.value };
                          setSettings({ ...settings, howItWorks: newSteps });
                        }}
                        placeholder="Örn: CheckCircle2, Package, Zap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Veya Kendi Görselinizi Yükleyin</Label>
                      <div className="flex items-center gap-4">
                        {settings.howItWorks?.[index]?.imageUrl && (
                          <img src={settings.howItWorks[index].imageUrl} alt="Step" className="h-12 w-12 object-cover rounded" />
                        )}
                        <MediaPicker
                          value={settings.howItWorks?.[index]?.imageUrl || ''}
                          onSelect={(url) => {
                            const newSteps = [...(settings.howItWorks || [])];
                            newSteps[index] = { ...newSteps[index], imageUrl: url };
                            setSettings({ ...settings, howItWorks: newSteps });
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Görsel yüklenirse icon yerine görsel kullanılır</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SSS (Sık Sorulan Sorular)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Soru {index + 1}</h4>
                    <div className="space-y-2">
                      <Label>Soru</Label>
                      <Input
                        value={settings.faqs?.[index]?.question || ''}
                        onChange={(e) => {
                          const newFaqs = [...(settings.faqs || [])];
                          newFaqs[index] = { ...newFaqs[index], question: e.target.value };
                          setSettings({ ...settings, faqs: newFaqs });
                        }}
                        placeholder="Soru giriniz"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cevap</Label>
                      <Textarea
                        value={settings.faqs?.[index]?.answer || ''}
                        onChange={(e) => {
                          const newFaqs = [...(settings.faqs || [])];
                          newFaqs[index] = { ...newFaqs[index], answer: e.target.value };
                          setSettings({ ...settings, faqs: newFaqs });
                        }}
                        rows={2}
                        placeholder="Cevap giriniz"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Info Tab */}
          <TabsContent value="bank" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Banka Hesap Bilgileri</CardTitle>
                <CardDescription>
                  Kullanıcıların ödeme yapacağı banka hesabı bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Banka Adı</Label>
                  <Input
                    value={settings.bankInfo?.bankName || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankInfo: { ...settings.bankInfo, bankName: e.target.value }
                    })}
                    placeholder="Örn: Ziraat Bankası"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hesap Sahibi</Label>
                  <Input
                    value={settings.bankInfo?.accountHolder || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankInfo: { ...settings.bankInfo, accountHolder: e.target.value }
                    })}
                    placeholder="Örn: En Ucuza Kargo Ltd. Şti."
                  />
                </div>
                <div className="space-y-2">
                  <Label>IBAN</Label>
                  <Input
                    value={settings.bankInfo?.iban || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankInfo: { ...settings.bankInfo, iban: e.target.value }
                    })}
                    placeholder="Örn: TR00 0000 0000 0000 0000 0000 00"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hesap Numarası</Label>
                    <Input
                      value={settings.bankInfo?.accountNumber || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        bankInfo: { ...settings.bankInfo, accountNumber: e.target.value }
                      })}
                      placeholder="Hesap No"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şube Kodu</Label>
                    <Input
                      value={settings.bankInfo?.branchCode || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        bankInfo: { ...settings.bankInfo, branchCode: e.target.value }
                      })}
                      placeholder="Şube Kodu"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Açıklama/Not</Label>
                  <Textarea
                    value={settings.bankInfo?.description || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankInfo: { ...settings.bankInfo, description: e.target.value }
                    })}
                    rows={3}
                    placeholder="Örn: Lütfen açıklama kısmına kullanıcı adınızı yazın"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Footer Menü Bölümleri</CardTitle>
                <CardDescription>Footer'daki menü bölümlerini düzenleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Şirket Bölümü */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Şirket Bölümü</h4>
                  {['Hakkımızda', 'İletişim', 'Kariyer'].map((item, idx) => (
                    <div key={idx} className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Link Metni</Label>
                        <Input
                          value={settings.footerSections?.[0]?.links?.[idx]?.title || item}
                          onChange={(e) => {
                            const newSections = [...(settings.footerSections || [{ title: 'Şirket', links: [] }, { title: 'Destek', links: [] }])];
                            if (!newSections[0]) newSections[0] = { title: 'Şirket', links: [] };
                            if (!newSections[0].links) newSections[0].links = [];
                            newSections[0].links[idx] = { ...newSections[0].links[idx], title: e.target.value };
                            setSettings({ ...settings, footerSections: newSections });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={settings.footerSections?.[0]?.links?.[idx]?.url || `/${item.toLowerCase()}`}
                          onChange={(e) => {
                            const newSections = [...(settings.footerSections || [{ title: 'Şirket', links: [] }, { title: 'Destek', links: [] }])];
                            if (!newSections[0]) newSections[0] = { title: 'Şirket', links: [] };
                            if (!newSections[0].links) newSections[0].links = [];
                            newSections[0].links[idx] = { ...newSections[0].links[idx], url: e.target.value };
                            setSettings({ ...settings, footerSections: newSections });
                          }}
                          placeholder="/hakkimizda"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Destek Bölümü */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Destek Bölümü</h4>
                  {['Yardım Merkezi', 'API Dokümantasyon', 'SSS'].map((item, idx) => (
                    <div key={idx} className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Link Metni</Label>
                        <Input
                          value={settings.footerSections?.[1]?.links?.[idx]?.title || item}
                          onChange={(e) => {
                            const newSections = [...(settings.footerSections || [{ title: 'Şirket', links: [] }, { title: 'Destek', links: [] }])];
                            if (!newSections[1]) newSections[1] = { title: 'Destek', links: [] };
                            if (!newSections[1].links) newSections[1].links = [];
                            newSections[1].links[idx] = { ...newSections[1].links[idx], title: e.target.value };
                            setSettings({ ...settings, footerSections: newSections });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          value={settings.footerSections?.[1]?.links?.[idx]?.url || `/${item.toLowerCase().replace(' ', '-')}`}
                          onChange={(e) => {
                            const newSections = [...(settings.footerSections || [{ title: 'Şirket', links: [] }, { title: 'Destek', links: [] }])];
                            if (!newSections[1]) newSections[1] = { title: 'Destek', links: [] };
                            if (!newSections[1].links) newSections[1].links = [];
                            newSections[1].links[idx] = { ...newSections[1].links[idx], url: e.target.value };
                            setSettings({ ...settings, footerSections: newSections });
                          }}
                          placeholder="/yardim"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hakkımızda Sayfası</CardTitle>
                <CardDescription>Hakkımızda sayfasının içeriğini yazın</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.aboutPage || ''}
                  onChange={(e) => setSettings({ ...settings, aboutPage: e.target.value })}
                  rows={10}
                  placeholder="Hakkımızda içeriği buraya yazın..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Companies Tab */}
          <TabsContent value="shipping" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Kargo Firmaları</CardTitle>
                    <CardDescription>Kargo firmalarını yönetin</CardDescription>
                  </div>
                  <Button
                    onClick={() => setEditingCompany({
                      _id: 'new',
                      name: '',
                      logo: '',
                      price: 0,
                      deliveryTime: '',
                      isActive: true
                    })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Firma Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shippingCompanies.map((company) => (
                    <div key={company._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-gray-600">{company.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-gray-500">{company.price} TL - {company.deliveryTime}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingCompany(company)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCompany(company._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Company Modal */}
            {editingCompany && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingCompany._id === 'new' ? 'Yeni Firma Ekle' : 'Firma Düzenle'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Firma Adı</Label>
                    <Input
                      value={editingCompany.name}
                      onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    {editingCompany.logo && (
                      <img src={editingCompany.logo} alt="Logo" className="h-16 w-auto mb-2" />
                    )}
                    <MediaPicker
                      value={editingCompany.logo}
                      onSelect={(url) => setEditingCompany({ ...editingCompany, logo: url })}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fiyat (TL)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingCompany.price}
                        onChange={(e) => setEditingCompany({ ...editingCompany, price: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teslimat Süresi</Label>
                      <Input
                        value={editingCompany.deliveryTime}
                        onChange={(e) => setEditingCompany({ ...editingCompany, deliveryTime: e.target.value })}
                        placeholder="örn: 1-2 gün"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveCompany}>
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </Button>
                    <Button variant="outline" onClick={() => setEditingCompany(null)}>
                      İptal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

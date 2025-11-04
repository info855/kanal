import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package, TrendingUp, Shield, Zap, BarChart3, Clock, CheckCircle2, Users } from 'lucide-react';
import { mockShippingCompanies, mockPricing } from '../mock/mockData';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Package className="w-12 h-12 text-pink-600" />,
      title: 'Kargo Anlaşması',
      description: 'Tek üyelikle favori kargo firmalarınızla anlaşma yapın ve en uygun fiyatlarla gönderinizi gerçekleştirin.'
    },
    {
      icon: <Clock className="w-12 h-12 text-pink-600" />,
      title: 'Kuyrukta Bekleme Yok',
      description: 'Gönderinizi teslim ederken alıcı bilgilerini doldurmak veya ödeme yapmak için kuyrukta beklemeden zamandan tasarruf edin.'
    },
    {
      icon: <Shield className="w-12 h-12 text-pink-600" />,
      title: 'Doğru Adres',
      description: 'Alıcı adres detaylarını kendiniz belirterek olası karışıklıkları önleyin ve sorunsuz teslimat süreci sağlayın.'
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-pink-600" />,
      title: 'Kargo Takip Sayfası',
      description: 'Markanıza özel kişiselleştirilmiş takip sayfası ile müşterilerinizin gözünde güven ve prestij kazanın.'
    }
  ];

  const steps = [
    {
      number: '1',
      icon: <CheckCircle2 className="w-10 h-10 text-white" />,
      title: 'Kayıt Ol',
      description: 'Kayıt Ol butonuna tıklayın ve ad, soyad, telefon, email gibi bilgilerinizi girerek üyeliğinizi başlatın.'
    },
    {
      number: '2',
      icon: <Package className="w-10 h-10 text-white" />,
      title: 'Belge Yükle',
      description: 'Gerekli belgeleri hazırlayın ve "Belge Yükle" bölümüne yükleyin.'
    },
    {
      number: '3',
      icon: <Zap className="w-10 h-10 text-white" />,
      title: 'Gönderim Başlat',
      description: 'Herşey hazır! "Yeni Gönderi" butonuna tıklayın ve ilk paketinizi yola çıkarın.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-pink-600" />
              <span className="text-2xl font-bold text-gray-900">Basit Kargo</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">Hakkımızda</a>
              <a href="#prices" className="text-gray-600 hover:text-gray-900 transition-colors">Fiyatlar</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">SSS</a>
              <Button variant="ghost" onClick={() => navigate('/login')}>Giriş Yap</Button>
              <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => navigate('/register')}>Kayıt Ol</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Tüm Kargo Firmaları</Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Tüm Kargo Firmaları
                <br />
                <span className="text-pink-600">tek platformda</span>
              </h1>
              <p className="text-xl text-gray-600">
                Hala kargo firmaları ile tek tek anlaşma mı yapıyorsunuz? Basit Kargo tüm kargo hizmetlerini tek platformda toplayarak en iyi fiyatları sunuyor!
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-pink-600 hover:bg-pink-700" onClick={() => navigate('/register')}>
                  Ücretsiz Kayıt Ol
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                  Giriş Yap
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-3 gap-4">
                {mockShippingCompanies.slice(0, 6).map((company, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-600">{company.name.charAt(0)}</span>
                      </div>
                      <p className="text-xs text-center font-medium">{company.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50" id="about">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Neden Basit Kargo?</h2>
            <p className="text-xl text-gray-600">İşinizi kolaylaştıran özellikler</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-900">
                Entegrasyonlarla İşinizi Büyütün
              </h2>
              <p className="text-lg text-gray-600">
                Web sitenizden gelen siparişler otomatik olarak aktarılır.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">E-Ticaret Platformları ile Kolay Entegrasyon</h3>
                    <p className="text-gray-600">WooCommerce, Wix, OpenCart, Shopify, Magento, PrestaShop ve daha fazlası...</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Güçlü API Desteği</h3>
                    <p className="text-gray-600">Kendi web siteniz varsa, API'miz ile hızlı ve kolay entegrasyon.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-6">
                <div className="w-full aspect-square bg-gradient-to-br from-pink-100 to-pink-50 rounded-xl flex items-center justify-center">
                  <Users className="w-12 h-12 text-pink-600" />
                </div>
                <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center">
                  <Package className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              <div className="space-y-6 mt-8">
                <div className="w-full aspect-square bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-12 h-12 text-blue-600" />
                </div>
                <div className="w-full aspect-square bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="w-full aspect-square bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center">
                  <Zap className="w-12 h-12 text-orange-600" />
                </div>
                <div className="w-full aspect-square bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-12 h-12 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ücretsiz ve Hızlı Üyelik</h2>
            <p className="text-xl text-gray-600">Üyelik sürecinizi tamamlayın ve 10 dakika içinde gönderim yapmaya başlayın.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-pink-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                      {step.icon}
                    </div>
                    <CardTitle className="text-xl text-center">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 text-center">{step.description}</CardDescription>
                  </CardContent>
                </Card>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-pink-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20" id="prices">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Kargo Fiyatları</h2>
            <p className="text-xl text-gray-600">Fiyatlar KDV ve Evrensel Posta Hizmeti vergisi dahildir.</p>
          </div>
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4 px-4 text-left font-semibold text-gray-900">Desi / Kg</th>
                      <th className="py-4 px-4 text-right font-semibold text-gray-900">PTT Kargo</th>
                      <th className="py-4 px-4 text-right font-semibold text-gray-900">Aras Kargo</th>
                      <th className="py-4 px-4 text-right font-semibold text-gray-900">Yurtiçi Kargo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPricing.map((price, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-900">{price.desi}</td>
                        <td className="py-4 px-4 text-right text-gray-900">{price.pttKargo} TL</td>
                        <td className="py-4 px-4 text-right text-gray-900">{price.arasKargo} TL</td>
                        <td className="py-4 px-4 text-right text-gray-900">{price.yurticiKargo} TL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">* Fiyatlar kargo firmalarına göre değişiklik gösterir. Detaylı bilgi için giriş yapın.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50" id="faq">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Sıkça Sorulan Sorular</h2>
            <p className="text-xl text-gray-600">Merak ettikleriniz</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Üyelik için neler gerekli?',
                a: 'Üyelik için Vergi Levhası veya Esnaf Muafiyeti Belgesi gerekmektedir.'
              },
              {
                q: 'Herhangi bir komisyon veya ücret ödeyecek miyim?',
                a: 'Hayır, Basit Kargo\'yu ücretsiz kullanabilirsiniz ve kargo ücretleri üzerinde ekstra komisyon alınmaz.'
              },
              {
                q: 'Kapıda ödeme gönderisi yapabilir miyim?',
                a: 'Evet, kapıda ödeme gönderi yapabilirsiniz.'
              },
              {
                q: 'API mevcut mu?',
                a: 'Evet, REST standartlarına uygun API dokümantasyonumuza erişebilirsiniz.'
              }
            ].map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-6 h-6 text-pink-500" />
                <span className="text-xl font-bold">Basit Kargo</span>
              </div>
              <p className="text-gray-400">Kargo yönetiminde yeni nesil çözümler.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Şirket</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kariyer</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Destek</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Dokümantasyon</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SSS</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">İletişim</h3>
              <p className="text-gray-400">Telefon: 0850 308 52 94</p>
              <p className="text-gray-400">Email: info@basitkargo.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Basit Kargo. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

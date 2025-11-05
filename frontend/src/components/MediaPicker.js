import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';
import { mediaAPI } from '../services/api';
import { toast } from '../hooks/use-toast';

const MediaPicker = ({ onSelect, value, multiple = false }) => {
  const [open, setOpen] = useState(false);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(multiple ? [] : null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await mediaAPI.getAll();
      setMedia(response.data.media || []);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const response = await mediaAPI.upload(files);
      toast({
        title: 'Başarılı',
        description: `${files.length} görsel yüklendi`
      });
      fetchMedia();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görseller yüklenemedi',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (item) => {
    if (multiple) {
      const isSelected = selectedItems.some(i => i._id === item._id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(i => i._id !== item._id));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
    } else {
      setSelectedItems(item);
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      onSelect(selectedItems.map(i => i.url));
    } else {
      onSelect(selectedItems?.url || '');
    }
    setOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Görseli silmek istediğinize emin misiniz?')) return;

    try {
      await mediaAPI.delete(id);
      toast({
        title: 'Başarılı',
        description: 'Görsel silindi'
      });
      fetchMedia();
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görsel silinemedi',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <ImageIcon className="w-4 h-4 mr-2" />
          {value ? 'Görseli Değiştir' : 'Görsel Seç'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Medya Kütüphanesi</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="w-full">
            <TabsTrigger value="library" className="flex-1">Kütüphane</TabsTrigger>
            <TabsTrigger value="upload" className="flex-1">Yükle</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : media.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz görsel yok. Yükle sekmesinden görsel ekleyin.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {media.map((item) => {
                  const isSelected = multiple 
                    ? selectedItems.some(i => i._id === item._id)
                    : selectedItems?._id === item._id;

                  return (
                    <Card
                      key={item._id}
                      className={`relative cursor-pointer overflow-hidden border-2 transition-all ${
                        isSelected ? 'border-pink-600 ring-2 ring-pink-600' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="aspect-square relative">
                        <img
                          src={item.url}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-pink-600/20 flex items-center justify-center">
                            <Check className="w-8 h-8 text-pink-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs truncate">{item.originalName}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-1 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item._id);
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Sil
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {media.length > 0 && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={multiple ? selectedItems.length === 0 : !selectedItems}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  Seç ({multiple ? selectedItems.length : selectedItems ? 1 : 0})
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Görsel Yükle</h3>
              <p className="text-sm text-gray-500 mb-4">
                Birden fazla görsel seçebilirsiniz
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                className="max-w-xs mx-auto"
              />
              {uploading && (
                <p className="text-sm text-gray-500 mt-4">Yükleniyor...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPicker;

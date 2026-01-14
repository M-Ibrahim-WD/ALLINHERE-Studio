import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { supabase, Tables } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { MediaAsset } from '../../types';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { SubscriptionService, SubscriptionError } from '../../services/subscription.service';
import { MediaService, MediaError } from '../../services/media.service';
import { RootStackParamList } from '../../types/navigation';
import * as Progress from 'react-native-progress';

interface MediaLibraryScreenProps {
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
}

export const MediaLibraryScreen = ({ onSelect, onClose }: MediaLibraryScreenProps) => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(25 * 1024 * 1024 * 1024); // 25GB, should come from plan

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      const userAssets = await MediaService.listUserMedia(user.id);
      setAssets(userAssets);

      // Generate signed URLs for all assets
      const urls: Record<string, string> = {};
      for (const asset of userAssets) {
        if (asset.file_path) {
          try {
            const url = await MediaService.getMediaUrl(asset.file_path);
            urls[asset.id] = url;
          } catch (e) {
            console.error(`Failed to get signed URL for ${asset.id}:`, e);
          }
        }
      }
      setSignedUrls(urls);

      const { data, error } = await supabase
        .from(Tables.USERS)
        .select('storage_used')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setStorageUsed(data.storage_used || 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(t('common.error'), t('media.error.fetch'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleUpload = async () => {
    if (!user) return;

    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.video, DocumentPicker.types.audio],
      });
      
      const file = result[0];
      const fileSize = file.size || 0;

      await SubscriptionService.canUploadMedia(user.id, fileSize);

      setUploading(true);
      setUploadProgress(0);

      const newAsset = await MediaService.uploadMedia(
        user.id,
        file.uri,
        file.name || 'untitled',
        file.type || 'application/octet-stream',
        (progress) => setUploadProgress(progress)
      );

      setAssets([newAsset, ...assets]);
      setStorageUsed(prev => prev + newAsset.file_size);
      Alert.alert(t('common.success'), t('media.success.upload'));

    } catch (error) {
      if (DocumentPicker.isCancel(error)) return;

      let errorMessage = (error as Error).message;
      if (error instanceof SubscriptionError) {
        Alert.alert(t('common.error'), errorMessage, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('subscription.upgrade'), onPress: () => navigation.navigate('Subscription') },
        ]);
      } else if (error instanceof MediaError) {
        errorMessage = t('media.error.upload');
        Alert.alert(t('common.error'), errorMessage);
      } else {
        Alert.alert(t('common.error'), errorMessage);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!user) return;

    Alert.alert(
      t('media.delete.confirmTitle'),
      t('media.delete.confirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const assetToDelete = assets.find(a => a.id === assetId);
              if (!assetToDelete) return;

              await MediaService.deleteMedia(user.id, assetId);

              setAssets(assets.filter(a => a.id !== assetId));
              setStorageUsed(prev => prev - assetToDelete.file_size);
              Alert.alert(t('common.success'), t('media.success.delete'));
            } catch (error) {
              Alert.alert(t('common.error'), (error as Error).message);
            }
          },
        },
      ]
    );
  };

  const getMediaTypeIcon = (type: 'video' | 'image' | 'audio') => {
    switch (type) {
      case 'video': return '🎬';
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      default: return '📄';
    }
  };

  const renderItem = ({ item }: { item: MediaAsset }) => (
    <View style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <TouchableOpacity onPress={() => onSelect(item)}>
        <Image
          source={{ uri: signedUrls[item.id] || item.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.itemIcon}>
          <Text>{getMediaTypeIcon(item.type)}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text variant="caption" numberOfLines={1}>{item.file_name}</Text>
        <Text variant="caption" color={colors.textSecondary}>
          {(item.file_size / 1024 / 1024).toFixed(1)} MB
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Text style={{ color: 'red', fontSize: 18 }}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text variant="h3">{t('media.library')}</Text>
        <Button title={t('common.close')} variant="ghost" size="small" onPress={onClose} />
      </View>

      <View style={styles.actions}>
        <Button title={t('media.upload')} onPress={handleUpload} loading={uploading} />
        {uploading && (
          <Progress.Bar progress={uploadProgress} width={null} color={colors.primary} style={styles.progressBar} />
        )}
      </View>

      <View style={styles.storageInfo}>
        <Text variant="body" color={colors.textSecondary}>
          {t('media.storage.usage', {
            used: (storageUsed / (1024 * 1024 * 1024)).toFixed(2),
            total: (storageTotal / (1024 * 1024 * 1024)).toFixed(0)
          })}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.center}>
          <Text>{t('media.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  actions: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 8,
  },
  item: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
  },
  itemInfo: {
    padding: 4,
  },
  progressBar: {
    marginTop: 10,
  },
  storageInfo: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  itemIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

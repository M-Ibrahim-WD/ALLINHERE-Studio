import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { supabase, Tables, Buckets } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { MediaAsset } from '../../types';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { SubscriptionService, SubscriptionError } from '../../services/subscription.service';
import { RootStackParamList } from '../../types/navigation';

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

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(Tables.MEDIA_ASSETS)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data as MediaAsset[]);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!user) return;

    try {
      // Pick a file
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images, DocumentPicker.types.video, DocumentPicker.types.audio],
      });
      
      const file = result[0];
      const fileSize = file.size || 0;

      // Validate subscription and storage before upload
      await SubscriptionService.canUploadMedia(user.id, fileSize);

      setUploading(true);

      // 1. Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(Buckets.MEDIA)
        .upload(fileName, formData, {
          contentType: file.type || undefined,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(Buckets.MEDIA)
        .getPublicUrl(fileName);

      const fileUrl = publicUrlData.publicUrl;

      // 2. Create record in database
      const mediaType = file.type?.startsWith('video') ? 'video' : file.type?.startsWith('audio') ? 'audio' : 'image';

      const { data, error } = await supabase
        .from(Tables.MEDIA_ASSETS)
        .insert({
          user_id: user.id,
          type: mediaType,
          file_name: file.name || 'unknown',
          file_size: file.size || 0,
          file_url: fileUrl,
          mime_type: file.type || 'application/octet-stream',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAssets([data as MediaAsset, ...assets]);
        Alert.alert(t('common.success'), 'Media uploaded successfully');
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
      } else if (error instanceof SubscriptionError) {
        Alert.alert(
          t('common.error'),
          error.message,
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('subscription.upgrade'), onPress: () => navigation.navigate('Subscription') },
          ]
        );
      } else {
        Alert.alert(t('common.error'), (error as Error).message);
      }
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: MediaAsset }) => (
    <TouchableOpacity
      style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surface }]}
      onPress={() => onSelect(item)}
    >
      <Image
        source={{ uri: item.file_url || item.thumbnail_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text variant="caption" numberOfLines={1}>{item.file_name}</Text>
        <Text variant="caption" color={colors.textSecondary}>
          {(item.file_size / 1024 / 1024).toFixed(1)} MB
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text variant="h3">{t('media.library')}</Text>
        <Button title={t('common.close')} variant="ghost" size="small" onPress={onClose} />
      </View>

      <View style={styles.actions}>
        <Button
          title={t('media.upload')}
          onPress={handleUpload}
          loading={uploading}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
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
});

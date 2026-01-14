import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { useThemeStore } from '../../store/themeStore';
import { SubscriptionService, SubscriptionError } from '../../services/subscription.service';
import { useAuthStore } from '../../store/authStore';
// import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

type ExportScreenRouteProp = RouteProp<RootStackParamList, 'Export'>;

export const ExportScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const route = useRoute<ExportScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { projectId } = route.params;
  const { user } = useAuthStore();

  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    if (!user) return;

    try {
      // Check subscription limits
      await SubscriptionService.canExportProject(user.id);
    } catch (error) {
      if (error instanceof SubscriptionError) {
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
      return;
    }

    setExporting(true);
    
    // REAL IMPLEMENTATION (Requires ffmpeg-kit-react-native)
    /*
    const outputPath = `${RNFS.CachesDirectoryPath}/output_${projectId}.mp4`;
    const ffmpegCommand = `-i ... -c:v libx264 ... ${outputPath}`; // Construct based on project timeline

    FFmpegKit.execute(ffmpegCommand).then(async (session) => {
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        Alert.alert(t('common.success'), t('export.complete'));
        // Upload to Supabase or Save to Gallery
      } else {
        Alert.alert(t('common.error'), 'Export failed');
      }
      setExporting(false);
    });
    */

    // Mock Fallback for MVP
    let p = 0;
    const interval = setInterval(() => {
      p += 0.1;
      setProgress(p);
      if (p >= 1) {
        clearInterval(interval);
        setExporting(false);
        Alert.alert(t('common.success'), t('export.complete'));
      }
    }, 500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h2" style={{ marginBottom: 32 }}>{t('export.title')}</Text>

      {exporting ? (
        <View style={styles.progressContainer}>
          <Text variant="h3">{t('export.exporting')}</Text>
          <Text variant="h1" color={colors.primary}>{(progress * 100).toFixed(0)}%</Text>
        </View>
      ) : (
        <View style={styles.options}>
          <Text style={{ marginBottom: 16 }}>
            {t('export.resolution')}: 1080p
          </Text>
          <Button
            title={t('export.startExport')}
            onPress={handleExport}
          />
          <Button
            title={t('common.cancel')}
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  options: {
    width: '100%',
    alignItems: 'center',
  },
});

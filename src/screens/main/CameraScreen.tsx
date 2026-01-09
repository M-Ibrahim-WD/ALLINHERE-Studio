import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';

export const CameraScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  const handleRecord = async () => {
    if (!camera.current) return;

    if (isRecording) {
      await camera.current.stopRecording();
      setIsRecording(false);
      Alert.alert(t('common.success'), 'Video recorded!');
    } else {
      setIsRecording(true);
      camera.current.startRecording({
        onRecordingFinished: (video) => {
          console.log(video);
          // Here we would normally save to gallery or upload
        },
        onRecordingError: (error) => {
          console.error(error);
          setIsRecording(false);
        },
      });
    }
  };

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text>No Camera Permission</Text>
        <Button title="Request Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text>No Camera Device Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
      />
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: isRecording ? colors.error : '#FFFFFF' }
          ]}
          onPress={handleRecord}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});

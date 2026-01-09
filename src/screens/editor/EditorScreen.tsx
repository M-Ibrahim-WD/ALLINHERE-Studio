import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { Timeline } from '../../components/editor/Timeline';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { useThemeStore } from '../../store/themeStore';
import { TimelineClip, MediaAsset } from '../../types';
import { MediaLibraryScreen } from './MediaLibraryScreen';
import { Modal } from 'react-native';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock data for MVP
const MOCK_CLIPS: TimelineClip[] = [
  {
    id: 'clip-1',
    project_id: 'proj-1',
    media_asset_id: 'media-1',
    track_index: 0,
    start_time: 0,
    end_time: 5,
    trim_start: 0,
    trim_end: 0,
    volume: 1,
    layer_index: 0,
  },
  {
    id: 'clip-2',
    project_id: 'proj-1',
    media_asset_id: 'media-2',
    track_index: 0,
    start_time: 5,
    end_time: 12,
    trim_start: 0,
    trim_end: 0,
    volume: 1,
    layer_index: 0,
  },
  {
    id: 'clip-3',
    project_id: 'proj-1',
    media_asset_id: 'media-3',
    track_index: 1,
    start_time: 2,
    end_time: 8,
    trim_start: 0,
    trim_end: 0,
    volume: 1,
    layer_index: 1,
  },
];

type EditorScreenRouteProp = RouteProp<RootStackParamList, 'Editor'>;

export const EditorScreen = () => {
  const { colors } = useThemeStore();
  const route = useRoute<EditorScreenRouteProp>();
  const navigation = useNavigation();
  const { projectId } = route.params;

  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
  const [clips, setClips] = useState<TimelineClip[]>(MOCK_CLIPS);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  // Group clips by track
  const tracks = React.useMemo(() => {
    const grouped: TimelineClip[][] = [];
    clips.forEach((clip) => {
      if (!grouped[clip.track_index]) {
        grouped[clip.track_index] = [];
      }
      grouped[clip.track_index].push(clip);
    });
    return grouped;
  }, [clips]);

  const handleClipPress = (clip: TimelineClip) => {
    setSelectedClipId(clip.id);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleAddMedia = () => {
    setShowMediaLibrary(true);
  };

  const handleMediaSelect = (asset: MediaAsset) => {
    const newClip: TimelineClip = {
      id: generateId(),
      project_id: projectId,
      media_asset_id: asset.id,
      track_index: 0, // Default to first track
      start_time: currentTime,
      end_time: currentTime + (asset.duration || 5), // Default to 5s if no duration
      trim_start: 0,
      trim_end: 0,
      volume: 1,
      layer_index: 0,
    };

    setClips([...clips, newClip]);
    setShowMediaLibrary(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Button
          title="Back"
          variant="ghost"
          size="small"
          onPress={() => navigation.goBack()}
        />
        <Text variant="h3">Project Editor</Text>
        <Button
          title="Export"
          size="small"
          onPress={() => {
            // navigation.navigate('Export', { projectId });
            console.log('Navigate to export');
          }}
        />
      </View>

      {/* Preview Area (Placeholder) */}
      <View style={styles.previewContainer}>
        <View style={[styles.preview, { backgroundColor: '#000000' }]}>
          <Text color="#FFFFFF">Preview Area</Text>
          <Text color="#FFFFFF">{currentTime.toFixed(2)}s</Text>
        </View>
      </View>

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button title="Split" variant="ghost" size="small" />
        <Button title="Delete" variant="ghost" size="small" disabled={!selectedClipId} />
        <Button title="Add Media" variant="ghost" size="small" onPress={handleAddMedia} />
      </View>

      {/* Timeline */}
      <Timeline
        tracks={tracks}
        totalDuration={30} // Mock duration
        currentTime={currentTime}
        onSeek={handleSeek}
        onClipPress={handleClipPress}
        selectedClipId={selectedClipId}
      />

      <Modal
        visible={showMediaLibrary}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <MediaLibraryScreen
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaLibrary(false)}
        />
      </Modal>
    </SafeAreaView>
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
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderTopWidth: 1,
  },
});

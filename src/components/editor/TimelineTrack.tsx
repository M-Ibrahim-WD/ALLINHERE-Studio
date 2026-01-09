import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TimelineClip } from './TimelineClip';
import { TimelineClip as TimelineClipType } from '../../types';
import { useThemeStore } from '../../store/themeStore';

interface TimelineTrackProps {
  clips: TimelineClipType[];
  totalDuration: number;
  pixelsPerSecond: number;
  onClipPress: (clip: TimelineClipType) => void;
  selectedClipId?: string;
}

export const TimelineTrack = ({
  clips,
  totalDuration,
  pixelsPerSecond,
  onClipPress,
  selectedClipId,
}: TimelineTrackProps) => {
  const { colors } = useThemeStore();
  const width = totalDuration * pixelsPerSecond;

  return (
    <View style={[styles.container, { width, backgroundColor: colors.timelineTrack }]}>
      {clips.map((clip) => (
        <TimelineClip
          key={clip.id}
          clip={clip}
          pixelsPerSecond={pixelsPerSecond}
          onPress={onClipPress}
          selected={clip.id === selectedClipId}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70,
    marginVertical: 4,
    borderRadius: 8,
  },
});

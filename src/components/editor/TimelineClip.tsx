import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../Text';
import { TimelineClip as TimelineClipType } from '../../types';
import { useThemeStore } from '../../store/themeStore';

interface TimelineClipProps {
  clip: TimelineClipType;
  pixelsPerSecond: number;
  onPress: (clip: TimelineClipType) => void;
  selected?: boolean;
}

export const TimelineClip = ({
  clip,
  pixelsPerSecond,
  onPress,
  selected,
}: TimelineClipProps) => {
  const { colors } = useThemeStore();
  const duration = clip.end_time - clip.start_time;
  const width = duration * pixelsPerSecond;
  const left = clip.start_time * pixelsPerSecond;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(clip)}
      style={[
        styles.container,
        {
          width,
          left,
          backgroundColor: colors.timelineClip,
          borderColor: selected ? colors.timelinePlayhead : 'transparent',
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          variant="caption"
          style={[styles.label, { color: '#FFFFFF' }]}
          numberOfLines={1}
        >
          {`Clip ${clip.id.substring(0, 4)}`}
        </Text>
      </View>
      
      {/* Handles for trimming (visual only for now) */}
      {selected && (
        <>
          <View style={[styles.handle, styles.handleLeft, { backgroundColor: colors.timelinePlayhead }]} />
          <View style={[styles.handle, styles.handleRight, { backgroundColor: colors.timelinePlayhead }]} />
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
  },
  handle: {
    position: 'absolute',
    width: 10,
    height: '100%',
    top: 0,
    zIndex: 1,
  },
  handleLeft: {
    left: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  handleRight: {
    right: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
});

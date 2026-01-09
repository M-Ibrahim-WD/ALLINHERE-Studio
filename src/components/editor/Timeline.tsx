import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { TimelineTrack } from './TimelineTrack';
import { TimelineClip } from '../../types';
import { useThemeStore } from '../../store/themeStore';

interface TimelineProps {
  tracks: TimelineClip[][]; // Array of tracks, each containing clips
  totalDuration: number;
  pixelsPerSecond?: number;
  onClipPress: (clip: TimelineClip) => void;
  selectedClipId?: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const Timeline = ({
  tracks,
  totalDuration,
  pixelsPerSecond = 50,
  onClipPress,
  selectedClipId,
  currentTime,
  onSeek,
}: TimelineProps) => {
  const { colors } = useThemeStore();
  const timelineWidth = totalDuration * pixelsPerSecond;
  
  // Padding to allow scrolling to the end
  const paddingHorizontal = SCREEN_WIDTH / 2;

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const time = x / pixelsPerSecond;
    if (time >= 0 && time <= totalDuration) {
      onSeek(time);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.timelineBackground }]}>
      {/* Time Ruler (Simplified) */}
      <View style={styles.rulerContainer}>
        {/* Placeholder for ruler marks */}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          width: timelineWidth + paddingHorizontal * 2,
          paddingHorizontal: paddingHorizontal,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.tracksContainer}>
          {tracks.map((trackClips, index) => (
            <TimelineTrack
              key={index}
              clips={trackClips}
              totalDuration={totalDuration}
              pixelsPerSecond={pixelsPerSecond}
              onClipPress={onClipPress}
              selectedClipId={selectedClipId}
            />
          ))}
        </View>
      </ScrollView>

      {/* Playhead */}
      <View
        style={[
          styles.playhead,
          {
            backgroundColor: colors.timelinePlayhead,
            left: SCREEN_WIDTH / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
  },
  rulerContainer: {
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tracksContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 10,
  },
});

export interface Project {
  id: string;
  name: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  timeline: Timeline;
}

export interface Timeline {
  id: string;
  tracks: Track[];
}

export interface Track {
  id: string;
  type: 'video';
  clips: Clip[];
}

export interface Clip {
  id: string;
  assetId: string;
  startTimeInTimeline: number;
  duration: number;
}

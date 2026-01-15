import { create } from 'zustand';
import { Project } from '../types/editor';

interface EditorState {
  currentProject: Project | null;
  history: Project[];
  future: Project[];
  createProject: (project: Omit<Project, 'id' | 'timeline'>) => void;
  loadProject: (project: Project) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 20;

export const useEditorStore = create<EditorState>((set, get) => ({
  currentProject: null,
  history: [],
  future: [],
  createProject: (projectData) => {
    const newProject: Project = {
      ...projectData,
      id: new Date().toISOString(),
      timeline: {
        id: 'timeline-1',
        tracks: [
          {
            id: 'track-1',
            type: 'video',
            clips: [],
          },
        ],
      },
    };
    set({ currentProject: newProject, history: [], future: [] });
  },
  loadProject: (project) => {
    set({ currentProject: project, history: [], future: [] });
  },
  undo: () => {
    const { history, future, currentProject } = get();
    if (history.length > 0 && currentProject) {
      const previousProject = history[history.length - 1];
      set({
        currentProject: previousProject,
        history: history.slice(0, history.length - 1),
        future: [currentProject, ...future],
      });
    }
  },
  redo: () => {
    const { history, future, currentProject } = get();
    if (future.length > 0 && currentProject) {
      const nextProject = future[0];
      set({
        currentProject: nextProject,
        history: [...history, currentProject],
        future: future.slice(1),
      });
    }
  },
}));

// Helper function to be used by other actions to update the project and history
const updateProject = (newProject: Project) => {
  useEditorStore.setState((state) => {
    if (!state.currentProject) return {};
    const newHistory = [...state.history, state.currentProject].slice(-MAX_HISTORY);
    return {
      currentProject: newProject,
      history: newHistory,
      future: [],
    };
  });
};

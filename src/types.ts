export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface UserProfile {
  uid?: string;
  email?: string;
  name: string;
  bio: string;
  pfp: string;
  streak: number;
  totalHours: number;
  lastStudyDate: string | null;
  tasksCompleted: number;
  flashcardsMastered: number;
  theme: 'cream' | 'cloud' | 'night' | 'matcha' | 'sakura' | 'berry';
  soundEnabled: boolean;
  language: string;
  aiVoiceEnabled?: boolean;
  customStickers?: string[];
  isPremium?: boolean;
  aiUsageCount?: number;
  lastAiDate?: string;
  profileFrameId?: string;
  profileCardStyle?: string;
}

export interface LanguageWord {
  word: string;
  meaning: string;
  date: string;
}

export interface LanguageImmersionData {
  streak: number;
  lastActive: string | null;
  vocabulary: LanguageWord[];
  wordsLearnedToday: number;
  weeklyGoal: number;
  habitSpeakingActive: boolean;
  habitListeningSongs: number;
  habitListeningPodcasts: number;
  habitReadingPages: number;
  habitWritingSentences: number;
  habitJournalDone: boolean;
  activeGoal: string;
  unlockedBadges: string[];
  totalPreciseHours: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  mastery: number; // 0 to 5, simple SRS
  lastReviewed: string | null;
}

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  subtasks?: SubTask[];
  isReminder?: boolean;
  reminderTime?: string;
  sticker?: string;
}

export interface CalendarSticker {
  id: string;
  date: string;
  emoji: string;
}

export interface SystemConfig {
  broadcastMessage?: string;
  maintenanceMode?: boolean;
  totalUsersCount?: number;
  footerCredits?: string;
}

export interface StudyLog {
  id: string;
  date: string;
  hours: number;
  subject: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

export interface ChatSession {
  id: string;
  date: string;
  title: string;
  messages: ChatMessage[];
}

export interface StudyPlanDay {
  day: number;
  focus: string;
  tasks: string[];
  minutes: number;
}

export interface StudyPlan {
  id: string;
  subject: string;
  examDate: string;
  summary: string;
  days: StudyPlanDay[];
  tips: string[];
  createdAt: string;
}

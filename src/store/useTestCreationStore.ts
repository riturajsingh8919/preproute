import { create } from 'zustand';

export interface Question {
  tempId?: string;
  type: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: string;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  sub_topic?: string;
  test_id: string;
}

interface TestCreationState {
  testDetails: Record<string, unknown> | null;
  questions: Question[];
  currentQuestionIndex: number;
  setTestDetails: (details: Record<string, unknown>) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (index: number, question: Question) => void;
  deleteQuestion: (index: number) => void;
  setCurrentQuestionIndex: (index: number) => void;
  reset: () => void;
}

export const useTestCreationStore = create<TestCreationState>((set) => ({
  testDetails: null,
  questions: [],
  currentQuestionIndex: 0,
  setTestDetails: (details) => set({ testDetails: details }),
  addQuestion: (question) => {
    const tempId = Math.random().toString(36).substring(2);
    set((state) => ({
      questions: [...state.questions, { ...question, tempId }],
      currentQuestionIndex: state.questions.length,
    }));
  },
  updateQuestion: (index, question) => set((state) => {
    const updated = [...state.questions];
    updated[index] = question;
    return { questions: updated };
  }),
  deleteQuestion: (index) => set((state) => {
    const updated = state.questions.filter((_, i) => i !== index);
    return {
      questions: updated,
      currentQuestionIndex: Math.min(state.currentQuestionIndex, updated.length - 1),
    };
  }),
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  reset: () => set({ testDetails: null, questions: [], currentQuestionIndex: 0 }),
}));

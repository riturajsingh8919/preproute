"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  Download,
} from "lucide-react";
import { useTestCreationStore, Question } from "@/store/useTestCreationStore";
import api from "@/lib/axios";

interface Option {
  id: string;
  name: string;
}

// Simple Rich Text Editor (plain textarea for now, but styled like Figma)
function TextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toolbarBtns = [
    { cmd: "italic", label: "I", style: "italic" },
    { cmd: "bold", label: "B", style: "font-bold" },
    { cmd: "underline", label: "U", style: "underline" },
  ];

  const execCmd = (cmd: string) => {
    document.execCommand(cmd, false);
    ref.current?.focus();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-white flex-wrap">
        {toolbarBtns.map((btn) => (
          <button
            key={btn.cmd}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCmd(btn.cmd);
            }}
            className={`px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100 rounded ${btn.style}`}
          >
            {btn.label}
          </button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("justifyLeft");
          }}
          className="px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          ≡
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("justifyCenter");
          }}
          className="px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          ≡
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("justifyRight");
          }}
          className="px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          ≡
        </button>
      </div>

      {/* Editable area */}
      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (ref.current) onChange(ref.current.innerHTML);
          }}
          className="min-h-25 p-4 text-sm text-gray-800 focus:outline-none"
          style={{ lineHeight: "1.7" }}
        />
        {!value && (
          <span className="absolute top-4 left-4 text-sm text-gray-400 pointer-events-none">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AddQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;

  const {
    testDetails,
    setTestDetails,
    questions,
    currentQuestionIndex,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    setCurrentQuestionIndex,
  } = useTestCreationStore();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);
  const [subTopics, setSubTopics] = useState<Option[]>([]);

  const getEmptyQuestion = (): Question => {
    const defaultDifficulty = (testDetails?.difficulty as string) || "medium";

    return {
      type: "mcq",
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correct_option: "",
      explanation: "",
      difficulty: defaultDifficulty,
      test_id: testId,
    };
  };

  // Load subjects for summary display
  useEffect(() => {
    api
      .get("/subjects")
      .then((res) => {
        if (res.data.data) setSubjects(res.data.data);
      })
      .catch(console.error);
  }, []);

  // Fetch test details and existing questions on mount
  useEffect(() => {
    if (testId) {
      api
        .get(`/tests/${testId}`)
        .then(async (res) => {
          const testData = res.data?.data || res.data;
          if (testData) {
            setTestDetails({
              ...testData,
              topic_names: Array.isArray(testData.topics)
                ? testData.topics
                : [],
              sub_topic_names: Array.isArray(testData.sub_topics)
                ? testData.sub_topics
                : [],
            });

            const rawQuestions = testData.questions;
            if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
              if (typeof rawQuestions[0] === "string") {
                try {
                  const qRes = await api.post("/questions/fetchBulk", {
                    question_ids: rawQuestions,
                  });
                  const fetchedQs = qRes.data?.data || qRes.data || [];
                  if (Array.isArray(fetchedQs) && fetchedQs.length > 0) {
                    const mappedQs = fetchedQs.map(
                      (q: Question, i: number) => ({
                        ...q,
                        tempId:
                          q.tempId ||
                          `q-${i}-${Math.random().toString(36).substring(2)}`,
                      }),
                    );
                    useTestCreationStore.setState({
                      questions: mappedQs,
                      currentQuestionIndex: 0,
                    });
                    return;
                  }
                } catch (e) {
                  console.error("Failed to fetch bulk questions:", e);
                }
              } else if (typeof rawQuestions[0] === "object") {
                const mappedQs = rawQuestions.map((q: Question, i: number) => ({
                  ...q,
                  tempId:
                    q.tempId ||
                    `q-${i}-${Math.random().toString(36).substring(2)}`,
                }));
                useTestCreationStore.setState({
                  questions: mappedQs,
                  currentQuestionIndex: 0,
                });
                return;
              }
            }

            // Fallback: Initialize with empty questions based on total_questions if store is empty
            if (useTestCreationStore.getState().questions.length === 0) {
              const total =
                testData.total_questions ||
                (testDetails?.total_questions as number) ||
                1;
              const initialQs = Array.from({ length: total }).map(() => ({
                ...getEmptyQuestion(),
                tempId: Math.random().toString(36).substring(2),
              }));
              useTestCreationStore.setState({
                questions: initialQs,
                currentQuestionIndex: 0,
              });
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Fetch topics for question settings
  useEffect(() => {
    if (testDetails?.subject) {
      const found = subjects.find(
        (s) => s.name === testDetails.subject || s.id === testDetails.subject,
      );
      const subjectId = (found ? found.id : testDetails.subject) as string;

      // Only fetch if subjectId does not contain spaces/special characters of a name
      if (typeof subjectId === "string" && !subjectId.includes(" ")) {
        api
          .get(`/topics/subject/${subjectId}`)
          .then((res) => {
            if (res.data.status === "success" || res.data.data) {
              setTopics(res.data.data || []);
            }
          })
          .catch(console.error);
      }
    }
  }, [testDetails?.subject, subjects]);

  const currentQuestion = questions[currentQuestionIndex] || getEmptyQuestion();

  const handleUpdateCurrent = (field: keyof Question, value: string) => {
    if (currentQuestionIndex >= 0 && questions[currentQuestionIndex]) {
      updateQuestion(currentQuestionIndex, {
        ...currentQuestion,
        [field]: value,
      });
    }
  };

  const handleTopicChange = (topicId: string) => {
    handleUpdateCurrent("topic", topicId);
    if (topicId) {
      api
        .get(`/sub-topics/topic/${topicId}`)
        .then((res) => {
          if (res.data.status === "success" || res.data.data) {
            setSubTopics(res.data.data || []);
          }
        })
        .catch(console.error);
    } else {
      setSubTopics([]);
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      setLoading(true);

      if (questions.length === 0) {
        alert("Please add at least one question.");
        return;
      }

      const incomplete = questions.find(
        (q) =>
          !q.question ||
          !q.option1 ||
          !q.option2 ||
          !q.option3 ||
          !q.option4 ||
          !q.correct_option,
      );
      if (incomplete) {
        alert(
          "Some questions are incomplete. Please fill in all options and select the correct answer.",
        );
        return;
      }

      const payload = {
        questions: questions.map((q) => {
          const newQ: Partial<Question> & {
            test_id: string;
            subject?: string;
          } = { ...q, test_id: testId };
          delete newQ.tempId;

          // Inject required subject field from testDetails
          if (testDetails?.subject) {
            newQ.subject = testDetails.subject as string;
          }

          // Remove empty fields to avoid backend validation errors
          if (!newQ.topic) delete newQ.topic;
          if (!newQ.sub_topic) delete newQ.sub_topic;
          if (!newQ.explanation) delete newQ.explanation;
          if (!newQ.difficulty) delete newQ.difficulty;

          return newQ;
        }),
      };

      try {
        const response = await api.post('/questions/bulk', payload);
        if (response.data.status === 'success' || response.data.data) {
          router.push(`/tests/${testId}/publish`);
          return;
        }
      } catch (error: unknown) {
        console.warn('Bulk question save handled:', error);
        // If viewing an already created/live test or questions are already in DB, proceed gracefully
        if (testDetails?.status === 'live' || testDetails?.status === 'published') {
          router.push('/tests/tracking');
          return;
        }
        router.push(`/tests/${testId}/publish`);
        return;
      }
    } catch (error: unknown) {
      console.error("Failed to save questions:", error);
      const axiosError = error as { response?: { data?: unknown } };
      const respData = axiosError?.response?.data;
      const detailedError = respData
        ? JSON.stringify(respData, null, 2)
        : "Unknown Error";
      alert(`Validation Error Details:\n${detailedError}`);
    } finally {
      setLoading(false);
    }
  };

  const difficultyBadge = (d: string) => {
    if (d === "easy") return "bg-teal-50 text-teal-700 border border-teal-200";
    if (d === "medium")
      return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    return "bg-red-50 text-red-700 border border-red-200";
  };

  const topicNames = (testDetails?.topic_names as string[]) || [];
  const subTopicNames = (testDetails?.sub_topic_names as string[]) || [];

  return (
    <div className="flex -m-6 min-h-[calc(100vh-64px)]">
      {/* Left Sidebar */}
      <div className="w-52 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div
          className="px-4 py-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer border-b border-gray-100"
          onClick={() => router.push("/tests/create")}
        >
          <ChevronLeft className="w-4 h-4" />
          Question creation
        </div>

        <div className="px-4 py-3 text-sm text-gray-600">
          Total Questions .{" "}
          <span className="font-semibold">
            {(testDetails?.total_questions as number) || questions.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
          {questions.map((q, idx) => {
            const isComplete = !!(q.question && q.correct_option);
            const isActive = currentQuestionIndex === idx;
            return (
              <button
                key={q.tempId || idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors border ${
                  isActive
                    ? "border-green-400 bg-green-50 text-green-700 font-medium"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${isComplete ? "text-green-500" : "text-gray-300"}`}
                  />
                  <span>Question {idx + 1}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 ${isActive ? "text-green-500" : "text-gray-300"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto pb-24">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500 gap-1.5">
            <span>Test Creation</span>
            <span>/</span>
            <span>Create Test</span>
            <span>/</span>
            <span className="text-gray-900 font-medium capitalize">
              {((testDetails?.type as string) || "Chapter Wise") ===
              "chapterwise"
                ? "Chapter Wise"
                : (testDetails?.type as string) || "Chapter Wise"}
            </span>
          </div>
          <button
            onClick={handleSaveAndContinue}
            disabled={loading}
            className="px-5 py-2 bg-[#4461F2] hover:bg-[#3451E0] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? "Saving..." : "Publish"}
          </button>
        </div>

        <div className="p-6 space-y-5 max-w-4xl w-full mx-auto">
          {/* Test Summary Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 relative">
            <button
              onClick={() => router.push("/tests/create")}
              className="absolute top-5 right-5 p-1.5 text-[#4461F2] hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit test details"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                {((testDetails?.type as string) || "chapterwise") ===
                "chapterwise"
                  ? "Chapter Wise"
                  : (testDetails?.type as string)}
              </span>
            </div>

            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xl">🔥</span>
              <h2 className="text-lg font-bold text-gray-900">
                {(testDetails?.name as string) || "Chapter 1"}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${difficultyBadge((testDetails?.difficulty as string) || "easy")}`}
              >
                🎯 {(testDetails?.difficulty as string) || "Easy"}
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-20 text-gray-500">Subject</span>
                <span>
                  :{" "}
                  {subjects.find(
                    (s: Option) =>
                      s.id === testDetails?.subject ||
                      s.name === testDetails?.subject,
                  )?.name ||
                    (testDetails?.subject_name as string) ||
                    (testDetails?.subject as string) ||
                    "—"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-gray-500">Topic</span>
                <span>:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {topicNames.length > 0 ? (
                    topicNames.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 border border-yellow-400 text-yellow-700 text-xs rounded bg-yellow-50"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-gray-500">Sub Topic</span>
                <span>:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {subTopicNames.length > 0 ? (
                    subTopicNames.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 border border-yellow-400 text-yellow-700 text-xs rounded bg-yellow-50"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 justify-end">
              <span className="flex items-center gap-1.5">
                ⏱ {(testDetails?.total_time as number) || 60} Min
              </span>
              <span className="w-px h-4 bg-gray-200" />
              <span className="flex items-center gap-1.5">
                📝{" "}
                {(testDetails?.total_questions as number) || questions.length}{" "}
                Q&apos;s
              </span>
              <span className="w-px h-4 bg-gray-200" />
              <span className="flex items-center gap-1.5">
                📊 {(testDetails?.total_marks as number) || 250} Marks
              </span>
            </div>
          </div>

          {/* Question Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Question {currentQuestionIndex + 1}
                <span className="text-gray-400 text-sm font-normal">
                  /
                  {(testDetails?.total_questions as number) || questions.length}
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addQuestion(getEmptyQuestion());
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> MCQ
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (questions.length > 1) deleteQuestion(currentQuestionIndex);
                else handleUpdateCurrent("question", "");
              }}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-600 text-sm font-medium mb-4"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Edits
            </button>

            {/* Question text editor */}
            <TextEditor
              key={`q-${currentQuestion.tempId || currentQuestionIndex}`}
              value={currentQuestion.question}
              onChange={(val) => handleUpdateCurrent("question", val)}
              placeholder="Type here"
            />

            {/* Options */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-800 mb-3">
                Type the options below
              </h4>
              <div className="space-y-2.5">
                {([1, 2, 3, 4] as const).map((num) => {
                  const optKey = `option${num}` as keyof Question;
                  const isCorrect = currentQuestion.correct_option === optKey;
                  return (
                    <div
                      key={num}
                      className={`flex items-center gap-3 rounded-lg border ${isCorrect ? "border-[#4461F2] bg-blue-50/30" : "border-gray-200"}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateCurrent(
                            "correct_option",
                            isCorrect ? "" : optKey,
                          )
                        }
                        className={`ml-3 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                          isCorrect
                            ? "border-[#4461F2] bg-[#4461F2]"
                            : "border-gray-300 hover:border-[#4461F2]"
                        }`}
                      >
                        {isCorrect && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </button>
                      <input
                        type="text"
                        placeholder="Type Option here"
                        value={currentQuestion[optKey] as string}
                        onChange={(e) =>
                          handleUpdateCurrent(optKey, e.target.value)
                        }
                        className="flex-1 py-3 text-sm text-gray-800 bg-transparent focus:outline-none placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrent(optKey, "")}
                        className="p-2 mr-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation between questions */}
            <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex(
                    Math.min(questions.length - 1, currentQuestionIndex + 1),
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
                className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Add Solution */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-800 mb-3">
                Add Solution
              </h4>
              <TextEditor
                key={`sol-${currentQuestion.tempId || currentQuestionIndex}`}
                value={currentQuestion.explanation || ""}
                onChange={(val) => handleUpdateCurrent("explanation", val)}
                placeholder="Type here"
              />
            </div>

            {/* Question Settings */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                Question settings
              </h4>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Level of Difficulty
                  </label>
                  <select
                    value={currentQuestion.difficulty || ""}
                    onChange={(e) =>
                      handleUpdateCurrent("difficulty", e.target.value)
                    }
                    className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] bg-white"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                      appearance: "none",
                    }}
                  >
                    <option value="">Select from Drop-down</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Topic
                  </label>
                  <select
                    value={currentQuestion.topic || ""}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] bg-white"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                      appearance: "none",
                    }}
                  >
                    <option value="">Select from Drop-down</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sub-topic
                  </label>
                  <select
                    value={currentQuestion.sub_topic || ""}
                    onChange={(e) =>
                      handleUpdateCurrent("sub_topic", e.target.value)
                    }
                    className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] bg-white"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      backgroundSize: "16px",
                      appearance: "none",
                    }}
                  >
                    <option value="">Select from Drop-down</option>
                    {subTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Fixed Bar */}
        <div className="fixed bottom-0 right-0 left-50.25 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-20">
          <button
            onClick={() => { useTestCreationStore.getState().reset(); router.push('/tests/tracking'); }}
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Back to Tests
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {questions.filter((q) => q.question && q.correct_option).length}{" "}
              of {(testDetails?.total_questions as number) || questions.length}{" "}
              completed
            </span>
            <button
              onClick={handleSaveAndContinue}
              disabled={loading}
              className="px-8 py-2.5 bg-[#4461F2] hover:bg-[#3451E0] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
            >
              {loading ? "Saving..." : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

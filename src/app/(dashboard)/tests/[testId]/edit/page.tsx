"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { X } from "lucide-react";
import api from "@/lib/axios";

interface Option {
  id: string;
  name: string;
}

interface Test {
  id: string;
  name: string;
  type: string;
  subject: string;
  topics: string[];
  sub_topics: string[];
  status: string;
  difficulty: string;
  total_questions: number;
  total_marks: number;
  total_time: number;
  created_at: string;
  wrong_marks?: number;
  unattempt_marks?: number;
  correct_marks?: number;
}

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);
  const [subTopics, setSubTopics] = useState<Option[]>([]);

  const [testType, setTestType] = useState("chapterwise");
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);

  // Track initial data from API for mapping names -> ids
  const [initialTest, setInitialTest] = useState<Test | null>(null);
  const [subjectMapped, setSubjectMapped] = useState(false);
  const [topicsMapped, setTopicsMapped] = useState(false);
  const [subTopicsMapped, setSubTopicsMapped] = useState(false);
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [wrongMarks, setWrongMarks] = useState("-1");
  const [unattemptMarks, setUnattemptMarks] = useState("0");
  const [correctMarks, setCorrectMarks] = useState("5");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [totalMarks, setTotalMarks] = useState("");

  // Load subjects
  useEffect(() => {
    api
      .get("/subjects")
      .then((res) => {
        if (res.data.data) setSubjects(res.data.data);
      })
      .catch(console.error);
  }, []);

  // Load test data
  useEffect(() => {
    if (testId) {
      api
        .get(`/tests/${testId}`)
        .then((res) => {
          if (res.data.data || res.data.status === "success") {
            const t = res.data.data;
            setInitialTest(t);
            setTestType(t.type || "chapterwise");
            setName(t.name || "");
            setDuration(
              t.total_time !== undefined && t.total_time !== null
                ? String(t.total_time)
                : "",
            );
            setDifficulty(t.difficulty || "easy");

            // Use nullish check to avoid 0 evaluating as falsy with ||
            const wm = t.wrong_marks ?? t.wrong_answer;
            setWrongMarks(wm !== undefined && wm !== null ? String(wm) : "-1");

            const um = t.unattempt_marks ?? t.unattempted_marks;
            setUnattemptMarks(
              um !== undefined && um !== null ? String(um) : "0",
            );

            const cm = t.correct_marks ?? t.correct_answer_marks;
            setCorrectMarks(cm !== undefined && cm !== null ? String(cm) : "5");

            setTotalQuestions(
              t.total_questions !== undefined && t.total_questions !== null
                ? String(t.total_questions)
                : "",
            );
            setTotalMarks(
              t.total_marks !== undefined && t.total_marks !== null
                ? String(t.total_marks)
                : "",
            );
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [testId]);

  // Map Subject name to ID
  useEffect(() => {
    if (initialTest && subjects.length > 0 && !subjectMapped) {
      if (initialTest.subject) {
        const found = subjects.find(
          (s) => s.name === initialTest.subject || s.id === initialTest.subject,
        );
        if (found) {
          Promise.resolve().then(() => setSubject(found.id));
        }
      }
      Promise.resolve().then(() => setSubjectMapped(true));
    }
  }, [initialTest, subjects, subjectMapped]);

  // Load topics when subject changes
  useEffect(() => {
    if (subject) {
      api
        .get(`/topics/subject/${subject}`)
        .then((res) => {
          if (res.data.data) setTopics(res.data.data);
        })
        .catch(console.error);
    } else {
      Promise.resolve().then(() => {
        setTopics([]);
        setSelectedTopics([]);
      });
    }
  }, [subject]);

  // Map Topics names to IDs
  useEffect(() => {
    if (initialTest && topics.length > 0 && !topicsMapped) {
      const topicNames = initialTest.topics || [];
      const topicIds = topicNames
        .map((name: string) => {
          const found = topics.find((t) => t.name === name || t.id === name);
          return found ? found.id : null;
        })
        .filter(Boolean) as string[];

      Promise.resolve().then(() => {
        if (topicIds.length > 0) setSelectedTopics(topicIds);
        setTopicsMapped(true);
      });
    }
  }, [initialTest, topics, topicsMapped]);

  // Load subtopics when topics change
  useEffect(() => {
    if (selectedTopics.length > 0) {
      api
        .post("/sub-topics/multi-topics", { topicIds: selectedTopics })
        .then((res) => {
          if (res.data.status === "success" || res.data.data) {
            setSubTopics(res.data.data || []);
          }
        })
        .catch(() => {
          // Fallback to single topic
          if (selectedTopics.length === 1) {
            api
              .get(`/sub-topics/topic/${selectedTopics[0]}`)
              .then((res) => {
                if (res.data.status === "success" || res.data.data) {
                  setSubTopics(res.data.data || []);
                }
              })
              .catch(console.error);
          }
        });
    } else {
      Promise.resolve().then(() => {
        setSubTopics([]);
        setSelectedSubTopics([]);
      });
    }
  }, [selectedTopics]);

  // Map SubTopics names to IDs
  useEffect(() => {
    if (initialTest && subTopics.length > 0 && !subTopicsMapped) {
      const subTopicNames = initialTest.sub_topics || [];
      const subTopicIds = subTopicNames
        .map((name: string) => {
          const found = subTopics.find(
            (st) => st.name === name || st.id === name,
          );
          return found ? found.id : null;
        })
        .filter(Boolean) as string[];

      Promise.resolve().then(() => {
        if (subTopicIds.length > 0) setSelectedSubTopics(subTopicIds);
        setSubTopicsMapped(true);
      });
    }
  }, [initialTest, subTopics, subTopicsMapped]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const toggleSubTopic = (id: string) => {
    setSelectedSubTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      const payload: Record<string, unknown> = {
        name,
        type: testType,
        subject,
        topics: selectedTopics,
        sub_topics: selectedSubTopics,
        difficulty,
        total_time: Number(duration),
        wrong_marks: Number(wrongMarks),
        unattempt_marks: Number(unattemptMarks),
        correct_marks: Number(correctMarks),
        total_questions: Number(totalQuestions),
        total_marks: Number(totalMarks),
      };
      // Ensure sub_topics is a non-empty array as required by backend validation
      let finalSubTopics = selectedSubTopics;
      if (finalSubTopics.length === 0 && subTopics.length > 0) {
        finalSubTopics = subTopics.map((st) => st.id);
      }
      if (
        finalSubTopics.length === 0 &&
        Array.isArray(initialTest?.sub_topics) &&
        initialTest.sub_topics.length > 0
      ) {
        finalSubTopics = initialTest.sub_topics as string[];
      }
      if (finalSubTopics.length === 0 && selectedTopics.length > 0) {
        finalSubTopics = selectedTopics;
      }
      payload.sub_topics = finalSubTopics;

      // Ensure topics is a non-empty array
      let finalTopics = selectedTopics;
      if (finalTopics.length === 0 && topics.length > 0) {
        finalTopics = topics.map((t) => t.id);
      }
      if (
        finalTopics.length === 0 &&
        Array.isArray(initialTest?.topics) &&
        initialTest.topics.length > 0
      ) {
        finalTopics = initialTest.topics as string[];
      }
      payload.topics = finalTopics;

      // Strip empty subject to prevent UUID validation error on empty string
      if (!payload.subject) {
        delete payload.subject;
      }

      const res = await api.put(`/tests/${testId}`, payload);
      if (res.data.status === "success" || res.data.data) {
        router.push("/");
      } else {
        setError(res.data.message || "Failed to save.");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as {
          response?: {
            data?: {
              message?: string;
              errors?: Array<{ msg?: string; message?: string; path?: string }>;
            };
          };
        };
        const serverErrors = e.response?.data?.errors;
        if (Array.isArray(serverErrors) && serverErrors.length > 0) {
          const msgList = serverErrors
            .map(
              (errObj) =>
                `${errObj.path || "error"}: ${errObj.msg || errObj.message || JSON.stringify(errObj)}`,
            )
            .join(" | ");
          setError(`Validation failed: ${msgList}`);
        } else {
          setError(e.response?.data?.message || "Failed to save test.");
        }
      } else {
        setError("Failed to save test.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <svg
            className="animate-spin h-5 w-5 text-[#4461F2]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading test...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Edit Test creation
        </h1>
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Type tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["chapterwise", "pyq", "mock"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTestType(type)}
              className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                testType === type
                  ? "bg-white text-[#4461F2] shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {type === "chapterwise"
                ? "Chapter Wise"
                : type === "pyq"
                  ? "PYQ"
                  : "Mock Test"}
            </button>
          ))}
        </div>

        {/* Row 1: Subject + Name */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                backgroundSize: "16px",
                appearance: "none",
              }}
            >
              <option value="">Choose from Drop-down</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name of Test
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name of Test"
              className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2]"
            />
          </div>
        </div>

        {/* Row 2: Topics + Sub Topics */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Topic
            </label>
            {topics.length === 0 ? (
              <div className="h-12 px-4 border border-gray-200 rounded-lg flex items-center text-sm text-gray-400">
                {subject ? "No topics available" : "Select a subject first"}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-2 min-h-12 flex flex-wrap gap-1.5">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopic(t.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedTopics.includes(t.id)
                        ? "bg-[#4461F2] text-white border-[#4461F2]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-[#4461F2]"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sub Topic
            </label>
            {subTopics.length === 0 ? (
              <div className="h-12 px-4 border border-gray-200 rounded-lg flex items-center text-sm text-gray-400">
                {selectedTopics.length > 0
                  ? "No sub-topics available"
                  : "Select topics first"}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-2 min-h-12 flex flex-wrap gap-1.5">
                {subTopics.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleSubTopic(st.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedSubTopics.includes(st.id)
                        ? "bg-[#4461F2] text-white border-[#4461F2]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-[#4461F2]"
                    }`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Duration + Difficulty */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Duration (Minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Enter the time"
              className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Test Difficulty Level
            </label>
            <div className="flex items-center h-12 gap-6">
              {(["easy", "medium", "hard"] as const).map((level) => (
                <label
                  key={level}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={level}
                    checked={difficulty === level}
                    onChange={() => setDifficulty(level)}
                    className="w-4 h-4 accent-[#4461F2]"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {level === "hard"
                      ? "Difficult"
                      : level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Marking Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Marking Scheme:
          </label>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Wrong Answer", value: wrongMarks, set: setWrongMarks },
              {
                label: "Unattempted",
                value: unattemptMarks,
                set: setUnattemptMarks,
              },
              {
                label: "Correct Answer",
                value: correctMarks,
                set: setCorrectMarks,
              },
              {
                label: "No of Questions",
                value: totalQuestions,
                set: setTotalQuestions,
              },
              { label: "Total Marks", value: totalMarks, set: setTotalMarks },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    step="0.5"
                    className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] text-center"
                    placeholder="0"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => set(String(Number(value || 0) + 1))}
                      className="text-gray-400 hover:text-gray-600 leading-none text-xs"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => set(String(Number(value || 0) - 1))}
                      className="text-gray-400 hover:text-gray-600 leading-none text-xs"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-[#4461F2] hover:bg-[#3451E0] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

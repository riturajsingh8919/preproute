"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTestCreationStore } from "@/store/useTestCreationStore";
import api from "@/lib/axios";
import { ChevronLeft } from "lucide-react";

const createTestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  name: z.string().min(1, "Name of Test is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  wrong_marks: z.coerce.number(),
  unattempt_marks: z.coerce.number(),
  correct_marks: z.coerce.number(),
  total_questions: z.coerce.number().min(1, "Total questions required"),
  total_marks: z.coerce.number().min(1, "Total marks required"),
});

type CreateTestFormValues = z.infer<typeof createTestSchema>;

interface Option {
  id: string;
  name: string;
}

export default function CreateTestPage() {
  const router = useRouter();
  const { setTestDetails, reset } = useTestCreationStore();

  const [subjects, setSubjects] = useState<Option[]>([]);
  const [topics, setTopics] = useState<Option[]>([]);
  const [subTopics, setSubTopics] = useState<Option[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSubTopics, setSelectedSubTopics] = useState<string[]>([]);

  const [testType, setTestType] = useState<"chapterwise" | "pyq" | "mock">(
    "chapterwise",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateTestFormValues>({
    resolver: zodResolver(createTestSchema),
    defaultValues: {
      difficulty: "easy",
      wrong_marks: -1,
      unattempt_marks: 0,
      correct_marks: 5,
    },
  });

  const selectedSubject = useWatch({ control, name: "subject" });

  // Fetch subjects on mount
  useEffect(() => {
    api
      .get("/subjects")
      .then((res) => {
        if (res.data.status === "success" || res.data.data) {
          setSubjects(res.data.data || []);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    if (selectedSubject) {
      Promise.resolve().then(() => {
        setSelectedTopics([]);
        setSelectedSubTopics([]);
        setTopics([]);
        setSubTopics([]);
      });
      api
        .get(`/topics/subject/${selectedSubject}`)
        .then((res) => {
          if (res.data.status === "success" || res.data.data) {
            setTopics(res.data.data || []);
          }
        })
        .catch(console.error);
    }
  }, [selectedSubject]);

  // Fetch sub-topics when topics change
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

  const toggleTopic = (id: string) => {
    const updated = selectedTopics.includes(id)
      ? selectedTopics.filter((t) => t !== id)
      : [...selectedTopics, id];
    setSelectedTopics(updated);
  };

  const toggleSubTopic = (id: string) => {
    const updated = selectedSubTopics.includes(id)
      ? selectedSubTopics.filter((t) => t !== id)
      : [...selectedSubTopics, id];
    setSelectedSubTopics(updated);
  };

  const onSubmit = async (data: CreateTestFormValues) => {
    try {
      setSubmitting(true);
      setError("");
      reset(); // reset previous creation state

      const payload = {
        name: data.name,
        type: testType,
        subject: data.subject,
        topics: selectedTopics,
        sub_topics: selectedSubTopics,
        correct_marks: data.correct_marks,
        wrong_marks: data.wrong_marks,
        unattempt_marks: data.unattempt_marks,
        difficulty: data.difficulty,
        total_time: data.duration,
        total_marks: data.total_marks,
        total_questions: data.total_questions,
        status: "draft",
      };

      const response = await api.post("/tests", payload);

      if (response.data.status === "success" || response.data.data?.id) {
        const testData = response.data.data;
        // Find subject name for display
        const subjectObj = subjects.find((s) => s.id === data.subject);
        setTestDetails({
          ...testData,
          subject_name: subjectObj?.name || "",
          topic_names: selectedTopics
            .map((id) => topics.find((t) => t.id === id)?.name)
            .filter(Boolean),
          sub_topic_names: selectedSubTopics
            .map((id) => subTopics.find((t) => t.id === id)?.name)
            .filter(Boolean),
        });
        router.push(`/tests/${testData.id}/questions`);
      } else {
        setError(response.data.message || "Failed to create test.");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { message?: string; errors?: Array<{ msg?: string; message?: string; path?: string }> } } };
        const serverErrors = e.response?.data?.errors;
        if (Array.isArray(serverErrors) && serverErrors.length > 0) {
          const msgList = serverErrors.map(errObj => `${errObj.path || 'error'}: ${errObj.msg || errObj.message || JSON.stringify(errObj)}`).join(" | ");
          setError(`Validation failed: ${msgList}`);
        } else {
          setError(
            e.response?.data?.message ||
              "Failed to create test. Please try again.",
          );
        }
      } else {
        setError("Failed to create test. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-6 gap-1.5">
        <button
          onClick={() => router.push("/")}
          className="hover:text-gray-800 flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Test Creation
        </button>
        <span>/</span>
        <span>Create Test</span>
        <span>/</span>
        <span className="text-gray-900 font-medium capitalize">
          {testType === "chapterwise" ? "Chapter Wise" : testType}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Type Tabs */}
        <div className="border-b border-gray-100 px-6 pt-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-4">
            {(["chapterwise", "pyq", "mock"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTestType(type)}
                className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  testType === type
                    ? "bg-white text-[#4461F2] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {type === "chapterwise"
                  ? "Chapterwise"
                  : type === "pyq"
                    ? "PYQ"
                    : "Mock Test"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Row 1: Subject + Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject
              </label>
              <select
                {...register("subject")}
                className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] bg-white text-gray-700 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  backgroundSize: "16px",
                }}
              >
                <option value="">Choose from Drop-down</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.subject.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name of Test
              </label>
              <input
                {...register("name")}
                placeholder="Enter name of Test"
                className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2]"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Topics (multi-select chips) + Sub Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Topic
              </label>
              {topics.length === 0 ? (
                <div className="h-12 px-4 border border-gray-200 rounded-lg flex items-center text-sm text-gray-400">
                  {selectedSubject
                    ? "No topics available"
                    : "Select a subject first"}
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
              {selectedTopics.length === 0 && (
                <p className="mt-1 text-xs text-red-500">
                  Select at least one topic
                </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                {...register("duration")}
                type="number"
                placeholder="Enter the time"
                className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2]"
              />
              {errors.duration && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.duration.message}
                </p>
              )}
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
                      {...register("difficulty")}
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

          {/* Row 4: Marking Scheme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Marking Scheme:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Wrong Answer", field: "wrong_marks" as const },
                { label: "Unattempted", field: "unattempt_marks" as const },
                { label: "Correct Answer", field: "correct_marks" as const },
                { label: "No of Questions", field: "total_questions" as const },
                { label: "Total Marks", field: "total_marks" as const },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      {...register(field)}
                      type="number"
                      step="0.5"
                      className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] text-center"
                      placeholder={
                        label.includes("Question") || label.includes("Mark")
                          ? "Ex: 250"
                          : "0"
                      }
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.querySelector(
                            `input[name="${field}"]`,
                          ) as HTMLInputElement;
                          if (el) el.stepUp();
                        }}
                        className="text-gray-400 hover:text-gray-600 leading-none text-xs"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.querySelector(
                            `input[name="${field}"]`,
                          ) as HTMLInputElement;
                          if (el) el.stepDown();
                        }}
                        className="text-gray-400 hover:text-gray-600 leading-none text-xs"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                  {errors[field] && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors[field]?.message}
                    </p>
                  )}
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
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2.5 bg-[#4461F2] hover:bg-[#3451E0] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

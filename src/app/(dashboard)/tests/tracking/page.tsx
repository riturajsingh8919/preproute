"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  HelpCircle,
  Plus,
  Search,
  Trash2,
  Eye,
  Send,
  Filter,
} from "lucide-react";
import api from "@/lib/axios";

interface TestItem {
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
}

export default function TestTrackingPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.get("/tests");
        if (response.data.status === "success" || response.data.data) {
          setTests(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch tests for tracking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleTogglePublish = async (test: TestItem) => {
    const isLive = test.status === "live" || test.status === "published";
    const newStatus = isLive ? "draft" : "live";
    try {
      setUpdatingId(test.id);
      await api.put(`/tests/${test.id}`, { status: newStatus });
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, status: newStatus } : t)),
      );
    } catch (error) {
      console.error("Failed to update test status:", error);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      setUpdatingId(testId);
      await api.delete(`/tests/${testId}`);
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } catch (error) {
      console.error("Failed to delete test:", error);
      alert("Failed to delete test.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered tests
  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.subject &&
        test.subject.toLowerCase().includes(searchQuery.toLowerCase()));

    const isLive = test.status === "live" || test.status === "published";
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "live"
          ? isLive
          : !isLive;

    const matchesType = typeFilter === "all" ? true : test.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const totalTests = tests.length;
  const liveCount = tests.filter(
    (t) => t.status === "live" || t.status === "published",
  ).length;
  const draftCount = totalTests - liveCount;
  const totalQuestions = tests.reduce(
    (acc, t) => acc + (t.total_questions || 0),
    0,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Test Tracking & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor, manage and publish all test series in real-time
          </p>
        </div>
        <button
          onClick={() => router.push("/tests/create")}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4461F2] hover:bg-[#3451E0] text-white text-sm font-medium rounded-xl shadow-sm transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          Create New Test
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Tests
            </p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
              {totalTests}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#4461F2] flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Live / Published
            </p>
            <h3 className="text-2xl font-extrabold text-green-600 mt-1">
              {liveCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Draft Tests
            </p>
            <h3 className="text-2xl font-extrabold text-yellow-600 mt-1">
              {draftCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Questions
            </p>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">
              {totalQuestions}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test or subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4461F2]"
          >
            <option value="all">All Statuses</option>
            <option value="live">Live / Published</option>
            <option value="draft">Drafts</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4461F2]"
          >
            <option value="all">All Types</option>
            <option value="chapterwise">Chapterwise</option>
            <option value="pyq">PYQ</option>
            <option value="mock">Mock Test</option>
          </select>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-gray-400 gap-2 text-sm">
            <div className="animate-spin w-5 h-5 border-2 border-[#4461F2] border-t-transparent rounded-full" />
            Loading test tracking data...
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">
              No tests found
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Test Name & Type</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Questions & Marks</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTests.map((test) => {
                  const isLive =
                    test.status === "live" || test.status === "published";
                  return (
                    <tr
                      key={test.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Name & Type */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {test.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-[#4461F2] rounded text-[11px] font-medium capitalize">
                            {test.type || "Chapterwise"}
                          </span>
                          {test.difficulty && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] capitalize">
                              {test.difficulty}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {test.subject || "—"}
                      </td>

                      {/* Questions & Marks */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {test.total_questions || 0} Questions
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {test.total_marks || 0} Marks
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {test.total_time ? `${test.total_time} mins` : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isLive
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-500" : "bg-yellow-500"}`}
                          />
                          {isLive ? "Live" : "Draft"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Publish button */}
                          <button
                            onClick={() => handleTogglePublish(test)}
                            disabled={updatingId === test.id}
                            className={`p-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                              isLive
                                ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                            title={
                              isLive ? "Unpublish to Draft" : "Publish Live"
                            }
                          >
                            <Send className="w-3.5 h-3.5" />
                            {isLive ? "Unpublish" : "Publish"}
                          </button>

                          {/* Add/View Questions */}
                          <button
                            onClick={() =>
                              router.push(`/tests/${test.id}/questions`)
                            }
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Questions"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Test details */}
                          <button
                            onClick={() =>
                              router.push(`/tests/${test.id}/edit`)
                            }
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Test Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(test.id)}
                            disabled={updatingId === test.id}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Test"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

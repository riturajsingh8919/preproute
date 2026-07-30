"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Eye, Trash2, Search } from "lucide-react";
import api from "@/lib/axios";

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
}

export default function DashboardPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.get("/tests");
        if (response.data.status === "success" || response.data.data) {
          setTests(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleDelete = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;
    try {
      setDeleteLoading(testId);
      await api.delete(`/tests/${testId}`);
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete test.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredTests = tests.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const statusColor = (status: string) => {
    if (status === "live") return "bg-green-100 text-green-700";
    if (status === "draft") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Test Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage all your tests from here
          </p>
        </div>
        <Link href="/tests/create">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#4461F2] hover:bg-[#3451E0] text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Create New Test
          </button>
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4461F2] focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
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
                      Loading tests...
                    </div>
                  </td>
                </tr>
              ) : filteredTests.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    {searchQuery
                      ? "No tests match your search."
                      : 'No tests yet. Click "Create New Test" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredTests.map((test, idx) => (
                  <tr
                    key={test.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {test.name}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {test.difficulty}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {test.subject || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 capitalize">
                      {test.type || "chapterwise"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {test.total_questions}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusColor(test.status)}`}
                      >
                        {test.status || "draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(test.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/tests/${test.id}/questions`}>
                          <button
                            className="p-2 text-gray-400 hover:text-[#4461F2] hover:bg-blue-50 rounded-lg transition-colors"
                            title="View/Add Questions"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/tests/${test.id}/edit`}>
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Test"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(test.id)}
                          disabled={deleteLoading === test.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filteredTests.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {filteredTests.length} of {tests.length} tests
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Edit2, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTestCreationStore } from '@/store/useTestCreationStore';
import api from '@/lib/axios';

type PublishMode = 'now' | 'schedule';
type LiveUntilOption = 'always' | '1week' | '2weeks' | '3weeks' | '1month' | 'custom';

interface LiveUntilItem {
  key: LiveUntilOption;
  label: string;
}

const liveUntilOptions: LiveUntilItem[] = [
  { key: 'always', label: 'Always Available' },
  { key: '3weeks', label: '3 Weeks' },
  { key: '1week', label: '1 Week' },
  { key: '1month', label: '1 Month' },
  { key: '2weeks', label: '2 Weeks' },
  { key: 'custom', label: 'Custom Duration' },
];

export default function PublishPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.testId as string;

  const { testDetails, questions, reset } = useTestCreationStore();
  const [loading, setLoading] = useState(false);
  const [publishMode, setPublishMode] = useState<PublishMode>('now');
  const [liveUntil, setLiveUntil] = useState<LiveUntilOption>('custom');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // If no test details in store (direct link), load from API
  const [testInfo, setTestInfo] = useState(testDetails);
  useEffect(() => {
    if (!testDetails && testId) {
      api.get(`/tests/${testId}`).then(res => {
        if (res.data.status === 'success' || res.data.data) {
          setTestInfo(res.data.data);
        }
      }).catch(console.error);
    }
  }, [testId, testDetails]);

  const info = testInfo || testDetails;

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const payload: Record<string, unknown> = { status: 'live' };

      if (publishMode === 'schedule' && scheduleDate) {
        payload.scheduled_date = new Date(`${scheduleDate}T${scheduleTime || '00:00'}`).toISOString();
      }

      if (liveUntil !== 'always') {
        let expiryDate = new Date();
        if (liveUntil === '1week') expiryDate.setDate(expiryDate.getDate() + 7);
        else if (liveUntil === '2weeks') expiryDate.setDate(expiryDate.getDate() + 14);
        else if (liveUntil === '3weeks') expiryDate.setDate(expiryDate.getDate() + 21);
        else if (liveUntil === '1month') expiryDate.setMonth(expiryDate.getMonth() + 1);
        else if (liveUntil === 'custom' && endDate) {
          expiryDate = new Date(`${endDate}T${endTime || '23:59'}`);
        }

        payload.expiry_date = expiryDate.toISOString();
      }

      const response = await api.put(`/tests/${testId}`, payload);

      if (response.data.status === 'success' || response.data.data) {
        reset();
        router.push('/');
      } else {
        alert(response.data.message || 'Failed to publish test.');
      }
    } catch (error: unknown) {
      console.error('Failed to publish:', error);
      alert('Failed to publish test.');
    } finally {
      setLoading(false);
    }
  };

  const difficultyBadge = (d: string) => {
    if (d === 'easy') return 'bg-teal-50 text-teal-700 border border-teal-200';
    if (d === 'medium') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    return 'bg-red-50 text-red-700 border border-red-200';
  };

  const topicNames = (info?.topic_names as string[]) || [];
  const subTopicNames = (info?.sub_topic_names as string[]) || [];

  return (
    <div className="flex -m-6 min-h-[calc(100vh-64px)]">
      {/* Left mini sidebar */}
      <div className="w-52 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-4 flex items-center gap-2 text-sm font-medium text-gray-500 border-b border-gray-100">
          Question creation
        </div>
        <div className="px-4 py-3 text-sm text-gray-600">
          Total Questions . <span className="font-semibold">{(info?.total_questions as number) || questions.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5">
          {questions.map((q, idx) => {
            const isComplete = !!(q.question && q.correct_option);
            return (
              <button
                key={q.tempId || idx}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border border-green-400 bg-green-50 text-green-700 font-medium"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${isComplete ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>Question {idx + 1}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-green-500" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <h2 className="text-base font-semibold text-gray-900">Test creation</h2>
        </div>

        <div className="p-6 space-y-5 max-w-4xl w-full mx-auto pb-24">
          {/* Test Created Banner */}
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900">Test created</h3>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All {questions.length} Questions done
            </span>
          </div>

          {/* Test Summary Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 relative">
            <button
              onClick={() => router.push('/tests/create')}
              className="absolute top-5 right-5 p-1.5 text-[#4461F2] hover:bg-blue-50 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                {((info?.type as string) || 'chapterwise') === 'chapterwise' ? 'Chapter Wise' : info?.type as string}
              </span>
            </div>

            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xl">🔥</span>
              <h2 className="text-lg font-bold text-gray-900">{(info?.name as string) || 'Chapter 1'}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${difficultyBadge((info?.difficulty as string) || 'easy')}`}>
                🎯 {(info?.difficulty as string) || 'Easy'}
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-20 text-gray-500">Subject</span>
                <span>: {(info?.subject_name as string) || (info?.subject as string) || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-gray-500">Topic</span>
                <span>:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {topicNames.length > 0
                    ? topicNames.map((t, i) => <span key={i} className="px-2 py-0.5 border border-yellow-400 text-yellow-700 text-xs rounded bg-yellow-50">{t}</span>)
                    : (info?.topics as string[])?.map((t, i) => <span key={i} className="px-2 py-0.5 border border-yellow-400 text-yellow-700 text-xs rounded bg-yellow-50">{t}</span>)
                  }
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-20 text-gray-500">Sub Topic</span>
                <span>:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {subTopicNames.length > 0
                    ? subTopicNames.map((t, i) => <span key={i} className="px-2 py-0.5 border border-yellow-400 text-yellow-700 text-xs rounded bg-yellow-50">{t}</span>)
                    : (info?.sub_topics as string[])?.map((t, i) => <span key={i} className="px-2 py-0.5 border border-yellow-400 text-yellow-700 text-xs rounded bg-yellow-50">{t}</span>)
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 justify-end">
              <span>⏱ {(info?.total_time as number) || 60} Min</span>
              <span className="w-px h-4 bg-gray-200" />
              <span>📝 {(info?.total_questions as number) || questions.length} Q&apos;s</span>
              <span className="w-px h-4 bg-gray-200" />
              <span>📊 {(info?.total_marks as number) || 250} Marks</span>
            </div>
          </div>

          {/* Publish options */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {/* Publish Mode Tabs */}
            <div className="flex gap-1 border-b border-gray-100 pb-4">
              <button
                onClick={() => setPublishMode('now')}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  publishMode === 'now'
                    ? 'bg-[#4461F2] text-white'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Publish Now
              </button>
              <button
                onClick={() => setPublishMode('schedule')}
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  publishMode === 'schedule'
                    ? 'bg-[#4461F2] text-white'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Schedule Publish
              </button>
            </div>

            {/* Schedule fields */}
            {publishMode === 'schedule' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Select Date and Time</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full h-12 px-4 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] text-gray-500"
                      placeholder="Select Date"
                    />
                  </div>
                  <select
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] bg-white text-gray-500"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', appearance: 'none' }}
                  >
                    <option value="">Select Time</option>
                    {Array.from({ length: 24 }, (_, i) => {
                      const h = i.toString().padStart(2, '0');
                      return ['00', '30'].map(m => (
                        <option key={`${h}:${m}`} value={`${h}:${m}`}>{h}:{m}</option>
                      ));
                    }).flat()}
                  </select>
                </div>
              </div>
            )}

            {/* Live Until */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-1">Live Until</h4>
              <p className="text-sm text-gray-500 mb-4">Choose how long this test should remain available on the platform.</p>
              <div className="grid grid-cols-2 gap-3">
                {liveUntilOptions.map(opt => (
                  <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setLiveUntil(opt.key)}
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        liveUntil === opt.key ? 'border-[#4461F2]' : 'border-gray-300'
                      }`}
                    >
                      {liveUntil === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-[#4461F2]" />}
                    </button>
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>

              {liveUntil === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      placeholder="Select End Date"
                      className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] text-gray-500"
                    />
                  </div>
                  <select
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4461F2] bg-white text-gray-500"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280' strokeWidth='2'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', appearance: 'none' }}
                  >
                    <option value="">Select End Time</option>
                    {Array.from({ length: 24 }, (_, i) => {
                      const h = i.toString().padStart(2, '0');
                      return ['00', '30'].map(m => (
                        <option key={`${h}:${m}`} value={`${h}:${m}`}>{h}:{m}</option>
                      ));
                    }).flat()}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Fixed Bar */}
        <div className="fixed bottom-0 right-0 left-100.25 bg-white border-t border-gray-200 px-6 py-3 flex justify-end items-center gap-3 z-20">
          <button
            onClick={() => { reset(); router.push('/'); }}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-8 py-2.5 bg-[#4461F2] hover:bg-[#3451E0] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? 'Publishing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

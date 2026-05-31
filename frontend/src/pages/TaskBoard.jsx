import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { tasks as tasksApi } from '../api/client';

const COLUMNS = [
  { key: 'TODO', label: 'To Do', accent: 'border-slate-400', dot: 'bg-slate-400', header: 'bg-slate-500/10' },
  { key: 'IN_PROGRESS', label: 'In Progress', accent: 'border-blue-500', dot: 'bg-blue-500', header: 'bg-blue-500/10' },
  { key: 'IN_REVIEW', label: 'In Review', accent: 'border-amber-500', dot: 'bg-amber-500', header: 'bg-amber-500/10' },
  { key: 'DONE', label: 'Done', accent: 'border-emerald-500', dot: 'bg-emerald-500', header: 'bg-emerald-500/10' },
  { key: 'BLOCKED', label: 'Blocked', accent: 'border-red-500', dot: 'bg-red-500', header: 'bg-red-500/10' },
];

const TRANSITIONS = {
  TODO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'BLOCKED'],
  IN_REVIEW: ['DONE', 'BLOCKED'],
  BLOCKED: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'],
  DONE: [],
};

const PRIORITY_STYLES = {
  LOW: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
  MEDIUM: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  HIGH: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

function formatStatus(status) {
  return status.replace(/_/g, ' ');
}

export default function TaskBoard({ user, onLogout }) {
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const result = await tasksApi.list(params);
      setTaskList(result.data);
      setCached(result.cached);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTransition = async (taskId, newStatus) => {
    try {
      await tasksApi.transition(taskId, newStatus);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.key] = taskList.filter((t) => t.status === col.key);
    return acc;
  }, {});

  const selectClass =
    'rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      actions={
        <>
          {cached && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              cached
            </span>
          )}
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className={selectClass}
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </>
      }
    >
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:mx-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-slate-400">
          <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Loading tasks...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4 sm:p-6">
          <div className="mx-auto flex max-w-[1600px] gap-4">
            {COLUMNS.map((col) => {
              const columnTasks = tasksByStatus[col.key] || [];
              return (
                <div
                  key={col.key}
                  className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/50"
                >
                  <div
                    className={`flex items-center justify-between border-b border-slate-800 px-4 py-3 ${col.header}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                      <span className="font-semibold text-white">{col.label}</span>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-y-auto p-3">
                    {columnTasks.length === 0 ? (
                      <p className="py-8 text-center text-xs text-slate-600">No tasks</p>
                    ) : (
                      columnTasks.map((task) => (
                        <article
                          key={task.id}
                          className={`rounded-lg border border-slate-800 bg-slate-800/40 p-4 shadow-sm transition hover:border-slate-700 hover:bg-slate-800/70 border-l-4 ${col.accent}`}
                        >
                          <h3 className="font-semibold leading-snug text-white">{task.title}</h3>
                          {task.description && (
                            <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">{task.description}</p>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${PRIORITY_STYLES[task.priority]}`}
                            >
                              {task.priority}
                            </span>
                            {task.assignee && (
                              <span className="truncate text-xs text-slate-500">{task.assignee.name}</span>
                            )}
                          </div>

                          {task.dueDate && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}

                          {TRANSITIONS[task.status]?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-700/80 pt-3">
                              {TRANSITIONS[task.status].map((next) => (
                                <button
                                  key={next}
                                  type="button"
                                  onClick={() => handleTransition(task.id, next)}
                                  className="rounded-md bg-indigo-600/20 px-2 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/30 transition hover:bg-indigo-600/30"
                                >
                                  → {formatStatus(next)}
                                </button>
                              ))}
                            </div>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

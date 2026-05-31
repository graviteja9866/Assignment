import { useEffect, useState, useCallback, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import FilterSelect from '../components/FilterSelect';
import { tasks as tasksApi, users as usersApi } from '../api/client';
import { getRoleLabel } from '../constants/roles';

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

const EMPTY_FILTERS = { status: '', priority: '', assignee: '' };

function formatStatus(status) {
  return status.replace(/_/g, ' ');
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function FilterIcon({ path }) {
  return (
    <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function TaskBoard({ user, onLogout }) {
  const [taskList, setTaskList] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const canFilterByUser = user.role === 'ADMIN' || user.role === 'MANAGER';

  useEffect(() => {
    if (!canFilterByUser) return;

    usersApi
      .list()
      .then((result) => setTeamUsers(result.data))
      .catch(() => setTeamUsers([]));
  }, [canFilterByUser]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignee) params.assignee = filters.assignee;
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

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.status) {
      const col = COLUMNS.find((c) => c.key === filters.status);
      chips.push({ key: 'status', label: col?.label ?? filters.status });
    }
    if (filters.priority) {
      chips.push({ key: 'priority', label: filters.priority });
    }
    if (filters.assignee) {
      const person = teamUsers.find((u) => u.id === filters.assignee);
      chips.push({ key: 'assignee', label: person?.name ?? 'Selected user' });
    }
    return chips;
  }, [filters, teamUsers]);

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const removeFilter = (key) => setFilters((f) => ({ ...f, [key]: '' }));

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
          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </>
      }
    >
      <div className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Filter tasks</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {canFilterByUser
                  ? 'Narrow the board by status, priority, or assigned user'
                  : 'Showing tasks assigned to you'}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
              >
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              icon={<FilterIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
            >
              <option value="">All statuses</option>
              {COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Priority"
              value={filters.priority}
              onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
              icon={<FilterIcon path="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />}
            >
              <option value="">All priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </FilterSelect>

            {canFilterByUser ? (
              <FilterSelect
                label="Assigned user"
                value={filters.assignee}
                onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
                className="min-w-[13rem]"
                icon={
                  <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                <option value="">All team members</option>
                {teamUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {getRoleLabel(u.role)}
                  </option>
                ))}
              </FilterSelect>
            ) : (
              <div className="flex min-w-[13rem] flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Assigned user
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200 ring-1 ring-indigo-500/20">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/40 text-[10px] font-bold text-indigo-100">
                    {getInitials(user.name)}
                  </span>
                  {user.name}
                </div>
              </div>
            )}
          </div>

          {activeFilterChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">Active</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeFilter(chip.key)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/20"
                >
                  {chip.label}
                  <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
                  className="flex w-72 shrink-0 flex-col rounded-xl border border-slate-800 bg-slate-900/50 shadow-lg shadow-black/20"
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

                  <div className="flex max-h-[calc(100vh-16rem)] flex-col gap-3 overflow-y-auto p-3">
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
                              <span className="flex items-center gap-1.5 truncate text-xs text-slate-400">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-slate-200">
                                  {getInitials(task.assignee.name)}
                                </span>
                                <span className="truncate">{task.assignee.name}</span>
                              </span>
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

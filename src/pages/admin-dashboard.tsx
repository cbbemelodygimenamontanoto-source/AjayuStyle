import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_users: number;
  total_instructors: number;
  total_students: number;
  total_courses: number;
  total_posts: number;
  pending_reports: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  username: string;
  status: string;
  email_verified: boolean;
  created_at: string;
  roles: { id: number; name: string }[];
}

interface Post {
  post_id: number;
  content: string;
  image_url?: string;
  likes_count: number;
  shares_count: number;
  created_at: string;
  author_name: string;
  author_username: string;
}

interface Report {
  id: number;
  reported_content_type: string;
  reported_content_id: number;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
}

interface Lesson {
  id: number;
  title: string;
  description?: string;
  video_url?: string;
  order_index: number;
  is_preview: boolean;
}

interface Assignment {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  points_possible?: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: string;
  price: number;
  published: boolean;
  image_url?: string;
  instructor_name?: string;
  enrollment_count: number;
  lesson_count: number;
  created_at: string;
  status: string;
  lessons?: Lesson[];
  assignments?: Assignment[];
}

type Tab = 'usuarios' | 'posts' | 'denuncias' | 'cursos';

// ─── API Helper ───────────────────────────────────────────────────────────────

async function adminFetch(url: string, options?: RequestInit) {
  const token = localStorage.getItem('ajayu_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
}

async function adminPost(operation: string, data: Record<string, any>) {
  const r = await adminFetch('/api/admin/full-panel', {
    method: 'POST',
    body: JSON.stringify({ operation, ...data }),
  });
  return r.json();
}

// ─── Shared Components ────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
      ⚠️ {message}
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{text}</span>;
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <p className="text-gray-800 mb-6 text-center">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancelar</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium text-sm">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', username: '', password: '', role: 'estudiante' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await adminFetch('/api/admin/full-panel?action=users');
      const d = await r.json();
      if (d.success) {
        setUsers(Array.isArray(d.users) ? d.users : []);
      } else {
        setError(d.message || 'Error cargando usuarios');
      }
    } catch (e: any) {
      setError(e.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (userId: number, role: string) => {
    await adminPost('update_user', { userId, role });
    load();
  };

  const toggleVerified = async (userId: number, current: boolean) => {
    await adminPost('update_user', { userId, email_verified: !current });
    load();
  };

  const deleteUser = async (userId: number) => {
    await adminPost('delete_user', { userId });
    setConfirm(null);
    load();
  };

  const createUser = async () => {
    setCreating(true);
    try {
      await adminPost('create_user', createForm);
      setShowCreate(false);
      setCreateForm({ name: '', email: '', username: '', password: '', role: 'estudiante' });
      load();
    } finally {
      setCreating(false);
    }
  };

  const filtered = users.filter(u =>
    [u.name, u.email, u.username].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <Spinner />;

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <input
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Buscar por nombre, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
          ＋ Nuevo Usuario
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-center">Verificado</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Registro</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(user => {
              const primaryRole = user.roles?.[0]?.name || 'sin rol';
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-gray-400 text-xs">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={primaryRole}
                      onChange={e => changeRole(user.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="estudiante">Estudiante</option>
                      <option value="instructor">Instructor</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={!!user.email_verified} onChange={() => toggleVerified(user.id, !!user.email_verified)} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <Badge text={user.status || 'activo'} color={user.status === 'deleted' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString('es') : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setConfirm(user.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors text-xs font-medium">
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No se encontraron usuarios.</div>}
      </div>

      {confirm !== null && (
        <ConfirmModal message="¿Eliminar este usuario?" onConfirm={() => deleteUser(confirm)} onCancel={() => setConfirm(null)} />
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Crear nuevo usuario</h3>
            <div className="space-y-3">
              {(['name', 'email', 'username', 'password'] as const).map(field => (
                <input key={field} type={field === 'password' ? 'password' : 'text'}
                  placeholder={{ name: 'Nombre completo', email: 'Email', username: 'Usuario', password: 'Contraseña' }[field]}
                  value={createForm[field]} onChange={e => setCreateForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              ))}
              <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="estudiante">Estudiante</option>
                <option value="instructor">Instructor</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancelar</button>
              <button onClick={createUser} disabled={creating} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold disabled:opacity-60 transition-colors">
                {creating ? 'Creando…' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────

function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await adminFetch('/api/admin/full-panel?action=posts');
      const d = await r.json();
      if (d.success) setPosts(Array.isArray(d.posts) ? d.posts : []);
      else setError(d.message || 'Error cargando posts');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deletePost = async (postId: number) => {
    await adminPost('delete_post', { postId });
    setConfirm(null); load();
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.post_id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {post.author_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{post.author_name}</span>
                    <span className="text-gray-400 text-xs">@{post.author_username}</span>
                    <span className="text-gray-400 text-xs">· {new Date(post.created_at).toLocaleDateString('es')}</span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1 line-clamp-3">{post.content}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>❤️ {post.likes_count}</span>
                    <span>🔁 {post.shares_count}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setConfirm(post.post_id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium flex-shrink-0">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No hay posts.</div>}
      </div>
      {confirm !== null && <ConfirmModal message="¿Eliminar este post permanentemente?" onConfirm={() => deletePost(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await adminFetch('/api/admin/full-panel?action=reports');
      const d = await r.json();
      if (d.success) setReports(Array.isArray(d.reports) ? d.reports : []);
      else setError(d.message || 'Error cargando denuncias');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolveReport = async (reportId: number, status: 'resolved' | 'dismissed') => {
    await adminPost('resolve_report', { reportId, status, reviewerProfileId: 0, notes: '' });
    load();
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-500',
  };

  if (loading) return <Spinner />;

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Razón</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map(report => (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">#{report.id}</td>
                <td className="px-4 py-3"><Badge text={report.reported_content_type} color="bg-blue-100 text-blue-600" /></td>
                <td className="px-4 py-3 text-gray-700 font-medium">{report.reason}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate text-xs">{report.description || '—'}</td>
                <td className="px-4 py-3"><Badge text={report.status} color={statusColor[report.status] || 'bg-gray-100 text-gray-500'} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(report.created_at).toLocaleDateString('es')}</td>
                <td className="px-4 py-3">
                  {report.status === 'pending' ? (
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => resolveReport(report.id, 'resolved')} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg text-xs font-medium transition-colors">Resolver</button>
                      <button onClick={() => resolveReport(report.id, 'dismissed')} className="text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-lg text-xs font-medium transition-colors">Descartar</button>
                    </div>
                  ) : <span className="text-gray-300 text-xs block text-center">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No hay denuncias.</div>}
      </div>
    </div>
  );
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonRow({ lesson, onSave, onDelete }: { lesson: Lesson; onSave: (id: number, data: Partial<Lesson>) => Promise<void>; onDelete: (id: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: lesson.title, description: lesson.description || '', video_url: lesson.video_url || '', is_preview: lesson.is_preview });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(lesson.id, form);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-indigo-50 rounded-xl p-3 space-y-2 border border-indigo-100">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="URL del video"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="flex gap-2 items-center flex-wrap">
          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.is_preview} onChange={e => setForm(f => ({ ...f, is_preview: e.target.checked }))} className="accent-indigo-600" />
            Vista previa
          </label>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50">Cancelar</button>
            <button onClick={save} disabled={saving} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-gray-300 text-xs font-mono w-5 text-center">{lesson.order_index}</span>
        <span className="text-sm text-gray-700 truncate">{lesson.title}</span>
        {lesson.is_preview && <Badge text="Preview" color="bg-blue-100 text-blue-600" />}

      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => setEditing(true)} className="text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded text-xs font-medium">Editar</button>
        <button onClick={() => onDelete(lesson.id)} className="text-red-400 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">Eliminar</button>
      </div>
    </div>
  );
}

// ─── Assignment Row ───────────────────────────────────────────────────────────

function AssignmentRow({ assignment, onSave, onDelete }: { assignment: Assignment; onSave: (id: number, data: Partial<Assignment>) => Promise<void>; onDelete: (id: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: assignment.title, description: assignment.description || '', points_possible: assignment.points_possible || 0 });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(assignment.id, form);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-amber-50 rounded-xl p-3 space-y-2 border border-amber-100">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Título de la tarea"
          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" />
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción"
          rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" />
        <div className="flex gap-2 items-center">
          <input type="number" value={form.points_possible} onChange={e => setForm(f => ({ ...f, points_possible: Number(e.target.value) }))} placeholder="Puntos"
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50">Cancelar</button>
            <button onClick={save} disabled={saving} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-amber-500 text-xs">📋</span>
        <span className="text-sm text-gray-700 truncate">{assignment.title}</span>
        {assignment.points_possible ? <span className="text-gray-400 text-xs">{assignment.points_possible}pts</span> : null}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => setEditing(true)} className="text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded text-xs font-medium">Editar</button>
        <button onClick={() => onDelete(assignment.id)} className="text-red-400 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium">Eliminar</button>
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onRefresh }: { course: Course; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<{ lessons: Lesson[]; assignments: Assignment[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [confirm, setConfirm] = useState<{ action: 'delete' | 'hide' } | null>(null);

  const loadDetail = useCallback(async () => {
    if (detail) return;
    setLoadingDetail(true);
    try {
      const r = await adminFetch(`/api/admin/full-panel?action=course&courseId=${course.id}`);
      const d = await r.json();
      if (d.success && d.course) {
        setDetail({ lessons: d.course.lessons || [], assignments: d.course.assignments || [] });
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [course.id, detail]);

  const toggle = () => {
    if (!expanded) loadDetail();
    setExpanded(e => !e);
  };

  const performAction = async () => {
    if (!confirm) return;
    await adminPost(confirm.action === 'delete' ? 'delete_course' : 'hide_course', { courseId: course.id });
    setConfirm(null);
    onRefresh();
  };

  const saveLesson = async (lessonId: number, data: Partial<Lesson>) => {
    await adminPost('update_lesson', { lessonId, ...data });
    setDetail(null);
    loadDetail();
  };

  const deleteLesson = async (lessonId: number) => {
    await adminPost('delete_lesson', { lessonId });
    setDetail(prev => prev ? { ...prev, lessons: prev.lessons.filter(l => l.id !== lessonId) } : null);
  };

  const saveAssignment = async (assignmentId: number, data: Partial<Assignment>) => {
    await adminPost('update_assignment', { assignmentId, ...data });
    setDetail(null);
    loadDetail();
  };

  const deleteAssignment = async (assignmentId: number) => {
    await adminPost('delete_assignment', { assignmentId });
    setDetail(prev => prev ? { ...prev, assignments: prev.assignments.filter(a => a.id !== assignmentId) } : null);
  };

  const levelColors: Record<string, string> = {
    principiante: 'bg-green-100 text-green-700',
    intermedio: 'bg-yellow-100 text-yellow-700',
    avanzado: 'bg-red-100 text-red-700',
  };

  return (
    <div className="border border-gray-100 rounded-xl bg-white overflow-hidden hover:shadow-sm transition-shadow">
      {/* Course header */}
      <div className="p-4 flex gap-4 items-start">
        {course.image_url ? (
          <img src={course.image_url} alt={course.title} className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
        ) : (
          <div className="w-20 h-14 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">📚</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{course.title}</h3>
              <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{course.description}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setConfirm({ action: 'hide' })} className="text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-200 transition-colors">Ocultar</button>
              <button onClick={() => setConfirm({ action: 'delete' })} className="text-red-500 hover:bg-red-50 px-2.5 py-1 rounded-lg text-xs font-medium border border-red-200 transition-colors">Eliminar</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            <Badge text={course.level || 'sin nivel'} color={levelColors[course.level] || 'bg-gray-100 text-gray-500'} />
            <Badge text={course.published ? 'Publicado' : 'Oculto'} color={course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} />
            <span className="text-gray-400 text-xs">👨‍🏫 {course.instructor_name || '—'}</span>
            <span className="text-gray-400 text-xs">📖 {course.lesson_count} lecciones</span>
            <span className="text-gray-400 text-xs">👥 {course.enrollment_count} inscritos</span>
            <button onClick={toggle} className="ml-auto text-indigo-500 hover:text-indigo-700 text-xs font-medium flex items-center gap-1 transition-colors">
              {expanded ? '▲ Ocultar' : '▼ Lecciones y tareas'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded: lessons + assignments */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 grid sm:grid-cols-2 gap-4">
          {/* Lessons */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📖 Lecciones</h4>
            {loadingDetail ? (
              <div className="text-gray-400 text-xs py-2">Cargando…</div>
            ) : detail?.lessons.length ? (
              <div className="space-y-0.5">
                {detail.lessons.map(lesson => (
                  <LessonRow key={lesson.id} lesson={lesson} onSave={saveLesson} onDelete={deleteLesson} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs py-2">Sin lecciones.</p>
            )}
          </div>

          {/* Assignments */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📋 Tareas</h4>
            {loadingDetail ? (
              <div className="text-gray-400 text-xs py-2">Cargando…</div>
            ) : detail?.assignments.length ? (
              <div className="space-y-0.5">
                {detail.assignments.map(assignment => (
                  <AssignmentRow key={assignment.id} assignment={assignment} onSave={saveAssignment} onDelete={deleteAssignment} />
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs py-2">Sin tareas.</p>
            )}
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message={confirm.action === 'delete' ? '¿Eliminar este curso permanentemente?' : '¿Ocultar este curso?'}
          onConfirm={performAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────

function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await adminFetch('/api/admin/full-panel?action=courses');
      const d = await r.json();
      if (d.success) setCourses(Array.isArray(d.courses) ? d.courses : []);
      else setError(d.message || 'Error cargando cursos');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <div className="space-y-3">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} onRefresh={load} />
        ))}
        {courses.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No hay cursos registrados.</div>}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${color}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-xl font-bold leading-none">{value ?? '—'}</p>
        <p className="text-xs mt-1 opacity-60 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading: authLoading, hasRole } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !hasRole('administrador'))) {
      router.replace('/');
    }
  }, [user, authLoading, hasRole, router]);

  useEffect(() => {
    if (!user || !hasRole('administrador')) return;
    (async () => {
      setStatsLoading(true);
      try {
        const r = await adminFetch('/api/admin/full-panel?action=stats');
        const d = await r.json();
        if (d.success) setStats(d.stats);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [user, hasRole]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Verificando acceso…</div>
      </div>
    );
  }

  if (!user || !hasRole('administrador')) return null;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'usuarios', label: 'Usuarios', icon: '👤' },
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'denuncias', label: 'Denuncias', icon: '🚩' },
    { id: 'cursos', label: 'Cursos', icon: '📚' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-none">Panel de Administración</h1>
              <p className="text-gray-400 text-xs mt-0.5">Ajayu Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
              {user.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsLoading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl p-4 bg-white border border-gray-100 animate-pulse h-18" />)
            : stats ? (
              <>
                <StatCard label="Usuarios" value={stats.total_users} icon="👥" color="bg-white border-gray-100 text-gray-800" />
                <StatCard label="Instructores" value={stats.total_instructors} icon="👨‍🏫" color="bg-blue-50 border-blue-100 text-blue-800" />
                <StatCard label="Estudiantes" value={stats.total_students} icon="🎓" color="bg-indigo-50 border-indigo-100 text-indigo-800" />
                <StatCard label="Cursos" value={stats.total_courses} icon="📚" color="bg-violet-50 border-violet-100 text-violet-800" />
                <StatCard label="Posts" value={stats.total_posts} icon="✍️" color="bg-emerald-50 border-emerald-100 text-emerald-800" />
                <StatCard label="Denuncias" value={stats.pending_reports} icon="🚩" color="bg-red-50 border-red-100 text-red-800" />
              </>
            ) : null}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 flex overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === 'denuncias' && stats && stats.pending_reports > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center leading-none">
                    {stats.pending_reports}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-5">
            {activeTab === 'usuarios' && <UsersTab />}
            {activeTab === 'posts' && <PostsTab />}
            {activeTab === 'denuncias' && <ReportsTab />}
            {activeTab === 'cursos' && <CoursesTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
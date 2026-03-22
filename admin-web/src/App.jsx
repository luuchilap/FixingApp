import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/admin-panel';

const SKILL_CATEGORIES = [
  { value: 'CLEANING', label: 'Dọn dẹp' },
  { value: 'HOUSEWORK', label: 'Việc nhà' },
  { value: 'PLUMBING', label: 'Sửa ống nước' },
  { value: 'ELECTRICAL', label: 'Thợ điện' },
  { value: 'AC_REPAIR', label: 'Sửa điều hòa' },
  { value: 'APPLIANCE_REPAIR', label: 'Sửa thiết bị' },
  { value: 'CARPENTRY', label: 'Thợ mộc' },
  { value: 'PAINTING', label: 'Thợ sơn' },
  { value: 'MASONRY', label: 'Thợ xây' },
  { value: 'GARDENING', label: 'Làm vườn' },
  { value: 'DELIVERY', label: 'Giao hàng' },
  { value: 'ERRANDS', label: 'Việc vặt' },
  { value: 'ENTERTAINMENT', label: 'Giải trí' },
  { value: 'MISC_TASKS', label: 'Tạp vụ' },
  { value: 'CARRYING', label: 'Bê vác' },
  { value: 'OTHER', label: 'Khác' },
];

function getCategoryLabel(value) {
  const found = SKILL_CATEGORIES.find(c => c.value === value);
  return found ? found.label : value;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const d = new Date(typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ROLE_LABELS = {
  EMPLOYER: 'Chủ nhà',
  WORKER: 'Thợ',
  ADMIN: 'Admin',
};

const VERIFICATION_LABELS = {
  NONE: 'Chưa gửi',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã xác thực',
  REJECTED: 'Bị từ chối',
};

const VERIFICATION_COLORS = {
  NONE: '#999',
  PENDING: '#fa8c16',
  APPROVED: '#52c41a',
  REJECTED: '#f5222d',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.headerTitle}>🛠️ FixingApp Admin</h1>
          <div style={styles.tabBar}>
            <button
              onClick={() => setActiveTab('users')}
              style={activeTab === 'users' ? styles.tabActive : styles.tab}
            >
              👤 Người dùng
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              style={activeTab === 'knowledge' ? styles.tabActive : styles.tab}
            >
              📚 Kiến thức
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'users' ? <UsersPanel /> : <KnowledgePanel />}
    </div>
  );
}

// ==================== USERS PANEL ====================
function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [lockedFilter, setLockedFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [error, setError] = useState(null);
  const [imageModal, setImageModal] = useState(null); // userId for image preview

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (lockedFilter) params.set('locked', lockedFilter);
      if (verificationFilter) params.set('verification', verificationFilter);

      const res = await fetch(`${API_BASE}/users?${params.toString()}`);
      if (!res.ok) throw new Error('Lỗi tải dữ liệu');
      const json = await res.json();
      setUsers(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, lockedFilter, verificationFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleLock = async (userId) => {
    setTogglingId(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/toggle-lock`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      const json = await res.json();
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, isLocked: json.isLocked } : u)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleVerification = async (userId, status) => {
    setVerifyingId(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      const json = await res.json();
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, verificationStatus: json.verificationStatus, verifiedAt: json.verifiedAt } : u)
      );
      setImageModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const lockedCount = users.filter(u => u.isLocked).length;
  const pendingCount = users.filter(u => u.verificationStatus === 'PENDING').length;
  const verifiedCount = users.filter(u => u.verificationStatus === 'APPROVED').length;
  const totalCount = users.length;

  const modalUser = imageModal ? users.find(u => u.id === imageModal) : null;

  return (
    <main style={styles.main}>
        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #2196F3' }}>
            <div style={styles.statNumber}>{totalCount}</div>
            <div style={styles.statLabel}>Tổng người dùng</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #f44336' }}>
            <div style={styles.statNumber}>{lockedCount}</div>
            <div style={styles.statLabel}>Đang bị khoá</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #fa8c16' }}>
            <div style={styles.statNumber}>{pendingCount}</div>
            <div style={styles.statLabel}>Chờ xác thực</div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #52c41a' }}>
            <div style={styles.statNumber}>{verifiedCount}</div>
            <div style={styles.statLabel}>Đã xác thực</div>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={styles.select}>
            <option value="">Tất cả vai trò</option>
            <option value="EMPLOYER">Chủ nhà</option>
            <option value="WORKER">Thợ</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select value={lockedFilter} onChange={e => setLockedFilter(e.target.value)} style={styles.select}>
            <option value="">Tất cả trạng thái</option>
            <option value="false">Đang hoạt động</option>
            <option value="true">Đang bị khoá</option>
          </select>
          <select value={verificationFilter} onChange={e => setVerificationFilter(e.target.value)} style={styles.select}>
            <option value="">Tất cả xác thực</option>
            <option value="NONE">Chưa gửi</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã xác thực</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
            <button onClick={fetchUsers} style={styles.retryBtn}>Thử lại</button>
          </div>
        )}

        {/* Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loadingBox}>Đang tải...</div>
          ) : users.length === 0 ? (
            <div style={styles.emptyBox}>Không tìm thấy người dùng nào.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Họ tên</th>
                  <th style={styles.th}>SĐT</th>
                  <th style={styles.th}>Vai trò</th>
                  <th style={styles.th}>Địa chỉ</th>
                  <th style={styles.th}>Xác thực</th>
                  <th style={styles.th}>Ngày tạo</th>
                  <th style={styles.th}>Trạng thái</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={user.isLocked ? styles.lockedRow : styles.row}>
                    <td style={styles.td}>{user.id}</td>
                    <td style={styles.td}>
                      <strong>{user.fullName || '—'}</strong>
                    </td>
                    <td style={styles.td}>{user.phone}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: user.role === 'ADMIN' ? '#9c27b0' : user.role === 'WORKER' ? '#2196F3' : '#FF9800',
                      }}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td style={styles.td}>{user.address || '—'}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          color: VERIFICATION_COLORS[user.verificationStatus] || '#999',
                          fontWeight: 500,
                          fontSize: 13,
                        }}>
                          {VERIFICATION_LABELS[user.verificationStatus] || 'Chưa gửi'}
                        </span>
                        {user.idImageUrl && (
                          <button
                            onClick={() => setImageModal(user.id)}
                            style={styles.viewImageBtn}
                            title="Xem ảnh"
                          >
                            🖼️
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>{formatDate(user.createdAt)}</td>
                    <td style={styles.td}>
                      {user.isLocked ? (
                        <span style={styles.statusLocked}>🔒 Đã khoá</span>
                      ) : (
                        <span style={styles.statusActive}>✅ Hoạt động</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleLock(user.id)}
                            disabled={togglingId === user.id}
                            style={user.isLocked ? styles.unlockBtn : styles.lockBtn}
                          >
                            {togglingId === user.id
                              ? '...'
                              : user.isLocked ? '🔓 Mở khoá' : '🔒 Khoá'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Image Preview Modal */}
        {modalUser && (
          <div style={styles.modalOverlay} onClick={() => setImageModal(null)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  Ảnh xác thực — {modalUser.fullName} ({modalUser.phone})
                </h3>
                <button onClick={() => setImageModal(null)} style={styles.modalClose}>✕</button>
              </div>
              <div style={styles.modalBody}>
                <img
                  src={modalUser.idImageUrl}
                  alt="ID Card"
                  style={styles.previewImage}
                />
                <div style={styles.modalInfo}>
                  <p><strong>Trạng thái:</strong>{' '}
                    <span style={{ color: VERIFICATION_COLORS[modalUser.verificationStatus] }}>
                      {VERIFICATION_LABELS[modalUser.verificationStatus]}
                    </span>
                  </p>
                  {modalUser.verifiedAt && (
                    <p><strong>Thời gian duyệt:</strong> {formatDate(modalUser.verifiedAt)}</p>
                  )}
                </div>
              </div>
              <div style={styles.modalActions}>
                <button
                  onClick={() => handleVerification(modalUser.id, 'APPROVED')}
                  disabled={verifyingId === modalUser.id}
                  style={styles.approveBtn}
                >
                  {verifyingId === modalUser.id ? '...' : '✅ Xác thực'}
                </button>
                <button
                  onClick={() => handleVerification(modalUser.id, 'REJECTED')}
                  disabled={verifyingId === modalUser.id}
                  style={styles.rejectBtn}
                >
                  {verifyingId === modalUser.id ? '...' : '❌ Từ chối'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
  );
}

// ==================== KNOWLEDGE PANEL ====================
function KnowledgePanel() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '', summary: '', content: '', category: '', authorName: 'Admin',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [previewArticle, setPreviewArticle] = useState(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`${API_BASE}/knowledge?${params.toString()}`);
      if (!res.ok) throw new Error('Lỗi tải dữ liệu');
      const json = await res.json();
      setArticles(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openCreateForm = () => {
    setEditingArticle(null);
    setFormData({ title: '', summary: '', content: '', category: '', authorName: 'Admin' });
    setShowForm(true);
  };

  const openEditForm = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      authorName: article.authorName || 'Admin',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.summary || !formData.content || !formData.category) {
      alert('Vui lòng điền đầy đủ tiêu đề, tóm tắt, nội dung và danh mục');
      return;
    }
    setSaving(true);
    try {
      const url = editingArticle
        ? `${API_BASE}/knowledge/${editingArticle.id}`
        : `${API_BASE}/knowledge`;
      const method = editingArticle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi lưu bài viết');
      }
      setShowForm(false);
      fetchArticles();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/knowledge/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Lỗi xóa bài viết');
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id) => {
    setTogglingId(id);
    try {
      const res = await fetch(`${API_BASE}/knowledge/${id}/toggle-publish`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Lỗi cập nhật');
      const json = await res.json();
      setArticles(prev =>
        prev.map(a => a.id === id ? { ...a, isPublished: json.isPublished } : a)
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const publishedCount = articles.filter(a => a.isPublished).length;
  const draftCount = articles.filter(a => !a.isPublished).length;
  const totalViews = articles.reduce((sum, a) => sum + (a.viewCount || 0), 0);

  return (
    <main style={styles.main}>
      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #2196F3' }}>
          <div style={styles.statNumber}>{articles.length}</div>
          <div style={styles.statLabel}>Tổng bài viết</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #52c41a' }}>
          <div style={styles.statNumber}>{publishedCount}</div>
          <div style={styles.statLabel}>Đang xuất bản</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #fa8c16' }}>
          <div style={styles.statNumber}>{draftCount}</div>
          <div style={styles.statLabel}>Bản nháp</div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #9c27b0' }}>
          <div style={styles.statNumber}>{totalViews.toLocaleString()}</div>
          <div style={styles.statLabel}>Tổng lượt xem</div>
        </div>
      </div>

      {/* Filters + Create Button */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Tìm theo tiêu đề..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={styles.select}>
          <option value="">Tất cả danh mục</option>
          {SKILL_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button onClick={openCreateForm} style={styles.createBtn}>
          ➕ Tạo bài viết
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
          <button onClick={fetchArticles} style={styles.retryBtn}>Thử lại</button>
        </div>
      )}

      {/* Table */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingBox}>Đang tải...</div>
        ) : articles.length === 0 ? (
          <div style={styles.emptyBox}>Chưa có bài viết nào.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tiêu đề</th>
                <th style={styles.th}>Danh mục</th>
                <th style={styles.th}>Tác giả</th>
                <th style={styles.th}>Lượt xem</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Ngày tạo</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} style={article.isPublished ? styles.row : styles.draftRow}>
                  <td style={styles.td}>{article.id}</td>
                  <td style={styles.td}>
                    <div>
                      <strong style={{ cursor: 'pointer', color: '#1a8b3f' }} onClick={() => setPreviewArticle(article)}>
                        {article.title}
                      </strong>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        {article.summary.substring(0, 80)}{article.summary.length > 80 ? '...' : ''}
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.categoryBadge}>
                      {getCategoryLabel(article.category)}
                    </span>
                  </td>
                  <td style={styles.td}>{article.authorName || '—'}</td>
                  <td style={styles.td}>{(article.viewCount || 0).toLocaleString()}</td>
                  <td style={styles.td}>
                    {article.isPublished ? (
                      <span style={styles.statusPublished}>✅ Xuất bản</span>
                    ) : (
                      <span style={styles.statusDraft}>📝 Nháp</span>
                    )}
                  </td>
                  <td style={styles.td}>{formatDate(article.createdAt)}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => openEditForm(article)} style={styles.editBtn}>
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleTogglePublish(article.id)}
                        disabled={togglingId === article.id}
                        style={article.isPublished ? styles.unpublishBtn : styles.publishBtn}
                      >
                        {togglingId === article.id ? '...' : article.isPublished ? '📥 Ẩn' : '📤 Xuất bản'}
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={deletingId === article.id}
                        style={styles.deleteBtn}
                      >
                        {deletingId === article.id ? '...' : '🗑️ Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={{ ...styles.modalContent, maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingArticle ? '✏️ Chỉnh sửa bài viết' : '➕ Tạo bài viết mới'}
              </h3>
              <button onClick={() => setShowForm(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={styles.formInput}
                  placeholder="Nhập tiêu đề bài viết..."
                />
              </div>
              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Danh mục *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    style={styles.formInput}
                  >
                    <option value="">Chọn danh mục...</option>
                    {SKILL_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.formLabel}>Tác giả</label>
                  <input
                    type="text"
                    value={formData.authorName}
                    onChange={e => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                    style={styles.formInput}
                    placeholder="Tên tác giả"
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tóm tắt *</label>
                <textarea
                  value={formData.summary}
                  onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  style={{ ...styles.formInput, minHeight: 60 }}
                  placeholder="Mô tả ngắn gọn về bài viết..."
                  rows={2}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nội dung * (hỗ trợ Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  style={{ ...styles.formInput, minHeight: 300, fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="Nội dung bài viết... (## Tiêu đề, ### Mục con, - Danh sách, **in đậm**)"
                  rows={15}
                />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? 'Đang lưu...' : editingArticle ? '💾 Cập nhật' : '💾 Tạo bài viết'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewArticle && (
        <div style={styles.modalOverlay} onClick={() => setPreviewArticle(null)}>
          <div style={{ ...styles.modalContent, maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>👁️ Xem trước bài viết</h3>
              <button onClick={() => setPreviewArticle(null)} style={styles.modalClose}>✕</button>
            </div>
            <div style={{ ...styles.modalBody, textAlign: 'left' }}>
              <div style={{ marginBottom: 12 }}>
                <span style={styles.categoryBadge}>{getCategoryLabel(previewArticle.category)}</span>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#1a1a2e' }}>{previewArticle.title}</h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
                {previewArticle.authorName} · {formatDate(previewArticle.createdAt)} · {previewArticle.viewCount} lượt xem
              </p>
              <p style={{ color: '#444', fontSize: 15, fontStyle: 'italic', marginBottom: 16, padding: '12px 16px', background: '#f9f9f9', borderRadius: 8, borderLeft: '3px solid #16a34a' }}>
                {previewArticle.summary}
              </p>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 14, color: '#333' }}>
                {previewArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
  },
  header: {
    background: 'linear-gradient(135deg, #1a8b3f 0%, #16a34a 100%)',
    color: '#fff',
    padding: '0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '6px 16px',
    borderRadius: 20,
    fontSize: 14,
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px',
  },
  statsRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: '1 1 200px',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterBar: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: '1 1 250px',
    padding: '10px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '10px 16px',
    border: '1px solid #d9d9d9',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
    minWidth: 160,
  },
  errorBox: {
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    borderRadius: 8,
    padding: '12px 20px',
    marginBottom: 20,
    color: '#cf1322',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  retryBtn: {
    marginLeft: 'auto',
    padding: '6px 16px',
    border: '1px solid #cf1322',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#cf1322',
    cursor: 'pointer',
    fontSize: 13,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  loadingBox: {
    padding: 60,
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  emptyBox: {
    padding: 60,
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '2px solid #f0f0f0',
    backgroundColor: '#fafafa',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
  },
  row: {},
  lockedRow: {
    backgroundColor: '#fff1f0',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
  },
  statusActive: {
    color: '#389e0d',
    fontWeight: 500,
    fontSize: 13,
  },
  statusLocked: {
    color: '#cf1322',
    fontWeight: 500,
    fontSize: 13,
  },
  lockBtn: {
    padding: '6px 16px',
    border: '1px solid #ff4d4f',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#cf1322',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  unlockBtn: {
    padding: '6px 16px',
    border: '1px solid #52c41a',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#389e0d',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  viewImageBtn: {
    background: 'none',
    border: '1px solid #d9d9d9',
    borderRadius: 4,
    cursor: 'pointer',
    padding: '2px 6px',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #f0f0f0',
  },
  modalTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#999',
    padding: '4px 8px',
  },
  modalBody: {
    padding: 24,
    textAlign: 'center',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: 400,
    borderRadius: 8,
    border: '1px solid #e8e8e8',
    marginBottom: 16,
  },
  modalInfo: {
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #f0f0f0',
  },
  approveBtn: {
    padding: '8px 24px',
    border: '1px solid #52c41a',
    borderRadius: 6,
    backgroundColor: '#f6ffed',
    color: '#389e0d',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  rejectBtn: {
    padding: '8px 24px',
    border: '1px solid #ff4d4f',
    borderRadius: 6,
    backgroundColor: '#fff2f0',
    color: '#cf1322',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  // Tab navigation
  tabBar: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  tabActive: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: '#1a8b3f',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  // Knowledge panel
  createBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: '#16a34a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    transition: 'background-color 0.2s',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: '#1a8b3f',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
  },
  statusPublished: {
    color: '#389e0d',
    fontWeight: 500,
    fontSize: 13,
  },
  statusDraft: {
    color: '#fa8c16',
    fontWeight: 500,
    fontSize: 13,
  },
  draftRow: {
    backgroundColor: '#fffbe6',
  },
  editBtn: {
    padding: '6px 14px',
    border: '1px solid #1890ff',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#1890ff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  publishBtn: {
    padding: '6px 14px',
    border: '1px solid #52c41a',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#389e0d',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  unpublishBtn: {
    padding: '6px 14px',
    border: '1px solid #fa8c16',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#d48806',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    padding: '6px 14px',
    border: '1px solid #ff4d4f',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#cf1322',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  // Form styles
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 0,
  },
  formLabel: {
    display: 'block',
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  cancelBtn: {
    padding: '10px 24px',
    border: '1px solid #d9d9d9',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#666',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  saveBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#16a34a',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
};

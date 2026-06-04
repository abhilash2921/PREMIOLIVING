/* js/services/auth.js - Premio Living OS Authentication Service */

window.AuthService = {
  supabaseUrl: localStorage.getItem('supabase_url') || '',
  supabaseKey: localStorage.getItem('supabase_key') || '',
  client: null,
  currentUser: null,
  currentProfile: null,

  // ── Initialize Supabase client ─────────────────────
  init() {
    if (this.supabaseUrl && this.supabaseKey && window.supabase) {
      try {
        this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
      } catch(e) {
        console.error('Auth: Supabase init failed', e);
        this.client = null;
      }
    }
  },

  isConfigured() {
    return this.client !== null;
  },

  // ── Check session on app startup ───────────────────
  async checkSession() {
    if (!this.isConfigured()) {
      // Running in offline/demo mode — use the legacy role switcher
      console.warn('Auth: Supabase not configured, running in demo mode.');
      return null;
    }

    try {
      const { data: { session } } = await this.client.auth.getSession();
      if (!session) {
        window.location.replace('login.html');
        return null;
      }

      this.currentUser = session.user;

      // Load profile (role + name)
      const { data: profile, error } = await this.client
        .from('profiles')
        .select('name, role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        await this.signOut();
        return null;
      }

      this.currentProfile = profile;

      // Sync to AppStore so all existing role checks work
      window.AppStore.activeRole = profile.role;
      window.AppStore.currentUserName = profile.name;
      window.AppStore.currentUserId = session.user.id;

      return profile;
    } catch(e) {
      console.error('Auth: Session check failed', e);
      return null;
    }
  },

  // ── Sign out ───────────────────────────────────────
  async signOut() {
    if (this.isConfigured()) {
      await this.client.auth.signOut();
    }
    window.AppStore.activeRole = 'admin';
    window.AppStore.currentUserName = null;
    window.AppStore.currentUserId = null;
    this.currentUser = null;
    this.currentProfile = null;
    window.location.replace('login.html');
  },

  // ── Create team member account (admin only) ────────
  async createTeamMember(email, password, name, role) {
    if (!this.isConfigured()) {
      window.ModalComponent.showToast('Supabase not configured. Cannot create accounts.');
      return { error: 'Not configured' };
    }

    try {
      // Admin creates user via Auth Admin API — this requires service_role key
      // For now: create profile entry and generate invite link
      const { data, error } = await this.client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role }
      });

      if (error) throw error;

      // Insert profile
      await this.client.from('profiles').insert({
        id: data.user.id,
        name,
        role
      });

      return { success: true, userId: data.user.id };
    } catch(e) {
      return { error: e.message };
    }
  },

  // ── Fetch all team members (for assignment dropdowns) ─
  async fetchTeamMembers() {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('id, name, role')
        .neq('role', 'admin')
        .order('name');
      return error ? [] : data;
    } catch(e) {
      return [];
    }
  },

  // ── Assign member to project ───────────────────────
  async assignMemberToProject(projectId, userId, name, role) {
    if (!this.isConfigured()) return { error: 'Not configured' };
    try {
      // Upsert: one person per role per project
      const { error } = await this.client
        .from('project_members')
        .upsert({ project_id: projectId, user_id: userId, name, role }, {
          onConflict: 'project_id,role'
        });
      return error ? { error: error.message } : { success: true };
    } catch(e) {
      return { error: e.message };
    }
  },

  // ── Remove member from project ─────────────────────
  async removeMemberFromProject(projectId, role) {
    if (!this.isConfigured()) return;
    await this.client
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('role', role);
  },

  // ── Get members assigned to a project ─────────────
  async getProjectMembers(projectId) {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('project_members')
        .select('user_id, name, role')
        .eq('project_id', projectId);
      return error ? [] : (data || []);
    } catch(e) {
      return [];
    }
  },

  // ── Get projects assigned to current user ──────────
  async getMyAssignedProjectIds() {
    if (!this.isConfigured() || !this.currentUser) return null;
    if (this.currentProfile?.role === 'admin') return null; // admin sees all

    try {
      const { data, error } = await this.client
        .from('project_members')
        .select('project_id')
        .eq('user_id', this.currentUser.id);

      return error ? [] : (data || []).map(r => r.project_id);
    } catch(e) {
      return [];
    }
  }
};

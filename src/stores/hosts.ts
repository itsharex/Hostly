import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';

export interface ProfileData {
  id: string;
  name: string;
  content: string;
  active: boolean;
}

export interface AppConfig {
  multi_select: boolean;
  profiles: { id: string, name: string, active: boolean }[];
  active_profile_ids: string[];
}

export const useHostsStore = defineStore('hosts', {
  state: () => ({
    profiles: [] as ProfileData[],
    systemHosts: '',
    commonConfig: '',
    config: { multi_select: false, profiles: [], active_profile_ids: [] } as AppConfig,
    settings: { multi_select: false }, // Computed/Simplified for UI if needed
    
    selectedProfileId: null as string | null, // Currently editing profile ID
    selectedProfileName: null as string | null, // For UI display helper
    
    editingType: 'profile' as 'profile' | 'system' | 'common', // What are we editing?
    hasWritePermission: true, // Default to true optimistically
  }),
  actions: {
    async init() {
        await this.checkPermission();
        await this.loadConfig();
        await this.loadCommonConfig();
        await this.fetchSystemHosts();
        await this.loadProfiles();
    },
    async checkPermission() {
        try {
            this.hasWritePermission = await invoke('check_write_permission');
        } catch (e) {
            console.error(e);
            this.hasWritePermission = false;
        }
    },
    async loadConfig() {
        try {
            this.config = await invoke('load_config');
            this.settings.multi_select = this.config.multi_select;
        } catch (e) { console.error("loadConfig", e); }
    },
    async loadCommonConfig() {
        try {
            this.commonConfig = await invoke('load_common_config');
        } catch (e) { console.error("loadCommon", e); }
    },
    async fetchSystemHosts() {
      try {
        this.systemHosts = await invoke('get_system_hosts');
      } catch (e) { console.error("fetchSystem", e); }
    },
    async loadProfiles() {
      try {
        // backend list_profiles now returns ProfileData struct which matches our interface
        this.profiles = await invoke('list_profiles');
        
        // Update local settings helper
        await this.loadConfig();
      } catch (e) { console.error("loadProfiles", e); }
    },

    // --- Actions ---

    async toggleMultiSelect() {
        // Optimistic UI update? No, wait for backend strict source of truth
        const newVal = !this.settings.multi_select;
        await invoke('set_multi_select', { enable: newVal });
        await this.loadConfig(); // Refresh config
        await this.loadProfiles(); // Refresh profiles active state
        await this.fetchSystemHosts();
    },

    async toggleProfileActive(id: string) {
        await invoke('toggle_profile_active', { id });
        await this.loadConfig();
        await this.loadProfiles();
        await this.fetchSystemHosts();
    },

    async saveCurrentEditorContent() {
        let shouldApply = false;

        if (this.editingType === 'common') {
            await invoke('save_common_config', { content: this.commonConfig });
            shouldApply = true;
        } else if (this.editingType === 'profile' && this.selectedProfileId) {
            const p = this.profiles.find(p => p.id === this.selectedProfileId);
            if (p) {
                await invoke('save_profile_content', { id: p.id, content: p.content });
                if (p.active) shouldApply = true;
            }
        }

        if (shouldApply) {
            await this.applyConfig();
        }
    },
    
    async addProfile(name: string, content?: string) {
        const id = await invoke<string>('create_profile', { name, content: content || null });
        await this.loadProfiles();
        this.selectProfile(id);
    },

    async renameProfile(id: string, newName: string) {
        await invoke('rename_profile', { id, newName });
        await this.loadProfiles();
         // If selected, ensure UI updates name (loadProfiles should handle it via reactive array)
    },

    async deleteProfile(id: string) {
        await invoke('delete_profile', { id });
        if (this.selectedProfileId === id) {
            this.selectedProfileId = null;
            this.editingType = 'system'; 
        }
        await this.loadProfiles();
        await this.fetchSystemHosts();
    },

    selectProfile(id: string) {
        this.selectedProfileId = id;
        this.editingType = 'profile';
        // Helper
        const p = this.profiles.find(p => p.id === id);
        this.selectedProfileName = p ? p.name : null;
    },

    async applyConfig() {
        try {
            await invoke('apply_config');
            await this.fetchSystemHosts();
        } catch (e) {
            console.error(e);
            throw e; 
        }
    },

    async refreshAll() {
        await this.init();
    },

    async importProfile(filePath: string) {
        try {
            const content = await invoke<string>('import_file', { path: filePath });
            // Extract filename as default name
            const name = filePath.split(/[\\/]/).pop()?.replace('.txt', '').replace('.hosts', '') || 'Imported';
            return { name, content };
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async exportProfile(filePath: string, content: string) {
        await invoke('export_file', { path: filePath, content });
    },

    async exportAllData(filePath: string) {
        const json = await invoke<string>('export_data');
        await invoke('export_file', { path: filePath, content: json });
    },
    
    async importAllData(filePath: string) {
        const json = await invoke<string>('import_file', { path: filePath });
        await invoke('import_data', { jsonContent: json });
        await this.init();
    }
  },
});

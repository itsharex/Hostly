<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Codemirror } from "vue-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { StreamLanguage } from "@codemirror/language";
import { properties } from "@codemirror/legacy-modes/mode/properties";
import { useHostsStore } from "./stores/hosts";
import { Plus, Save, RefreshCw, Power, Trash2, FileText, Monitor, Loader2, AlertTriangle, Pencil, Download, Upload } from "lucide-vue-next";
import { Toaster, toast } from "vue-sonner";
import { useI18n } from 'vue-i18n';
import { open, save, ask } from '@tauri-apps/plugin-dialog';

const { t } = useI18n();
const store = useHostsStore();
const extensions = [oneDark, StreamLanguage.define(properties)];

const newProfileName = ref("");
const isSaving = ref(false);
// Track renaming/toggling by ID
const togglingProfileId = ref<string | null>(null);

onMounted(async () => {
  await store.init();
});

// Computed property for the editor content
const editorContent = computed({
    get: () => {
        if (store.editingType === 'common') return store.commonConfig;
        if (store.editingType === 'profile' && store.selectedProfileId) {
            return store.profiles.find(p => p.id === store.selectedProfileId)?.content || '';
        }
        return '';
    },
    set: (value: string) => {
        if (store.editingType === 'common') {
             store.commonConfig = value;
        } else if (store.editingType === 'profile' && store.selectedProfileId) {
             const p = store.profiles.find(p => p.id === store.selectedProfileId);
             if (p) p.content = value;
        }
    }
});

const handleSave = async () => {
    isSaving.value = true;
    try {
        await store.saveCurrentEditorContent();
        toast.success(t('toast.saved'));
    } catch (e) {
        toast.error(t('toast.save_failed'));
    } finally {
        isSaving.value = false;
    }
};

const handleAddProfile = async () => {
  if (!newProfileName.value) return;
  try {
      await store.addProfile(newProfileName.value);
      newProfileName.value = "";
      toast.success(t('toast.env_created'));
  } catch (e) {
      toast.error(t('toast.create_failed'));
  }
};

const handleSelectProfile = (id: string) => {
    store.selectProfile(id);
};

const handleSelectCommon = () => {
    store.editingType = 'common';
    store.selectedProfileId = null;
    store.selectedProfileName = null;
};

const handleSelectSystem = () => {
    store.editingType = 'system';
    store.selectedProfileId = null;
    store.selectedProfileName = null;
    store.fetchSystemHosts();
};

const handleDelete = async (id: string, name: string) => {
    const yes = await ask(t('confirm_delete', { name }), {
        title: 'Hosts Switcher',
        kind: 'warning'
    });

    if (yes) {
        try {
            await store.deleteProfile(id);
            toast.success(t('toast.env_deleted'));
        } catch (e) {
            toast.error(t('toast.delete_failed'));
        }
    }
};

const handleToggleActive = async (id: string) => {
    togglingProfileId.value = id;
    try {
        await store.toggleProfileActive(id);
        toast.success(t('toast.env_toggled'));
    } catch (e) {
        toast.error(t('toast.toggle_failed'));
    } finally {
        togglingProfileId.value = null;
    }
};

const handleRefresh = async () => {
    try {
        await store.refreshAll();
        toast.success(t('toast.refreshed'));
    } catch (e) {
        toast.error(t('toast.refresh_failed'));
    }
};

const handleRename = async (id: string) => {
    const profile = store.profiles.find(p => p.id === id);
    if (!profile) return;
    
    // Safety check again for protected
    if (isProtected(profile.name)) return;

    const newName = prompt(t('enter_new_name', { name: profile.name }), profile.name);
    if (newName && newName !== profile.name) {
        try {
            await store.renameProfile(id, newName);
            toast.success(t('toast.renamed'));
        } catch (e) {
            toast.error(t('toast.rename_failed'));
        }
    }
};



const isProtected = (name: string) => {
    return name === "系统hosts备份";
};

const handleImport = async () => {
    try {
        // Here we could ask: Import Single file or Full Backup in JSON?
        // Or check file extension.
        const selected = await open({
            multiple: false,
            filters: [
                { name: 'All Supported', extensions: ['txt', 'hosts', 'json'] },
                { name: 'Backup JSON', extensions: ['json'] },
                { name: 'Text Files', extensions: ['txt', 'hosts'] }
            ]
        });
        
        if (selected && typeof selected === 'string') {
            if (selected.endsWith('.json')) {
                // Assume full backup
                try {
                     await store.importAllData(selected);
                     toast.success(t('toast.imported')); // or reuse imported_all? using generic imported for now or add new string
                } catch (e) {
                     toast.error(t('toast.import_failed'));
                }
            } else {
                // Single profile
                const { name, content } = await store.importProfile(selected);
                const finalName = prompt(t('enter_new_name', { name }), name);
                if (finalName) {
                    await store.addProfile(finalName, content);
                    toast.success(t('toast.imported'));
                }
            }
        }
    } catch (e) {
        toast.error(t('toast.import_failed'));
    }
};

const handleExport = async (id: string) => {
    const profile = store.profiles.find(p => p.id === id);
    if (!profile) return;

    try {
        const filePath = await save({
            defaultPath: `${profile.name}.txt`,
            filters: [{ name: 'Text Files', extensions: ['txt'] }]
        });

        if (filePath) {
            await store.exportProfile(filePath, profile.content);
            toast.success(t('toast.exported'));
        }
    } catch (e: any) {
        console.error(e);
        toast.error(`${t('toast.export_failed')}: ${e.message || e}`);
    }
};

const handleExportAll = async () => {
    try {
        const filePath = await save({
            defaultPath: 'hosts-switcher-backup.json',
            filters: [{ name: 'JSON Backup', extensions: ['json'] }]
        });

        if (filePath) {
            await store.exportAllData(filePath);
            toast.success(t('toast.exported_all'));
        }
    } catch (e: any) {
        console.error(e);
        toast.error(`${t('toast.export_all_failed')}: ${e.message || e}`);
    }
};


</script>

<template>
  <Toaster position="bottom-right" theme="dark" />
  <div class="flex flex-col h-screen text-white bg-transparent font-sans overflow-hidden select-none">
    <!-- Titlebar -->
    <div data-tauri-drag-region class="h-10 flex items-center px-4 bg-black/20 shrink-0 border-b border-white/5">
      <span class="font-semibold text-sm opacity-80 pointer-events-none">{{ t('app_name') }}</span>
    </div>

    <!-- Permission Warning Banner -->
    <div v-if="!store.hasWritePermission" class="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-3">
         <AlertTriangle class="w-4 h-4 text-red-400 shrink-0" />
         <span class="text-xs text-red-200">{{ t('permission_denied') }}</span>
    </div>

    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar -->
        <div class="w-64 flex flex-col bg-black/10 border-r border-white/10">
            
            <!-- System & Common -->
            <div class="p-2 space-y-1">
                 <div 
                    @click="handleSelectSystem"
                    class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm"
                    :class="store.editingType === 'system' ? 'bg-blue-600/30 text-blue-100' : 'hover:bg-white/5 text-gray-300'"
                >
                    <Monitor class="w-4 h-4 text-gray-400" />
                    <span>{{ t('system_hosts') }}</span>
                </div>
                 <div 
                    @click="handleSelectCommon"
                    class="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm"
                    :class="store.editingType === 'common' ? 'bg-blue-600/30 text-blue-100' : 'hover:bg-white/5 text-gray-300'"
                >
                    <FileText class="w-4 h-4 text-orange-400" />
                    <span>{{ t('common_config') }}</span>
                </div>
            </div>

            <div class="mx-3 my-2 border-t border-white/10"></div>

            <!-- Profiles Header -->
            <div class="px-4 py-2 flex items-center justify-between">
                <h2 class="text-xs font-bold text-gray-400 uppercase tracking-wider">{{ t('environments') }}</h2>
                <button 
                    @click="store.toggleMultiSelect" 
                    class="text-[10px] px-1.5 py-0.5 rounded border border-white/10 transition-colors"
                    :class="store.settings.multi_select ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-transparent text-gray-500'"
                    :title="t('multi_select')"
                >
                    {{ store.settings.multi_select ? t('multi_select') : t('single_select') }}
                </button>
            </div>

            <!-- New Profile Input -->
            <div class="px-3 pb-2 flex gap-2">
                <input 
                    v-model="newProfileName" 
                    class="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500/50 transition-colors" 
                    :placeholder="t('new_env_placeholder')"
                    @keydown.enter="handleAddProfile"
                />
                <button @click="handleAddProfile" class="p-1.5 hover:bg-white/10 rounded border border-white/5"><Plus class="w-3.5 h-3.5" /></button>
            </div>
            
            <!-- List -->
            <div class="flex-1 overflow-y-auto px-2 space-y-0.5">
                <div 
                    v-for="profile in store.profiles" 
                    :key="profile.id"
                    @click="handleSelectProfile(profile.id)"
                    @dblclick="handleToggleActive(profile.id)"
                    class="group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors text-sm border border-transparent"
                    :class="store.selectedProfileId === profile.id ? 'bg-white/10 border-white/5 text-white' : 'hover:bg-white/5 text-gray-400'"
                >
                    <div class="flex items-center gap-2 overflow-hidden">
                        <span class="truncate">{{ profile.name }}</span>
                    </div>
                    
                    <div class="flex items-center gap-1">
                        
                        <button 
                            @click.stop="handleToggleActive(profile.id)"
                            class="p-1.5 rounded-full hover:bg-white/20 transition-all disabled:opacity-50"
                            :class="profile.active ? 'text-green-400 bg-green-500/10' : 'text-gray-600 group-hover:text-gray-500'"
                            :disabled="togglingProfileId === profile.id"
                            title="Toggle Active"
                        >
                            <Loader2 v-if="togglingProfileId === profile.id" class="w-3.5 h-3.5 animate-spin" />
                            <Power v-else class="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                            @click.stop="handleDelete(profile.id, profile.name)"
                            class="p-1.5 rounded-full hover:bg-red-500/20 text-transparent group-hover:text-gray-500 hover:text-red-400 transition-all"
                            title="Delete"
                        >
                            <Trash2 class="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-3 border-t border-white/10 text-xs text-gray-500 flex justify-between items-center bg-black/20">
                <span>{{ t('env_count', { count: store.profiles.length }) }}</span>
                <span class="flex gap-2">
                     <button @click="handleImport" class="hover:text-white transition-colors" title="Import"><Upload class="w-3 h-3" /></button>
                     <button @click="handleExportAll" class="hover:text-white transition-colors" title="Backup All"><Download class="w-3 h-3 text-orange-400" /></button>
                     <button @click="handleRefresh" class="hover:text-white transition-colors" title="Refresh"><RefreshCw class="w-3 h-3" /></button>
                </span>
            </div>

        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col bg-black/40 relative">
            <!-- Toolbar for Editor -->
            <div v-if="store.editingType !== 'system'" class="h-10 flex items-center justify-between px-4 border-b border-white/5 bg-white/5">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-200">
                        {{ store.editingType === 'common' ? t('common_config') : store.selectedProfileName }}
                    </span>
                    <span v-if="store.editingType === 'common'" class="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">{{ t('global') }}</span>
                </div>
                <div class="flex gap-2">
                     <!-- Profile Actions -->
                     <template v-if="store.editingType === 'profile' && store.selectedProfileId && store.selectedProfileName">
                        <button 
                            v-if="!isProtected(store.selectedProfileName)"
                            @click="handleRename(store.selectedProfileId)"
                            class="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Rename"
                        >
                            <Pencil class="w-3.5 h-3.5" />
                        </button>
                         <button 
                            @click="handleExport(store.selectedProfileId)"
                            class="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Export"
                        >
                            <Download class="w-3.5 h-3.5" />
                        </button>
                        <div class="w-px h-4 bg-white/10 my-auto mx-1"></div>
                     </template>

                    <button 
                        @click="handleSave" 
                        :disabled="isSaving"
                        class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Loader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
                        <Save v-else class="w-3.5 h-3.5" /> 
                        {{ isSaving ? t('saving') : t('save') }}
                    </button>
                </div>
            </div>

            <!-- Editor View -->
            <div v-if="store.editingType !== 'system'" class="flex-1 overflow-hidden relative">
                 <Codemirror
                    v-model="editorContent"
                    placeholder="# Enter hosts configuration..."
                    :style="{ height: '100%' }"
                    :autofocus="true"
                    :indent-with-tab="true"
                    :tab-size="2"
                    :extensions="extensions"
                />
            </div>
            
            <!-- Read-only System View -->
            <div v-else class="flex-1 flex flex-col h-full bg-black/60">
                <div class="h-10 flex items-center px-4 border-b border-white/5 bg-white/5 text-gray-400 text-sm">
                    <Monitor class="w-3.5 h-3.5 mr-2" /> {{ t('system_hosts_readonly') }}
                </div>
                <div class="flex-1 overflow-auto p-0">
                    <Codemirror
                        :model-value="store.systemHosts"
                        :style="{ height: '100%' }"
                        :extensions="extensions"
                        :editable="false"
                    />
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    app_name: 'Hosts Switcher',
    system_hosts: 'System Hosts',
    system_hosts_readonly: 'System Hosts (Preview - Generated Result)',
    common_config: 'Common Config',
    global: 'Global',
    environments: 'Environments',
    multi_select: 'Multi',
    single_select: 'Single',
    new_env_placeholder: 'New Environment...',
    env_count: '{count} Envs',
    save: 'Save',
    saving: 'Saving...',
    toast: {
      saved: 'Saved successfully',
      save_failed: 'Failed to save configuration',
      env_created: 'Environment created',
      create_failed: 'Failed to create environment',
      env_deleted: 'Environment deleted',
      delete_failed: 'Failed to delete environment',
      env_toggled: 'Environment status updated',
      toggle_failed: 'Failed to toggle environment',
      refreshed: 'System hosts and profiles refreshed',
      refresh_failed: 'Failed to refresh',
      renamed: 'Profile renamed',
      rename_failed: 'Failed to rename profile',
      imported: 'Profile imported successfully',
      import_failed: 'Failed to import profile',
      exported: 'Profile exported successfully',
      export_failed: 'Failed to export profile',
      exported_all: 'Full backup exported successfully',
      export_all_failed: 'Failed to export backup'
    },
    confirm_delete: 'Delete profile "{name}"?',
    enter_new_name: 'Enter new name for profile "{name}":',
    permission_denied: 'Permission Denied: Run as Administrator to modify config.',
  },
  zh: {
    app_name: 'Hosts Switcher',
    system_hosts: '系统 Hosts',
    system_hosts_readonly: '系统 Hosts (当前生效结果 - 由配置生成)',
    common_config: '公共配置',
    global: '全局',
    environments: '环境列表',
    multi_select: '多选模式',
    single_select: '单选模式',
    new_env_placeholder: '新建环境名称...',
    env_count: '{count} 个环境',
    save: '保存',
    saving: '保存中...',
    toast: {
      saved: '保存成功',
      save_failed: '保存失败',
      env_created: '环境已创建',
      create_failed: '创建环境失败',
      env_deleted: '环境已删除',
      delete_failed: '删除环境失败',
      env_toggled: '环境状态已更新',
      toggle_failed: '切换环境失败',
      refreshed: '系统 hosts 和 profiles 已刷新',
      renamed: '配置已重命名',
      rename_failed: '重命名失败',
      imported: '配置导入成功',
      import_failed: '导入失败',
      exported: '配置导出成功',
      export_failed: '导出失败',
      exported_all: '完整备份已导出',
      export_all_failed: '备份导出失败'
    },
    confirm_delete: '确定要删除环境 "{name}" 吗？',
    enter_new_name: '请输入 "{name}" 的新名称:',
    permission_denied: '权限不足：请以管理员身份运行程序，否则无法写入系统 Hosts。',
  }
};

const i18n = createI18n({
  legacy: false, 
  locale: 'zh', // Default to Chinese as requested
  fallbackLocale: 'en',
  messages,
});

export default i18n;

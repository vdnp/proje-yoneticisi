import { app } from 'electron'

// The few strings the main process shows itself: tray menu, splash screen and
// native file dialogs. Everything else is translated in the renderer.
const STRINGS = {
  tr: {
    appName: 'Proje Yöneticisi',
    splashSub: 'Projelerin yükleniyor…',
    trayFavorites: 'Favoriler',
    trayRecent: 'Son Açılanlar',
    trayOpen: 'Uygulamayı Aç',
    trayQuit: 'Çıkış',
    pickFolder: 'Proje klasörü seç',
    exportTitle: 'Verileri dışa aktar',
    importTitle: 'Yedeği içe aktar',
    jsonFiles: 'JSON dosyaları'
  },
  en: {
    appName: 'Project Manager',
    splashSub: 'Loading your projects…',
    trayFavorites: 'Favorites',
    trayRecent: 'Recently opened',
    trayOpen: 'Open app',
    trayQuit: 'Quit',
    pickFolder: 'Choose a project folder',
    exportTitle: 'Export data',
    importTitle: 'Import a backup',
    jsonFiles: 'JSON files'
  }
}

let lang = 'en'

// 'auto' follows the OS locale. Must be called after app 'ready', since
// app.getLocale() is not meaningful before that.
export function setLanguage(setting) {
  if (setting === 'tr' || setting === 'en') {
    lang = setting
  } else {
    lang = (app.getLocale() || '').toLowerCase().startsWith('tr') ? 'tr' : 'en'
  }
}

export function t(key) {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key
}

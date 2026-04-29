/**
 * Internationalization (i18n) System
 * Provides language switching functionality for 6 languages with RTL support
 */

class I18n {
  constructor() {
    this.translations = {};
    this.fallbackLang = 'bs';
    this.isLoading = false;
    this.supportedLanguages = ['bs', 'sv', 'en', 'de', 'sq', 'ar'];
    this.currentLang = this.getStoredLanguage() || 'bs';
  }

  /**
   * Initialize the i18n system
   */
  async init() {
    try {
      await this.loadLanguage(this.currentLang);
      this.translatePage();
      this.updateDirection();
      this.setupLanguageSelector();
      console.log(`i18n initialized with language: ${this.currentLang}`);
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
    }
  }

  /**
   * Load a language translation file
   */
  async loadLanguage(lang) {
    if (this.translations[lang]) {
      return; // Already loaded
    }

    if (!this.supportedLanguages.includes(lang)) {
      console.warn(`Unsupported language: ${lang}. Using fallback: ${this.fallbackLang}`);
      lang = this.fallbackLang;
    }

    this.isLoading = true;
    try {
      const response = await fetch(`i18n/translations/${lang}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.translations[lang] = await response.json();
      console.log(`Loaded translations for ${lang}`);
    } catch (error) {
      console.error(`Failed to load ${lang} translations:`, error);

      // Try loading fallback language if not already trying
      if (lang !== this.fallbackLang) {
        console.log(`Loading fallback language: ${this.fallbackLang}`);
        await this.loadLanguage(this.fallbackLang);
      } else {
        throw new Error(`Failed to load fallback language: ${this.fallbackLang}`);
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get translation for a key
   */
  t(key, fallback = null) {
    const keys = key.split('.');
    let value = this.getNestedValue(this.translations[this.currentLang], keys);

    // Try fallback language if translation not found
    if (value === undefined && this.currentLang !== this.fallbackLang) {
      value = this.getNestedValue(this.translations[this.fallbackLang], keys);
    }

    return value || fallback || key;
  }

  /**
   * Helper to get nested object value by key path
   */
  getNestedValue(obj, keys) {
    return keys.reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Translate all elements on the page
   */
  translatePage() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        if (element.type === 'submit' || element.type === 'button') {
          element.value = translation;
        } else if (element.hasAttribute('data-i18n-placeholder')) {
          // Handle placeholder separately if specified
          const placeholderKey = element.getAttribute('data-i18n-placeholder');
          element.placeholder = this.t(placeholderKey);
        } else {
          element.placeholder = translation;
        }
      } else {
        element.textContent = translation;
      }
    });

    // Handle elements with separate placeholder translation
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    // Update document meta information
    this.updateMetaTags();
  }

  /**
   * Update meta tags for SEO
   */
  updateMetaTags() {
    document.documentElement.lang = this.currentLang;

    // Update page title if translation exists
    const titleTranslation = this.t('meta.title');
    if (titleTranslation && titleTranslation !== 'meta.title') {
      document.title = titleTranslation;
    }

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const descTranslation = this.t('meta.description');
    if (metaDesc && descTranslation && descTranslation !== 'meta.description') {
      metaDesc.content = descTranslation;
    }
  }

  /**
   * Switch to a different language
   */
  async switchLanguage(lang) {
    if (lang === this.currentLang || this.isLoading) {
      return;
    }

    if (!this.supportedLanguages.includes(lang)) {
      console.error(`Unsupported language: ${lang}`);
      return;
    }

    try {
      await this.loadLanguage(lang);
      this.currentLang = lang;
      this.storeLanguage(lang);
      this.translatePage();
      this.updateDirection();

      // Update language selector
      const selector = document.getElementById('lang');
      if (selector) {
        selector.value = lang;
      }

      console.log(`Switched to language: ${lang}`);

      // Dispatch custom event for other scripts to listen
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: lang }
      }));
    } catch (error) {
      console.error(`Failed to switch to language ${lang}:`, error);
    }
  }

  /**
   * Update text direction and load RTL styles for Arabic
   */
  updateDirection() {
    const isRTL = this.translations[this.currentLang]?.meta?.rtl || false;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

    // Load or remove RTL stylesheet
    const rtlLink = document.getElementById('rtl-styles');
    if (isRTL && !rtlLink) {
      const link = document.createElement('link');
      link.id = 'rtl-styles';
      link.rel = 'stylesheet';
      link.href = 'i18n/rtl.css';
      document.head.appendChild(link);
      console.log('RTL stylesheet loaded');
    } else if (!isRTL && rtlLink) {
      rtlLink.remove();
      console.log('RTL stylesheet removed');
    }
  }

  /**
   * Setup event listener for language selector dropdown
   */
  setupLanguageSelector() {
    const selector = document.getElementById('lang');
    if (!selector) {
      console.warn('Language selector not found');
      return;
    }

    // Set current language in selector
    selector.value = this.currentLang;

    // Add event listener
    selector.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
    });

    console.log('Language selector initialized');
  }

  /**
   * Get stored language preference
   */
  getStoredLanguage() {
    const stored = localStorage.getItem('preferred-language');
    if (stored && this.supportedLanguages.includes(stored)) {
      return stored;
    }

    // Try to detect browser language
    return this.detectBrowserLanguage();
  }

  /**
   * Store language preference
   */
  storeLanguage(lang) {
    localStorage.setItem('preferred-language', lang);
  }

  /**
   * Detect browser language
   */
  detectBrowserLanguage() {
    if (!navigator.language || !this.supportedLanguages) {
      return 'bs'; // fallback to default
    }

    const browserLang = navigator.language.split('-')[0];
    return this.supportedLanguages.includes(browserLang) ? browserLang : 'bs';
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLang;
  }

  /**
   * Check if language is RTL
   */
  isRTL(lang = null) {
    const checkLang = lang || this.currentLang;
    return this.translations[checkLang]?.meta?.rtl || false;
  }
}

// Initialize i18n when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.i18n = new I18n();
  window.i18n.init().catch(error => {
    console.error('Failed to initialize i18n system:', error);
  });
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
}
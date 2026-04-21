import { useAuth } from '../context/AuthContext';
import { tr } from '../i18n/translations';

/**
 * Returns a translation function bound to the current app language.
 * Usage: const { t } = useTranslation();  then  t('Call')
 */
export function useTranslation() {
  const { settings } = useAuth();
  const language = settings?.language || 'English';
  return {
    t: (text) => tr(text, language),
    language,
  };
}

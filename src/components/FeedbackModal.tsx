import Giscus from '@giscus/react'
import { useLang, useT } from '../lib/i18n'
import type { Lang } from '../lib/i18n'
import { Modal } from './Modal'

/**
 * 公開留言板(Giscus,底層是 GitHub repo 的 Discussions)。
 * 訪客用 GitHub 帳號留言;作者在 GitHub Discussions 刪除/管理。
 * 設定值取自 giscus.app;要換 repo/分類時到 giscus.app 重拿 repoId / categoryId。
 */
const REPO = '25qi/muscle-3d-site' as const
const REPO_ID = 'R_kgDOTb6VtA'
// Announcements 分類:只有維護者與 giscus 能開新討論串,訪客只能在留言板底下留言
const CATEGORY = 'Announcements'
const CATEGORY_ID = 'DIC_kwDOTb6VtM4DB7vF'

// 我們的語言碼 → giscus 支援的語言碼
const GISCUS_LANG: Record<Lang, string> = {
  zh: 'zh-TW',
  en: 'en',
  es: 'es',
  fr: 'fr',
  it: 'it',
  pl: 'pl',
  tr: 'tr',
}

/** Public feedback board rendered in a modal (Giscus / GitHub Discussions). */
export function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { lang } = useLang()
  const t = useT()
  const configured = !REPO_ID.startsWith('REPLACE')

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
        <div className="border-b border-line p-5">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {t('feedbackTitle')}
          </h2>
          <p className="mt-1 text-sm text-ink-3">{t('feedbackHint')}</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {configured ? (
            <Giscus
              repo={REPO}
              repoId={REPO_ID}
              category={CATEGORY}
              categoryId={CATEGORY_ID}
              mapping="specific"
              term="site-feedback"
              strict="1"
              reactionsEnabled="1"
              emitMetadata="0"
              inputPosition="top"
              theme="dark"
              lang={GISCUS_LANG[lang]}
            />
          ) : (
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-ink-2">
              留言板尚未設定完成。請依 <code>FeedbackModal.tsx</code>{' '}
              檔頭步驟啟用 GitHub Discussions + giscus,並填入 repo id /
              category id。
            </div>
          )}
      </div>
    </Modal>
  )
}

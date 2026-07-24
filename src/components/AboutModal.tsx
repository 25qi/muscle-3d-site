import { aboutBody, useLang, useT } from '../lib/i18n'
import { Modal } from './Modal'
import { Credits } from './Credits'

/** 關於視窗:說明網站在做什麼 + 各資料來源授權。 */
export function AboutModal({ onClose }: { onClose: () => void }) {
  const t = useT()
  const { lang } = useLang()
  const body = aboutBody(lang)
  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="flex max-h-[82vh] flex-col overflow-y-auto p-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Vector
          </h2>
          <span className="text-xs text-ink-3">3D Muscle Explorer</span>
        </div>

        <p className="text-sm leading-relaxed text-ink-2">{body.lead}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{body.use}</p>

        <h3 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">
          {t('aboutSources')}
        </h3>
        <Credits className="text-xs" />
      </div>
    </Modal>
  )
}

import { useT } from '../lib/i18n'
import { Modal } from './Modal'
import { Credits } from './Credits'

/** 關於視窗:署名 + 各資料來源授權(手機版把常駐 footer 收在這裡)。 */
export function AboutModal({ onClose }: { onClose: () => void }) {
  const t = useT()
  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-ink">
          {t('about')}
        </h2>
        <Credits className="text-xs" />
      </div>
    </Modal>
  )
}

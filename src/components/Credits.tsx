/**
 * 署名 + 各資料來源的授權標註。桌機顯示在 footer,手機收進側邊選單的「關於」。
 * CC BY-SA 與 GymVisual 的標註是法律義務,不可省略。網址一律純文字(不可點)。
 */
export function Credits({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-ink-3 ${className}`}>
      This website was built by Veky. © 2026 Veky. Anatomy model: BodyParts3D ©
      The Database Center for Life Science (CC BY-SA 2.1 JP) / Z-Anatomy (CC
      BY-SA 4.0). Exercise data: ExerciseDB (hasaneyldrm/exercises-dataset,
      MIT). Exercise images/GIFs © GymVisual (https://gymvisual.com)
    </p>
  )
}

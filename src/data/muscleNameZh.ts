/**
 * muscleNameZh.ts
 *
 * Translate a GLB mesh name (English/Latin anatomical name) into a readable
 * Traditional Chinese muscle name, for display in the info panel.
 *
 * Matching mirrors muscleMap: lowercase substring `includes`, checked in array
 * order so more specific names must come before generic ones. A head/part
 * qualifier (e.g. "long head", "clavicular part") is appended in parentheses.
 * Returns null when unknown (caller falls back to the raw English name).
 */

// 詞綴(頭 / 部位),接在肌肉主名後面以括號呈現
const QUALIFIERS: [string, string][] = [
  ['long head', '長頭'],
  ['short head', '短頭'],
  ['lateral head', '外側頭'],
  ['medial head', '內側頭'],
  ['superior head', '上頭'],
  ['inferior head', '下頭'],
  ['humeral head', '肱骨頭'],
  ['ulnar head', '尺骨頭'],
  ['oblique head', '斜頭'],
  ['transverse head', '橫頭'],
  ['clavicular part', '鎖骨部'],
  ['sternocostal part', '胸肋部'],
  ['abdominal part', '腹部'],
  ['acromial part', '肩峰部'],
  ['spinal part', '棘部'],
  ['ascending part', '升部'],
  ['descending part', '降部'],
  ['transverse part', '橫部'],
  ['deep part', '深部'],
  ['superficial part', '淺部'],
]

// 肌肉主名對照(specific -> generic 由上而下,先命中者優先)
const BASE_NAMES: [string, string][] = [
  // ─── 胸 / 軀幹 ───
  ['pectoralis major', '胸大肌'],
  ['pectoralis minor', '胸小肌'],
  ['serratus anterior', '前鋸肌'],
  ['serratus posterior superior', '上後鋸肌'],
  ['serratus posterior inferior', '下後鋸肌'],
  ['innermost intercostal', '最內肋間肌'],
  ['external intercostal', '肋間外肌'],
  ['internal intercostal', '肋間內肌'],
  ['transversus thoracis', '胸橫肌'],
  ['diaphragm', '橫膈膜'],
  ['rectus abdominis', '腹直肌'],
  ['external oblique', '腹外斜肌'],
  ['internal oblique', '腹內斜肌'],
  ['transversus abdominis', '腹橫肌'],

  // ─── 背 ───
  ['trapezius', '斜方肌'],
  ['latissimus dorsi', '闊背肌'],
  ['rhomboid major', '大菱形肌'],
  ['rhomboid minor', '小菱形肌'],
  ['levator scapulae', '提肩胛肌'],
  ['iliocostalis cervicis', '頸髂肋肌'],
  ['iliocostalis thoracis', '胸髂肋肌'],
  ['iliocostalis lumborum', '腰髂肋肌'],
  ['longissimus capitis', '頭最長肌'],
  ['longissimus cervicis', '頸最長肌'],
  ['longissimus thoracis', '胸最長肌'],
  ['spinalis thoracis', '胸棘肌'],
  ['spinalis', '棘肌'],
  ['semispinalis capitis', '頭半棘肌'],
  ['semispinalis cervicis', '頸半棘肌'],
  ['semispinalis thoracis', '胸半棘肌'],
  ['multifidus cervicis', '頸多裂肌'],
  ['multifidus lumborum', '腰多裂肌'],
  ['multifidus thoracis', '胸多裂肌'],
  ['rotatores', '迴旋肌'],
  ['quadratus lumborum', '腰方肌'],
  ['interspinales cervicis', '頸棘間肌'],
  ['interspinales lumborum', '腰棘間肌'],
  ['interspinalis thoracis', '胸棘間肌'],
  ['levatores costarum breves', '短肋提肌'],
  ['levatores costarum longi', '長肋提肌'],
  ['lateral lumbar intertransversarius', '腰外側橫突間肌'],
  ['medial lumbar intertransversarius', '腰內側橫突間肌'],
  ['anterior cervical intertransversarii', '頸前橫突間肌'],
  ['posterior cervical intertransversarii', '頸後橫突間肌'],
  ['thoracolumbar fascia', '胸腰筋膜'],

  // ─── 肩 / 旋轉肌群 / 上臂 ───
  ['deltoid', '三角肌'],
  ['supraspinatus', '棘上肌'],
  ['infraspinatus', '棘下肌'],
  ['subscapularis', '肩胛下肌'],
  ['teres major', '大圓肌'],
  ['teres minor', '小圓肌'],
  ['subclavius', '鎖骨下肌'],
  ['biceps brachii', '肱二頭肌'],
  ['triceps brachii', '肱三頭肌'],
  ['coracobrachialis', '喙肱肌'],
  ['brachialis', '肱肌'],
  ['anconeus', '肘肌'],

  // ─── 前臂 / 手 ───
  ['brachioradialis', '肱橈肌'],
  ['pronator teres', '旋前圓肌'],
  ['pronator quadratus', '旋前方肌'],
  ['supinator', '旋後肌'],
  ['flexor carpi radialis', '橈側屈腕肌'],
  ['flexor carpi ulnaris', '尺側屈腕肌'],
  ['extensor carpi radialis longus', '橈側伸腕長肌'],
  ['extensor carpi radialis brevis', '橈側伸腕短肌'],
  ['extensor carpi ulnaris', '尺側伸腕肌'],
  ['palmaris longus', '掌長肌'],
  ['flexor digitorum superficialis', '屈指淺肌'],
  ['flexor digitorum profundus', '屈指深肌'],
  ['flexor pollicis longus', '拇長屈肌'],
  ['flexor pollicis brevis', '拇短屈肌'],
  ['extensor digitorum longus', '趾長伸肌'],
  ['extensor digitorum', '指伸肌'],
  ['extensor digiti minimi', '小指伸肌'],
  ['extensor indicis', '示指伸肌'],
  ['extensor pollicis longus', '拇長伸肌'],
  ['extensor pollicis brevis', '拇短伸肌'],
  ['abductor pollicis longus', '拇長外展肌'],
  ['abductor pollicis brevis', '拇短外展肌'],
  ['opponens pollicis', '拇對掌肌'],
  ['opponens digiti minimi', '小指對掌肌'],
  ['adductor pollicis', '拇內收肌'],
  ['flexor pollicis', '拇屈肌'],
  ['dorsal interossei', '背側骨間肌'],
  ['palmar interossei', '掌側骨間肌'],
  ['lumbrical', '蚓狀肌'],
  ['flexor retinaculum', '屈肌支持帶'],

  // ─── 髖 / 骨盆 ───
  ['gluteus maximus', '臀大肌'],
  ['gluteus medius', '臀中肌'],
  ['gluteus minimus', '臀小肌'],
  ['tensor fasciae latae', '闊筋膜張肌'],
  ['iliotibial tract', '髂脛束'],
  ['piriformis', '梨狀肌'],
  ['obturator externus', '閉孔外肌'],
  ['obturator internus', '閉孔內肌'],
  ['gemellus superior', '上孖肌'],
  ['gemellus inferior', '下孖肌'],
  ['quadratus femoris', '股方肌'],
  ['pectineus', '恥骨肌'],
  ['iliacus', '髂肌'],
  ['psoas major', '腰大肌'],
  ['coccygeus', '尾骨肌'],
  ['iliococcygeus', '髂尾肌'],
  ['pubococcygeus', '恥尾肌'],
  ['puborectalis', '恥骨直腸肌'],
  ['tendinous arch of levator ani', '提肛肌腱弓'],
  ['external anal sphincter', '肛門外括約肌'],

  // ─── 大腿 ───
  ['rectus femoris', '股直肌'],
  ['vastus lateralis', '股外側肌'],
  ['vastus medialis', '股內側肌'],
  ['vastus intermedius', '股中間肌'],
  ['biceps femoris', '股二頭肌'],
  ['semitendinosus', '半腱肌'],
  ['semimembranosus', '半膜肌'],
  ['sartorius', '縫匠肌'],
  ['gracilis', '股薄肌'],
  ['adductor longus', '內收長肌'],
  ['adductor magnus', '內收大肌'],
  ['adductor brevis', '內收短肌'],
  ['adductor minimus', '內收小肌'],

  // ─── 小腿 / 足 ───
  ['gastrocnemius', '腓腸肌'],
  ['soleus', '比目魚肌'],
  ['plantaris', '蹠肌'],
  ['popliteus', '膕肌'],
  ['tibialis anterior', '脛骨前肌'],
  ['tibialis posterior', '脛骨後肌'],
  ['fibularis longus', '腓骨長肌'],
  ['fibularis brevis', '腓骨短肌'],
  ['fibularis tertius', '第三腓骨肌'],
  ['interosseous membrane', '骨間膜'],
  ['calcaneal tendon', '跟腱'],
  ['long plantar ligament', '蹠長韌帶'],
  ['abductor hallucis', '拇趾外展肌'],
  ['adductor hallucis', '拇趾內收肌'],
  ['flexor hallucis longus', '拇趾長屈肌'],
  ['flexor hallucis brevis', '拇趾短屈肌'],
  ['extensor hallucis longus', '拇趾長伸肌'],
  ['extensor hallucis brevis', '拇趾短伸肌'],
  ['flexor digitorum brevis', '趾短屈肌'],
  ['flexor digitorum longus', '趾長屈肌'],
  ['flexor accessorius', '蹠方肌'],
  ['plantar interosseous', '蹠側骨間肌'],
  ['abductor digiti minimi', '小趾外展肌'],
  ['flexor digiti minimi brevis', '小趾短屈肌'],

  // ─── 頸 ───
  ['sternocleidomastoid', '胸鎖乳突肌'],
  ['scalenus anterior', '前斜角肌'],
  ['scalenus medius', '中斜角肌'],
  ['scalenus posterior', '後斜角肌'],
  ['longus capitis', '頭長肌'],
  ['longus colli', '頸長肌'],
  ['splenius capitis', '頭夾肌'],
  ['splenius cervicis', '頸夾肌'],
  ['rectus capitis anterior', '頭前直肌'],
  ['rectus capitis lateralis', '頭外側直肌'],
  ['rectus capitis posterior major', '頭後大直肌'],
  ['rectus capitis posterior minor', '頭後小直肌'],
  ['omohyoid', '肩胛舌骨肌'],
  ['sternohyoid', '胸骨舌骨肌'],
  ['sternothyroid', '胸骨甲狀肌'],
  ['thyrohyoid', '甲狀舌骨肌'],
  ['geniohyoid', '頦舌骨肌'],
  ['mylohyoid', '下頜舌骨肌'],
  ['stylohyoid', '莖突舌骨肌'],
  ['digastric', '二腹肌'],
  ['platysma', '頸闊肌'],

  // ─── 頭 / 面 / 咀嚼 ───
  ['masseter', '咬肌'],
  ['temporalis', '顳肌'],
  ['medial pterygoid', '翼內肌'],
  ['lateral pterygoid', '翼外肌'],
  ['frontalis', '額肌'],
  ['orbicularis oculi', '眼輪匝肌'],
  ['orbicularis oris', '口輪匝肌'],
  ['zygomaticus major', '大顴肌'],
  ['zygomaticus minor', '小顴肌'],
  ['levator labii superioris', '提上唇肌'],
  ['depressor labii inferioris', '降下唇肌'],
  ['depressor anguli oris', '降口角肌'],
  ['levator palpebrae superioris', '提上瞼肌'],
  ['risorius', '笑肌'],
  ['mentalis', '頦肌'],
  ['procerus', '降眉間肌'],
  ['nasalis', '鼻肌'],
  ['corrugator supercilii', '皺眉肌'],
  ['levator veli palatini', '提腭帆肌'],
  ['tensor veli palatini', '腭帆張肌'],

  // ─── 眼球外肌(注意:longus colli 已在頸部先命中) ───
  ['superior oblique', '上斜肌'],
  ['inferior oblique', '下斜肌'],
  ['superior rectus', '上直肌'],
  ['inferior rectus', '下直肌'],
  ['medial rectus', '內直肌'],
  ['lateral rectus', '外直肌'],

  // ─── 喉部軟骨 / 肌 ───
  ['lateral crico-arytenoid', '外側環杓肌'],
  ['posterior crico-arytenoid', '後環杓肌'],
  ['cricothyroid', '環甲肌'],
  ['thyro-arytenoid', '甲杓肌'],
  ['oblique arytenoid', '斜杓肌'],
  ['transverse arytenoid', '橫杓肌'],
  ['arytenoid cartilage', '杓狀軟骨'],
  ['median cricothyroid ligament', '環甲正中韌帶'],

  // ─── 其他 ───
  ['intermediate tendon', '中間腱'],
]

/**
 * Return the Traditional Chinese name for a mesh, or null if unknown.
 * e.g. "long head of left biceps brachii" -> "肱二頭肌(長頭)"
 */
/** 英文肌肉名:把底線換空格、去掉 left/right(介面英文時用) */
export function muscleNameEn(meshName: string): string {
  return meshName
    .replace(/_/g, ' ')
    .replace(/\b(left|right)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 依介面語言取肌肉名(en=true → 英文,否則中文) */
export function muscleName(meshName: string, en: boolean): string {
  return en ? muscleNameEn(meshName) : (muscleNameZh(meshName) ?? muscleNameEn(meshName))
}

export function muscleNameZh(meshName: string): string | null {
  // three.js 載入時會把名字空格換成底線,比對前先換回空格
  const n = meshName.toLowerCase().replace(/_/g, ' ')
  const base = BASE_NAMES.find(([p]) => n.includes(p))
  if (!base) return null
  const qualifier = QUALIFIERS.find(([p]) => n.includes(p))
  return qualifier ? `${base[1]}(${qualifier[1]})` : base[1]
}

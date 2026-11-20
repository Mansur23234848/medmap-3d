// Reference anatomy for the 21 selectable regions. Short, general, educational descriptions only (no diagnosis).
type Side = 'LEFT' | 'RIGHT' | 'CENTER';
type View = 'FRONT' | 'BACK' | 'BOTH';

export const BODY_AREAS: { slug: string; nameEn: string; nameKk: string; side: Side; view: View; description: string }[] = [
  { slug: 'head', nameEn: 'Head', nameKk: 'Бас', side: 'CENTER', view: 'BOTH', description: 'Бас сүйегі (краниум) мен бет сүйектерінен тұрады. Ішінде ми, көру, есту, иіс және дәм сезу мүшелері орналасқан.' },
  { slug: 'neck', nameEn: 'Neck', nameKk: 'Мойын', side: 'CENTER', view: 'BOTH', description: 'Жеті мойын омыртқасы (C1–C7), кеңірдек, өңеш, қалқанша без және басқа қан тамырлары өтетін аймақ.' },
  { slug: 'chest', nameEn: 'Chest', nameKk: 'Кеуде', side: 'CENTER', view: 'FRONT', description: 'Төс сүйегі мен қабырғалардан құралған кеуде қуысы. Ішінде жүрек, өкпе және ірі қан тамырлары орналасқан.' },
  { slug: 'abdomen', nameEn: 'Abdomen', nameKk: 'Іш', side: 'CENTER', view: 'FRONT', description: 'Көкет пен жамбас арасындағы аймақ. Асқазан, бауыр, ішек, ұйқы безі сияқты ас қорыту мүшелері орналасқан.' },
  { slug: 'upper_back', nameEn: 'Upper Back', nameKk: 'Арқаның жоғарғы бөлігі', side: 'CENTER', view: 'BACK', description: 'Кеуде омыртқалары (T1–T12), жауырындар және арқаның жоғарғы бұлшықеттері (трапеция, ромб тәрізді бұлшықеттер).' },
  { slug: 'lower_back', nameEn: 'Lower Back', nameKk: 'Бел', side: 'CENTER', view: 'BACK', description: 'Бел омыртқалары (L1–L5) мен оларды қоршаған бұлшықеттер. Дененің салмағын көтеретін негізгі тірек аймағы.' },
  { slug: 'left_shoulder', nameEn: 'Left Shoulder', nameKk: 'Сол иық', side: 'LEFT', view: 'BOTH', description: 'Иық буыны тоқпан жілік, жауырын және бұғана сүйектерінен түзіледі. Айналмалы манжета бұлшықеттері қозғалысты қамтамасыз етеді.' },
  { slug: 'right_shoulder', nameEn: 'Right Shoulder', nameKk: 'Оң иық', side: 'RIGHT', view: 'BOTH', description: 'Иық буыны тоқпан жілік, жауырын және бұғана сүйектерінен түзіледі. Айналмалы манжета бұлшықеттері қозғалысты қамтамасыз етеді.' },
  { slug: 'left_arm', nameEn: 'Left Arm', nameKk: 'Сол қол', side: 'LEFT', view: 'BOTH', description: 'Иық пен білек бөліктері: тоқпан жілік, кәрі жілік және шынтақ жілігі, сондай-ақ бүгу мен жазу бұлшықеттері.' },
  { slug: 'right_arm', nameEn: 'Right Arm', nameKk: 'Оң қол', side: 'RIGHT', view: 'BOTH', description: 'Иық пен білек бөліктері: тоқпан жілік, кәрі жілік және шынтақ жілігі, сондай-ақ бүгу мен жазу бұлшықеттері.' },
  { slug: 'left_elbow', nameEn: 'Left Elbow', nameKk: 'Сол шынтақ', side: 'LEFT', view: 'BOTH', description: 'Тоқпан жілік, кәрі жілік және шынтақ жілігі түйісетін топса тәрізді буын. Қолды бүгуге және бұруға мүмкіндік береді.' },
  { slug: 'right_elbow', nameEn: 'Right Elbow', nameKk: 'Оң шынтақ', side: 'RIGHT', view: 'BOTH', description: 'Тоқпан жілік, кәрі жілік және шынтақ жілігі түйісетін топса тәрізді буын. Қолды бүгуге және бұруға мүмкіндік береді.' },
  { slug: 'left_hand', nameEn: 'Left Hand', nameKk: 'Сол қол басы', side: 'LEFT', view: 'BOTH', description: 'Білезік, алақан және саусақтар: 27 сүйек, көптеген ұсақ буындар мен сіңірлер нәзік қозғалысты қамтамасыз етеді.' },
  { slug: 'right_hand', nameEn: 'Right Hand', nameKk: 'Оң қол басы', side: 'RIGHT', view: 'BOTH', description: 'Білезік, алақан және саусақтар: 27 сүйек, көптеген ұсақ буындар мен сіңірлер нәзік қозғалысты қамтамасыз етеді.' },
  { slug: 'pelvis', nameEn: 'Pelvis', nameKk: 'Жамбас', side: 'CENTER', view: 'BOTH', description: 'Жамбас сүйектері мен сегізкөз құрайтын сақина. Қуық, жыныс мүшелері және тік ішек осы аймақта орналасқан.' },
  { slug: 'left_leg', nameEn: 'Left Leg', nameKk: 'Сол аяқ', side: 'LEFT', view: 'BOTH', description: 'Сан және сирақ бөліктері: ортан жілік, асықты жілік, шыбық жілік және аяқтың ірі бұлшықеттері.' },
  { slug: 'right_leg', nameEn: 'Right Leg', nameKk: 'Оң аяқ', side: 'RIGHT', view: 'BOTH', description: 'Сан және сирақ бөліктері: ортан жілік, асықты жілік, шыбық жілік және аяқтың ірі бұлшықеттері.' },
  { slug: 'left_knee', nameEn: 'Left Knee', nameKk: 'Сол тізе', side: 'LEFT', view: 'BOTH', description: 'Дененің ең ірі буыны: ортан жілік, асықты жілік және тізе тостағаны. Мениск пен байламдар тұрақтылықты қамтамасыз етеді.' },
  { slug: 'right_knee', nameEn: 'Right Knee', nameKk: 'Оң тізе', side: 'RIGHT', view: 'BOTH', description: 'Дененің ең ірі буыны: ортан жілік, асықты жілік және тізе тостағаны. Мениск пен байламдар тұрақтылықты қамтамасыз етеді.' },
  { slug: 'left_foot', nameEn: 'Left Foot', nameKk: 'Сол табан', side: 'LEFT', view: 'BOTH', description: 'Тілерсек, табан және башпай сүйектері (26 сүйек). Табан күмбезі жүру кезінде салмақты біркелкі бөледі.' },
  { slug: 'right_foot', nameEn: 'Right Foot', nameKk: 'Оң табан', side: 'RIGHT', view: 'BOTH', description: 'Тілерсек, табан және башпай сүйектері (26 сүйек). Табан күмбезі жүру кезінде салмақты біркелкі бөледі.' },
];

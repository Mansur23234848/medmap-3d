# MEDMAP 3D — Premium Digital Health Platform

Адамның денсаулығы туралы ақпаратты **интерактивті 3D дене** арқылы жинап, жеке медициналық картада сақтайтын демонстрациялық веб-платформа.

> ⚠️ Бұл демонстрациялық жоба. Барлық деректер синтетикалық. Платформа диагноз қоймайды, дәрі ұсынбайды, PDF құжаттар рецепт немесе ресми медициналық қорытынды емес.

## Мүмкіндіктер

| Модуль | Не істейді |
|---|---|
| **3D дене картасы** | Реалистік 3D адам моделі, 21 таңдалатын аймақ, алды/арты, айналдыру, zoom, камера анимациясы, hover (көгілдір), таңдау (қызыл + glow), жазбасы бар аймақтар (қызғылт) |
| **Шағым енгізу** | Аймақ, сипаттама, басталған күні, ұзақтығы, қарқындылығы (1–10), қосымша белгілер, дәрігерге қаралу, файл/сурет (JPG/PNG/WEBP/PDF, 5 МБ) |
| **Пациент кабинеті** | Басты бет (нақты статистика, 3D превью, қарқындылық графигі), медициналық тарих (хронология, сүзгі), тағайындаулар, дәрігерге рұқсат беру/кері алу, профиль, PDF есеп, хабарламалар |
| **Дәрігер панелі** | Тек рұқсат берген пациенттер, іздеу, 3D картадағы аймақтар, шағым мәртебесі, қорытынды, жазба (пациентке/жеке), тағайындау, PDF |
| **Дәрілер анықтамалығы** | Тек ресми дереккөзден (NHS UK) алынған ақпарат, әр жазбада сілтеме, Rx/OTC белгісі |
| **Дәріхана (демо)** | Код арқылы тағайындауды тексеру; мазмұн тек пациент рұқсат берсе көрінеді |
| **Әкімші панелі** | Нақты статистика + графиктер, қолданушылар/дәрігерлер/пациенттер/дәріханалар, рөлдерді басқару, жазбалар, дәрілер базасы (CRUD), аудит журналы |

## Технологиялар

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Framer Motion, TanStack Query, Recharts, lucide-react, sonner
- **3D:** Three.js, React Three Fiber, Drei (CameraControls, Environment, ContactShadows), GLB модель
- **Backend:** Node.js, Express, TypeScript (tsx), Zod валидация, Multer, PDFKit
- **Database:** MySQL / MariaDB (XAMPP), Prisma ORM (migrations + seed)
- **Security:** bcrypt (12 rounds), JWT httpOnly + SameSite cookie, RBAC, helmet, rate limiting, магиялық байттар арқылы файл тексеру, аудит журналы

## Жылдам іске қосу (Windows)

1. **XAMPP Control Panel** ашып, **MySQL**-ді қосыңыз (бұл компьютерде порт **3307**, `C:\xampp\mysql\bin\my.ini`).
2. Жоба папкасындағы **`start.bat`** файлын екі рет басыңыз — серверлер іске қосылып, браузер ашылады.

Немесе терминалда:

```powershell
npm run dev
```

- Сайт: <http://localhost:5173>
- API: <http://localhost:4000/api/health>

## Нөлден орнату (басқа компьютерде)

```powershell
npm run install:all
```

`server\.env.example` файлын `server\.env` деп көшіріп, `DATABASE_URL` (пайдаланушы, құпиясөз, порт) және `JWT_SECRET` (кемінде 32 таңба) мәндерін толтырыңыз. MySQL-де дерекқор мен пайдаланушы жасаңыз:

```sql
CREATE DATABASE medmap3d CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'medmap'@'localhost' IDENTIFIED BY 'ӨЗ_ҚҰПИЯСӨЗІҢІЗ';
GRANT ALL PRIVILEGES ON medmap3d.* TO 'medmap'@'localhost';
```

**1-нұсқа — дайын база файлын импорттау.** Репозиторийде толық демо база бар: [database/medmap3d.sql](database/medmap3d.sql) (барлық кестелер + синтетикалық деректер). phpMyAdmin-де `medmap3d` базасын ашып, «Import» арқылы осы файлды жүктеңіз, немесе:

```powershell
C:\xampp\mysql\bin\mysql.exe -h 127.0.0.1 -P 3307 -u root medmap3d -e "source database/medmap3d.sql"
```

**2-нұсқа — Prisma арқылы нөлден жасау.** Кестелерді жасап, демо деректерді енгізіңіз:

```powershell
npm run db:setup
```

Демо деректерді қайта толтыру (барлық деректер өшіп, қайта жасалады):

```powershell
npm run db:seed
```

## Демо аккаунттар

| Рөл | Email | Құпиясөз |
|---|---|---|
| Пациент | `patient@medmap.demo` | `Patient2026!` |
| Пациент 2 (тек неврологқа рұқсат берген) | `patient2@medmap.demo` | `Patient2026!` |
| Дәрігер (терапевт) | `doctor@medmap.demo` | `Doctor2026!` |
| Дәрігер (невролог) | `neuro@medmap.demo` | `Doctor2026!` |
| Фармацевт | `pharmacy@medmap.demo` | `Pharma2026!` |
| Әкімші | `admin@medmap.demo` | `Admin2026!` |

Кіру бетінде демо аккаунт батырмаларын басып, деректерді автоматты толтыруға болады.

Демо тағайындау кодтары (дәріхана беті үшін): `RX-DEMO-2026` (пациент рұқсат берген), `RX-7KQ2-M9PX` (рұқсат берілмеген — тек мәртебе көрінеді).

## Деректер базасы

Prisma migration 14 кесте жасайды: `users`, `patient_profiles`, `doctor_profiles`, `pharmacy_profiles`, `body_areas`, `symptom_reports`, `report_attachments`, `medical_records`, `doctor_notes`, `medications`, `prescriptions`, `patient_consents`, `notifications`, `activity_logs`. Барлығында primary key, foreign key, индекстер, timestamps және unique шектеулер бар. Схема: [server/prisma/schema.prisma](server/prisma/schema.prisma).

## Қауіпсіздік

- Құпиясөздер bcrypt-пен хэштеледі; тіркелу тек «Пациент» рөлін береді, басқа рөлдерді әкімші тағайындайды.
- Сессия: JWT `httpOnly`, `SameSite=Lax` cookie (JavaScript оқи алмайды); әр сұраныста аккаунт белсенділігі қайта тексеріледі.
- Әр API рөл бойынша қорғалған; дәрігер тек белсенді **patient_consents** рұқсаты бар пациентті көреді; пациент тек өз жазбаларын көреді/өзгертеді.
- Дәрігер қараған шағымды және дәрігер қорытындысын пациент өзгерте/өшіре алмайды.
- Барлық кіріс деректер серверде Zod арқылы тексеріледі; SQL-инъекциядан Prisma параметрленген сұраныстары қорғайды.
- Файлдар: тип пен кеңейтім whitelist, 5 МБ шек, мазмұнның «магиялық байттары» тексеріледі, файлдар жария емес — тек рұқсаты бар қолданушыға беріледі.
- Медициналық API жауаптары кэштелмейді (`Cache-Control: no-store`); helmet, rate limiting, аудит журналы.

## 3D модель және лицензиялар

- **3D адам моделі:** «Human base mesh with editable 53-bone rig», Innerscene Corp, MakeHuman/MPFB CC0 активтерінен жасалған. Лицензия: **CC0 1.0 (public domain)**, атрибуция міндетті емес. Дереккөз: <https://www.innerscene.com/tools/library/3d-parts/human-base-mesh-with-editable-53-bone-rig-8e7c8ab1>. Толығырақ: [client/public/models/LICENSE.txt](client/public/models/LICENSE.txt).
- Модель скелеттің салмақтары (skin weights) және буын координаттары арқылы 21 аймаққа автоматты бөлінеді ([bodyModel.ts](client/src/components/body3d/bodyModel.ts)); ерекшелеу шейдерде жұмсақ шекаралармен жасалады.
- **Дәрілер туралы ақпарат:** NHS (UK) ресми беттерінен (nhs.uk/medicines) қазақ тіліне қысқаша мазмұндалған, 2026-11-20 тексерілген. Rx/OTC белгісі Ұлыбританиядағы мәртебені көрсетеді.
- **Шрифт:** Inter (SIL Open Font License).

## Жоба құрылымы

```
med/
├─ start.bat                 # Windows-та бір басумен іске қосу
├─ package.json              # npm run dev → API + Web бірге
├─ server/                   # Express + Prisma API
│  ├─ prisma/                # schema.prisma, migrations/, seed.ts
│  └─ src/
│     ├─ config/             # .env оқу
│     ├─ middleware/         # auth (JWT, RBAC), валидация, upload, error
│     ├─ routes/             # auth, patient, doctor, pharmacy, admin, misc
│     ├─ services/           # рұқсат тексеру, медициналық карта, PDF
│     └─ data/               # дене аймақтары, дәрілер (дереккөзбен)
└─ client/                   # React + Vite
   ├─ public/models/         # human.glb + LICENSE.txt
   └─ src/
      ├─ components/body3d/  # 3D сахна, сегментация, шейдер
      ├─ components/ui|layout
      ├─ features/           # auth, patient, doctor, pharmacy, admin, common
      ├─ hooks/ lib/
```

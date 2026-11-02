export type MissionId = 'james-webb' | 'hubble' | 'fermi'

export interface MissionImage {
  src: string
  title: string
  caption: string
  credit: string
  source: string
  kind: string
}

export interface Mission {
  id: MissionId
  short: string
  name: string
  kicker: string
  description: string
  launch: string
  location: string
  purpose: string
  stats: { label: string; value: string }[]
  construction: string
  science: string
  achievement: string
  source: string
  model: string
  image: string
  photoCaption: string
  photoCredit: string
  photoSource: string
  images: MissionImage[]
}

export const missions: Mission[] = [
  {
    id: 'james-webb',
    short: 'WEBB',
    name: 'James Webb',
    kicker: 'ИНФРАКРАСНАЯ ОБСЕРВАТОРИЯ',
    description: 'Свет первых галактик. Рождение звёзд. Атмосферы далёких миров. Webb открывает Вселенную, скрытую от наших глаз.',
    launch: '25.12.2021',
    location: 'Гало-орбита вокруг L2 системы Солнце–Земля',
    purpose: 'Ранняя Вселенная, эволюция галактик и экзопланеты',
    stats: [
      { label: 'ГЛАВНОЕ ЗЕРКАЛО', value: '6,5 м' },
      { label: 'ДИАПАЗОН', value: '0,6–28,5 мкм' },
      { label: 'ОТ ЗЕМЛИ', value: '≈ 1,5 млн км' },
    ],
    construction: '18 позолоченных бериллиевых сегментов работают как одно зеркало. Пятислойный солнцезащитный экран отделяет холодную оптику от нагретой стороны аппарата. Webb обращается вокруг Солнца, следуя по гало-орбите вокруг L2, а не по околоземной орбите.',
    science: 'Четыре научных прибора — NIRCam, NIRSpec, MIRI и NIRISS — исследуют инфракрасный свет. Спектры позволяют определять химический состав атмосфер экзопланет, а глубокие наблюдения — изучать ранние галактики.',
    achievement: 'В 2022 году Webb обнаружил ясный спектральный след углекислого газа в атмосфере WASP-39 b. Его первые глубокие поля показали тысячи галактик и действие гравитационного линзирования.',
    source: 'https://science.nasa.gov/mission/webb/',
    model: '/assets/models/james-webb.glb',
    image: '/assets/explorer/webb-cutout.webp',
    photoCaption: 'Аппарат в сложенной конфигурации · наземные испытания, 2020',
    photoCredit: 'NASA/Chris Gunn',
    photoSource: 'https://www.nasa.gov/solar-system/nasas-james-webb-space-telescope-completes-environmental-testing/',
    images: [
      {
        src: '/assets/images/webb-cliffs.jpg',
        title: 'Космические скалы',
        caption: 'Научное изображение NIRCam: край области звездообразования NGC 3324 в туманности Киля. Инфракрасные диапазоны переведены в видимые цвета; это наблюдение Webb, а не фотография самого телескопа.',
        credit: 'NASA, ESA, CSA, STScI',
        source: 'https://science.nasa.gov/missions/webb/nasas-webb-reveals-cosmic-cliffs-glittering-landscape-of-star-birth/',
        kind: 'НАУЧНОЕ ИЗОБРАЖЕНИЕ · NIRCAM',
      },
      {
        src: '/assets/explorer/webb-cutout.webp',
        title: 'Перед полётом',
        caption: 'Настоящая фотография Webb после испытаний на Земле в 2020 году. Телескоп сложен для запуска. Фон удалён маской; детали аппарата сохранены без генерации и увеличения исходного разрешения.',
        credit: 'NASA/Chris Gunn',
        source: 'https://www.nasa.gov/solar-system/nasas-james-webb-space-telescope-completes-environmental-testing/',
        kind: 'ФОТОГРАФИЯ АППАРАТА · 2020',
      },
      {
        src: '/assets/images/webb-deep-field.jpg',
        title: 'Первое глубокое поле',
        caption: 'Научное изображение скопления SMACS 0723, опубликованное в июле 2022 года. Дуги — искажённые гравитационным линзированием изображения более далёких галактик. Составлено из экспозиций NIRCam в нескольких инфракрасных фильтрах.',
        credit: 'NASA, ESA, CSA, STScI',
        source: 'https://science.nasa.gov/asset/webb/webbs-first-deep-field-unveiled-nircam-image/',
        kind: 'НАУЧНОЕ ИЗОБРАЖЕНИЕ · NIRCAM',
      },
    ],
  },
  {
    id: 'hubble',
    short: 'HUBBLE',
    name: 'Hubble',
    kicker: 'ОПТИЧЕСКАЯ ОБСЕРВАТОРИЯ',
    description: 'Над земной атмосферой Hubble наблюдает рождение и гибель звёзд, далёкие галактики и расширяющуюся Вселенную.',
    launch: '24.04.1990',
    location: 'Низкая околоземная орбита',
    purpose: 'Ультрафиолетовая, видимая и ближняя инфракрасная астрономия',
    stats: [
      { label: 'ГЛАВНОЕ ЗЕРКАЛО', value: '2,4 м' },
      { label: 'ДЛИНА АППАРАТА', value: '13,2 м' },
      { label: 'СЕРВИСНЫЕ МИССИИ', value: '5' },
    ],
    construction: 'В цилиндрическом корпусе размещён телескоп с главным зеркалом диаметром 2,4 метра. Солнечные панели обеспечивают питание, а антенны передают наблюдения на Землю. Пять экспедиций астронавтов ремонтировали и обновляли обсерваторию; последняя состоялась в 2009 году.',
    science: 'Hubble наблюдает в ультрафиолетовом, видимом и ближнем инфракрасном диапазонах. Работа над атмосферой Земли позволяет различать тонкие детали звёздных облаков, изучать чёрные дыры и измерять расстояния до галактик.',
    achievement: 'Наблюдения Hubble вместе с наземными обсерваториями помогли установить ускорение расширения Вселенной. Глубокие поля телескопа раскрыли множество галактик в крошечных участках неба.',
    source: 'https://science.nasa.gov/mission/hubble/observatory/',
    model: '/assets/models/hubble.glb',
    image: '/assets/explorer/hubble-cutout.webp',
    photoCaption: 'После последней миссии обслуживания · STS-125, 2009',
    photoCredit: 'NASA / STS-125',
    photoSource: 'https://science.nasa.gov/asset/hubble/bidding-hubble-farewell-after-servicing-mission-4-2009/',
    images: [
      {
        src: '/assets/images/hubble-pillars.jpg',
        title: 'Сквозь Столпы Творения',
        caption: 'Научное изображение Hubble в ближнем инфракрасном диапазоне. Свет проникает сквозь часть пыли туманности Орла и обнаруживает звёзды за ней. Цвета условные; это не обычная фотография в видимом свете.',
        credit: 'NASA, ESA, Hubble Heritage Team (STScI/AURA)',
        source: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e000842',
        kind: 'НАУЧНОЕ ИЗОБРАЖЕНИЕ · ИНФРАКРАСНОЕ',
      },
      {
        src: '/assets/images/hubble-spacecraft.jpg',
        title: 'Обсерватория на орбите',
        caption: 'Фотография самого Hubble, сделанная экипажем Atlantis 13 мая 2009 года, во время Servicing Mission 4. В этой экспедиции телескоп получил новые приборы и обновлённые системы.',
        credit: 'NASA',
        source: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e002151',
        kind: 'ФОТОГРАФИЯ АППАРАТА · 2009',
      },
      {
        src: '/assets/images/hubble-mountain.jpg',
        title: 'Мистическая гора',
        caption: 'Научное изображение WFC3: столб газа и пыли в туманности Киля, наблюдавшийся в феврале–марте 2010 года. Три диапазона ближнего инфракрасного света показаны условными цветами; за пылевой завесой видны звёзды.',
        credit: 'NASA, ESA, M. Livio, Hubble 20th Anniversary Team (STScI)',
        source: 'https://images.nasa.gov/details/GSFC_20171208_Archive_e002058',
        kind: 'НАУЧНОЕ ИЗОБРАЖЕНИЕ · WFC3',
      },
    ],
  },
  {
    id: 'fermi',
    short: 'FERMI',
    name: 'Fermi',
    kicker: 'ГАММА-ОБСЕРВАТОРИЯ',
    description: 'Самый энергичный свет космоса. Fermi исследует пульсары, джеты чёрных дыр и короткие вспышки колоссальной мощности.',
    launch: '11.06.2008',
    location: 'Низкая околоземная орбита',
    purpose: 'Высокоэнергетическая астрофизика и гамма-всплески',
    stats: [
      { label: 'ПРИБОРЫ', value: 'LAT + GBM' },
      { label: 'ДИАПАЗОН LAT', value: '20 МэВ–>300 ГэВ' },
      { label: 'ПОЛНЫЙ ОБЗОР НЕБА', value: '≈ 3 часа' },
    ],
    construction: 'Главный прибор LAT регистрирует высокоэнергетические гамма-фотоны. Монитор GBM дополняет его наблюдениями всплесков при меньших энергиях. Две большие солнечные панели питают обсерваторию, обращающуюся вокруг Земли.',
    science: 'Гамма-лучи показывают Вселенную иначе, чем видимый свет. Fermi исследует нейтронные звёзды, активные ядра галактик, происхождение космических лучей и гамма-всплески. Наблюдения дополняют измерения нейтрино и гравитационных волн.',
    achievement: 'В 2010 году данные LAT выявили пузыри Ферми — гигантские области гамма-излучения над и под плоскостью Млечного Пути. В 2017 году GBM зарегистрировал всплеск, связанный со слиянием нейтронных звёзд GW170817.',
    source: 'https://science.nasa.gov/mission/fermi/',
    model: '/assets/models/fermi.glb',
    image: '/assets/explorer/fermi-cutout.webp',
    photoCaption: 'Подготовка к запуску · сложенные панели и монтажная оснастка, 2008',
    photoCredit: 'NASA/Jim Grossmann',
    photoSource: 'https://images.nasa.gov/details/KSC-08pd1359',
    images: [
      {
        src: '/assets/images/fermi-sky.jpg',
        title: 'Небо в гамма-лучах',
        caption: 'Научная карта, составленная по 12 годам наблюдений LAT при энергиях выше 1 ГэВ. Яркие области отмечают интенсивное гамма-излучение. Это визуализация данных с условной цветовой шкалой, а не оптическая фотография.',
        credit: 'NASA/DOE/Fermi LAT Collaboration',
        source: 'https://science.nasa.gov/mission/fermi/',
        kind: 'НАУЧНЫЕ ДАННЫЕ · LAT',
      },
      {
        src: '/assets/images/fermi-spacecraft.jpg',
        title: 'Fermi в космосе',
        caption: 'Официальная научная визуализация Fermi из серии NASA 2025 года. Изображение показывает аппарат и солнечные панели; это компьютерная визуализация конструкции, а не снимок с орбиты.',
        credit: "NASA’s Goddard Space Flight Center/CI Lab",
        source: 'https://svs.gsfc.nasa.gov/14881/',
        kind: 'ВИЗУАЛИЗАЦИЯ АППАРАТА · NASA',
      },
      {
        src: '/assets/images/fermi-assembly.jpg',
        title: 'До выхода на орбиту',
        caption: 'Техническая фотография: аппарат GLAST, впоследствии переименованный в Fermi, опускают к переходнику полезной нагрузки в Astrotech. Флорида, 14 мая 2008 года.',
        credit: 'NASA/Jim Grossmann',
        source: 'https://images.nasa.gov/details/KSC-08pd1359',
        kind: 'ФОТОГРАФИЯ АППАРАТА · 2008',
      },
    ],
  },
]

'use strict';

// Fixed coordinates from OpenStreetMap points where available. Approximate
// business markers are flagged; all live walking directions open in Amap.
const routePlaces = {
  airport:   { name: '浦東機場',          lat: 31.1427359, lon: 121.8041131, query: '上海浦东国际机场' },
  hotel:     { name: '亞朵酒店',          lat: 31.23730,   lon: 121.48442,   query: '上海外滩南京东路亚朵酒店 福州路105-1号', approximate: true },
  dahu:      { name: '大壺春',            lat: 31.2367029, lon: 121.4847725, query: '大壶春 四川中路136号' },
  sihang:    { name: '四行倉庫',          lat: 31.2421773, lon: 121.4664853, query: '四行仓库抗战纪念馆' },
  peoples:   { name: '人民廣場',          lat: 31.2338888, lon: 121.4709881, query: '上海人民广场' },
  nanjing:   { name: '南京東路',          lat: 31.2367348, lon: 121.4717101, query: '南京东路步行街', approximate: true },
  wangyutai: { name: '汪裕泰・茶葉',      lat: 31.23745,   lon: 121.47520,   query: '汪裕泰 第一食品商店 南京东路720号', approximate: true },
  huanglongtai: { name: '黃隆泰・果乾茶', lat: 31.23910, lon: 121.48440, query: '黄隆泰潮品花茶店 江西中路300号', approximate: true },
  yuxingji:  { name: '裕興記',            lat: 31.24010,   lon: 121.48585,   query: '裕兴记 四川中路410号', approximate: true },
  waibaidu:  { name: '外白渡橋',          lat: 31.2453073, lon: 121.4857442, query: '外白渡桥' },
  bund:      { name: '外灘步道',          lat: 31.23950,   lon: 121.49000,   query: '外滩 南京东路口', approximate: true },
  laolao:    { name: '上海姥姥',          lat: 31.2373758, lon: 121.4845225, query: '上海姥姥家常饭馆 福州路70号' },
  yuyuan:    { name: '豫園庭園',          lat: 31.2289274, lon: 121.4879752, query: '上海豫园' },
  citygod:   { name: '城隍廟・商城',      lat: 31.2278786, lon: 121.4881914, query: '上海城隍庙' },
  nanxiang:  { name: '南翔饅頭店',        lat: 31.22760,   lon: 121.48770,   query: '南翔馒头店 豫园路87号', approximate: true },
  huxinting: { name: '湖心亭・九曲橋',    lat: 31.22776,   lon: 121.48770,   query: '湖心亭 九曲桥 豫园', approximate: true },
  pearl:     { name: '東方明珠外觀',      lat: 31.2419464, lon: 121.4952604, query: '东方明珠广播电视塔' },
  superbrand:{ name: '正大廣場',          lat: 31.2386497, lon: 121.4947385, query: '正大广场 陆家嘴西路168号' },
  riverside: { name: '浦東濱江',          lat: 31.2419543, lon: 121.4920105, query: '陆家嘴 滨江大道', approximate: true },
  jingan:    { name: '靜安寺',            lat: 31.2252150, lon: 121.4407923, query: '静安寺' },
  lailai:    { name: '萊萊小籠',          lat: 31.2271249, lon: 121.4386511, query: '莱莱小笼 万航渡路50号', approximate: true },
  anfu:      { name: '安福路',            lat: 31.2163067, lon: 121.4410334, query: '安福路 乌鲁木齐中路', approximate: true },
  wukang:    { name: '武康路',            lat: 31.2138866, lon: 121.4361757, query: '武康路 安福路', approximate: true },
  mansion:   { name: '武康大樓',          lat: 31.2062561, lon: 121.4337292, query: '武康大楼 淮海中路1850号' },
  shangyin:  { name: '上隱水產',          lat: 31.21889,   lon: 121.45444,   query: '上隐水产 淮海中路918号 百盛购物中心7楼', approximate: true },
};

const dailyRoutes = {
  '1': { stops: ['airport', 'hotel'], transit: [0], note: '機場到飯店需搭車；海底撈分店未定，暫不標點。' },
  '2': { stops: ['hotel', 'jingan', 'lailai', 'anfu', 'wukang', 'mansion', 'shangyin'], transit: [0], note: '4/1（週四）飯店到靜安寺建議搭車；步行逛安福路、武康路和淮海路，晚上到上隱水產。' },
  '3': { stops: ['dahu', 'sihang', 'peoples', 'nanjing', 'wangyutai', 'huanglongtai', 'yuxingji', 'hotel', 'laolao'], transit: [0], note: '4/2（週五）四行倉庫、人民廣場和南京東路集中一天；茶葉與果乾茶沿路買，晚餐在飯店附近。' },
  '4': { stops: ['yuyuan', 'citygod', 'nanxiang', 'huxinting', 'bund', 'pearl', 'superbrand', 'riverside'], transit: [4], note: '4/3（週六）豫園步行到外灘，再搭車過江到陸家嘴；外白渡橋是外灘北端的加走選項。' },
  '5': { stops: [], transit: [], note: '最後一天留白，等回程航班確認再畫路線。' },
};

const dayButtons = [...document.querySelectorAll('.real-map-tabs button')];
const stopList = document.getElementById('map-stop-list');
const mapHint = document.getElementById('map-fallback');
const mapExplain = document.getElementById('map-explain');
const mapElement = document.getElementById('route-map');

if (!window.L) {
  mapHint.hidden = false;
  mapHint.textContent = '地圖底圖目前無法載入。下方文字路線與各停點的高德連結仍可使用。';
} else {
  const map = L.map(mapElement, { scrollWheelZoom: false, zoomControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    updateWhenIdle: true,
    keepBuffer: 1,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
  }).addTo(map);
  const overlay = L.layerGroup().addTo(map);

  function showRoute(day) {
    overlay.clearLayers();
    stopList.replaceChildren();
    dayButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.day === day)));
    const route = dailyRoutes[day];
    mapExplain.textContent = route.note + ' 地圖連線表示停點順序，不代表實際人行道；虛線表示搭車。位置帶「約」者為附近地標。';
    if (!route.stops.length) {
      map.setView([31.232, 121.478], 12);
      mapHint.hidden = false;
      mapHint.textContent = route.note;
      return;
    }
    mapHint.hidden = true;
    const points = route.stops.map(key => routePlaces[key]);
    points.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lon], {
        icon: L.divIcon({ className: '', html: '<span class="map-number">' + (index + 1) + '</span>', iconSize: [26, 26], iconAnchor: [13, 13] }),
        title: (index + 1) + '. ' + point.name,
      }).addTo(overlay);
      const url = 'https://www.amap.com/search?city=310000&query=' + encodeURIComponent(point.query);
      const popup = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'map-popup-title';
      title.textContent = (index + 1) + '. ' + point.name + (point.approximate ? '（約略位置）' : '');
      const link = document.createElement('a');
      link.className = 'map-popup-link';
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '開啟高德找店門口 ↗';
      popup.append(title, link);
      marker.bindPopup(popup);

      const item = document.createElement('li');
      const number = document.createElement('b');
      number.textContent = index + 1;
      const text = document.createElement('a');
      text.href = url;
      text.target = '_blank';
      text.rel = 'noopener noreferrer';
      text.textContent = point.name;
      item.append(number, text);
      if (point.approximate) {
        const approx = document.createElement('span');
        approx.className = 'map-uncertain';
        approx.textContent = '約';
        item.append(approx);
      }
      stopList.append(item);
      if (index > 0) {
        L.polyline([[points[index - 1].lat, points[index - 1].lon], [point.lat, point.lon]], {
          color: route.transit.includes(index - 1) ? '#68736a' : '#ad4b36',
          weight: route.transit.includes(index - 1) ? 3 : 4,
          opacity: 0.85,
          dashArray: route.transit.includes(index - 1) ? '7 8' : null,
        }).addTo(overlay);
      }
    });
    map.fitBounds(L.latLngBounds(points.map(point => [point.lat, point.lon])), { padding: [32, 32], maxZoom: day === '1' ? 11 : 15 });
  }

  dayButtons.forEach(button => button.addEventListener('click', () => {
    document.querySelector('.day-tab[data-day="' + button.dataset.day + '"]').click();
  }));
  const itineraryTabs = [...document.querySelectorAll('.day-tab')];
  const selectedDay = () => itineraryTabs.find(tab => tab.getAttribute('aria-selected') === 'true')?.dataset.day || '2';
  new MutationObserver(() => showRoute(selectedDay())).observe(document.querySelector('.day-tabs'), { subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
  showRoute(selectedDay());
}

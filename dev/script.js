// ============================================================
// Project Slavery - Web Edition
// Ported from Python original by Hsu Hsieh
// ============================================================

// ---- Dice System ----

function d(a, b = 1, m = '+') {
    let sum = 0;
    for (let i = 0; i < b; i++) {
        sum += Math.floor(Math.random() * a) + 1;
    }
    if (m === '+-') {
        if (Math.floor(Math.random() * 2) === 0) {
            sum = -sum;
        }
    }
    return sum;
}

function comp(a, b) {
    const hard = Math.floor(b / 2);
    const extreme = Math.floor(b / 5);
    if (a > b) return 0;
    if (a <= b && a > hard) return 1;
    if (a <= b && a > extreme) return 2;
    if (a <= extreme) return 3;
    return 0;
}

function compagainst(a, b) {
    return comp(d(100), a) - comp(d(100), b);
}

function ch(a) {
    return comp(d(100), a);
}

function xch(a, b) {
    return ch(a) - ch(b);
}

const CH_LABELS = ['失败', '成功', '大成功', '超大成功'];
const XCH_LABELS = { '-3': '傻逼了', '-2': '大失败', '-1': '失败', '0': '平手', '1': '成功', '2': '大成功', '3': '牛逼了' };

// ---- Game State ----

let G = null;
let actingCharId = null;
let yearActionsDone = false;
let currentActionId = null;

const STAT_KEYS = ['int', 'cha', 'sta', 'sex', 'psq', 'hel', 'con', 'wel', 'luc', 'cal', 'edu', 'exp'];
const STAT_LABELS = { int: '智力', cha: '魅力', sta: '劳动力', sex: '性能力', psq: '体格', hel: '寿命', con: '魄力', wel: '财富', luc: '运气', cal: '灾厄', edu: '教育', exp: '经验' };
const STAT_COLORS = { int: '#4fc3f7', cha: '#ffb74d', sta: '#81c784', sex: '#f06292', psq: '#ff8a65', hel: '#aed581', con: '#ba68c8', wel: '#ce93d8', luc: '#ffd54f', cal: '#90caf9', edu: '#a5d6a7', exp: '#4db6ac' };
function statColor(key, ch) {
    if (key === 'con' && ch && isHaoQiang(ch)) return '#ff0000';
    return STAT_COLORS[key];
}

const STAT_DESC = {
    int: { t: '智力', r: [[1,'蠢笨如猪'],[11,'呆傻如畜'],[21,'略显愚笨'],[31,'智力正常'],[51,'老谋深算'],[71,'在世诸葛'],[91,'无所不知']] },
    cha: { t: '魅力', r: [[1,'状如厉鬼'],[11,'面目可憎'],[21,'貌不出众'],[31,'五官端正'],[51,'风度翩翩'],[71,'倾国倾城'],[91,'如神降世']] },
    sta: { t: '劳动力', r: [[1,'奄奄一息'],[11,'手不缚鸡'],[21,'容易疲惫'],[31,'身强力健'],[51,'精力过人'],[71,'坚韧如铁'],[91,'人形机床']] },
    sex: { t: '性能力', r: [[1,'枯木死灰'],[11,'寡欲无能'],[21,'偶有心力'],[31,'精神焕发'],[51,'龙精虎猛'],[71,'产科常客'],[91,'无垠深壑']] },
    psq: { t: '体格', r: [[1,'烂肉几斤'],[11,'弱不禁风'],[21,'偶染微恙'],[31,'气血充足'],[51,'铜皮铁骨'],[71,'拔山扛鼎'],[91,'小祖国人']] },
    hel: { t: '寿命', r: [[1,'短命早夭'],[11,'英年早逝'],[21,'难得而立'],[31,'享寿天年'],[51,'长命百岁'],[71,'寿比南山'],[91,'万寿无疆']] },
    con: { t: '魄力', r: [[1,'众叛亲离'],[11,'人微言轻'],[21,'唯唯诺诺'],[31,'一呼百应'],[51,'威震八方'],[71,'乱世枭雄'],[91,'天生帝王']] },
    wel: { t: '财产', r: [[1,'身无分文'],[11,'饥寒交迫'],[21,'勉强糊口'],[31,'家境殷实'],[51,'巨富商贾'],[71,'富可敌国'],[91,'四海皆私']] },
    luc: { t: '幸运', r: [[1,'衰神附体'],[11,'诸事不顺'],[21,'偶遇颠簸'],[31,'平平安安'],[51,'逢凶化吉'],[71,'洪福齐天'],[91,'天命之子']] },
    cal: { t: '灾厄', r: [[1,'洁白无瑕'],[11,'偶染尘埃'],[21,'略积怨怼'],[31,'恶业缠身'],[51,'天怒人怨'],[71,'罪不容诛'],[91,'万劫不复']] },
    edu: { t: '教育', r: [[1,'这是文盲'],[11,'中学毕业'],[21,'高校毕业'],[31,'专业深耕'],[51,'学术顶尖'],[71,'海河学者']] },
    exp: { t: '经验', r: [[1,'不谙世事'],[11,'初经人事'],[21,'察言观色'],[31,'饱经风霜'],[51,'老练圆滑'],[71,'看破红尘'],[91,'洞若观火']] }
};

function statDesc(key, val) {
    const d = STAT_DESC[key];
    if (!d) return '';
    const r = d.r;
    for (let i = r.length - 1; i >= 0; i--) {
        if (val >= r[i][0]) return r[i][1];
    }
    return r[0][1];
}

function ageDesc(age) {
    if (age <= 12) return '谁家小孩';
    if (age <= 24) return '脑容升级';
    if (age <= 60) return '正值壮年';
    if (age <= 80) return '已是耄耋';
    return '谁家老头';
}

const CLASS_MAP = {
    '皇帝': '天子',
    '正宫': '后宫',
    '宰相': '大臣', '监工': '大臣', '将军': '大臣',
    '学者': '军工', '艺人': '军工', '劳工': '军工', '士兵': '军工',
    '无业者': '平民', '休养者': '平民',
    '普侍': '贱民'
};

const CLASS_COLORS = { '天子': '#e94560', '后宫': '#f48fb1', '储君': '#ffd54f', '大臣': '#4fc3f7', '军工': '#81c784', '平民': '#a0a0b0', '贱民': '#888' };

const TARGET_SETTINGS = {
    '科技大学': { tec:[180,'+4+-1d8'], cul:[100,'+-1d4'], prd:[120,'+-1d4+1'], pop:[60,'+-1d4'], mil:[80,'+-1d4'], inf:[80,'+-1d4'], tre:[50,'+-1d8'], cal:[100,'+-1d4'], mdtBase:400 },
    '财经大学': { tec:[130,'+-1d4-2'], cul:[120,'+-1d4+1d6-3'], prd:[90,'+-1d4-1'], pop:[60,'+-1d4'], mil:[80,'+-1d4'], inf:[70,'+-1d4'], tre:[150,'+-1d4+2'], cal:[100,'+-1d4'], mdtBase:400 },
    '玛钢厂':  { tec:[150,'+1+-1d4'], cul:[80,'+-1d4-1d6+2'], prd:[150,'+-1d4+2d4-1'], pop:[60,'+-1d4'], mil:[120,'+-1d4+1'], inf:[70,'+-1d4'], tre:[50,'+-1d8'], cal:[150,'+-1d8+1d20'], mdtBase:400 },
    '第四医院': { tec:[130,'+-1d4-2'], cul:[150,'+-1d4+2d6-3'], prd:[120,'+-1d4+1'], pop:[80,'+-1d4+2'], mil:[70,'+-1d4'], inf:[80,'+-1d4'], tre:[50,'+-1d8'], cal:[80,'+-1d4-2'], mdtBase:450 },
    '东海居委会':  { tec:[100,'+-1d6-5'], cul:[100,'+-1d4'], prd:[120,'+-1d4+1'], pop:[50,'+-1d4-1'], mil:[150,'+-1d4+1d6+1'], inf:[90,'+-1d4+1'], tre:[70,'+-1d6'], cal:[130,'+-1d4+1'], mdtBase:450 },
    '陈塘庄居委会':{ tec:[100,'+-1d6-5'], cul:[100,'+-1d4'], prd:[120,'+-1d4+1'], pop:[50,'+-1d4-1'], mil:[150,'+-1d4+1d6+1'], inf:[90,'+-1d4+1'], tre:[70,'+-1d6'], cal:[130,'+-1d4+1'], mdtBase:450 },
    '柳林居委会':  { tec:[100,'+-1d6-5'], cul:[100,'+-1d4'], prd:[120,'+-1d4+1'], pop:[50,'+-1d4-1'], mil:[150,'+-1d4+1d6+1'], inf:[90,'+-1d4+1'], tre:[70,'+-1d6'], cal:[130,'+-1d4+1'], mdtBase:450 }
};

// 征服条件: 7项条件固定为 tec/cul/prd/pop/mil/inf/tre
const CONQUEST_CONDS = [
    { name:'科技', field:'tec' }, { name:'文化', field:'cul' }, { name:'生产', field:'prd' },
    { name:'人口', field:'pop' }, { name:'军事', field:'mil' }, { name:'民心', field:'inf' }, { name:'银库', field:'tre' }
];
// 各目标的关键条件索引 (0-based)
const CONQUEST_KEYS = {
    '科技大学': [0], '财经大学': [6], '玛钢厂': [2], '第四医院': [3],
    '东海居委会': [4,5,6], '陈塘庄居委会': [4,5,6], '柳林居委会': [4,5,6]
};


function parseDice(s) {
    if (s.includes('d')) {
        const [count, size] = s.split('d');
        return d(parseInt(size), parseInt(count) || 1);
    }
    return parseInt(s) || 0;
}

function evalFluctuation(expr) {
    if (!expr) return 0;
    const parts = expr.split(/(?=[+-])/).filter(Boolean);
    let total = 0;
    for (const part of parts) {
        if (part.startsWith('+-')) {
            const dice = part.slice(2);
            if (dice.includes('d')) {
                const [count, size] = dice.split('d');
                total += d(parseInt(size), parseInt(count) || 1, '+-');
            } else {
                total += (Math.random() < 0.5 ? 1 : -1) * (parseInt(dice) || 0);
            }
        } else if (part.startsWith('+')) {
            total += parseDice(part.slice(1));
        } else if (part.startsWith('-')) {
            total -= parseDice(part.slice(1));
        }
    }
    return total;
}

function initTargetProps(target) {
    const s = TARGET_SETTINGS[target.name];
    if (!s) return;
    target.tec = s.tec[0]; target._tec = s.tec[1];
    target.cul = s.cul[0]; target._cul = s.cul[1];
    target.prd = s.prd[0]; target._prd = s.prd[1];
    target.pop = s.pop[0]; target._pop = s.pop[1];
    target.mil = s.mil[0]; target._mil = s.mil[1];
    target.inf = s.inf[0]; target._inf = s.inf[1];
    target.tre = s.tre[0]; target._tre = s.tre[1];
    target.cal = s.cal[0]; target._cal = s.cal[1];
    target.mdtBase = s.mdtBase;
}

function targetMinxin(t) {
    const avg = ((t.tec||0) + (t.cul||0) + (t.prd||0) + (t.pop||0) + (t.mil||0)) / 5;
    return Math.floor(avg + (t.inf||0) * 0.8 + (t.tre||0) / 7);
}

function targetTiantian(t) {
    return (t.mdtBase||0) + targetMinxin(t) - (t.cal||0);
}

function processTargetFluctuations() {
    (G.mapData.targets || []).forEach(t => {
        if (t.id === 'headquarter') return;
        if (t._tec) t.tec = Math.max(0, (t.tec||0) + evalFluctuation(t._tec));
        if (t._cul) t.cul = Math.max(0, (t.cul||0) + evalFluctuation(t._cul));
        if (t._prd) t.prd = Math.max(0, (t.prd||0) + evalFluctuation(t._prd));
        if (t._pop) t.pop = Math.max(0, (t.pop||0) + evalFluctuation(t._pop));
        if (t._mil) t.mil = Math.max(0, (t.mil||0) + evalFluctuation(t._mil));
        if (t._inf) t.inf = Math.max(0, (t.inf||0) + evalFluctuation(t._inf));
        if (t._tre) t.tre = Math.max(0, (t.tre||0) + evalFluctuation(t._tre));
        if (t._cal) t.cal = Math.max(0, (t.cal||0) + evalFluctuation(t._cal));
    });
}

function showTargetDetail(targetId) {
    const t = G.mapData.targets.find(x => x.id === targetId);
    if (!t) return;
    const mx = targetMinxin(t);
    const tt = targetTiantian(t);
    let html = `<div class="detail-header">${t.name}</div>`;
    html += '<div class="detail-stats" style="margin-top:8px;">';
    html += `<span><span class="stat-label">科技:</span> <span class="stat-val">${t.tec||0}</span></span>`;
    html += `<span><span class="stat-label">文化:</span> <span class="stat-val">${t.cul||0}</span></span>`;
    html += `<span><span class="stat-label">生产:</span> <span class="stat-val">${t.prd||0}</span></span>`;
    html += `<span><span class="stat-label">人口:</span> <span class="stat-val">${t.pop||0}</span></span>`;
    html += `<span><span class="stat-label">军事:</span> <span class="stat-val">${t.mil||0}</span></span>`;
    html += `<span><span class="stat-label">民心:</span> <span class="stat-val">${t.inf||0}</span></span>`;
    html += `<span><span class="stat-label">国库:</span> <span class="stat-val">${t.tre||0}</span></span>`;
    html += `<span><span class="stat-label">灾厄:</span> <span class="stat-val">${t.cal||0}</span></span>`;
    html += `<span><span class="stat-label">天命基础:</span> <span class="stat-val">${t.mdtBase||0}</span></span>`;
    html += '</div>';
    html += '<div style="margin-top:10px;border-top:1px solid #333;padding-top:8px;">';
    html += `<span>民心: ${mx}</span><br>`;
    html += `<span>天命: ${tt}</span>`;
    html += '</div>';
    document.getElementById('targetDetailTitle').textContent = `${t.name} 属性`;
    document.getElementById('targetDetailContent').innerHTML = html;
    document.getElementById('targetDetailOverlay').style.display = 'flex';
}


function isConsort(ch) {
    if (!ch || ch.isDead || ch.exitStatus) return false;
    const emp = G.chars.find(e => e.id === G.leaderId);
    if (!emp) return false;
    return (emp.lovers && emp.lovers.includes(ch.id)) || (ch.lovers && ch.lovers.includes(emp.id));
}

function getClass(profession, ch) {
    if (ch && isConsort(ch)) return '后宫';
    return CLASS_MAP[profession] || '平民';
}

function charClass(c) {
    return getClass(c.profession, c);
}

function charClass(c) {
    if (c._class) return c._class;
    if (c.parents && c.parents.includes(G.leaderId)) return '储君';
    return getClass(c.profession);
}

function findCharById(id) {
    return G.chars.find(x => x.id === id)
        || (G.historicalFigures || []).find(x => x.id === id)
        || (G.unavailableChars || []).find(x => x.id === id)
        || (G.deadChars || []).find(x => x.id === id);
}

function getParents(c) {
    return (c.parents || []).map(id => findCharById(id)).filter(Boolean);
}

function getChildren(c) {
    return (c.children || []).map(id => findCharById(id)).filter(Boolean);
}

function getGrandparents(c) {
    return (c.grandparents || []).map(id => findCharById(id)).filter(Boolean);
}

const HISTORY_LABELS = { science: '科学', art: '艺术', labor: '劳动', dating: '约会', rest: '休息', birth: '生育' };

function logLifeEvent(c, type, desc) {
    if (!c.lifeEvents) c.lifeEvents = [];
    c.lifeEvents.push({ year: G.time, type, desc });
}

function logFamilyExitEvent(c, desc) {
    if (c.spouseId) {
        const spouse = G.chars.find(x => x.id === c.spouseId);
        if (spouse && !spouse.exitStatus) {
            logLifeEvent(spouse, 'family_exit', '配偶' + c.name + desc);
        }
    }
    (c.children || []).forEach(childId => {
        const child = G.chars.find(x => x.id === childId);
        if (child && !child.exitStatus) {
            logLifeEvent(child, 'family_exit', '父母' + c.name + desc);
        }
    });
    (c.parents || []).forEach(parentId => {
        const parent = G.chars.find(x => x.id === parentId);
        if (parent && !parent.exitStatus) {
            logLifeEvent(parent, 'family_exit', '子女' + c.name + desc);
        }
    });
}

const LIFE_EVENT_ICONS = {
    entry: '入场', exit: '✟离场', appoint: '⬆任职', demote: '⬇卸任',
    marry: '❤嫁娶', childbirth: '⊛生子', coup: '⚔政变',
    dice_crit: '★特大', dice_fail: '✘大败',
    exile: '↯流放', kill: '☠处决', summon: '☎召见',
    family_exit: '⊲亲属离场'
};

// ---- Organization ----

const ORG_LABELS = { tec: '科技', cul: '文化', prd: '生产', pop: '人口', mil: '军事', inf: '民心', tre: '银库', apo: '天灾', mdt: '天命', lvl: '等级' };
const ORG_COLORS = { tec: '#4fc3f7', cul: '#ffb74d', prd: '#81c784', pop: '#f06292', mil: '#e94560', inf: '#aed581', tre: '#ce93d8', apo: '#90caf9', mdt: '#ffd54f', lvl: '#ba68c8' };

const ORG_LEVEL_NAMES = ['办公室', '街道', '镇', '县', '省', '国'];

function initOrganization() {
    G.organization = {
        current: {
            tec: 0, cul: 0, prd: 0, pop: 0, mil: 0, inf: 0, tre: 0, apo: 0, mdt: 0, lvl: 0,
            btec: 0, etec: 0, atec: 0, bcul: 0, ecul: 0, acul: 0,
            bprd: 0, eprd: 0, aprd: 0,
            bpop: 0, epop: 0, apop: 0,
            bmil: 0, emil: 0, amil: 0,
            binf: 0, einf: 0, ainf: 0,
            btre: 0, etre: 0,
            bapo: 0, eapo: 0, aapo: 0,
            bmdt: 0, emdt: 0
        },
        peak: {}
    };
    ['tec', 'cul', 'prd', 'pop', 'mil', 'inf', 'tre', 'apo', 'mdt', 'lvl'].forEach(k => {
        G.organization.peak[k] = { value: 0, year: 0 };
    });
}

function updateOrganization() {
    const alive = G.chars.filter(c => !c.exitStatus);
    const aliveUnavailable = (G.unavailableChars || []).filter(c => !c.exitStatus);
    const n = alive.length + aliveUnavailable.length;
    if (n === 0) return;

    const leader = G.chars.find(c => c.id === G.leaderId);
    if (!leader) return;

    const role = prof => alive.find(c => c.profession === prof);
    const emp = leader;
    const consort = role('正宫');
    const chancellor = role('宰相');
    const overseer = role('监工');
    const general = role('将军');

    const pool = [...alive, ...aliveUnavailable];
    const sum = s => pool.reduce((a, c) => a + (c[s] || 0), 0);
    const avg = s => sum(s) / n;
    const muln = 1 + n / 10;
    const n_mil = alive.filter(c => c.profession === '士兵').length;

    const cur = G.organization.current;

    const btec = (emp ? emp.int : 0) + avg('int') * muln;
    const bcul = (emp ? emp.cha : 0) + avg('cha') * muln;
    const bprd = (overseer ? overseer.sta : 0) + avg('sta') * muln;
    const bpop = (overseer ? overseer.sex * 0.5 : 0) + avg('sex') * 0.5 + 2 * n;
    const bmil = ((emp ? emp.psq + emp.con : 0) + (general ? general.psq + general.con : 0)) * 0.25 + avg('psq') * muln + n_mil;
    const bapo = (emp ? emp.cal : 0) + avg('cal') * (0.2 + n / 10);

    cur.btec = btec; cur.bcul = bcul; cur.bprd = bprd;
    cur.bpop = bpop; cur.bmil = bmil; cur.bapo = bapo;

    const tec = btec + (cur.etec || 0) + (cur.atec || 0);
    const cul = bcul + (cur.ecul || 0) + (cur.acul || 0);
    const prd = bprd + (cur.eprd || 0) + (cur.aprd || 0);
    const pop = bpop + (cur.epop || 0) + (cur.apop || 0);
    const mil = bmil + (cur.emil || 0) + (cur.amil || 0);
    const apo = bapo + (cur.eapo || 0) + (cur.aapo || 0);

    cur.tre = cur.btre + cur.etre;

    const binf = 0.2 * (tec + cul + prd + pop + mil)
        + 0.7 * (emp ? emp.con : 0)
        + 0.125 * ([consort, chancellor, overseer, general].reduce((s, r) => s + (r ? r.con : 0), 0))
        + (1 / 7) * cur.tre;
    const inf = binf + (cur.einf || 0) + (cur.ainf || 0);

    const mdt = 500 - (G.mdtPenalty || 0) + (G.mdtRestorerAccum || 0) + inf - apo;

    cur.tec = tec; cur.cul = cul; cur.prd = prd; cur.pop = pop; cur.mil = mil;
    cur.inf = inf; cur.apo = apo; cur.mdt = mdt;
    cur.binf = binf;

    const peak = G.organization.peak;
    const year = G.time;
    ['tec', 'cul', 'prd', 'pop', 'mil', 'inf', 'tre', 'apo', 'mdt', 'lvl'].forEach(k => {
        if (cur[k] > peak[k].value) {
            peak[k].value = cur[k];
            peak[k].year = year;
        }
    });

    renderOrganization();
}

function renderOrganization() {
    const el = document.getElementById('orgPanel');
    if (!el) return;
    const cur = G.organization.current;
    const peak = G.organization.peak;
    const keys = Object.keys(ORG_LABELS).filter(k => k !== 'lvl');
    el.innerHTML = keys.map(k => {
        const val = fmt(cur[k]);
        const peakVal = fmt(peak[k].value);
        const br = k === 'inf' ? '<div style="width:100%;"></div>' : '';
        return br + `
        <span class="org-stat" data-org-key="${k}" style="cursor:pointer;">
            <span class="org-label" style="color:${ORG_COLORS[k]}">${ORG_LABELS[k]}</span>
            <span class="org-cur">${val}</span>
            <span class="org-peak">↓${peakVal}@${peak[k].year}</span>
        </span>`;
    }).join('') + '<span class="org-year">年' + G.time + '</span>';

    el.querySelectorAll('.org-stat[data-org-key]').forEach(span => {
        span.addEventListener('click', () => showOrgBreakdown(span.dataset.orgKey));
        span.addEventListener('mouseenter', showOrgTooltip);
        span.addEventListener('mouseleave', hideOrgTooltip);
        span.addEventListener('mousemove', moveOrgTooltip);
    });
}

function orgTooltipText(key) {
    const cur = G.organization.current;
    const alive = G.chars.filter(c => !c.exitStatus);
    const aliveUnavailable = (G.unavailableChars || []).filter(c => !c.exitStatus);
    const n = alive.length + aliveUnavailable.length;
    const pool = [...alive, ...aliveUnavailable];
    const avg = s => pool.reduce((a, c) => a + (c[s] || 0), 0) / n;
    const muln = 1 + n / 10;
    const emp = alive.find(c => c.id === G.leaderId);
    const consort = alive.find(c => c.profession === '正宫');
    const chancellor = alive.find(c => c.profession === '宰相');
    const overseer = alive.find(c => c.profession === '监工');
    const general = alive.find(c => c.profession === '将军');
    const pf = v => typeof v === 'number' ? fmt(v) : '0';

    if (key === 'lvl') return `${ORG_LEVEL_NAMES[cur.lvl]}`;
    if (key === 'tre') return `积蓄:${pf(cur.btre)} + 额外:${pf(cur.etre)} = ${pf(cur.tre)}`;
    if (key === 'tec') {
        const empC = emp ? emp.int : 0;
        const popC = avg('int') * muln;
        let s = `皇帝(int:${emp ? emp.int : '—'}):${pf(empC)} + 民众 avg(int):${pf(avg('int'))}×${pf(muln)}:${pf(popC)} + 额外:${pf(cur.etec||0)}`;
        if (cur.atec) s += ` + 累计:${pf(cur.atec)}`;
        return s + ` = ${pf(cur.tec)}`;
    }
    if (key === 'cul') {
        const empC = emp ? emp.cha : 0;
        const popC = avg('cha') * muln;
        let s = `皇帝(cha:${emp ? emp.cha : '—'}):${pf(empC)} + 民众 avg(cha):${pf(avg('cha'))}×${pf(muln)}:${pf(popC)} + 额外:${pf(cur.ecul||0)}`;
        if (cur.acul) s += ` + 累计:${pf(cur.acul)}`;
        return s + ` = ${pf(cur.cul)}`;
    }
    if (key === 'prd') {
        const overseerC = overseer ? overseer.sta : 0;
        const popC = avg('sta') * muln;
        let s = `监工(sta:${overseer ? overseer.sta : '—'}):${pf(overseerC)} + 民众 avg(sta):${pf(avg('sta'))}×${pf(muln)}:${pf(popC)} + 额外:${pf(cur.eprd||0)}`;
        if (cur.aprd) s += ` + 累计:${pf(cur.aprd)}`;
        return s + ` = ${pf(cur.prd)}`;
    }
    if (key === 'pop') {
        const overseerC = overseer ? overseer.sex * 0.5 : 0;
        const popC = avg('sex') * 0.5 + 2 * n;
        let s = `监工(sex:${overseer ? overseer.sex : '—'}×0.5):${pf(overseerC)} + 民众 avg(sex)/2:${pf(avg('sex')*0.5)} + 基数:${pf(2*n)}:${pf(popC)} + 额外:${pf(cur.epop||0)}`;
        if (cur.apop) s += ` + 累计:${pf(cur.apop)}`;
        return s + ` = ${pf(cur.pop)} (人数:${n})`;
    }
    if (key === 'mil') {
        const empC = emp ? (emp.psq + emp.con) * 0.25 : 0;
        const generalC = general ? (general.psq + general.con) * 0.25 : 0;
        const popC = avg('psq') * muln;
        const n_mil = alive.filter(c => c.profession === '士兵').length;
        let s = `皇帝(psq+con:${emp ? emp.psq + emp.con : '—'}×0.25):${pf(empC)} + 将军(psq+con:${general ? general.psq + general.con : '—'}×0.25):${pf(generalC)} + 民众 avg(psq):${pf(avg('psq'))}×${pf(muln)}:${pf(popC)} + 士兵:${pf(n_mil)} + 额外:${pf(cur.emil||0)}`;
        if (cur.amil) s += ` + 累计:${pf(cur.amil)}`;
        return s + ` = ${pf(cur.mil)}`;
    }
    if (key === 'inf') {
        const prodC = 0.2 * (cur.tec + cur.cul + cur.prd + cur.pop + cur.mil);
        const empC = emp ? 0.7 * emp.con : 0;
        const ministers = [consort, chancellor, overseer, general].filter(Boolean);
        const ministerC = 0.125 * ministers.reduce((s, r) => s + r.con, 0);
        const treC = (1 / 7) * cur.tre;
        let s = `五业×0.2:${pf(prodC)} + 皇帝con×0.7:${pf(empC)} + 重臣con×0.125:${pf(ministerC)} + 银库/7:${pf(treC)} + 额外:${pf(cur.einf||0)}`;
        if (cur.ainf) s += ` + 累计:${pf(cur.ainf)}`;
        return s + ` = ${pf(cur.inf)}`;
    }
    if (key === 'apo') {
        const empC = emp ? emp.cal : 0;
        const popC = avg('cal') * (0.2 + n / 10);
        let s = `皇帝(cal:${emp ? emp.cal : '—'}):${pf(empC)} + 民众 avg(cal):${pf(avg('cal'))}×${pf(0.2 + n / 10)}:${pf(popC)} + 额外:${pf(cur.eapo||0)}`;
        if (cur.aapo) s += ` + 累计:${pf(cur.aapo)}`;
        return s + ` = ${pf(cur.apo)}`;
    }
    if (key === 'mdt') {
        const penalty = G.mdtPenalty || 0;
        return `基础:${500 - penalty} (500-${penalty}) + 民心:${pf(cur.inf)} - 天灾:${pf(cur.apo)} = ${pf(cur.mdt)}`;
    }
    return '';
}

function showOrgTooltip(e) {
    const key = e.currentTarget.dataset.orgKey;
    const text = orgTooltipText(key);
    if (!text) return;
    const tip = document.getElementById('orgTooltip');
    tip.textContent = text;
    tip.style.display = 'block';
    const rect = e.currentTarget.getBoundingClientRect();
    const appRect = document.getElementById('app').getBoundingClientRect();
    tip.style.left = (rect.left - appRect.left) + 'px';
    tip.style.top = (rect.bottom - appRect.top + 4) + 'px';
}

function moveOrgTooltip(e) {
    const tip = document.getElementById('orgTooltip');
    if (tip.style.display === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const appRect = document.getElementById('app').getBoundingClientRect();
    tip.style.left = (rect.left - appRect.left) + 'px';
    tip.style.top = (rect.bottom - appRect.top + 4) + 'px';
}

function hideOrgTooltip() {
    document.getElementById('orgTooltip').style.display = 'none';
}

function showOrgBreakdown(key) {
    const cur = G.organization.current;
    const alive = G.chars.filter(c => !c.exitStatus);
    const aliveUnavailable = (G.unavailableChars || []).filter(c => !c.exitStatus);
    const n = alive.length + aliveUnavailable.length;
    const pool = [...alive, ...aliveUnavailable];
    const avg = s => pool.reduce((a, c) => a + (c[s] || 0), 0) / n;
    const muln = 1 + n / 10;
    const emp = alive.find(c => c.id === G.leaderId);
    const consort = alive.find(c => c.profession === '正宫');
    const chancellor = alive.find(c => c.profession === '宰相');
    const overseer = alive.find(c => c.profession === '监工');
    const general = alive.find(c => c.profession === '将军');

    const pf = v => typeof v === 'number' ? fmt(v) : '0';
    const lines = [];

    if (key === 'lvl') {
        lines.push(`等级: ${ORG_LEVEL_NAMES[cur.lvl]}`);
    } else if (key === 'tre') {
        lines.push(`银库 = 积蓄 + 额外`);
        lines.push(`  积蓄(btre): ${pf(cur.btre)}`);
        lines.push(`  额外(etre): ${pf(cur.etre)}`);
        lines.push(`  合计: ${pf(cur.tre)}`);
    } else if (key === 'tec') {
        const empC = emp ? emp.int : 0;
        const popC = avg('int') * muln;
        lines.push(`科技 = 皇帝智力 + 民众平均智力×人数系数`);
        lines.push(`  皇帝贡献: ${pf(empC)} (int=${emp ? emp.int : '—'})`);
        lines.push(`  民众贡献: ${pf(popC)} (avg(int)=${pf(avg('int'))} × ${pf(muln)})`);
        if (cur.atec) lines.push(`  累计(atec): ${pf(cur.atec)}`);
        lines.push(`  = ${pf(cur.tec)} (btec:${pf(empC + popC)} + etec:${pf(cur.etec || 0)}${cur.atec ? ' + atec:' + pf(cur.atec) : ''})`);
    } else if (key === 'cul') {
        const empC = emp ? emp.cha : 0;
        const popC = avg('cha') * muln;
        lines.push(`文化 = 皇帝魅力 + 民众平均魅力×人数系数`);
        lines.push(`  皇帝贡献: ${pf(empC)} (cha=${emp ? emp.cha : '—'})`);
        lines.push(`  民众贡献: ${pf(popC)} (avg(cha)=${pf(avg('cha'))} × ${pf(muln)})`);
        if (cur.acul) lines.push(`  累计(acul): ${pf(cur.acul)}`);
        lines.push(`  = ${pf(cur.cul)} (bcul:${pf(empC + popC)} + ecul:${pf(cur.ecul || 0)}${cur.acul ? ' + acul:' + pf(cur.acul) : ''})`);
    } else if (key === 'prd') {
        const overseerC = overseer ? overseer.sta : 0;
        const popC = avg('sta') * muln;
        lines.push(`生产 = 监工劳力 + 民众平均劳力×人数系数`);
        lines.push(`  监工贡献: ${pf(overseerC)} (sta=${overseer ? overseer.sta : '—'})`);
        lines.push(`  民众贡献: ${pf(popC)} (avg(sta)=${pf(avg('sta'))} × ${pf(muln)})`);
        if (cur.aprd) lines.push(`  累计(aprd): ${pf(cur.aprd)}`);
        lines.push(`  = ${pf(cur.prd)} (bprd:${pf(overseerC + popC)} + eprd:${pf(cur.eprd || 0)}${cur.aprd ? ' + aprd:' + pf(cur.aprd) : ''})`);
    } else if (key === 'pop') {
        const overseerC = overseer ? overseer.sex * 0.5 : 0;
        const popC = avg('sex') * 0.5 + 2 * n;
        lines.push(`人口 = 监工性能力/2 + 民众平均性能力/2 + 人口基数`);
        lines.push(`  监工贡献: ${pf(overseerC)} (sex=${overseer ? overseer.sex : '—'} × 0.5)`);
        lines.push(`  民众贡献: ${pf(popC)} (avg(sex)/2=${pf(avg('sex') * 0.5)} + 基数${pf(2 * n)})`);
        if (cur.apop) lines.push(`  累计(apop): ${pf(cur.apop)}`);
        lines.push(`  = ${pf(cur.pop)} (bpop:${pf(overseerC + popC)} + epop:${pf(cur.epop || 0)}${cur.apop ? ' + apop:' + pf(cur.apop) : ''})`);
        lines.push(`  <span style="color:#888;">— 场上角色: ${alive.length} 人，不可用: ${aliveUnavailable.length} 人，总计: ${n} 人 —</span>`);
    } else if (key === 'mil') {
        const empC = emp ? (emp.psq + emp.con) * 0.25 : 0;
        const generalC = general ? (general.psq + general.con) * 0.25 : 0;
        const popC = avg('psq') * muln;
        const n_mil = alive.filter(c => c.profession === '士兵').length;
        lines.push(`军事 = (皇帝体格+魄力)/4 + (将军体格+魄力)/4 + 民众平均体格×人数系数 + 士兵数`);
        lines.push(`  皇帝贡献: ${pf(empC)} (psq+con=${emp ? emp.psq + emp.con : '—'} × 0.25)`);
        lines.push(`  将军贡献: ${pf(generalC)} (psq+con=${general ? general.psq + general.con : '—'} × 0.25)`);
        lines.push(`  民众贡献: ${pf(popC)} (avg(psq)=${pf(avg('psq'))} × ${pf(muln)})`);
        lines.push(`  士兵数: ${pf(n_mil)}`);
        if (cur.amil) lines.push(`  累计(amil): ${pf(cur.amil)}`);
        lines.push(`  = ${pf(cur.mil)} (bmil:${pf(empC + generalC + popC + n_mil)} + emil:${pf(cur.emil || 0)}${cur.amil ? ' + amil:' + pf(cur.amil) : ''})`);
    } else if (key === 'inf') {
        const prodC = 0.2 * (cur.tec + cur.cul + cur.prd + cur.pop + cur.mil);
        const empC = emp ? 0.7 * emp.con : 0;
        const ministers = [consort, chancellor, overseer, general].filter(Boolean);
        const ministerC = 0.125 * ministers.reduce((s, r) => s + r.con, 0);
        const treC = (1 / 7) * cur.tre;
        lines.push(`民心 = 五业总值×0.2 + 皇帝魄力×0.7 + 重臣魄力×0.125 + 银库×1/7`);
        lines.push(`  五业贡献: ${pf(prodC)} (tec+cul+prd+pop+mil=${pf(cur.tec + cur.cul + cur.prd + cur.pop + cur.mil)} × 0.2)`);
        lines.push(`  皇帝贡献: ${pf(empC)} (con=${emp ? emp.con : '—'} × 0.7)`);
        lines.push(`  重臣贡献: ${pf(ministerC)} (${ministers.map(r => `${r.name}:${r.con}`).join('+')} × 0.125)`);
        lines.push(`  银库贡献: ${pf(treC)} (tre=${pf(cur.tre)} × 1/7)`);
        if (cur.ainf) lines.push(`  累计(ainf): ${pf(cur.ainf)}`);
        lines.push(`  = ${pf(cur.inf)} (binf:${pf(prodC + empC + ministerC + treC)} + einf:${pf(cur.einf || 0)}${cur.ainf ? ' + ainf:' + pf(cur.ainf) : ''})`);
    } else if (key === 'apo') {
        const empC = emp ? emp.cal : 0;
        const popC = avg('cal') * (0.2 + n / 10);
        lines.push(`天灾 = 皇帝灾厄 + 民众平均灾厄×(0.2+人数/10)`);
        lines.push(`  皇帝贡献: ${pf(empC)} (cal=${emp ? emp.cal : '—'})`);
        lines.push(`  民众贡献: ${pf(popC)} (avg(cal)=${pf(avg('cal'))} × ${pf(0.2 + n / 10)})`);
        if (cur.aapo) lines.push(`  累计(aapo): ${pf(cur.aapo)}`);
        lines.push(`  = ${pf(cur.apo)} (bapo:${pf(empC + popC)} + eapo:${pf(cur.eapo || 0)}${cur.aapo ? ' + aapo:' + pf(cur.aapo) : ''})`);
    } else if (key === 'mdt') {
        const penalty = G.mdtPenalty || 0;
        const base = 500 - penalty;
        lines.push(`天命 = 基础 + 民心 - 天灾`);
        lines.push(`  基础: ${base} (500 - ${penalty}天命惩罚)`);
        lines.push(`  民心: ${pf(cur.inf)}`);
        lines.push(`  天灾: ${pf(cur.apo)}`);
        lines.push(`  合计: ${pf(cur.mdt)}`);
    }

    document.getElementById('orgBreakdownTitle').textContent = ORG_LABELS[key] + ' 详情';
    document.getElementById('orgBreakdownContent').innerHTML = lines.map(l => `<div style="padding:3px 0;">${l}</div>`).join('');
    document.getElementById('orgBreakdownOverlay').style.display = 'flex';
}

function closeOrgBreakdown() {
    document.getElementById('orgBreakdownOverlay').style.display = 'none';
}

function fmt(v) {
    if (Number.isInteger(v)) return v.toString();
    // 向下取整到0.1的倍数并格式化为字符串
    return (Math.floor(v * 10) / 10).toString();
}
function floorToTenthStr(v) {
    return fmt(v);
}

// ---- Character Creation ----

function dgender() {
    return d(2) === 1 ? 'm' : 'f';
}

function createChar() {
    const c = {
        id: null,
        name: '',
        gender: dgender(),
        age: 0,
        int: d(4, 3),
        cha: d(6, 2),
        sta: d(4, 3),
        sex: d(4, 4),
        psq: d(4, 3),
        hel: d(12, 10),
        con: d(6, 2),
        wel: 0,
        luc: d(20, 5),
        cal: 0,
        edu: 0,
        exp: 0,
        isDead: false,
        exitStatus: null,
        entryAge: 0,
        exitYear: null,
        married: false,
        spouseId: null,
        scienceStreak: 0,
        artStreak: 0,
        laborStreak: 0,
        datingStreak: 0,
        marriedDatingStreak: 0,
        _scienceMastery: false,
        _artMastery: false,
        profession: '无业者',
        parents: [],
        grandparents: [],
        children: [],
        lovers: [],
        surname: '',
        middlename: '',
        givenname: '',
        history: { science: 0, art: 0, labor: 0, dating: 0, rest: 0, birth: 0, exercise: 0 },
        lifeEvents: []
    };
    c.cal = Math.max(0, Math.round((25 - c.luc / 5) * 3) - d(10, 2));
    if (c.cal > 30) c.cal = Math.max(0, c.cal - d(4, 5));
    return c;
}

function generateCharOptions() {
    const options = [];
    for (let i = 0; i < 3; i++) {
        options.push(createChar());
    }
    return options;
}

// ---- Name Pool ----

const _surnames = ['张','王','李','白','刘','房','尹','曹','孙','杨','赵','朱','郭','戴','钱','周','吴','郑','冯','陈','褚','魏','蒋','沈','韩'];
const _imperialSurnames = ['张','王','李','白','刘','房','尹','曹','孙','杨','赵','朱','郭','戴'];
const _maleGiven = ['伟','强','明','勇','杰','涛','波','斌','刚','兵'];
const _femaleGiven = ['芳','娟','敏','静','丽','雪','燕','琳','雅','蝶'];

// ---- 扩展的姓名池 ----
// 新增更多常见姓氏
const MORE_SURNAMES = ['林','黄','何','梁','宋','郑','谢','韩','唐','冯','董','萧','程','曹','袁','邓','许','傅','沈','曾','彭','吕','苏','卢','蒋','蔡','贾','丁','魏','薛','叶','阎','余','潘'];
const ALL_SURNAMES = _surnames.concat(MORE_SURNAMES);

// 扩展的男性名字（包括双字名选项）
const MORE_MALE_GIVEN = [
    // 单字名
    '龙','海','峰','平','亮','忠','健','翔','飞','鸣','辉','成','德',
    '文','武','荣','松','彬','东','南','西','北','山','川','林','江','河',
    // 男女通用名
    '天','一','子','小','思','雨','云','羽','辰','宁','安','光','阳','君',
    '青','白','丹','星','风','月','野','千','凡',
    // 晚清-改革开放常用字
    '福','寿','富','贵','禄','和','顺','盛','兴','茂','金','宝',
    '华','义','仁','信','礼','孝','廉','春','秋','立','新','有',
    '长','连','民','红','卫','继',
    // 可作双字名第二字的传统字
    '乐','诚','哲','瑞','根'
];
const MALE_GIVEN_FIRST = [
    // 可用于双字名的第一个字
    '子','天','文','云','彦','家','建','振','志','宏','永','昌','世',
    '光','明','国','庆','军','福','寿','富','贵','和','顺','盛','兴',
    '金','宝','华','义','仁','信','礼','孝','春','秋','有','连','立','新','民'
];
const ALL_MALE_GIVEN = _maleGiven.concat(MORE_MALE_GIVEN);

// 扩展的女性名字（包括双字名选项）
const MORE_FEMALE_GIVEN = [
    // 单字名
    '美','慧','淑','珍','英','玉','萍','红','梅','兰','竹','菊','丹','莉',
    '霞','云','彩','凤','娥','莹','秀','华','莲','荷','杏','桃','香','芬',
    // 男女通用名
    '天','一','子','小','思','雨','羽','辰','宁','安','光','阳','君',
    '青','白','星','风','月','野','千','凡',
    // 晚清-改革开放常用字
    '福','寿','富','贵','和','顺','盛','春','秋','金','宝','素','桂','芝',
    // 可作双字名第二字的传统字
    '妃','媛','瑶','琪','颖'
];
const FEMALE_GIVEN_FIRST = [
    // 可用于双字名的第一个字
    '雅','梦','思','雨','晓','小','安','乐',
    '美','丽','淑','婉','秀','文','静','清','玉','雪','彩','云',
    '福','寿','富','贵','春','秋','华','素','桂','梅','兰','莲','荷'
];
const ALL_FEMALE_GIVEN = _femaleGiven.concat(MORE_FEMALE_GIVEN);

// ---- 年号系统 ----
const PRESET_REIGNS = [
    '太平','永昌','永和','永康','永安','永宁','永兴','永寿',
    '建隆','开宝','天禧','乾兴','天圣','景祐','庆历','皇祐','嘉祐','治平',
    '元丰','崇宁','大观',
    '绍熙','庆元','嘉泰','嘉定','端平','景定','咸淳','祥兴',
    '洪熙','正统','天顺','弘治','隆庆','泰昌',
    '景德','建武','建安','建德','建元','建兴',
    '天福','天成','天佑','咸平','咸和','咸宁','乾道','乾德',
    '大业','大安','大德','大同','大明','至正','至元',
    '瑞昌','瑞祥','瑞安','昌盛','昌明','明昌','明德',
    '淳化','淳熙','永丰','永福','永泰','永隆',
    // 仿宋明风格自制年号
    '天德','天熙','天昌','永熙','永德','永庆',
    '明熙','明泰','景丰','景和','德熙','德昌','德兴',
    '隆丰','隆熙','泰和','庆丰','庆昌','大熙','元熙','宝熙'
];
function generateReignName() {
    return PRESET_REIGNS[Math.floor(Math.random() * PRESET_REIGNS.length)];
}

// ---- 新的随机名字生成函数 ----
// 支持生成三字名字（一姓+2名）的概率控制
function generateRandomName(c, useThreeCharNameProbability = 0.3) {
    // 随机选择姓氏
    const surname = ALL_SURNAMES[Math.floor(Math.random() * ALL_SURNAMES.length)];
    
    // 确定性别对应的名字池
    const isMale = c.gender === 'm';
    const givenFirstPool = isMale ? MALE_GIVEN_FIRST : FEMALE_GIVEN_FIRST;
    const givenSecondPool = isMale ? ALL_MALE_GIVEN : ALL_FEMALE_GIVEN;
    
    let givenname = '';
    let middlename = '';
    let fullGiven = '';
    
    // 决定是否生成三字名
    if (Math.random() < useThreeCharNameProbability && givenFirstPool.length > 0) {
        // 生成三字名：姓 + 第一个字 + 第二个字
        const first = givenFirstPool[Math.floor(Math.random() * givenFirstPool.length)];
        const second = givenSecondPool[Math.floor(Math.random() * givenSecondPool.length)];
        middlename = first;
        givenname = second;
        fullGiven = first + second;
    } else {
        // 生成两字名：姓 + 名
        givenname = givenSecondPool[Math.floor(Math.random() * givenSecondPool.length)];
        fullGiven = givenname;
    }
    
    c.surname = surname;
    c.givenname = givenname;
    c.middlename = middlename;
    c.name = surname + fullGiven;
}

// 替换原来的 _randName 函数为增强版
function _randName(c) {
    return generateRandomName(c, 0.3); // 30%概率生成三字名
}

function showNameInputOverlay(title, currentName, gender, onConfirm) {
    const overlay = document.createElement('div');
    overlay.id = 'nameInputOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    const win = document.createElement('div');
    win.style.cssText = 'background:#fff;padding:24px;border-radius:10px;min-width:280px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = 'font-size:18px;font-weight:bold;margin-bottom:16px;color:#333;';
    const originalEl = document.createElement('div');
    originalEl.textContent = '原名: ' + currentName;
    originalEl.style.cssText = 'font-size:13px;color:#888;margin-bottom:10px;';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.style.cssText = 'width:200px;padding:8px;font-size:16px;margin-bottom:12px;border:1px solid #ccc;border-radius:4px;text-align:center;';
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;justify-content:center;gap:10px;';
    const randomBtn = document.createElement('button');
    randomBtn.textContent = '随机取名';
    randomBtn.style.cssText = 'padding:6px 14px;font-size:14px;cursor:pointer;border:1px solid #999;border-radius:4px;background:#f0f0f0;';
    randomBtn.onclick = () => {
        const pool = gender === 'f' ? ALL_FEMALE_GIVEN : ALL_MALE_GIVEN;
        input.value = pool[Math.floor(Math.random() * pool.length)];
    };
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确定';
    confirmBtn.style.cssText = 'padding:6px 14px;font-size:14px;cursor:pointer;border:1px solid #4a90d9;border-radius:4px;background:#4a90d9;color:#fff;';
    confirmBtn.onclick = () => {
        overlay.remove();
        onConfirm(input.value.trim() || currentName);
    };
    btnRow.appendChild(randomBtn);
    btnRow.appendChild(confirmBtn);
    win.appendChild(titleEl);
    win.appendChild(originalEl);
    win.appendChild(input);
    win.appendChild(btnRow);
    overlay.appendChild(win);
    document.body.appendChild(overlay);
    setTimeout(() => input.focus(), 100);
}

// 添加一个专用函数用于生成特殊名字（如皇帝、历史人物等）
function generateSpecialName(c, type = 'normal') {
    switch (type) {
        case 'emperor':
            // 皇帝可以使用更庄重的名字，提高三字名概率
            return generateRandomName(c, 0.5);
        case 'historical':
            // 历史人物使用中等概率的三字名
            return generateRandomName(c, 0.4);
        case 'talent':
            // 人才市场角色使用标准概率
            return generateRandomName(c, 0.3);
        default:
            return generateRandomName(c, 0.3);
    }
}

function generateSpouse(level, suitor, dateType) {
    const spouse = createChar();
    spouse.id = G.nextCharId;
    G.nextCharId++;
    spouse.gender = suitor.gender === 'm' ? 'f' : 'm';
    _randName(spouse);
    spouse.luc = d(20, 5);

    if (dateType === 1) {
        spouse.age = 18 + d(12, 3);
        spouse.int = 20 + d(4, 6);
        spouse.cha = 16 + d(4, 8);
        spouse.sta = 20 + d(4, 6);
        spouse.sex = 12 + d(8, 5);
        const baseHel = Math.max(spouse.age, suitor.hel);
        spouse.hel = baseHel + (d(4) * (Math.random() < 0.5 ? 1 : -1));
        spouse.wel = d(12, 3);
        spouse.edu = d(8, 3);

        if (level >= 2) {
            spouse.int += d(4, 2); spouse.cha += d(4, 2); spouse.sta += d(4, 2);
            spouse.sex += d(4, 2); spouse.wel += d(4, 2); spouse.edu += d(4, 2);
        }
        if (level >= 3) {
            spouse.int += d(4, 3); spouse.cha += d(4, 3); spouse.sta += d(4, 3);
            spouse.sex += d(4, 3) + d(6, 2); spouse.wel += d(4, 3); spouse.edu += d(4, 3);
        }
    } else {
        spouse.age = 18 + d(12);
        spouse.int = 12 + d(4, 8);
        spouse.cha = 20 + d(4, 7);
        spouse.sta = 12 + d(4, 8);
        spouse.sex = 20 + d(8, 5);
        const baseHel = Math.max(spouse.age, suitor.hel);
        spouse.hel = baseHel + (d(12) * (Math.random() < 0.5 ? 1 : -1));
        spouse.wel = d(6, 6);
        spouse.edu = d(12, 2);

        if (level >= 2) {
            spouse.int += d(8); spouse.cha += d(8); spouse.sta += d(8);
            spouse.sex += d(8) + d(6); spouse.wel += d(8); spouse.edu += d(8);
        }
        if (level >= 3) {
            spouse.int += d(6, 2); spouse.cha += d(6, 2) + d(6); spouse.sta += d(6, 2);
            spouse.sex += d(6, 2) + d(12); spouse.wel += d(6, 2); spouse.edu += d(6, 2);
        }
    }

    spouse.cal = Math.round((25 - spouse.luc / 5) * 3);
    spouse.married = true;
    spouse.spouseId = suitor.id;
    return spouse;
}

// ---- Childbirth ----

const CHILDBIRTH_TIER_LABELS = { a:'配偶/正宫', b:'情人/后宫', c:'大臣/军工/无业/休养', d:'普侍/近亲', e:'后代' };
const CHILDBIRTH_TIER_MOD = { a: 20, b: 10, c: 0, d: -10, e: -20 };

function isDescendant(c1, c2) {
    if (c1.parents && c1.parents.includes(c2.id)) return true;
    if (c2.parents && c2.parents.includes(c1.id)) return true;
    if (c1.grandparents && c1.grandparents.includes(c2.id)) return true;
    if (c2.grandparents && c2.grandparents.includes(c1.id)) return true;
    return false;
}

function isCloseRelative(c1, c2) {
    const set = new Set();
    const addList = (arr) => { if (arr) arr.forEach(id => set.add(id)); };
    addList(c1.parents); addList(c1.grandparents);
    if (c2.parents) for (const id of c2.parents) { if (set.has(id)) return true; }
    if (c2.grandparents) for (const id of c2.grandparents) { if (set.has(id)) return true; }
    return false;
}

function tierForChildbirth(emp, partner) {
    if (partner.id === emp.id) return 'e';
    if (isDescendant(emp, partner)) return 'e';
    if (partner.profession === '正宫' || partner.spouseId === emp.id) return 'a';
    if (partner.lovers && partner.lovers.includes(emp.id)) return 'b';
    if (isCloseRelative(emp, partner)) return 'd';
    if (['宰相','监工','将军','士兵','劳工','学者','艺人','无业者','休养者'].includes(partner.profession)) return 'c';
    if (partner.profession === '普侍') return 'd';
    return 'c';
}

function generateChild(father, mother, tier, r) {
    const child = createChar();
    child.id = G.nextCharId;
    G.nextCharId++;
    child.gender = Math.random() < 0.5 ? 'm' : 'f';
    child.age = 0;
    child.entryAge = 0;
    child.parents = [father.id, mother.id];
    child.grandparents = [...new Set([
        ...(father.parents || []), ...(mother.parents || []),
        ...(father.grandparents || []), ...(mother.grandparents || [])
    ])];
    child.surname = father.surname;
    const givenPool = child.gender === 'm' ? _maleGiven : _femaleGiven;
    child.givenname = givenPool[Math.floor(Math.random() * givenPool.length)];
    child.middlename = '';
    child.name = child.surname + child.givenname;
    child.luc = d(20, 5);
    child.wel = 0;
    child.exp = 0;
    child.history = { science: 0, art: 0, labor: 0, dating: 0, rest: 0, birth: 0, exercise: 0 };

    const emp = father;
    const partner = mother;
    const REGULAR_STATS = ['int','cha','sta','sex','psq'];

    function higher(stat) { return (emp[stat]||0) >= (partner[stat]||0) ? emp : partner; }
    function lower(stat) { return (emp[stat]||0) < (partner[stat]||0) ? emp : partner; }

    let calcXxx, calcHel, calcCon;

    switch (tier) {
        case 'a':
            calcXxx = (stat) => Math.floor(higher(stat)[stat] / 12) + d(4);
            calcHel = () => higher('hel')['hel'] + d(4);
            calcCon = () => Math.floor(((emp.con||0) + (partner.con||0)) / 8);
            break;
        case 'b':
            calcXxx = (stat) => Math.floor(higher(stat)[stat] / 15);
            calcHel = () => higher('hel')['hel'];
            calcCon = () => Math.floor((emp.con||0) / 12);
            break;
        case 'c':
            calcXxx = (stat) => Math.floor(((emp[stat]||0) + (partner[stat]||0)) / 24);
            calcHel = () => Math.floor(((emp.hel||0) + (partner.hel||0)) / 2);
            calcCon = () => Math.floor((emp.con||0) / 20);
            break;
        case 'd':
            calcXxx = (stat) => Math.floor(lower(stat)[stat] / 15);
            calcHel = () => lower('hel')['hel'];
            calcCon = () => Math.floor((emp.con||0) / 10);
            break;
        case 'e':
            calcXxx = (stat) => Math.max(1, Math.floor(lower(stat)[stat] / 12) - d(4));
            calcHel = () => Math.max(1, lower('hel')['hel'] - d(4));
            calcCon = () => Math.floor((emp.con||0) / 5);
            break;
    }

    REGULAR_STATS.forEach(stat => {
        let val = calcXxx(stat);
        if (r === 2) val += d(6);
        if (r === 3) val += d(10);
        child[stat] = Math.max(1, val);
    });

    child.hel = Math.max(1, calcHel());
    child.con = Math.max(1, calcCon());
    child.edu = 0;

    child.cal = Math.round(((emp.cal||0) + (partner.cal||0)) / 2);
    if (tier === 'd') child.cal += d(20);
    if (tier === 'e') child.cal += d(20, 2);

    if (father.id === G.leaderId || mother.id === G.leaderId) {
        child.profession = '无业者';
        child._class = '储君';
    }

    logLifeEvent(child, 'entry', '出生，父' + father.name + '母' + mother.name);
    return child;
}

function showChildbirthTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    btnContainer.innerHTML = '';
    const targets = G.chars.filter(t =>
        t.id !== c.id && !t.isDead && t.gender !== c.gender && t.age >= 12
    );
    if (targets.length === 0) {
        prompt.textContent = '没有可生育的对象。';
        const back = document.createElement('button');
        back.textContent = '返回';
        back.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(back);
        return;
    }
    prompt.textContent = `${c.name}: 选择生育对象：`;
    targets.forEach(t => {
        const btn = document.createElement('button');
        const tier = tierForChildbirth(c, t);
        const tierLabel = CHILDBIRTH_TIER_LABELS[tier] || '未知';
        btn.textContent = `${t.name} ${t.gender==='m'?'♂':'♀'} [${tierLabel}]`;
        btn.title = `${STAT_LABELS.sex}:${c.sex}+${t.sex}=${c.sex+t.sex}`;
        btn.addEventListener('click', () => executeChildbirth(c, t));
        btnContainer.appendChild(btn);
    });
    const back = document.createElement('button');
    back.textContent = '取消';
    back.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(back);
}

function executeChildbirth(c, t) {
    const tier = tierForChildbirth(c, t);
    const sexSum = c.sex + t.sex;
    const mod = CHILDBIRTH_TIER_MOD[tier] || 0;
    const target = Math.max(1, sexSum + mod);
    const r = ch(target);
    const isGreat = r === 2;
    const isExtreme = r === 3;
    const tierName = CHILDBIRTH_TIER_LABELS[tier] || tier;

    let helLoss, staLoss, calGain, conGain, mdtLoss;
    switch (tier) {
        case 'a':
            helLoss = isGreat ? 0 : 1;
            staLoss = isExtreme ? 1 : d(4);
            calGain = 0; conGain = 0; mdtLoss = 0;
            break;
        case 'b':
            helLoss = isGreat ? 0 : d(4);
            staLoss = isExtreme ? 1 : d(4);
            calGain = 0; conGain = 0; mdtLoss = 0;
            break;
        case 'c':
            helLoss = isGreat ? 0 : d(4);
            staLoss = isExtreme ? 1 : d(4);
            calGain = 1; conGain = 0; mdtLoss = 0;
            break;
        case 'd':
            helLoss = isGreat ? 0 : d(4);
            staLoss = isExtreme ? 1 : d(4);
            calGain = isExtreme ? d(10, 2) : isGreat ? d(8, 2) : d(6, 2);
            conGain = d(6);
            mdtLoss = 0;
            break;
        case 'e':
            helLoss = isGreat ? 0 : d(6);
            staLoss = isExtreme ? 1 : d(6);
            calGain = isExtreme ? d(20, 2) : isGreat ? d(12, 2) : d(10, 2);
            conGain = isExtreme ? d(12, 2) : d(8, 2);
            mdtLoss = isExtreme ? d(10, 10) : isGreat ? d(6, 10) : d(4, 10);
            break;
    }

    c.hel = Math.max(1, (c.hel || 0) - helLoss);
    t.hel = Math.max(1, (t.hel || 0) - helLoss);
    c.sta = Math.max(1, (c.sta || 0) - staLoss);
    t.sta = Math.max(1, (t.sta || 0) - staLoss);
    if (calGain) c.cal = (c.cal || 0) + calGain;
    if (conGain) c.con = (c.con || 0) + conGain;
    if (mdtLoss) G.mdtPenalty = (G.mdtPenalty || 0) + mdtLoss;

    const sexLoss = d(10, 3);
    c.sex = Math.max(1, (c.sex || 0) - sexLoss);
    t.sex = Math.max(1, (t.sex || 0) - sexLoss);

    let effects = [];
    if (helLoss > 0) effects.push(`寿-${helLoss}`);
    if (staLoss > 0) effects.push(`劳-${staLoss}`);
    if (calGain > 0) effects.push(`灾+${calGain}`);
    if (conGain > 0) effects.push(`魄+${conGain}`);
    if (mdtLoss > 0) effects.push(`天命基础-${mdtLoss}`);
    effects.push(`性-${sexLoss}`);
    const effectStr = effects.length > 0 ? '（' + effects.join('，') + '）' : '';

    let msg = '';
    if (r >= 1) {
        const child = generateChild(c, t, tier, r);
        const doBirthPush = (newName) => {
            if (newName) {
                child.givenname = newName;
                child.name = child.surname + child.givenname;
            }
            G.chars.push(child);
            msg = `<span class="success">[生育]</span> ${c.name} 与 ${t.name}（${tierName}）成功诞下 ${child.name}！`;
            if (effectStr) msg += `<br><span class="stat-change">[损耗]</span>${effectStr}`;
            addLog(msg);
            logLifeEvent(c, 'childbirth', '与' + t.name + '生下' + child.name);
            logLifeEvent(t, 'childbirth', '与' + c.name + '生下' + child.name);
            updateOrganization();
    renderCharList();
    renderGame();
    refreshActionPanelTabs();
            showActionResult(msg);
            finalizeCharAction(c);
        };
        if (c.id === G.leaderId || t.id === G.leaderId) {
            showNameInputOverlay('为新生儿命名', child.givenname, child.gender, doBirthPush);
            return;
        } else {
            doBirthPush(null);
        }
    } else {
        msg = `<span class="fail">[生育]</span> ${c.name} 与 ${t.name}（${tierName}）未能成功生育。`;
        if (effectStr) msg += `<br><span class="stat-change">[损耗]</span>${effectStr}`;
        addLog(msg);
        showActionResult(msg);
        finalizeCharAction(c);
    }
}

function needsChildbirthType(actionId) {
    return actionId === 'childbirth';
}

const EXILE_RATES = [
    { pct: 0, label: '0%' },
    { pct: 10, label: '10%' },
    { pct: 25, label: '25%' },
    { pct: 50, label: '50%' },
    { pct: 80, label: '80%' }
];

function showExileTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    btnContainer.innerHTML = '';
    const targets = G.chars.filter(t =>
        t.id !== c.id && t.id !== G.leaderId && !t.isDead && !t.exitStatus && !isConquestParticipant(t)
    );
    if (targets.length === 0) {
        prompt.textContent = '没有可流放的对象。';
        const back = document.createElement('button');
        back.textContent = '返回';
        back.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(back);
        return;
    }
    prompt.textContent = `${c.name}: 选择要流放的对象：`;
    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} ${t.gender==='m'?'♂':'♀'} (财${t.wel})`;
        btn.addEventListener('click', () => showExileRates(c, t));
        btnContainer.appendChild(btn);
    });
    const back = document.createElement('button');
    back.textContent = '取消';
    back.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(back);
}

function showExileRates(c, target) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    btnContainer.innerHTML = '';
    prompt.textContent = `${c.name}: 从 ${target.name} 的财产中取走多少？（拥有 ${target.wel} 财）`;
    EXILE_RATES.forEach(rate => {
        const amount = Math.floor(target.wel * rate.pct / 100);
        const btn = document.createElement('button');
        btn.textContent = `${rate.label}（得${amount}财）`;
        btn.addEventListener('click', () => {
            executeExile(c, target, rate.pct, amount);
        });
        btnContainer.appendChild(btn);
    });
    const back = document.createElement('button');
    back.textContent = '返回';
    back.addEventListener('click', () => showExileTargets(c));
    btnContainer.appendChild(back);
}

function executeExile(c, target, pct, amount) {
    if (amount > 0) {
        target.wel -= amount;
        G.organization.current.btre += amount;
    }
    G.mdtPenalty = (G.mdtPenalty || 0) + pct;
    target.exitStatus = 'exiled';
    delete target._class;
    target.exitYear = G.time;
    if (target.entryAge === undefined) target.entryAge = target.age;
    logLifeEvent(target, 'exit', '被' + c.name + '流放');
    logFamilyExitEvent(target, '被' + c.name + '流放');
    logLifeEvent(c, 'exile', '流放了' + target.name + '，取走' + pct + '%财产');
    const idx = G.chars.indexOf(target);
    if (idx >= 0) G.chars.splice(idx, 1);
    if (!G.unavailableChars) G.unavailableChars = [];
    G.unavailableChars.push(target);
    addLog(`<span class="log-death">[流放]</span> ${c.name} 流放了 ${target.name}，取走${pct}%财产（${amount}财），天命-${pct}。`);
    updateOrganization();
    showActionResult(`<span class="fail">[流放]</span> ${target.name} 被流放，取走${pct}%财产（${amount}财），天命-${pct}。`);
    updateUIAfterAction(c);
}

function showKillTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    btnContainer.innerHTML = '';
    const targets = G.chars.filter(t =>
        t.id !== c.id && t.id !== G.leaderId && !t.isDead && !t.exitStatus
    );
    if (targets.length === 0) {
        prompt.textContent = '没有可杀害的对象。';
        const back = document.createElement('button');
        back.textContent = '返回';
        back.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(back);
        return;
    }
    prompt.textContent = `${c.name}: 选择要杀害的对象（该角色将死亡，全部财产归国库）：`;
    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} ${t.gender==='m'?'♂':'♀'} (财${t.wel})`;
        btn.addEventListener('click', () => {
            if (confirm(`确定要杀害 ${t.name} 吗？`)) {
                executeKill(c, t);
            }
        });
        btnContainer.appendChild(btn);
    });
    const back = document.createElement('button');
    back.textContent = '取消';
    back.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(back);
}

function executeKill(c, target) {
    const amount = target.wel || 0;
    const calGain = d(10, 2);
    G.organization.current.btre += amount;
    target.wel = 0;
    c.cal = (c.cal || 0) + calGain;
    handleExit(target, 'killed');
    G.mdtPenalty = (G.mdtPenalty || 0) + 80;
    logLifeEvent(c, 'kill', '处决了' + target.name + '，财产归公');
    addLog(`<span class="log-death">[处决]</span> ${c.name} 处决了 ${target.name}，财产${amount}财归公，天命-100，灾厄+${calGain}。`);
    updateOrganization();
    showActionResult(`<span class="fail">[处决]</span> ${target.name} 被处决，财产${amount}财归公，天命-100，灾厄+${calGain}。`);
    finalizeCharAction(c);
}

function showSummonTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    btnContainer.innerHTML = '';
    const targets = (G.unavailableChars || []).filter(c => c.exitStatus);
    if (targets.length === 0) {
        prompt.textContent = '没有可召见的对象。';
        const back = document.createElement('button');
        back.textContent = '返回';
        back.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(back);
        return;
    }
    prompt.textContent = `${c.name}: 选择要召见的不可用角色（灾厄+1d4）：`;
    targets.forEach(t => {
        const btn = document.createElement('button');
        const status = t.exitStatus === 'natural' ? '已故' : t.exitStatus === 'exiled' ? '流放' : '隐退';
        btn.textContent = `${t.name} (${status})`;
        btn.addEventListener('click', () => {
            executeSummon(c, t);
        });
        btnContainer.appendChild(btn);
    });
    const back = document.createElement('button');
    back.textContent = '取消';
    back.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(back);
}

function executeSummon(c, target) {
    const calGain = d(4);
    c.cal = (c.cal || 0) + calGain;
    const idx = G.unavailableChars.indexOf(target);
    if (idx >= 0) G.unavailableChars.splice(idx, 1);
    target.exitStatus = undefined;
    target.exitYear = undefined;
    target.profession = '无业者';
    target.wel = 0;
    G.chars.push(target);
    logLifeEvent(target, 'entry', '被' + c.name + '召见，重返游戏');
    logLifeEvent(c, 'summon', '召回了' + target.name);
    addLog(`<span class="info">[召见]</span> ${c.name} 召见了 ${target.name}，灾厄+${calGain}。`);
    updateOrganization();
    showActionResult(`<span class="success">[召见]</span> ${c.name} 召回了 ${target.name}，灾厄+${calGain}。`);
    finalizeCharAction(c);
}

function executeRetire(c) {
    if (!confirm(`${c.name} 确定要隐退吗？`)) {
        selectChar(c.id);
        return;
    }
    handleExit(c, 'retired');
    addLog(`<span class="info">[隐退]</span> ${c.name} 选择了隐退。`);
    updateOrganization();
    showActionResult(`<span class="success">[隐退]</span> ${c.name} 隐退。`);
    updateUIAfterAction(c);
}

function showAppointHeirTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    btnContainer.innerHTML = '';
    const targets = G.chars.filter(t => t.id !== c.id && !t.exitStatus);
    if (targets.length === 0) {
        prompt.textContent = '没有可立嗣的对象。';
        const back = document.createElement('button');
        back.textContent = '返回';
        back.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(back);
        return;
    }
    prompt.textContent = `${c.name}: 选择要立为储君的角色（阶级变为储君，不影响职业）：`;
    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} ${t.gender==='m'?'♂':'♀'} [${t.profession}]`;
        btn.addEventListener('click', () => {
            G.chars.forEach(x => delete x._class);
            t._class = '储君';
            addLog(`<span class="success">[立嗣]</span> ${c.name} 立 ${t.name} 为储君。`);
            showActionResult(`<span class="success">[立嗣]</span> ${c.name} 立 ${t.name} 为储君。`);
            finalizeCharAction(c);
        });
        btnContainer.appendChild(btn);
    });
    const back = document.createElement('button');
    back.textContent = '取消';
    back.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(back);
}

// ---- Actions ----

function resetLearningStreaks(c) {
    c.scienceStreak = 0;
    c.artStreak = 0;
    c.laborStreak = 0;
    c.datingStreak = 0;
    c.marriedDatingStreak = 0;
}

function learnScience(c) {
    c.scienceStreak += 1;
    c.artStreak = 0;
    c.laborStreak = 0;
    c.datingStreak = 0;
    c.marriedDatingStreak = 0;
    c.history.science += 1;

    const r = ch(c.int);
    let msg = '';
    if (r === 0) {
        c.exp += 1;
        msg = `<span class="fail">[失败]</span> 学术无进展，经验+1`;
    } else if (r === 1) {
        const i = d(4);
        c.int += i; c.edu += 1; c.wel += 1; c.exp += 1;
        msg = `<span class="success">[成功]</span> 学术精进（智+${i} 教+1 财+1 经+1）`;
    } else if (r === 2) {
        const i = d(4, 2), w = d(4);
        c.int += i; c.edu += 1; c.sex += 1; c.wel += w; c.exp += 1;
        msg = `<span class="great">[大成功]</span> 学术突破（智+${i} 教+1 性+1 财+${w} 经+1）`;
    } else {
        const i = d(6, 2), e = d(4), x = d(4), s = d(4), w = d(4, 2);
        c.int += i; c.edu += e; c.exp += x; c.sex += s; c.wel += w;
        msg = `<span class="extreme">[超常]</span> 学术大成（智+${i} 教+${e} 经+${x} 性+${s} 财+${w}）`;
    }

    if (c.scienceStreak > 0 && c.scienceStreak % 6 === 0) {
        const i = d(6), e = d(4, 2), x = d(4), s = d(4), w = d(4), ch = d(4);
        c.int += i; c.edu += e; c.exp += x; c.sex += s; c.wel += w; c.cha += ch;
        msg += `<br><span class="great">[里程碑]</span> 连续学术${c.scienceStreak}年！智+${i} 教+${e} 经+${x} 性+${s} 财+${w} 魅+${ch}`;
    }

    if (c.history.science === 18 && !c._scienceMastery) {
        c._scienceMastery = true;
        const i = d(8, 3), e = d(4, 8), w = d(6, 2), s = d(8, 2), st = d(4, 2), ch = d(4, 2), x = d(10, 2);
        c.int += i; c.edu += e; c.wel += w; c.sex += s; c.sta += st; c.cha += ch; c.exp += x;
        msg += `<br><span class="extreme">[学术巅峰]</span> 累计学术18年达成！智+${i} 教+${e} 财+${w} 性+${s} 体+${st} 魅+${ch} 经+${x}`;
    }

    return msg;
}

function learnArt(c) {
    c.artStreak += 1;
    c.scienceStreak = 0;
    c.laborStreak = 0;
    c.datingStreak = 0;
    c.marriedDatingStreak = 0;
    c.history.art += 1;

    const r = ch(c.cha);
    let msg = '';
    if (r === 0) {
        c.exp += 1;
        msg = `<span class="fail">[失败]</span> 学艺无进展，经验+1`;
    } else if (r === 1) {
        const ch = d(4), st = d(4);
        c.cha += ch; c.sta += st; c.exp += 1;
        msg = `<span class="success">[成功]</span> 学艺精进（魅+${ch} 体+${st} 经+1）`;
    } else if (r === 2) {
        const ch = d(8), st = d(6);
        c.cha += ch; c.sta += st; c.wel += 1; c.edu += 1; c.exp += 1;
        msg = `<span class="great">[大成功]</span> 学艺突破（魅+${ch} 体+${st} 财+1 教+1 经+1）`;
    } else {
        const ch = d(12), st = d(6, 2), w = d(6), e = d(4), x = d(4);
        c.cha += ch; c.sta += st; c.wel += w; c.edu += e; c.exp += x;
        msg = `<span class="extreme">[超常]</span> 学艺大成（魅+${ch} 体+${st} 财+${w} 教+${e} 经+${x}）`;
    }

    if (c.artStreak > 0 && c.artStreak % 6 === 0) {
        const ch = d(8), st = d(6), w = d(4), e1 = d(4), e2 = d(4), i = d(4);
        c.cha += ch; c.sta += st; c.wel += w; c.edu += e1 + e2; c.int += i;
        msg += `<br><span class="great">[里程碑]</span> 连续学艺${c.artStreak}年！魅+${ch} 体+${st} 财+${w} 教+${e1 + e2} 智+${i}`;
    }

    if (c.history.art === 18 && !c._artMastery) {
        c._artMastery = true;
        const ch = d(20) + d(4), st = d(20), w = d(20), x = d(10, 2), i = d(8), e = d(10);
        c.cha += ch; c.sta += st; c.wel += w; c.exp += x; c.int += i; c.edu += e;
        msg += `<br><span class="extreme">[艺术巅峰]</span> 累计学艺18年达成！魅+${ch} 体+${st} 财+${w} 经+${x} 智+${i} 教+${e}`;
    }

    return msg;
}

function exercise(c) {
    c.scienceStreak = 0;
    c.artStreak = 0;
    c.laborStreak = 0;
    c.datingStreak = 0;
    c.marriedDatingStreak = 0;
    c.history.exercise += 1;

    const r = ch(c.psq);
    let msg = '';
    if (r === 0) {
        const p = Math.max(0, d(4) - 1);
        c.psq += p; c.exp += 1;
        msg = `<span class="fail">[失败]</span> 锻炼过度，体格+${p} 经+1`;
    } else     if (r === 1) {
        const p = d(4);
        c.psq += p; c.sta += 1; c.exp += 1;
        msg = `<span class="success">[成功]</span> 锻炼有效（体+${p} 劳+1 经+1）`;
    } else if (r === 2) {
        const p = d(4, 2), st = d(4), x = d(4);
        c.psq += p; c.sta += st; c.sex += 1; c.exp += x;
        msg = `<span class="great">[大成功]</span> 锻炼有成（体+${p} 劳+${st} 性+1 经+${x}）`;
    } else {
        const p = d(6, 2), st = d(6), x = d(6), s = d(4);
        c.psq += p; c.sta += st; c.exp += x; c.sex += s;
        msg = `<span class="extreme">[超常]</span> 锻炼大成（体+${p} 劳+${st} 经+${x} 性+${s}）`;
    }

    if (c.history.exercise > 0 && c.history.exercise % 5 === 0) {
        const p = d(6), x = d(4), st = d(4), s = d(8);
        c.psq += p; c.exp += x; c.sta += st; c.sex += s;
        msg += `<br><span class="great">[里程碑]</span> 累计锻炼${c.history.exercise}年！体+${p} 经+${x} 劳+${st} 性+${s}`;
    }

    return msg;
}

function labor(c, laborType) {
    c.scienceStreak = 0;
    c.artStreak = 0;
    c.laborStreak += 1;
    c.datingStreak = 0;
    c.marriedDatingStreak = 0;
    c.history.labor += 1;
    let msg = '';
    const tLabel = laborType === 1 ? '智力劳动' : '体力劳动';

    if (laborType === 2) {
        const r = ch(c.sta);
        if (r === 0) {
            const s = d(4);
            c.sta -= s; c.exp += 1;
            msg = `<span class="fail">[失败]</span> ${tLabel}（体-${s} 经+1）`;
        } else if (r === 1) {
            const s = d(4), w = d(4);
            c.sta -= s; c.wel += w + 1; c.exp += 1;
            msg = `<span class="success">[成功]</span> ${tLabel}（体-${s} 财+${w + 1} 经+1）`;
        } else if (r === 2) {
            const w = d(4, 2), x = d(4);
            c.sta -= 1; c.wel += w; c.exp += x; c.int += 1;
            msg = `<span class="great">[大成功]</span> ${tLabel}（体-1 财+${w} 经+${x} 智+1）`;
        } else {
            const w = d(4, 3), x = d(6), i = d(4);
            c.wel += w; c.exp += x; c.int += i;
            msg = `<span class="extreme">[超常]</span> ${tLabel}（财+${w} 经+${x} 智+${i}）`;
        }
    } else {
        const r = ch(c.int);
        if (r === 0) {
            const s = d(4);
            c.sta -= s; c.exp += 1;
            msg = `<span class="fail">[失败]</span> ${tLabel}（体-${s} 经+1）`;
        } else if (r === 1) {
            const s = d(4), co = d(4);
            c.sta -= s; c.wel += 1; c.exp += 1; c.con += co;
            msg = `<span class="success">[成功]</span> ${tLabel}（体-${s} 财+1 经+1 魄+${co}）`;
        } else if (r === 2) {
            const w = d(4), x = d(4), co = d(6);
            c.wel += w; c.exp += x; c.con += co;
            msg = `<span class="great">[大成功]</span> ${tLabel}（财+${w} 经+${x} 魄+${co}）`;
        } else {
            const w = 2 + d(4, 2), x = d(6), co = d(6, 2);
            c.wel += w; c.exp += x; c.con += co;
            msg = `<span class="extreme">[超常]</span> ${tLabel}（财+${w} 经+${x} 魄+${co}）`;
        }
    }

    if (c.laborStreak > 0 && c.laborStreak % 5 === 0) {
        const s = d(4), i = d(6), co = d(8), w = d(6, 2), x = d(6, 2), h = d(4);
        c.sta -= s; c.int += i; c.con += co; c.wel += w; c.exp += x; c.hel -= h;
        msg += `<br><span class="great">[里程碑]</span> 连续劳动${c.laborStreak}年！体-${s} 智+${i} 魄+${co} 财+${w} 经+${x} 寿-${h}`;
    }

    return msg;
}

function generateLover(level, suitor, dateType) {
    const lover = createChar();
    lover.id = G.nextCharId;
    G.nextCharId++;
    lover.gender = suitor.gender === 'm' ? 'f' : 'm';
    _randName(lover);
    lover.luc = d(20, 5);

    if (dateType === 1) {
        lover.age = 18 + d(12);
        lover.int = 20 + d(6, 3);
        lover.cha = 16 + d(4, 6);
        lover.sta = 20 + d(6, 3);
        lover.sex = 16 + d(8, 3);
        const baseHel = Math.max(lover.age, suitor.hel);
        lover.hel = baseHel + (d(4, 3) * (Math.random() < 0.5 ? 1 : -1));
        lover.wel = d(12, 3);
        lover.edu = d(8, 3);

        if (level >= 3) {
            lover.int += d(4); lover.cha += d(4); lover.sta += d(4);
            lover.sex += d(4); lover.wel += d(4); lover.edu += d(4);
        }
    } else {
        lover.age = 18 + d(20);
        lover.int = 8 + d(4, 6);
        lover.cha = 16 + d(4, 6);
        lover.sta = 8 + d(4, 6);
        lover.sex = 24 + d(8, 3);
        const baseHel = Math.max(lover.age, suitor.hel);
        lover.hel = baseHel + d(4, 4);
        lover.wel = d(6, 6);
        lover.edu = d(12, 2);

        if (level >= 3) {
            lover.int += d(4); lover.cha += d(4); lover.sta += d(4);
            lover.sex += d(4); lover.wel += d(4); lover.edu += d(4);
        }
    }

    lover.cal = Math.round((25 - lover.luc / 5) * 3) + d(4);
    return lover;
}

function dateAct(c, dateType) {
    resetLearningStreaks(c);

    let costMsg = '', affairMsg = '', penaltyMsg = '';
    if (c.married) {
        const cost = d(8), calGain = d(4);
        c.wel -= cost; c.cal += calGain;
        costMsg = `<br><span class="stat-change">[花费]</span> 约会开销财-${cost}`;
        affairMsg = `<br><span class="fail">[出轨]</span> 灾厄+${calGain}`;
        c.datingStreak = 0;
        c.marriedDatingStreak += 1;
        if (c.marriedDatingStreak > 0 && c.marriedDatingStreak % 5 === 0) {
            const sLoss = d(8), chLoss = d(6, 2), wLoss = d(4, 4), hLoss = d(4, 2);
            c.sex -= sLoss; c.cha -= chLoss; c.wel -= wLoss; c.hel -= hLoss;
            penaltyMsg = `<br><span class="fail">[放纵]</span> 连续出轨${c.marriedDatingStreak}年！性-${sLoss} 魅-${chLoss} 财-${wLoss} 寿-${hLoss}`;
        }
    } else {
        const cost = d(4);
        c.wel -= cost;
        costMsg = `<br><span class="stat-change">[花费]</span> 约会开销财-${cost}`;
        c.datingStreak += 1;
        c.marriedDatingStreak = 0;
        if (c.datingStreak > 0 && c.datingStreak % 5 === 0) {
            const sLoss = d(4), chLoss = d(4), wLoss = d(8);
            c.sex -= sLoss; c.cha -= chLoss; c.wel -= wLoss;
            penaltyMsg = `<br><span class="fail">[求偶受挫]</span> 连续求偶${c.datingStreak}年无果！性-${sLoss} 魅-${chLoss} 财-${wLoss}`;
        }
    }

    let compee;
    if (c.married) {
        const spouse = G.chars.find(s => s.id === c.spouseId);
        const stat = dateType === 1 ? c.cha : c.sex;
        const spouseStat = spouse ? (dateType === 1 ? spouse.cha : spouse.sex) : 0;
        compee = stat - spouseStat + d(10, 2);
    } else {
        compee = dateType === 1 ? c.cha : c.sex;
    }

    const roll = d(100);
    const result = comp(roll, compee);
    c.history.dating += 1;
    const tLabel = dateType === 1 ? '魅力约会' : '性感约会';

    const lvLabel = ['', '成功', '大成功', '牛逼'][result];

    if (dateType === 1) {
        if (c.married) {
            if (result === 0) {
                const chLoss = d(8);
                c.cha -= chLoss;
                return `<span class="fail">[失败]</span> ${tLabel}出轨（魅-${chLoss}）${costMsg}${affairMsg}`;
            }
            const lover = generateLover(result, c, 1);
            lover._actedThisYear = true;
            lover.entryAge = lover.age;
            G.chars.push(lover);
            logLifeEvent(lover, 'entry', '因' + c.name + '的出轨而生');
            let selfMsg = '';
            if (result === 1) { const chL = d(4); c.cha -= chL; selfMsg = `（自身魅-${chL}）`; }
            return `<span class="success">[${lvLabel}]</span> ${tLabel}出轨成功！${lover.name}成为${c.name}的情人${selfMsg}<br>${formatSpouseStats(lover)}${costMsg}${affairMsg}`;
        }
        if (result === 0) {
            const chLoss = d(4);
            c.cha -= chLoss;
            return `<span class="fail">[失败]</span> ${tLabel}失败（魅-${chLoss}）${costMsg}${penaltyMsg}`;
        }
        const spouse = generateSpouse(result, c, 1);
        spouse._actedThisYear = true;
        spouse.entryAge = spouse.age;
        G.chars.push(spouse);
        logLifeEvent(spouse, 'entry', '因' + c.name + '的追求而成婚');
        c.married = true;
        c.spouseId = spouse.id;
        if (c.profession === '皇帝') {
            const oldConsort = G.chars.find(t => t.profession === '正宫');
            if (oldConsort) oldConsort.profession = '无业者';
            spouse.profession = '正宫';
        }
        let bonusMsg = '';
        if (result >= 2) bonusMsg += '（各属性+2d4）';
        if (result >= 3) bonusMsg += '（各属性+3d4，性+2d6）';
        return `<span class="success">[${lvLabel}]</span> ${tLabel}成功！${spouse.name}加入了部落成为${c.name}的配偶${bonusMsg}<br>${formatSpouseStats(spouse)}${costMsg}${penaltyMsg}`;
    }

    if (c.married) {
        if (result === 0) {
            const chLoss = d(12), sLoss = d(4);
            c.cha -= chLoss; c.sex -= sLoss;
            return `<span class="fail">[失败]</span> ${tLabel}出轨（魅-${chLoss}，性-${sLoss}）${costMsg}${affairMsg}`;
        }
        const lover = generateLover(result, c, 2);
        lover._actedThisYear = true;
        lover.entryAge = lover.age;
        G.chars.push(lover);
        logLifeEvent(lover, 'entry', '因' + c.name + '的出轨而生');
        let selfMsg = '';
        if (result === 1) { const chL = d(8), sL = d(4); c.cha -= chL; c.sex -= sL; selfMsg = `（自身魅-${chL}，性-${sL}）`; }
        else { const sL = d(4); c.sex -= sL; selfMsg = `（自身性-${sL}）`; }
        return `<span class="success">[${lvLabel}]</span> ${tLabel}出轨成功！${lover.name}成为${c.name}的情人${selfMsg}<br>${formatSpouseStats(lover)}${costMsg}${affairMsg}`;
    }
    if (result === 0) {
        const chLoss = d(6), sGain = d(4);
        c.cha -= chLoss; c.sex += sGain;
        return `<span class="info">[受挫]</span> ${tLabel}失败（魅-${chLoss}，性+${sGain}，聊以自慰）${costMsg}${penaltyMsg}`;
    }
    const spouse = generateSpouse(result, c, 2);
    spouse._actedThisYear = true;
    spouse.entryAge = spouse.age;
    G.chars.push(spouse);
    logLifeEvent(spouse, 'entry', '因' + c.name + '的追求而成婚');
    c.married = true;
    c.spouseId = spouse.id;
    if (c.profession === '皇帝') {
        const oldConsort = G.chars.find(t => t.profession === '正宫');
        if (oldConsort) oldConsort.profession = '无业者';
        spouse.profession = '正宫';
    }
    let bonusMsg = '';
    if (result >= 2) bonusMsg += '（各属性+1d8，性+1d6）';
    if (result >= 3) bonusMsg += '（各属性+2d6，魅+1d6，性+1d12）';
    return `<span class="success">[${lvLabel}]</span> ${tLabel}成功！${spouse.name}加入了部落成为${c.name}的配偶${bonusMsg}<br>${formatSpouseStats(spouse)}${costMsg}${penaltyMsg}`;
}

function formatSpouseStats(sp) {
    return `<span class="stat-change">智${sp.int} 魅${sp.cha} 体${sp.sta} 性${sp.sex} 体格${sp.psq} 寿${sp.hel} 魄${sp.con} 财${sp.wel} 教${sp.edu} 经${sp.exp}</span>`;
}

// ---- Pursue & Propose ----

const _REL_STATS = ['int', 'cha', 'sta', 'sex', 'psq', 'con', 'wel'];

function countWins(a, b) {
    return _REL_STATS.filter(k => xch(a[k], b[k]) >= 0).length;
}

function showPursueTargets(c) {
    if (c.wel < 12) {
        showActionResult(`<span class="fail">[失败]</span> 财富不足12，无法发起追求。`);
        finalizeCharAction(c);
        return;
    }
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const targets = G.chars.filter(t =>
        t.id !== c.id && !t.isDead && t.gender !== c.gender
    );
    if (targets.length === 0) {
        prompt.textContent = `${c.name}: 没有可追求的对象。`;
        btnContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(backBtn);
        return;
    }
    prompt.textContent = `${c.name}: 选择追求对象：`;
    btnContainer.innerHTML = '';
    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} ${t.gender === 'm' ? '♂' : '♀'} (${t.profession})`;
        btn.addEventListener('click', () => executePursue(c, t));
        btnContainer.appendChild(btn);
    });
    const backBtn = document.createElement('button');
    backBtn.textContent = '取消';
    backBtn.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(backBtn);
}

function executePursue(c, t) {
    const cost = d(12);
    const actual = Math.min(cost, c.wel);
    c.wel -= actual;
    t.wel += actual;

    const wins = countWins(c, t);
    let msg = `<span class="stat-change">[花费]</span> 转赠${actual}财富给${t.name}。`;
    if (wins >= 3) {
        c.lovers.push(t.id);
        t.lovers.push(c.id);
        msg += `<br><span class="success">[成功]</span> 追求${t.name}成功！${t.name}成为情人。`;
        addLog(`${c.name} 成功追求 ${t.name}。`);
    } else {
        const chLoss = d(4);
        c.cha = Math.max(0, c.cha - chLoss);
        msg += `<br><span class="fail">[失败]</span> 追求${t.name}失败（${wins}/7），魅力-${chLoss}。`;
    }
    showActionResult(msg);
    finalizeCharAction(c);
}

function showProposeTargets(c) {
    if (c.wel < 12) {
        showActionResult(`<span class="fail">[失败]</span> 财富不足12，无法发起求婚。`);
        finalizeCharAction(c);
        return;
    }
    if (c.married) {
        showActionResult(`<span class="info">[信息]</span> ${c.name} 已婚，无法求婚。`);
        finalizeCharAction(c);
        return;
    }
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const targets = (c.lovers || []).map(id => G.chars.find(t => t.id === id)).filter(Boolean);
    if (targets.length === 0) {
        prompt.textContent = `${c.name}: 没有可求婚的情人。`;
        btnContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(backBtn);
        return;
    }
    prompt.textContent = `${c.name}: 选择要求婚的情人：`;
    btnContainer.innerHTML = '';
    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} ${t.gender === 'm' ? '♂' : '♀'}`;
        btn.addEventListener('click', () => executePropose(c, t));
        btnContainer.appendChild(btn);
    });
    const backBtn = document.createElement('button');
    backBtn.textContent = '取消';
    backBtn.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(backBtn);
}

function executePropose(c, t) {
    const cost = d(12);
    const actual = Math.min(cost, c.wel);
    c.wel -= actual;
    t.wel += actual;

    const wins = countWins(c, t);
    let msg = `<span class="stat-change">[花费]</span> 转赠${actual}财富给${t.name}。`;
    if (wins >= 1) {
        c.married = true;
        c.spouseId = t.id;
        t.married = true;
        t.spouseId = c.id;
        t.profession = '正宫';
        c.lovers = c.lovers.filter(id => id !== t.id);
        logLifeEvent(c, 'marry', '与' + t.name + '成婚');
        logLifeEvent(t, 'marry', '与' + c.name + '成婚');
        if (t.surname !== c.surname) {
            t.middlename = t.surname;
            t.surname = c.surname;
            t.name = t.surname + t.middlename + t.givenname;
            msg += `<br><span class="success">[赐姓]</span> 赐国姓${c.surname}。`;
        }
        const oldConsort = G.chars.find(x => x.profession === '正宫' && x.id !== t.id);
        if (oldConsort) {
            oldConsort.profession = '无业者';
            addLog(`<span class="info">[正宫]</span> ${oldConsort.name} 被降为无业者。`);
        }
        msg += `<br><span class="success">[结婚]</span> 向${t.name}求婚成功！${t.name}成为正宫。`;
        addLog(`${c.name} 与 ${t.name} 结为夫妻。`);
    } else {
        c.lovers = c.lovers.filter(id => id !== t.id);
        msg += `<br><span class="fail">[失败]</span> 求婚${t.name}失败（${wins}/7），${t.name}离开了情人行列。`;
        addLog(`${c.name} 向 ${t.name} 求婚失败。`);
    }
    showActionResult(msg);
    finalizeCharAction(c);
}

function rest(c) {
    resetLearningStreaks(c);
    const r = ch(c.wel);
    c.history.rest += 1;
    let msg = '';
    if (r === 0) {
        const w = d(4);
        c.wel -= w;
        msg = `<span class="fail">[失败]</span> 养生不佳（财-${w}）`;
    } else if (r === 1) {
        const w = d(4), st = d(4), s = d(4);
        c.wel -= w; c.sta += st; c.sex += s;
        msg = `<span class="success">[成功]</span> 养生（财-${w} 体+${st} 性+${s}）`;
    } else if (r === 2) {
        const w = d(4), st = d(4, 2), s = d(8);
        c.wel -= w; c.sta += st; c.sex += s;
        msg = `<span class="great">[大成功]</span> 养生（财-${w} 体+${st} 性+${s}）`;
    } else {
        const st = d(6, 2), s = d(4, 3), ch = d(4);
        c.wel -= 1; c.sta += st; c.sex += s; c.cha += ch;
        msg = `<span class="extreme">[超常]</span> 养生（财-1 体+${st} 性+${s} 魅+${ch}）`;
    }
    return msg;
}

function elderlyCare(c) {
    resetLearningStreaks(c);
    const r = ch(c.wel);
    c.history.rest += 1;
    let msg = '';
    if (r === 0) {
        const w = d(6);
        c.wel -= w;
        msg = `<span class="fail">[失败]</span> 养老不佳（财-${w}）`;
    } else if (r === 1) {
        const w = d(6), ch = d(4);
        c.wel -= w; c.hel += 2; c.cha += ch;
        msg = `<span class="success">[成功]</span> 养老（财-${w} 寿+2 魅+${ch}）`;
    } else if (r === 2) {
        const w = d(6), h = d(4, 2), ch = d(4, 2);
        c.wel -= w; c.hel += h; c.cha += ch;
        msg = `<span class="great">[大成功]</span> 养老（财-${w} 寿+${h} 魅+${ch}）`;
    } else {
        const h = d(6, 2), ch = d(6, 2), st = d(4);
        c.wel -= 1; c.hel += h; c.cha += ch; c.sta += st;
        msg = `<span class="extreme">[超常]</span> 养老（财-1 寿+${h} 魅+${ch} 体+${st}）`;
    }
    return msg;
}
// ---- Slave Market ----

// ---- Talent Market ----

function generateTalent(isOppositeSex, leaderGender) {
    const s = createChar();
    s.id = G.nextCharId;
    G.nextCharId++;
    s.luc = 0;
    s.cal = 0;
    s.wel = 0;
    if (isOppositeSex) {
        s.gender = leaderGender === 'm' ? 'f' : 'm';
        s.int = 16 + d(4, 8);
        s.cha = 12 + d(4, 9);
        s.sta = 16 + d(4, 8);
        s.sex = 8 + d(8, 5);
        s.psq = 16 + d(4, 6);
        s.con = 12 + d(6);
        s.age = 12 + d(6, 3);
        s.hel = 12 + d(6, 3) + d(12, 7);
        s.edu = d(12);
        s.exp = d(6, 3);
        s._price = 20;
    } else {
        s.gender = dgender();
        _randName(s);
        s.int = 16 + d(4, 6);
        s.cha = 12 + d(4, 8);
        s.sta = 16 + d(4, 6);
        s.sex = 6 + d(8, 5);
        s.psq = 20 + d(4, 6);
        s.con = 12 + d(8);
        s.age = 12 + d(4, 4);
        s.hel = 12 + d(4, 4) + d(12, 6);
        s.edu = d(12);
        s.exp = d(6, 3);
        s._price = 20;
    }
    _randName(s);
    return s;
}

function generateTalentMarket() {
    const leader = G.chars.find(c => c.id === G.leaderId);
    if (!leader || leader.age < 20) {
        G.talentMarket = [];
        return;
    }

    if (!G.talentMarket) G.talentMarket = [];

    // Remove purchased talents
    G.talentMarket = G.talentMarket.filter(s => !s._purchased);

    // Each talent has 10% chance to leave
    G.talentMarket = G.talentMarket.filter(() => d(100) > 10);

    // Fill up to 2 slots
    while (G.talentMarket.length < 2) {
        const roll = d(6);
        let t;
        if (roll <= 2) {
            t = generateTalent(true, leader.gender);
        } else {
            t = generateTalent(false, leader.gender);
        }
        if (ch(leader.cha) >= 2) {
            t._price = Math.max(0, t._price - d(10));
        }
        G.talentMarket.push(t);
    }

    // Special talent refresh
    if (G.specialTalentRefresh === undefined) G.specialTalentRefresh = 0;
    if (G.specialTalent && G.specialTalent._purchased) {
        G.specialTalent = null;
        G.specialTalentRefresh = d(8);
    }
    if (G.specialTalentRefresh > 0) G.specialTalentRefresh--;
    if (G.specialTalentRefresh <= 0) {
        G.specialTalent = generateSpecialTalent();
        G.specialTalentRefresh = d(8);
    }
}

function generateSpecialTalent() {
    const c = createChar();
    c.id = G.nextCharId;
    G.nextCharId++;
    c.int = d(12, 10);
    c.cha = d(12, 10);
    c.sta = d(12, 10);
    c.sex = d(12, 10);
    c.psq = d(12, 10);
    c.con = d(12, 10);
    const _statKeys = ['int','cha','sta','sex','psq','con'];
    const _sorted = _statKeys.map(k => ({key:k,val:c[k]})).sort((a,b) => b.val - a.val);
    const _top2 = new Set(_sorted.slice(0,2).map(s => s.key));
    _statKeys.forEach(k => { if (!_top2.has(k)) c[k] = Math.max(0, c[k] - (2 + d(6,3))); });
    c.age = d(20, 3);
    c.hel = c.age + d(20, 5);
    c.edu = d(20, 6);
    c.exp = d(20, 6);
    c.luc = d(20, 5);
    c.cal = Math.max(0, Math.round((25 - c.luc / 5) * 3));
    if (c.cal > 30) c.cal = Math.max(0, c.cal - d(4, 5));
    c.wel = 0;
    _randName(c);
    c._price = 35;
    c._isTalent = true;
    return c;
}

function payFromTreasury(amount, leader) {
    const cur = G.organization.current;
    const maxFromTre = Math.max(0, cur.btre - 10);
    const fromTre = Math.min(maxFromTre, amount);
    const fromLeader = amount - fromTre;
    if (fromLeader > 0) {
        if (leader.wel < fromLeader) {
            alert(`银库不足（需留至少10财），皇帝财产也不足${fromLeader}财。`);
            return false;
        }
        if (!confirm(`银库不足（需留至少10财），需皇帝自付${fromLeader}财。皇帝现有${leader.wel}财。确认支付？`)) {
            return false;
        }
        leader.wel -= fromLeader;
    }
    if (fromTre > 0) cur.btre -= fromTre;
    return true;
}

function renderTalentMarket() {
    const container = document.getElementById('talentMarketSlots');
    if (!container) return;
    container.innerHTML = '';

    const leader = G.chars.find(c => c.id === G.leaderId);
    const leaderWel = leader ? leader.wel : 0;

    const talents = (G.talentMarket || []).filter(s => !s._purchased);

    if (!leader || leader.age < 20) {
        container.innerHTML = '<div class="no-talent" style="color:#666;font-size:0.75rem;text-align:center;padding:8px;">皇帝未满20岁</div>';
        return;
    }

    for (let i = 0; i < 3; i++) {
        const t = i < talents.length ? talents[i] : null;
        if (t) {
            const card = document.createElement('div');
            card.className = 'talent-card';
            const cur = G.organization.current;
            const maxFromTre = Math.max(0, cur.btre - 10);
            const canBuy = leader && (leader.wel + maxFromTre) >= t._price && !leader.isDead;
            card.innerHTML = `
                <div class="talent-name">${t.name} ${t.gender === 'm' ? '♂' : '♀'} ${t.age}岁</div>
                <div class="talent-stats">
                    <span>智${t.int}</span> <span>魅${t.cha}</span>
                    <span>体${t.sta}</span> <span>性${t.sex}</span>
                    <span>体魄${t.psq}</span> <span>魄${t.con}</span>
                </div>
                <div class="talent-price">${t._price}财</div>
                <button class="talent-buy-btn" ${canBuy ? '' : 'disabled'}>
                    ${canBuy ? '招募' : (leader && leader.isDead ? '领袖已死亡' : '不足')}
                </button>
            `;
            if (canBuy) {
                card.querySelector('.talent-buy-btn').addEventListener('click', () => {
                    if (!payFromTreasury(t._price, leader)) return;
                    t.luc = d(20, 5);
                    t.cal = Math.round((25 - t.luc / 5) * 3);
                    if (t.cal > 30) t.cal = Math.max(0, t.cal - d(4, 5));
                    t.wel = Math.floor(t._price * 3 / 4);
                    t._purchased = true;
                    t._isTalent = true;
                    t._actedThisYear = true;
                    t.entryAge = t.age;
                    G.chars.push(t);
                    logLifeEvent(t, 'entry', '被招募为人才');
                    renderRecruitPanel();
                    renderCharList();
                    renderGame();
                    updateOrganization();
                    addLog(`<span class="success">[招募]</span> ${leader.name} 花费${t._price}财招募了人才 ${t.name}。`);
                });
            }
            container.appendChild(card);
        } else {
            const empty = document.createElement('div');
            empty.className = 'talent-card talent-card-empty';
            empty.innerHTML = '<div class="talent-empty-slot">空位</div>';
            container.appendChild(empty);
        }
    }
}

function renderRecruitPanel() {
    renderTalentMarket();

    // Bounty column
    const bountyContainer = document.getElementById('recruitBountyContent');
    if (!bountyContainer) return;
    const leader = G.chars.find(c => c.id === G.leaderId);
    const leaderWel = leader ? leader.wel : 0;
    const bounties = G.bounties || [];

    let formHtml = `<div class="bounty-form">
        <div class="bounty-form-row">
            <label>性别:</label>
            <select id="bountyGender" onchange="updateBountyPrice()" style="background:#0f3460;color:#e0e0e0;border:1px solid #1a4a7a;padding:2px 4px;border-radius:3px;font-size:0.75rem;">
                <option value="">不限</option>
                <option value="m">男</option>
                <option value="f">女</option>
            </select>
            <label>年龄:</label>
            <select id="bountyAge" onchange="updateBountyPrice()" style="background:#0f3460;color:#e0e0e0;border:1px solid #1a4a7a;padding:2px 4px;border-radius:3px;font-size:0.75rem;">
                <option value="">不限</option>
                <option value="0">12+1d4</option>
                <option value="1">16+3d6</option>
                <option value="2">20+2d12</option>
            </select>
        </div>
        <div class="bounty-stats-grid" id="bountyStats">`;

    const statOpts = [
        { key: 'int', label: '智力' }, { key: 'cha', label: '魅力' },
        { key: 'sta', label: '劳动力' }, { key: 'sex', label: '性能力' },
        { key: 'psq', label: '体格' }, { key: 'con', label: '魄力' }
    ];
    statOpts.forEach(s => {
        formHtml += `<label style="font-size:0.72rem;display:inline-block;margin-right:6px;"><input type="checkbox" class="bounty-stat-cb" value="${s.key}" onchange="updateBountyPrice()" style="margin-right:2px;"> ${s.label}</label>`;
    });

    const nActive = bounties.length;
    const hasActive = nActive > 0;
    formHtml += `</div>
        <div style="margin-top:4px;display:flex;gap:6px;align-items:center;">
            <button class="bounty-submit-btn" id="bountySubmitBtn" onclick="createBounty()" ${leader && leader.wel >= 30 && !leader.isDead && !hasActive ? '' : 'disabled'} style="background:#e94560;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;">发布</button>
            <span class="bounty-price-hint" id="bountyPriceHint" style="color:#888;font-size:0.7rem;">费用: 30财起</span>
        </div>
    </div>`;

    let activeHtml = `<div class="active-bounties">`;
    if (bounties.length === 0) {
        activeHtml += `<p style="color:#666;font-size:0.72rem;margin-top:6px;">暂无悬赏。</p>`;
    } else {
        bounties.forEach(b => {
            const specParts = [];
            if (b.gender) specParts.push(b.gender === 'm' ? '男' : '女');
            if (b.ageOption !== '') {
                const ageLabels = ['12+1d4', '16+3d6', '20+2d12'];
                specParts.push(`年龄:${ageLabels[parseInt(b.ageOption)]}`);
            }
            (b.specStats || []).forEach(k => specParts.push(`${STAT_LABELS[k]}:30+5d6`));
            activeHtml += `<div style="display:flex;justify-content:space-between;font-size:0.72rem;padding:3px 0;border-bottom:1px solid #1a1a3e;">
                <span style="color:#a0a0d0;">${specParts.join(' | ') || '无指定'}</span>
                <span style="color:#888;">剩${b.yearRemaining}年</span>
            </div>`;
        });
    }
    activeHtml += `</div>`;
    bountyContainer.innerHTML = formHtml + activeHtml;
    updateBountyPrice();

    // Special talent column
    const specialContainer = document.getElementById('recruitSpecialContent');
    if (!specialContainer) return;
    const st = G.specialTalent;
    if (st && !st._purchased) {
        const statKeys = ['int', 'cha', 'sta', 'sex', 'psq', 'con'];
        const sorted = statKeys.map(k => ({ key: k, val: st[k] })).sort((a, b) => b.val - a.val);
        const top2 = sorted.slice(0, 2).map(s => `${STAT_LABELS[s.key]}:${statDesc(s.key, s.val)}`).join('，');
        const cur = G.organization.current;
        const maxFromTre = Math.max(0, cur.btre - 10);
        const canBuy = leader && (leader.wel + maxFromTre) >= st._price && !leader.isDead;
        specialContainer.innerHTML = `
            <div class="talent-card talent-special" style="border-color:#ffd54f;">
                <div class="talent-special-header" style="color:#ffd54f;font-weight:bold;font-size:0.78rem;margin-bottom:4px;">★ 特殊人才</div>
                <div class="talent-name">${st.name} ${st.gender === 'm' ? '♂' : '♀'} ${st.age}岁</div>
                <div class="talent-special-desc" style="font-size:0.7rem;color:#a0d8a0;font-style:italic;">${top2}</div>
                <div class="talent-price" style="font-size:0.72rem;color:#888;margin:4px 0;">价格: ${st._price}财</div>
                <button class="talent-buy-btn" ${canBuy ? '' : 'disabled'} style="background:#e94560;color:#fff;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.75rem;width:100%;">
                    ${canBuy ? '招募' : (leader && leader.isDead ? '领袖已死亡' : '财富不足')}
                </button>
            </div>
        `;
        if (canBuy) {
            specialContainer.querySelector('.talent-buy-btn').addEventListener('click', () => {
                if (!payFromTreasury(st._price, leader)) return;
                st.luc = d(20, 5);
                st.cal = Math.max(0, Math.round((25 - st.luc / 5) * 3));
                st.wel = Math.floor(st._price * 3 / 4);
                st._purchased = true;
                st._actedThisYear = true;
                st.entryAge = st.age;
                G.chars.push(st);
                logLifeEvent(st, 'entry', '被招募为特殊人才');
                generateTalentMarket();
                renderRecruitPanel();
                renderCharList();
                renderGame();
                updateOrganization();
                addLog(`<span class="success">[招募]</span> ${leader.name} 花费${st._price}财招募了特殊人才 ${st.name}。`);
            });
        }
    } else {
        specialContainer.innerHTML = '<div style="color:#666;font-size:0.75rem;text-align:center;padding:12px;">当前无特殊人才。</div>';
    }
}

function updateBountyPrice() {
    const leader = G.chars.find(c => c.id === G.leaderId);
    const leaderWel = leader ? leader.wel : 0;
    const hasActive = (G.bounties || []).length > 0;
    const checked = document.querySelectorAll('.bounty-stat-cb:checked');
    const hasGender = document.getElementById('bountyGender').value !== '';
    const hasAge = document.getElementById('bountyAge').value !== '';
    const nAttrs = (hasGender ? 1 : 0) + (hasAge ? 1 : 0) + checked.length;
    const price = 30 + 10 * nAttrs;
    document.getElementById('bountyPriceHint').textContent = `费用: ${price}财 (${leaderWel}财可用)`;
    document.getElementById('bountySubmitBtn').disabled = !leader || leaderWel < price || leader.isDead || hasActive;
}

function createBounty() {
    const leader = G.chars.find(c => c.id === G.leaderId);
    if (!leader || leader.isDead) { alert('领袖不可用。'); return; }

    if ((G.bounties || []).length > 0) { alert('已有进行中的悬赏，请等待完成。'); return; }

    const checked = document.querySelectorAll('.bounty-stat-cb:checked');
    const hasGender = document.getElementById('bountyGender').value !== '';
    const hasAge = document.getElementById('bountyAge').value !== '';
    if (!hasGender && !hasAge && checked.length === 0) { alert('请至少指定一项条件（性别、年龄或数值）。'); return; }
    const nAttrs = (hasGender ? 1 : 0) + (hasAge ? 1 : 0) + checked.length;
    if (nAttrs > 4) { alert('至多指定4项条件（性别、年龄、至多2项数值）。'); return; }
    if (checked.length > 2) { alert('至多选择2项数值属性！'); return; }
    const price = 30 + 10 * nAttrs;

    if (leader.wel < price) { alert('财富不足！'); return; }

    const specStats = [];
    checked.forEach(cb => specStats.push(cb.value));

    const bounty = {
        id: G.nextCharId++,
        yearRemaining: d(8),
        gender: document.getElementById('bountyGender').value,
        ageOption: document.getElementById('bountyAge').value,
        specStats: specStats
    };
    if (!G.bounties) G.bounties = [];
    G.bounties.push(bounty);
    leader.wel -= price;
    addLog(`<span class="success">[悬赏]</span> ${leader.name} 花费${price}财发布悬赏（${bounty.yearRemaining}年后到货）。`);
    renderRecruitPanel();
    renderCharList();
    renderGame();
    updateOrganization();
}

function generateBountyCharacter(bounty) {
    const c = createChar();
    c.id = G.nextCharId;
    G.nextCharId++;
    const allStats = ['int', 'cha', 'sta', 'sex', 'psq', 'con'];
    const specSet = new Set(bounty.specStats || []);
    allStats.forEach(k => {
        if (specSet.has(k)) {
            c[k] = 30 + d(6, 5);
        } else {
            c[k] = 16 + d(8, 6);
        }
    });
    if (bounty.gender) c.gender = bounty.gender;
    if (bounty.ageOption !== '') {
        const opt = parseInt(bounty.ageOption);
        if (opt === 0) c.age = 12 + d(4);
        else if (opt === 1) c.age = 16 + d(6, 3);
        else if (opt === 2) c.age = 20 + d(12, 2);
    } else {
        c.age = 12 + d(4, 4);
    }
    c.edu = d(6, 5);
    c.exp = d(6, 5);
    c.hel = 20 + d(20, 4);
    c.wel = 0;
    c.luc = d(20, 5);
    c.cal = Math.max(0, Math.round((25 - c.luc / 5) * 3));
    if (c.cal > 30) c.cal = Math.max(0, c.cal - d(4, 5));
    c._isTalent = true;
    c._actedThisYear = true;
    _randName(c);
    return c;
}

function renderSpecialTab() {
    const container = document.getElementById('talentMarketSpecial');
    const st = G.specialTalent;
    if (st && !st._purchased) {
        const statKeys = ['int', 'cha', 'sta', 'sex', 'psq', 'con'];
        const sorted = statKeys.map(k => ({ key: k, val: st[k] })).sort((a, b) => b.val - a.val);
        const top2 = sorted.slice(0, 2).map(s => `${STAT_LABELS[s.key]}:${statDesc(s.key, s.val)}`).join('，');
        container.innerHTML = `
            <div style="color:#ffd54f;font-weight:bold;margin-bottom:8px;">当前特殊人才</div>
            <div style="background:#16213e;border:1px solid #ffd54f;border-radius:8px;padding:12px;">
                <div style="font-size:1rem;font-weight:bold;margin-bottom:6px;">${st.name} ${st.gender === 'm' ? '♂' : '♀'} ${st.age}岁</div>
                <div style="font-size:0.85rem;color:#a0d8a0;font-style:italic;">${top2}</div>
                <div style="margin-top:8px;color:#888;font-size:0.8rem;">招募后方可查看完整属性。</div>
            </div>
        `;
    } else {
        container.innerHTML = '<div class="special-placeholder">当前无特殊人才。</div>';
    }
}

// ---- Exploitation & Transfer ----

const EXPLOIT_RATES = [
    { label: '10%', pct: 10, calDice: () => 1 },
    { label: '25%', pct: 25, calDice: () => d(4) },
    { label: '50%', pct: 50, calDice: () => d(8) },
    { label: '80%', pct: 80, calDice: () => d(6, 2) },
    { label: '100%', pct: 100, calDice: () => d(4, 5) }
];

function showExploitTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const targets = G.chars.filter(t => t.id !== c.id && !t.isDead);

    if (targets.length === 0) {
        prompt.textContent = `${c.name}: 没有可以剥削的对象。`;
        btnContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(backBtn);
        return;
    }

    prompt.textContent = `${c.name}: 选择要剥削的对象（当前财富: ${c.wel}）`;
    btnContainer.innerHTML = '';

    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} (财${t.wel})`;
        btn.addEventListener('click', () => showExploitPercentages(c, t));
        btnContainer.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '取消';
    backBtn.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(backBtn);
}

function showExploitPercentages(c, target) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');

    prompt.textContent = `${c.name}: 对 ${target.name} 剥削多少比例？`;
    btnContainer.innerHTML = '';

    EXPLOIT_RATES.forEach(rate => {
        const amount = Math.floor(target.wel * rate.pct / 100);
        const calGain = rate.calDice();
        const btn = document.createElement('button');
        btn.textContent = `${rate.label}（得${amount}财 灾+${calGain}）`;
        btn.addEventListener('click', () => {
            if (amount <= 0) {
                showActionResult(`<span class="info">[剥削]</span> ${target.name} 没有足够财富可剥削。`);
                finalizeCharAction(c);
                return;
            }
            target.wel -= amount;
            c.wel += amount;
            c.cal += calGain;
            showActionResult(`<span class="fail">[剥削]</span> ${c.name} 剥削了 ${target.name} 的${rate.label}财富（${amount}财）！<br>自身灾厄+${calGain}`);
            finalizeCharAction(c);
        });
        btnContainer.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => showExploitTargets(c));
    btnContainer.appendChild(backBtn);
}

function showTransferTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');

    if ((c.wel || 0) < 5) {
        prompt.textContent = `${c.name}: 财富不足5，无法转账。`;
        btnContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(backBtn);
        return;
    }

    const targets = G.chars.filter(t => t.id !== c.id && !t.isDead);

    if (targets.length === 0) {
        prompt.textContent = `${c.name}: 没有可以转账的对象。`;
        btnContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(backBtn);
        return;
    }

    prompt.textContent = `${c.name}: 选择转账对象（当前财富: ${c.wel}）`;
    btnContainer.innerHTML = '';

    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} (财${t.wel})`;
        btn.addEventListener('click', () => {
            showTransferAmountOverlay(c, t);
        });
        btnContainer.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '取消';
    backBtn.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(backBtn);
}

function showTransferAmountOverlay(c, t) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    const win = document.createElement('div');
    win.style.cssText = 'background:#1a1a2e;padding:24px;border-radius:10px;min-width:280px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);border:1px solid #0f3460;';
    const titleEl = document.createElement('div');
    titleEl.textContent = `向 ${t.name} 转账（拥有: ${c.wel}财）`;
    titleEl.style.cssText = 'font-size:16px;font-weight:bold;margin-bottom:16px;color:#e0e0e0;';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = String(c.wel);
    input.value = '0';
    input.style.cssText = 'width:200px;padding:8px;font-size:16px;margin-bottom:12px;border:1px solid #333;border-radius:4px;text-align:center;background:#16213e;color:#e0e0e0;';
    const errEl = document.createElement('div');
    errEl.style.cssText = 'color:#e94560;font-size:13px;margin-bottom:8px;display:none;';
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;justify-content:center;gap:10px;';
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确认转账';
    confirmBtn.style.cssText = 'padding:6px 14px;font-size:14px;cursor:pointer;border:none;border-radius:4px;background:#e94560;color:#fff;';
    confirmBtn.onclick = () => {
        const amount = parseInt(input.value);
        if (isNaN(amount) || amount <= 0) {
            errEl.textContent = '请输入有效金额（大于0）';
            errEl.style.display = '';
            return;
        }
        if (amount > c.wel) {
            errEl.textContent = `财富不足！拥有${c.wel}财。`;
            errEl.style.display = '';
            return;
        }
        overlay.remove();
        c.wel -= amount;
        t.wel += amount;
        showActionResult(`<span class="success">[转账]</span> ${c.name} 转账 ${amount}财 给 ${t.name}。`);
        finalizeCharAction(c);
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = 'padding:6px 14px;font-size:14px;cursor:pointer;border:1px solid #555;border-radius:4px;background:transparent;color:#aaa;';
    cancelBtn.onclick = () => {
        overlay.remove();
        showActionResult(`<span class="info">[转账]</span> ${c.name} 取消了转账。`);
        finalizeCharAction(c);
    };
    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(cancelBtn);
    win.appendChild(titleEl);
    win.appendChild(input);
    win.appendChild(errEl);
    win.appendChild(btnRow);
    overlay.appendChild(win);
    document.body.appendChild(overlay);
    setTimeout(() => input.focus(), 100);
}

function showBestowSurnameTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const targets = G.chars.filter(t => t.id !== c.id && !t.isDead && t.surname !== c.surname);

    if (targets.length === 0) {
        prompt.textContent = `${c.name}: 没有可以赐姓的对象。`;
        btnContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => selectChar(c.id));
        btnContainer.appendChild(backBtn);
        return;
    }

    prompt.textContent = `${c.name}: 选择要赐姓的对象（国姓: ${c.surname}）`;
    btnContainer.innerHTML = '';

    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name} (原姓${t.surname})`;
        btn.addEventListener('click', () => bestowSurname(c, t));
        btnContainer.appendChild(btn);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(cancelBtn);
}

function showAppointMenu(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    prompt.textContent = `${c.name}: 选择要指派的职位：`;
    btnContainer.innerHTML = '';

    const professions = [
        { id: '正宫', label: '正宫', filter: t => t.id !== c.id && !t.isDead && t.gender !== c.gender, note: t => G.chars.find(x => x.profession === '正宫') ? `当前:${G.chars.find(x => x.profession === '正宫').name}` : '' },
        { id: '宰相', label: '宰相', filter: t => {
            if (t.id === c.id || t.isDead) return false;
            const emp = G.chars.find(x => x.id === G.leaderId);
            if (!emp) return false;
            return t.edu > Math.min(emp.edu || 0, 70)
                || t.int > Math.min(emp.int || 0, 90)
                || t.cha > Math.min(emp.cha || 0, 80)
                || ((t.profession === '学者' || t.profession === '艺人') && t.age > 60);
        }, note: t => G.chars.find(x => x.profession === '宰相') ? `当前:${G.chars.find(x => x.profession === '宰相').name}` : '' },
        { id: '监工', label: '监工', filter: t => {
            if (t.id === c.id || t.isDead) return false;
            const emp = G.chars.find(x => x.id === G.leaderId);
            if (!emp) return false;
            return t.sta > Math.min(emp.sta || 0, 80)
                || t.sex > Math.min(emp.sex || 0, 80)
                || (t.profession === '劳工' && t.age > 40);
        } },
        { id: '将军', label: '将军', filter: t => {
            if (t.id === c.id || t.isDead) return false;
            const emp = G.chars.find(x => x.id === G.leaderId);
            if (!emp) return false;
            return t.psq > Math.min(emp.psq || 0, 80)
                || t.con > Math.min(emp.con || 0, 80)
                || (t.profession === '士兵' && t.age > 40);
        } },
        { id: '学者', label: '学者', filter: t => t.id !== c.id && !t.isDead },
        { id: '艺人', label: '艺人', filter: t => t.id !== c.id && !t.isDead },
        { id: '劳工', label: '劳工', filter: t => t.id !== c.id && !t.isDead },
        { id: '士兵', label: '士兵', filter: t => t.id !== c.id && !t.isDead },
        { id: '普侍', label: '普侍', filter: t => t.id !== c.id && !t.isDead },
        { id: '休养者', label: '休养者', filter: t => t.id !== c.id && !t.isDead },
        { id: '无业者', label: '无业者', filter: t => t.id !== c.id && !t.isDead },
    ];

    professions.forEach(p => {
        const btn = document.createElement('button');
        btn.textContent = p.disabled ? `${p.label} [${p.disabled}]` : p.label;
        btn.style.margin = '3px';
        if (p.disabled) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.addEventListener('click', () => showAppointTargets(c, p));
        }
        btnContainer.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(backBtn);
}

// ---- Unified Appoint Target Selection ----

function appointConsort(c, t) {
    const old = G.chars.find(x => x.profession === '正宫');
    if (old && old.id !== t.id) {
        old.profession = '无业者';
        logLifeEvent(old, 'demote', '被免去正宫之位');
        addLog(`<span class="info">[正宫]</span> ${old.name} 被降为无业者。`);
    }
    t.profession = '正宫';
    logLifeEvent(t, 'appoint', '被立为正宫');
    // Auto-bestow imperial surname
    if (t.surname !== c.surname) {
        t.middlename = t.surname;
        t.surname = c.surname;
        t.name = t.surname + t.middlename + t.givenname;
        addLog(`<span class="success">[赐姓]</span> ${c.name} 赐 ${t.name} 国姓。`);
    }
    return `<span class="success">[正宫]</span> ${c.name} 指定 ${t.name} 为正宫！`;
}

function appointChancellor(c, t) {
    const old = G.chars.find(x => x.profession === '宰相');
    if (old && old.id !== t.id) {
        old.profession = '学者';
        logLifeEvent(old, 'demote', '被免去宰相之位');
        addLog(`<span class="info">[宰相]</span> ${old.name} 被降为学者。`);
    }
    t.profession = '宰相';
    logLifeEvent(t, 'appoint', '被任命为宰相');
    return `<span class="success">[任命]</span> ${c.name} 指定 ${t.name} 为宰相！`;
}

function appointSimple(c, t, prof) {
    const MINISTER_PROFS = ['监工', '将军'];
    // Single office-holder check for ministers
    if (MINISTER_PROFS.includes(prof)) {
        const old = G.chars.find(x => x.profession === prof);
        if (old && old.id !== t.id) {
            // Demote old to appropriate profession
            const demoteTo = prof === '将军' ? '士兵' : '劳工';
            old.profession = demoteTo;
            logLifeEvent(old, 'demote', `被免去${prof}之位`);
            addLog(`<span class="info">[${prof}]</span> ${old.name} 被降为${demoteTo}。`);
        }
        logLifeEvent(t, 'appoint', '被任命为' + prof);
    }
    
    // 如果指派为普侍，mdt基础-10
    if (prof === '普侍') {
        G.mdtPenalty = (G.mdtPenalty || 0) + 10;
        addLog(`<span class="info">[天命]</span> 任命普侍，天命基础-10。`);
    }
    
    t.profession = prof;
    return `<span class="success">[任命]</span> ${c.name} 指定 ${t.name} 为${prof}。`;
}

function showAppointTargets(c, prof) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const targets = G.chars.filter(prof.filter);

    if (targets.length === 0) {
        prompt.textContent = `${c.name}: 没有可指定为${prof.label}的对象。`;
        btnContainer.innerHTML = '';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => showAppointMenu(c));
        btnContainer.appendChild(backBtn);
        return;
    }

    const note = prof.note ? prof.note() : '';
    prompt.textContent = `${c.name}: 选择要指定为${prof.label}的对象${note ? `（${note}）` : ''}`;
    btnContainer.innerHTML = '';

    targets.forEach(t => {
        const btn = document.createElement('button');
        const extra = prof.id === '正宫' && t.profession === '正宫' ? ' [现任]' :
                      prof.id === '宰相' && t.profession === '宰相' ? ' [现任]' : '';
        btn.textContent = `${t.name} ${t.gender === 'm' ? '♂' : '♀'} (${t.profession})${extra}`;
        btn.addEventListener('click', () => {
            let html;
            if (prof.id === '正宫') {
                html = appointConsort(c, t);
            } else if (prof.id === '宰相') {
                html = appointChancellor(c, t);
            } else {
                html = appointSimple(c, t, prof.id);
            }
            showActionResult(html);
            finalizeCharAction(c);
        });
        btnContainer.appendChild(btn);
    });

    const backBtn = document.createElement('button');
    backBtn.textContent = '取消';
    backBtn.addEventListener('click', () => showAppointMenu(c));
    btnContainer.appendChild(backBtn);
}

function elderlyCare(c) {
    resetLearningStreaks(c);
    const roll = d(100);
    const result = comp(roll, c.wel);
    c.history.rest += 1;
    let msg = '';
    if (result === 0) {
        const wLoss = d(4);
        c.wel -= wLoss;
        msg = `<span class="fail">[失败]</span> 养老失败（财-${wLoss}）`;
    } else if (result === 1) {
        const wLoss = d(4), stGain = d(4), hGain = d(4);
        c.wel -= wLoss; c.sta += stGain; c.hel += hGain;
        msg = `<span class="success">[成功]</span> 养老成功（财-${wLoss} 体+${stGain} 寿+${hGain}）`;
    } else if (result === 2) {
        const wLoss = d(4), stGain = d(4), hGain = d(4, 2);
        c.wel -= wLoss; c.sta += stGain; c.hel += hGain;
        msg = `<span class="great">[大成功]</span> 养老大成功（财-${wLoss} 体+${stGain} 寿+${hGain}）`;
    } else if (result === 3) {
        const wLoss = 1, stGain = d(8), hGain = d(6, 2);
        c.wel -= wLoss; c.sta += stGain; c.hel += hGain;
        msg = `<span class="extreme">[牛逼]</span> 养老牛逼！（财-${wLoss} 体+${stGain} 寿+${hGain}）`;
    }
    return msg;
}

function nothing(c) {
    resetLearningStreaks(c);
    return `<span class="info">[虚度]</span> 又浪费了一年！`;
}

function showGovernOptions(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const treasury = G.organization.current.btre;
    
    if (treasury < 20) {
        prompt.textContent = '国库余额不足20，无法发动理政。';
        btnContainer.innerHTML = '<button onclick="document.getElementById(\'actionPrompt\').textContent = \'点击一个角色来执行行动\'">返回</button>';
        return;
    }
    
    // 获取国家科技和文化值
    const stateTech = G.organization.current.tec;
    const stateCulture = G.organization.current.cul;
    
    // 决定显示哪些选项
    let showTech = false;
    let showCulture = false;
    
    if (c.int > c.cha) {
        // 宰相智力 > 魅力：默认显示科技
        showTech = true;
        // 如果国家文化 > 科技，也显示文化
        showCulture = stateCulture > stateTech;
    } else if (c.cha > c.int) {
        // 宰相魅力 > 智力：默认显示文化
        showCulture = true;
        // 如果国家科技 > 文化，也显示科技
        showTech = stateTech > stateCulture;
    } else {
        // 宰相智力 = 魅力：两个都显示
        showTech = true;
        showCulture = true;
    }
    
    let promptText = `${c.name}: 选择提升类型`;
    if (c.int > c.cha) {
        promptText += `（宰相智力${c.int} > 魅力${c.cha}`;
        if (stateCulture > stateTech) promptText += `，但国家文化${fmt(stateCulture)} > 科技${fmt(stateTech)}`;
        promptText += '）';
    } else if (c.cha > c.int) {
        promptText += `（宰相魅力${c.cha} > 智力${c.int}`;
        if (stateTech > stateCulture) promptText += `，但国家科技${fmt(stateTech)} > 文化${fmt(stateCulture)}`;
        promptText += '）';
    } else {
        promptText += `（宰相智力${c.int} = 魅力${c.cha}）`;
    }
    
    prompt.textContent = promptText;
    btnContainer.innerHTML = '';
    
    if (showTech) {
        const techBtn = document.createElement('button');
        techBtn.textContent = `提升科技 (智力: ${c.int})`;
        techBtn.onclick = () => {
            const result = executeGovern(c, 'tech');
            showActionResult(result);
            finalizeCharAction(c);
        };
        btnContainer.appendChild(techBtn);
    }
    
    if (showCulture) {
        const cultureBtn = document.createElement('button');
        cultureBtn.textContent = `提升文化 (魅力: ${c.cha})`;
        cultureBtn.onclick = () => {
            const result = executeGovern(c, 'culture');
            showActionResult(result);
            finalizeCharAction(c);
        };
        btnContainer.appendChild(cultureBtn);
    }
    
    // 如果两个选项都不显示（理论上不会发生）
    if (!showTech && !showCulture) {
        prompt.textContent = '没有可用的提升选项。';
    }
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
        document.getElementById('actionPrompt').textContent = '点击一个角色来执行行动';
        document.getElementById('actionBtns').innerHTML = '';
    };
    btnContainer.appendChild(cancelBtn);
}

function executeGovern(c, type) {
    resetLearningStreaks(c);
    c.history.govern = (c.history.govern || 0) + 1;
    
    const treasury = G.organization.current.btre;
    if (treasury < 20) {
        return `<span class="fail">[失败]</span> 国库余额不足20，无法发动理政。`;
    }
    
    // 花费国库5d4
    const cost = d(4, 5);
    if (cost > treasury) {
        return `<span class="fail">[失败]</span> 国库余额不足${cost}，无法发动理政。`;
    }
    
    G.organization.current.btre -= cost;
    const duration = 2 + d(6);
    const endYear = G.time + duration;
    
    let msg = '';
    if (type === 'tech') {
        // 提升科技
        G.organization.current.atec = (G.organization.current.atec || 0) + cost;
        if (!G._governEffects) G._governEffects = [];
        G._governEffects.push({ type: 'tech', amount: cost, endYear });
        const scholars = G.chars.filter(x => !x.isDead && x.profession === '学者');
        scholars.forEach(s => s.int += d(4));
        msg = `<span class="success">[理政]</span> ${c.name} 提升科技，花费国库${cost}，科技提升${cost}（持续${duration}年），所有学者智力+1d4`;
    } else {
        // 提升文化
        G.organization.current.acul = (G.organization.current.acul || 0) + cost;
        if (!G._governEffects) G._governEffects = [];
        G._governEffects.push({ type: 'culture', amount: cost, endYear });
        const artists = G.chars.filter(x => !x.isDead && x.profession === '艺人');
        artists.forEach(a => a.cha += d(4));
        msg = `<span class="success">[理政]</span> ${c.name} 提升文化，花费国库${cost}，文化提升${cost}（持续${duration}年），所有艺人魅力+1d4`;
    }
    
    return msg;
}

function showSqueezeOptions(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const treasury = G.organization.current.btre;

    if (treasury < 20) {
        prompt.textContent = '国库余额不足20，无法发动压榨。';
        btnContainer.innerHTML = '<button onclick="document.getElementById(\'actionPrompt\').textContent = \'点击一个角色来执行行动\'; document.getElementById(\'actionBtns\').innerHTML = \'\'">返回</button>';
        return;
    }

    const cur = G.organization.current;
    const prd = cur.prd || 0;
    const pop = cur.pop || 0;
    const pushiCount = G.chars.filter(x => !x.isDead && x.profession === '普侍').length;
    const laborCount = G.chars.filter(x => !x.isDead && x.profession === '劳工').length;

    let showPrd = false;
    let showPop = false;

    if (prd > pop) {
        showPrd = true;
        if (pushiCount > laborCount) showPop = true;
    } else if (pop > prd) {
        showPop = true;
        if (laborCount > pushiCount) showPrd = true;
    } else {
        showPrd = true;
        showPop = true;
    }

    prompt.textContent = `${c.name}: 选择压榨类型`;
    btnContainer.innerHTML = '';

    if (showPrd) {
        const btn = document.createElement('button');
        btn.textContent = `提升生产 (生产${fmt(prd)} > 人口${fmt(pop)})`;
        btn.onclick = () => {
            const result = executeSqueeze(c, 'prd');
            showActionResult(result);
            finalizeCharAction(c);
        };
        btnContainer.appendChild(btn);
    }

    if (showPop) {
        const btn = document.createElement('button');
        btn.textContent = `提升人口 (人口${fmt(pop)}${showPrd ? `，普侍${pushiCount} > 劳工${laborCount}` : ` > 生产${fmt(prd)}`})`;
        btn.onclick = () => {
            const result = executeSqueeze(c, 'pop');
            showActionResult(result);
            finalizeCharAction(c);
        };
        btnContainer.appendChild(btn);
    }

    if (!showPrd && !showPop) {
        prompt.textContent = '没有可用的压榨选项。';
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
        document.getElementById('actionPrompt').textContent = '点击一个角色来执行行动';
        document.getElementById('actionBtns').innerHTML = '';
    };
    btnContainer.appendChild(cancelBtn);
}

function executeSqueeze(c, type) {
    resetLearningStreaks(c);
    c.history.squeeze = (c.history.squeeze || 0) + 1;

    const treasury = G.organization.current.btre;
    if (treasury < 20) {
        return `<span class="fail">[失败]</span> 国库余额不足20，无法发动压榨。`;
    }

    const cost = d(4, 5);
    if (cost > treasury) {
        return `<span class="fail">[失败]</span> 国库余额不足${cost}，无法发动压榨。`;
    }

    G.organization.current.btre -= cost;
    const duration = 2 + d(6);
    const endYear = G.time + duration;

    let msg = '';

    if (type === 'prd') {
        G.organization.current.aprd = (G.organization.current.aprd || 0) + cost;

        const laborers = G.chars.filter(x => !x.isDead && x.profession === '劳工');
        const helLoss = d(4, 2) + 2;
        const staLoss = d(10, 2);
        let totalTreasury = 0;
        laborers.forEach(lab => {
            lab.hel = Math.max(1, (lab.hel || 0) - helLoss);
            lab.sta = Math.max(0, (lab.sta || 0) - staLoss);
            const gain = 2 + d(4, 2);
            totalTreasury += gain;
            msg += `<br>&nbsp;&nbsp;${lab.name}: 寿命-${helLoss} 劳-${staLoss} 为国库+${gain}`;
        });
        G.organization.current.btre += totalTreasury;
        msg = `<span class="success">[压榨·生产]</span> ${c.name} 压榨提升生产，花费国库${cost}，生产提升${cost}（持续${duration}年），国库收回${totalTreasury}${msg}`;
    } else {
        G.organization.current.apop = (G.organization.current.apop || 0) + cost;

        const pushis = G.chars.filter(x => !x.isDead && x.profession === '普侍');
        const helLoss = d(4, 2) + 2;
        const staLoss = d(10, 2);
        const sexGain = d(6, 3) + 2;
        let totalCalOverseer = 0;
        let totalCalEmperor = 0;
        pushis.forEach(p => {
            p.hel = Math.max(1, (p.hel || 0) - helLoss);
            p.sta = Math.max(0, (p.sta || 0) - staLoss);
            p.sex = (p.sex || 0) + sexGain;
            const ocGain = d(4, 2);
            c.cal = (c.cal || 0) + ocGain;
            totalCalOverseer += ocGain;
            const empGain = d(4);
            const emp = G.chars.find(e => e.id === G.leaderId);
            if (emp) emp.cal = (emp.cal || 0) + empGain;
            totalCalEmperor += empGain;
            msg += `<br>&nbsp;&nbsp;${p.name}: 寿命-${helLoss} 劳-${staLoss} 性+${sexGain}`;
        });

        const mdtLoss = d(4) * 5;
        G.mdtPenalty = (G.mdtPenalty || 0) + mdtLoss;

        msg = `<span class="success">[压榨·人口]</span> ${c.name} 压榨提升人口，花费国库${cost}，人口提升${cost}（持续${duration}年），天命惩罚+${mdtLoss}，监工灾厄+${totalCalOverseer}，皇帝灾厄+${totalCalEmperor}${msg}`;

        // 随机选一名普侍进行生育检定
        if (pushis.length > 0) {
            const chosen = pushis[Math.floor(Math.random() * pushis.length)];
            const partners = G.chars.filter(x =>
                !x.isDead && !x.exitStatus &&
                x.gender !== chosen.gender &&
                x.id !== chosen.id &&
                x.age >= 12 && x.age <= 50
            );
            if (partners.length > 0) {
                const partner = partners[Math.floor(Math.random() * partners.length)];
                const tier = tierForChildbirth(chosen, partner);
                const mod = CHILDBIRTH_TIER_MOD[tier] || 0;
                const sexSum = (chosen.sex || 0) + (partner.sex || 0);
                const target = Math.max(1, sexSum + mod);
                const r = ch(target);
                if (r >= 1) {
                    const child = generateChild(chosen, partner, tier, r);
                    child._actedThisYear = true;
                    G.chars.push(child);
                    msg += `<br>&nbsp;&nbsp;${chosen.name} 与 ${partner.name} 诞下 ${child.name}。`;
                    if (Math.random() < 0.25) {
                        handleExit(chosen, 'natural');
                        msg += `<br>&nbsp;&nbsp;<span class="fail">${chosen.name} 因生育去世。</span>`;
                    }
                }
            }
        }
    }

    return msg;
}

function showDrillOptions(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const treasury = G.organization.current.btre;

    if (treasury < 20) {
        prompt.textContent = '国库余额不足20，无法发动演兵。';
        btnContainer.innerHTML = '<button onclick="document.getElementById(\'actionPrompt\').textContent = \'点击一个角色来执行行动\'; document.getElementById(\'actionBtns\').innerHTML = \'\'">返回</button>';
        return;
    }

    const emp = G.chars.find(e => e.id === G.leaderId);
    const genPsq = c.psq || 0;
    const genCon = c.con || 0;
    const empPsq = emp ? emp.psq || 0 : 0;
    const empCon = emp ? emp.con || 0 : 0;

    let showExercise = false;
    let showMobilize = false;

    if (genPsq > genCon) {
        showExercise = true;
        if (empCon > empPsq) showMobilize = true;
    } else if (genCon > genPsq) {
        showMobilize = true;
        if (empPsq > empCon) showExercise = true;
    } else {
        showExercise = true;
        showMobilize = true;
    }

    prompt.textContent = `${c.name}: 选择演兵类型`;
    btnContainer.innerHTML = '';

    if (showExercise) {
        const btn = document.createElement('button');
        btn.textContent = '演习';
        btn.onclick = () => {
            const result = executeDrill(c, 'exercise');
            showActionResult(result);
            finalizeCharAction(c);
        };
        btnContainer.appendChild(btn);
    }

    if (showMobilize) {
        const btn = document.createElement('button');
        btn.textContent = '动员';
        btn.onclick = () => {
            const result = executeDrill(c, 'mobilize');
            showActionResult(result);
            finalizeCharAction(c);
        };
        btnContainer.appendChild(btn);
    }

    if (!showExercise && !showMobilize) {
        prompt.textContent = '没有可用的演兵选项。';
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
        document.getElementById('actionPrompt').textContent = '点击一个角色来执行行动';
        document.getElementById('actionBtns').innerHTML = '';
    };
    btnContainer.appendChild(cancelBtn);
}

function executeDrill(c, type) {
    resetLearningStreaks(c);
    c.history.drill = (c.history.drill || 0) + 1;

    const treasury = G.organization.current.btre;
    if (treasury < 20) {
        return `<span class="fail">[失败]</span> 国库余额不足20，无法发动演兵。`;
    }

    const cost = d(4, 5);
    if (cost > treasury) {
        return `<span class="fail">[失败]</span> 国库余额不足${cost}，无法发动演兵。`;
    }

    G.organization.current.btre -= cost;
    const duration = 2 + d(6);
    const endYear = G.time + duration;

    G.organization.current.amil = (G.organization.current.amil || 0) + cost;
    if (!G._drillEffects) G._drillEffects = [];
    G._drillEffects.push({ type, amount: cost, endYear });

    const emp = G.chars.find(e => e.id === G.leaderId);
    const soldiers = G.chars.filter(x => !x.isDead && x.profession === '士兵');

    let msg = '';
    if (type === 'exercise') {
        // 将军 and 所有士兵: sta-1d4, psq+1d8, int+1d4, con+2
        [c, ...soldiers].forEach(ch => {
            const staLoss = d(4);
            const psqGain = d(8);
            const intGain = d(4);
            const conGain = 2;
            ch.sta = Math.max(0, (ch.sta || 0) - staLoss);
            ch.psq = (ch.psq || 0) + psqGain;
            ch.int = (ch.int || 0) + intGain;
            ch.con = (ch.con || 0) + conGain;
        });
        // 皇帝: con+2d6
        if (emp) {
            emp.con = (emp.con || 0) + d(6, 2);
            msg = `<span class="success">[演兵·演习]</span> ${c.name} 发动演习，花费国库${cost}，军事提升${cost}（持续${duration}年），皇帝魄力+${d(6, 2)}`;
        }
    } else {
        // 动员: 将军 and 所有士兵: cha-1d4, con+3d4, sta+2, psq+1d4, int+2
        [c, ...soldiers].forEach(ch => {
            const chaLoss = d(4);
            const conGain = d(4, 3);
            const staGain = 2;
            const psqGain = d(4);
            const intGain = 2;
            ch.cha = Math.max(0, (ch.cha || 0) - chaLoss);
            ch.con = (ch.con || 0) + conGain;
            ch.sta = (ch.sta || 0) + staGain;
            ch.psq = (ch.psq || 0) + psqGain;
            ch.int = (ch.int || 0) + intGain;
        });
        // 皇帝: con+1d12
        if (emp) {
            emp.con = (emp.con || 0) + d(12);
            msg = `<span class="success">[演兵·动员]</span> ${c.name} 发动动员，花费国库${cost}，军事提升${cost}（持续${duration}年），皇帝魄力+${d(12)}`;
        }
    }

    return msg;
}

function govern(c) {
    // 旧版本兼容
    resetLearningStreaks(c);
    c.history.govern = (c.history.govern || 0) + 1;
    const r = ch(c.edu);
    let msg = '';
    if (r === 0) {
        const eduG = d(4);
        c.edu += eduG;
        msg = `<span class="fail">[失败]</span> 理政（教+${eduG}）`;
    } else if (r === 1) {
        const eduG = d(4), welG = d(4), conG = d(4);
        c.edu += eduG; c.wel += welG; c.con += conG;
        msg = `<span class="success">[成功]</span> 理政（教+${eduG} 财+${welG} 魄+${conG}）`;
    } else if (r === 2) {
        const eduG = d(6), welG = d(6), conG = d(6), intG = d(4);
        c.edu += eduG; c.wel += welG; c.con += conG; c.int += intG;
        G.organization.current.epop += d(4);
        msg = `<span class="great">[大成功]</span> 理政（教+${eduG} 财+${welG} 魄+${conG} 智+${intG}）`;
    } else {
        const eduG = d(8), welG = d(8, 2), conG = d(8), intG = d(6);
        c.edu += eduG; c.wel += welG; c.con += conG; c.int += intG;
        G.organization.current.epop += d(6);
        const emp = G.chars.find(e => e.id === G.leaderId);
        if (emp && !emp.isDead) emp.wel += d(4);
        msg = `<span class="extreme">[超常]</span> 理政（教+${eduG} 财+${welG} 魄+${conG} 智+${intG} 人口+增加 帝财+增加）`;
    }
    return msg;
}

function showGovernPolicy(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const emp = G.chars.find(e => e.id === G.leaderId);
    if (!emp || emp.isDead) return;

    prompt.textContent = `${emp.name}: 选择施政项目`;
    btnContainer.innerHTML = '';
    const policies = [
        { id: 'tax', label: '征税' },
        { id: 'granary', label: '开仓' },
        { id: 'invest', label: '投资' },
        { id: 'assassinate', label: '暗杀' }
    ];
    policies.forEach(p => {
        const btn = document.createElement('button');
        btn.textContent = p.label;
        btn.addEventListener('click', () => executeGovernPolicy(emp, p.id));
        btnContainer.appendChild(btn);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => {
        document.getElementById('actionPrompt').textContent = '点击一个角色来执行行动';
        document.getElementById('actionBtns').innerHTML = '';
    });
    btnContainer.appendChild(cancelBtn);
    labelActionBtns();
}

function doGovernConCheck(emp) {
    const HAOQIANG_STATS = ['int','cha','sta','sex','psq','con','wel'];
    const hqList = G.chars.filter(ch => {
        if (ch.isDead || ch.exitStatus || ch.id === G.leaderId) return false;
        let count = 0;
        HAOQIANG_STATS.forEach(s => { if ((ch[s] || 0) > (emp[s] || 0)) count++; });
        return count >= 3;
    });
    let checkCon = emp.con;
    if (hqList.length > 0) {
        const maxHqCon = Math.max(...hqList.map(h => h.con || 0));
        if (maxHqCon > emp.con) {
            checkCon = Math.max(0, emp.con * 2 - maxHqCon);
        }
    }
    return ch(checkCon);
}

function executeGovernPolicy(emp, policyId) {
    const conR = doGovernConCheck(emp);
    if (conR === 0) {
        const msg = `<span class="fail">[失败]</span> 施政检定失败（魄力检定未通过），施政未能执行。`;
        showActionResult(msg);
        finalizeCharAction(emp);
        return;
    }
    if (policyId === 'tax') showTaxRateOptions(emp);
    else if (policyId === 'granary') showGranaryRateOptions(emp);
    else if (policyId === 'invest') showInvestRateOptions(emp);
    else if (policyId === 'assassinate') showAssassinateRoleOptions(emp);
}

function showTaxRateOptions(emp) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    prompt.textContent = `${emp.name}: 选择税率`;
    btnContainer.innerHTML = '';
    const rates = [10, 25, 50, 80];
    rates.forEach((rate, i) => {
        const btn = document.createElement('button');
        btn.textContent = `${rate}%`;
        btn.addEventListener('click', () => {
            const msg = executePolicyTax(emp, i);
            showActionResult(msg);
            finalizeCharAction(emp);
        });
        btnContainer.appendChild(btn);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => showGovernPolicy(emp));
    btnContainer.appendChild(cancelBtn);
    labelActionBtns();
}

function executePolicyTax(emp, rateIndex) {
    const rates = [10, 25, 50, 80];
    const rate = rates[rateIndex];
    const eapoGain = [d(4), d(6), d(10), d(20)][rateIndex];
    let totalTax = 0;
    let resistCount = 0;
    G.chars.forEach(ch => {
        if (ch.isDead || ch.exitStatus || ch.id === G.leaderId) return;
        if ((ch.wel || 0) <= 8) return;
        const tax = Math.floor(ch.wel * rate / 100);
        if (tax <= 0) return;
        if ((ch.con || 0) > (emp.con || 0)) {
            const contest = xch(ch.con, emp.con);
            if (contest >= 2) { resistCount++; return; }
        }
        ch.wel -= tax;
        totalTax += tax;
    });
    G.organization.current.btre += totalTax;
    G.organization.current.eapo = (G.organization.current.eapo || 0) + eapoGain;
    G.organization.current.aapo = (G.organization.current.aapo || 0) + eapoGain;
    const rateLabel = rates[rateIndex];
    return `征税：税率${rateLabel}%，实收${totalTax}财，${resistCount}人抗税，eapo+${eapoGain}`;
}

function showGranaryRateOptions(emp) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    prompt.textContent = `${emp.name}: 选择开仓比例`;
    btnContainer.innerHTML = '';
    const rates = [10, 25, 50, 80];
    rates.forEach((rate, i) => {
        const btn = document.createElement('button');
        btn.textContent = `${rate}%`;
        btn.addEventListener('click', () => {
            const msg = executePolicyGranary(emp, i);
            showActionResult(msg);
            finalizeCharAction(emp);
        });
        btnContainer.appendChild(btn);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => showGovernPolicy(emp));
    btnContainer.appendChild(cancelBtn);
    labelActionBtns();
}

function executePolicyGranary(emp, rateIndex) {
    const rates = [10, 25, 50, 80];
    const rate = rates[rateIndex];
    const mdtGain = [d(4), d(6), d(10), d(20)][rateIndex];
    const treasury = G.organization.current.btre;
    const allocation = Math.floor(treasury * rate / 100);
    if (allocation <= 0) {
        return `<span class="fail">[失败]</span> 国库资金不足，无法开仓。`;
    }
    const eligible = G.chars.filter(ch => !ch.isDead && !ch.exitStatus && ch.profession !== '皇帝' && ch.profession !== '贱民');
    if (eligible.length === 0) {
        return `<span class="fail">[失败]</span> 没有符合条件的角色。`;
    }
    const perCapitaTheory = allocation / eligible.length;
    let totalPaid = 0;
    eligible.forEach(ch => {
        const actualPay = Math.floor(perCapitaTheory);
        if (actualPay > 0) {
            ch.wel = (ch.wel || 0) + actualPay;
            totalPaid += actualPay;
        }
    });
    const leftover = allocation - totalPaid;
    G.organization.current.btre -= allocation;
    G.organization.current.btre += leftover;
    if (totalPaid === 0) {
        return `<span class="fail">[失败]</span> 实际支付值为0，开仓无效，mdt不获得加成。`;
    }
    G.organization.current.bmdt = (G.organization.current.bmdt || 0) + mdtGain;
    return `开仓：拨款${allocation}财，实际发放${totalPaid}财，回流${leftover}财，mdt+${mdtGain}`;
}

function showInvestRateOptions(emp) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    prompt.textContent = `${emp.name}: 选择投资比例`;
    btnContainer.innerHTML = '';
    const rates = [10, 25, 50, 80];
    rates.forEach((rate, i) => {
        const btn = document.createElement('button');
        btn.textContent = `${rate}%`;
        btn.addEventListener('click', () => showInvestDeptOptions(emp, i));
        btnContainer.appendChild(btn);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => showGovernPolicy(emp));
    btnContainer.appendChild(cancelBtn);
    labelActionBtns();
}

function showInvestDeptOptions(emp, rateIndex) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    prompt.textContent = `${emp.name}: 选择投资部门`;
    btnContainer.innerHTML = '';
    const depts = [
        { id: 'tec', label: '科技' },
        { id: 'cul', label: '文化' },
        { id: 'prd', label: '生产' },
        { id: 'pop', label: '人口' },
        { id: 'mil', label: '军事' }
    ];
    depts.forEach(d => {
        const btn = document.createElement('button');
        btn.textContent = d.label;
        btn.addEventListener('click', () => {
            const msg = executePolicyInvest(emp, rateIndex, d.id);
            showActionResult(msg);
            finalizeCharAction(emp);
        });
        btnContainer.appendChild(btn);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => showInvestRateOptions(emp));
    btnContainer.appendChild(cancelBtn);
    labelActionBtns();
}

function executePolicyInvest(emp, rateIndex, dept) {
    const rates = [10, 25, 50, 80];
    const rate = rates[rateIndex];
    const statGain = [d(4), d(6), d(10), d(20)][rateIndex];
    const treasury = G.organization.current.btre;
    const allocation = Math.floor(treasury * rate / 100);
    if (allocation <= 0) {
        return `<span class="fail">[失败]</span> 国库资金不足，无法投资。`;
    }
    G.organization.current.btre -= allocation;
    const deptMap = {
        tec: { stat: 'int', currKey: 'etec', accumKey: 'atec', label: '科技' },
        cul: { stat: 'cha', currKey: 'ecul', accumKey: 'acul', label: '文化' },
        prd: { stat: 'sta', currKey: 'eprd', accumKey: 'aprd', label: '生产' },
        pop: { stat: 'sex', currKey: 'epop', accumKey: 'apop', label: '人口' },
        mil: { stat: 'psq', currKey: 'emil', accumKey: 'amil', label: '军事' }
    };
    const info = deptMap[dept];
    G.organization.current[info.currKey] = (G.organization.current[info.currKey] || 0) + allocation;
    G.organization.current[info.accumKey] = (G.organization.current[info.accumKey] || 0) + allocation;
    if (dept === 'pop') {
        G.chars.filter(ch => !ch.isDead && !ch.exitStatus && ch.profession !== '皇帝').forEach(ch => {
            ch[info.stat] = (ch[info.stat] || 0) + statGain;
        });
    } else {
        G.chars.filter(ch => !ch.isDead && !ch.exitStatus && ch.profession !== '皇帝' && ch.profession !== '贱民').forEach(ch => {
            ch[info.stat] = (ch[info.stat] || 0) + statGain;
        });
    }
    return `投资${info.label}：拨款${allocation}财，${info.label}累计+${allocation}，民众${info.stat}+${statGain}`;
}

function showAssassinateRoleOptions(emp) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    prompt.textContent = `${emp.name}: 选择暗杀执行人`;
    btnContainer.innerHTML = '';
    const roles = [
        { id: 'chancellor', label: '宰相' },
        { id: 'overseer', label: '监工' },
        { id: 'general', label: '将军' }
    ];
    roles.forEach(r => {
        const btn = document.createElement('button');
        btn.textContent = r.label;
        btn.addEventListener('click', () => showAssassinateTargetOptions(emp, r.id));
        btnContainer.appendChild(btn);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => showGovernPolicy(emp));
    btnContainer.appendChild(cancelBtn);
    labelActionBtns();
}

function showAssassinateTargetOptions(emp, roleId) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    prompt.textContent = `${emp.name}: 选择暗杀目标`;
    btnContainer.innerHTML = '';
    const targets = G.chars.filter(ch => !ch.isDead && !ch.exitStatus && ch.id !== G.leaderId);
    if (targets.length === 0) {
        prompt.textContent = '没有可指定的暗杀目标。';
        const backBtn = document.createElement('button');
        backBtn.textContent = '返回';
        backBtn.addEventListener('click', () => showGovernPolicy(emp));
        btnContainer.appendChild(backBtn);
        labelActionBtns();
        return;
    }
    targets.forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = `${t.name}（${t.profession}）`;
        btn.addEventListener('click', () => {
            const msg = executePolicyAssassinate(emp, roleId, t.id);
            showActionResult(msg);
            finalizeCharAction(emp);
        });
        btnContainer.appendChild(btn);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => showAssassinateRoleOptions(emp));
    btnContainer.appendChild(cancelBtn);
    labelActionBtns();
}

function executePolicyAssassinate(emp, roleId, targetId) {
    const target = G.chars.find(ch => ch.id === targetId);
    if (!target) return `<span class="fail">[失败]</span> 暗杀目标不存在。`;
    const assassin = G.chars.find(ch => {
        if (ch.isDead || ch.exitStatus || ch.id === G.leaderId) return false;
        if (roleId === 'chancellor') return ch.profession === '宰相';
        if (roleId === 'overseer') return ch.profession === '监工';
        if (roleId === 'general') return ch.profession === '将军';
        return false;
    });
    if (!assassin) return `<span class="fail">[失败]</span> 没有合适的执行人。`;
    const calCost = d(4);
    const mdtCost = 2 + d(4, 2);
    emp.cal = (emp.cal || 0) + calCost;
    G.organization.current.bmdt = Math.max(0, (G.organization.current.bmdt || 0) - mdtCost);
    let assassinStat;
    if (roleId === 'chancellor') assassinStat = Math.max(assassin.int || 0, assassin.cha || 0);
    else if (roleId === 'overseer') assassinStat = assassin.wel || 0;
    else assassinStat = assassin.psq || 0;
    const targetStat = Math.max(target.int || 0, target.cha || 0, target.wel || 0, target.psq || 0);
    const contest = xch(assassinStat, targetStat);
    let succeed = false;
    let extreme = false;
    if (contest >= 3) { succeed = true; extreme = true; }
    else if (contest >= 2) succeed = true;
    else if (contest >= 1) {
        if ((assassin.con || 0) > (emp.con || 0)) succeed = false;
        else succeed = true;
    }
    if (!succeed) {
        return `<span class="fail">[暗杀失败]</span> ${assassin.name}（${roleId === 'chancellor' ? '宰相' : roleId === 'overseer' ? '监工' : '将军'}）暗杀${target.name}失败，皇帝cal+${calCost}，mdt基础-${mdtCost}。`;
    }
    const calBonus = d(6);
    assassin.cal = (assassin.cal || 0) + calBonus;
    target.isDead = true;
    target.exitStatus = 'assassinated';
    target.exitYear = G.time;
    logLifeEvent(target, 'exit', '被暗杀');
    logFamilyExitEvent(target, '被暗杀');
    let msg = `<span class="fail">[暗杀成功]</span> ${assassin.name}（${roleId === 'chancellor' ? '宰相' : roleId === 'overseer' ? '监工' : '将军'}）成功暗杀${target.name}，暗杀人cal+${calBonus}`;
    if (extreme) {
        const conBonus = 2 + d(4, 2);
        assassin.con = (assassin.con || 0) + conBonus;
        msg += `，魄力+${conBonus}`;
    }
    return msg;
}

function showTeachTargets(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const treasury = G.organization.current.btre;

    if (treasury < 16) {
        prompt.textContent = '国库余额不足16，无法发动执教。';
        btnContainer.innerHTML = '<button onclick="document.getElementById(\'actionPrompt\').textContent = \'点击一个角色来执行行动\'; document.getElementById(\'actionBtns\').innerHTML = \'\'">返回</button>';
        return;
    }

    function showTargetList(teachType, subjectName) {
        prompt.textContent = `${c.name}: 选择要教授的角色（教授科目: ${subjectName}）`;
        btnContainer.innerHTML = '';

        const availableTargets = G.chars.filter(x => !x.isDead && !x.exitStatus && x.id !== c.id);
        if (availableTargets.length === 0) {
            prompt.textContent = '没有可教授的角色。';
            btnContainer.innerHTML = '<button onclick="document.getElementById(\'actionPrompt\').textContent = \'点击一个角色来执行行动\'; document.getElementById(\'actionBtns\').innerHTML = \'\'">返回</button>';
            return;
        }

        availableTargets.forEach(target => {
            const btn = document.createElement('button');
            btn.textContent = `${target.name} (财富: ${target.wel.toFixed(1)})`;
            if (target.wel < 4) {
                btn.disabled = true;
                btn.title = '该角色财富不足4，无法被教授';
                btn.style.opacity = '0.5';
            }
            btn.onclick = () => {
                const result = executeTeach(c, target, teachType);
                showActionResult(result);
                finalizeCharAction(c);
            };
            btnContainer.appendChild(btn);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = () => {
            document.getElementById('actionPrompt').textContent = '点击一个角色来执行行动';
            document.getElementById('actionBtns').innerHTML = '';
        };
        btnContainer.appendChild(cancelBtn);
    }

    // 监工: sta/sex 中较高者
    if (c.profession === '监工') {
        const teachType = c.sta >= c.sex ? 'sta' : 'sex';
        const subjectName = teachType === 'sta' ? '劳动力' : '性能力';
        showTargetList(teachType, subjectName);
        return;
    }

    // 将军: psq/con 中较高者
    if (c.profession === '将军') {
        const teachType = c.psq >= c.con ? 'psq' : 'con';
        const subjectName = teachType === 'psq' ? '体格' : '魄力';
        showTargetList(teachType, subjectName);
        return;
    }

    // 宰相: existing behavior
    const teachType = c.int >= c.cha ? 'int' : 'cha';
    const subjectName = teachType === 'int' ? '智力' : '魅力';
    showTargetList(teachType, subjectName);
}

function updateUIAfterAction(c) {
    // 更新UI但不标记角色为已行动
    renderCharList();
    renderGame();
}

function executeTeach(c, target, teachType) {
    resetLearningStreaks(c);
    c.history.teach = (c.history.teach || 0) + 1;
    
    const treasury = G.organization.current.btre;
    if (treasury < 16) {
        return `<span class="fail">[失败]</span> 国库余额不足16，无法发动执教。`;
    }
    
    if (target.wel < 4) {
        return `<span class="fail">[失败]</span> ${target.name} 财富不足4，无法发动执教。`;
    }
    
    // 花费国库2d8
    const treasuryCost = d(8, 2);
    // 花费被教授人财富1d4
    const targetCost = d(4);
    
    if (treasuryCost > treasury) {
        return `<span class="fail">[失败]</span> 国库余额不足${treasuryCost}，无法发动执教。`;
    }
    
    if (targetCost > target.wel) {
        return `<span class="fail">[失败]</span> ${target.name} 财富不足${targetCost}，无法发动执教。`;
    }
    
    // 扣除花费
    G.organization.current.btre -= treasuryCost;
    target.wel -= targetCost;
    
    // 教授科目
    if (!teachType) {
        teachType = c.int >= c.cha ? 'int' : 'cha';
    }
    const totalGain = treasuryCost + targetCost + d(10); // 花费值总和 + 1d10
    
    const statMap = {
        int: { label: '智力', key: 'int' },
        cha: { label: '魅力', key: 'cha' },
        sta: { label: '劳动力', key: 'sta' },
        sex: { label: '性能力', key: 'sex' },
        psq: { label: '体格', key: 'psq' },
        con: { label: '魄力', key: 'con' }
    };
    const stat = statMap[teachType];
    if (!stat) {
        return `<span class="fail">[错误]</span> 未知科目类型。`;
    }
    
    target[stat.key] = (target[stat.key] || 0) + totalGain;
    
    // 将军教授con时，将军con+1d4
    let extraMsg = '';
    if (c.profession === '将军' && teachType === 'con') {
        const conGain = d(4);
        c.con = (c.con || 0) + conGain;
        extraMsg = `，将军魄力+${conGain}`;
    }
    
    return `<span class="success">[执教]</span> ${c.name} 教授${target.name} ${stat.label}，花费国库${treasuryCost}，${target.name}花费财富${targetCost}，${target.name}${stat.label}+${totalGain}${extraMsg}`;
}

function teach(c) {
    // 旧版本兼容
    resetLearningStreaks(c);
    c.history.teach = (c.history.teach || 0) + 1;
    const r = ch(c.edu);
    let msg = '';
    if (r === 0) {
        const eduLoss = d(4);
        c.edu -= eduLoss;
        msg = `<span class="fail">[失败]</span> 执教（教-${eduLoss}）`;
    } else if (r === 1) {
        const eduG = d(4), welG = d(4);
        c.edu += eduG; c.wel += welG;
        const student = G.chars.filter(x => !x.isDead && x.profession === '学者' || x.profession === '艺人').sort(() => 0.5 - Math.random())[0];
        if (student) {
            student.edu += d(2);
            msg = `<span class="success">[成功]</span> 执教（教+${eduG} 财+${welG} 学生${student.name}教+提高）`;
        } else {
            msg = `<span class="success">[成功]</span> 执教（教+${eduG} 财+${welG}）`;
        }
    } else if (r === 2) {
        const eduG = d(6), welG = d(6), intG = d(4);
        c.edu += eduG; c.wel += welG; c.int += intG;
        const students = G.chars.filter(x => !x.isDead && (x.profession === '学者' || x.profession === '艺人') && x.id !== c.id).slice(0, 2);
        students.forEach(s => s.edu += d(2));
        msg = `<span class="great">[大成功]</span> 执教（教+${eduG} 财+${welG} 智+${intG} 学生数人教+提高）`;
    } else {
        const eduG = d(8), welG = d(8, 2), intG = d(6), chaG = d(4);
        c.edu += eduG; c.wel += welG; c.int += intG; c.cha += chaG;
        const students = G.chars.filter(x => !x.isDead && (x.profession === '学者' || x.profession === '艺人')).slice(0, 3);
        students.forEach(s => { s.edu += d(3); s.int += d(2); });
        msg = `<span class="extreme">[超常]</span> 执教（教+${eduG} 财+${welG} 智+${intG} 魅+${chaG} 学生数人教智+提高）`;
    }
    return msg;
}

function showDonatePrompt(c) {
    const prompt = document.getElementById('actionPrompt');
    const btnContainer = document.getElementById('actionBtns');
    const treasury = G.organization.current.btre;

    btnContainer.innerHTML = '';
    prompt.textContent = `${c.name}: 理财`;

    // Mode selection buttons
    const modeBtns = document.createElement('div');
    modeBtns.style.marginBottom = '8px';
    let mode = 'deposit';

    const depositBtn = document.createElement('button');
    depositBtn.textContent = '存入国库';
    depositBtn.className = 'finance-mode-btn active';
    depositBtn.style.marginRight = '4px';

    const withdrawBtn = document.createElement('button');
    withdrawBtn.textContent = '从国库提取';
    withdrawBtn.className = 'finance-mode-btn';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = 0;
    input.value = 10;
    input.style.cssText = 'width:120px;padding:4px;margin:4px;background:#2a2a4e;color:#fff;border:1px solid #555;';

    const info = document.createElement('div');
    info.style.cssText = 'margin:4px 0;font-size:0.85rem;color:#aaa;';

    function updateInfo() {
        if (mode === 'deposit') {
            input.max = c.wel;
            input.value = Math.min(parseInt(input.value) || 0, c.wel);
            info.textContent = `个人财产: ${c.wel} 财  |  国库: ${treasury} 财`;
        } else {
            input.max = treasury;
            input.value = Math.min(parseInt(input.value) || 0, treasury);
            info.textContent = `国库: ${treasury} 财  |  个人财产: ${c.wel} 财`;
        }
    }

    depositBtn.addEventListener('click', () => {
        mode = 'deposit';
        depositBtn.className = 'finance-mode-btn active';
        withdrawBtn.className = 'finance-mode-btn';
        updateInfo();
    });

    withdrawBtn.addEventListener('click', () => {
        mode = 'withdraw';
        withdrawBtn.className = 'finance-mode-btn active';
        depositBtn.className = 'finance-mode-btn';
        updateInfo();
    });

    modeBtns.appendChild(depositBtn);
    modeBtns.appendChild(withdrawBtn);
    btnContainer.appendChild(modeBtns);

    const inputRow = document.createElement('div');
    inputRow.style.margin = '4px 0';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确认';
    confirmBtn.style.marginLeft = '4px';
    confirmBtn.addEventListener('click', () => {
        const amount = parseInt(input.value, 10);
        if (isNaN(amount) || amount <= 0) {
            alert('请输入有效金额。');
            return;
        }
        if (mode === 'deposit') {
            if (amount > c.wel) {
                alert('个人财产不足。');
                return;
            }
            c.wel -= amount;
            G.organization.current.btre += amount;
            const calLoss = Math.floor(amount / 3);
            if (c.id === G.leaderId) {
                c.cal = Math.max(0, (c.cal || 0) - calLoss);
            }
            showActionResult(`<span class="success">[理财]</span> ${c.name} 存入国库 ${amount} 财。` + (calLoss > 0 && c.id === G.leaderId ? `<br>灾厄-${calLoss}` : ''));
        } else {
            if (amount > G.organization.current.btre) {
                alert('国库资金不足。');
                return;
            }
            G.organization.current.btre -= amount;
            c.wel += amount;
            const calGain = Math.floor(amount / 2);
            if (c.id === G.leaderId) {
                c.cal = (c.cal || 0) + calGain;
            }
            showActionResult(`<span class="success">[理财]</span> ${c.name} 从国库提取 ${amount} 财。` + (calGain > 0 && c.id === G.leaderId ? `<br>灾厄+${calGain}` : ''));
        }
        finalizeCharAction(c);
    });

    inputRow.appendChild(input);
    inputRow.appendChild(confirmBtn);
    btnContainer.appendChild(inputRow);
    btnContainer.appendChild(info);

    const backBtn = document.createElement('button');
    backBtn.textContent = '返回';
    backBtn.addEventListener('click', () => selectChar(c.id));
    btnContainer.appendChild(backBtn);

    updateInfo();
}

// ---- Checks ----

function grow(c) {
    const age = c.age;
    let msgs = [];
    if (age <= 6) {
        if (age % 2 === 0) {
            c.int += d(4); c.cha += d(4); c.sta += d(4); c.sex += d(4);
            c.psq += d(4);
            c.hel += d(4, 1, '+-');
            msgs.push(`成长了（智+ 魅+ 体+ 性+ 体格+ 寿±）`);
        }
    } else if (age <= 21) {
        if (age % 3 === 0) {
            c.int += d(6); c.cha += d(6); c.sta += d(6); c.sex += d(6);
            c.psq += d(6);
            c.hel += d(6, 1, '+-');
            msgs.push(`成长了（智+ 魅+ 体+ 性+ 体格+ 寿±）`);
        }
    } else if (age < 61) {
        if (age % 5 === 0) {
            c.int += d(8); c.cha += d(8); c.sta += d(4); c.sex += d(4);
            c.psq += d(4); c.con += d(4);
            c.hel += d(4, 1, '+-');
            msgs.push(`成长了（智+ 魅+ 体+ 性+ 体格+ 魄+ 寿±）`);
        }
    } else if (age < 81) {
        if (age % 5 === 0) {
            c.sex -= d(4); c.con += d(6);
            c.hel += d(4, 1, '+-');
            msgs.push(`成长了（魄+ 性- 寿±）`);
            if (age % 10 === 0) {
                c.int += d(4);
                c.cha += d(4, 1, '+-');
                c.sta -= d(4);
                msgs.push(`特殊成长（智+ 魅± 体-）`);
            }
        }
    } else {
        c.sex -= d(4); c.psq -= d(4);
        if (age % 5 === 0) {
            c.int += d(4); c.cha -= d(6); c.sta -= d(10); c.con += d(6);
            c.hel += d(4, 1, '+-');
            msgs.push(`晚年成长（智+ 魅- 体- 魄+ 寿±）`);
        }
    }
    return msgs;
}

function accident(c) {
    if (c.age % 10 !== 0) return [];
    const accResult = compagainst(c.luc, c.cal);
    const props = ['int', 'cha', 'sta', 'sex', 'hel', 'wel'];
    let msgs = [];
    if (accResult === 1) {
        const sel = d(6) - 1;
        const gain = d(6);
        c[props[sel]] += gain;
        c.luc += d(4); c.cal += d(4);
        msgs.push(`<span class="success">[好运]</span> 发生了好事！${STAT_LABELS[props[sel]]}+${gain}`);
    } else if (accResult === 2) {
        const sel = d(6) - 1;
        const gain = d(12);
        c[props[sel]] += gain;
        c.cal += d(6);
        msgs.push(`<span class="great">[大好运]</span> 发生了大好事！${STAT_LABELS[props[sel]]}+${gain}`);
    } else if (accResult === 3) {
        for (let i = 0; i < 2; i++) {
            const sel = d(6) - 1;
            const gain = d(8) + d(8) + d(8);
            c[props[sel]] += gain;
            c.luc -= d(4); c.cal += d(8);
        }
        msgs.push(`<span class="extreme">[牛逼]</span> 发生了牛逼的事！！`);
    } else if (accResult === 0) {
        c.luc += d(12, 1, '+-');
        c.cal += d(12, 1, '+-');
        msgs.push(`<span class="info">[未知]</span> 发生了什么事...？`);
    } else if (accResult === -1) {
        const sel = d(6) - 1;
        const loss = d(6);
        c[props[sel]] -= loss;
        c.luc += d(4); c.cal += d(4);
        msgs.push(`<span class="fail">[厄运]</span> 发生了坏事！${STAT_LABELS[props[sel]]}-${loss}`);
    } else if (accResult === -2) {
        const sel = d(6) - 1;
        const loss = d(12);
        c[props[sel]] -= loss;
        c.luc += d(6);
        msgs.push(`<span class="fail">[大厄运]</span> 发生了大坏事！${STAT_LABELS[props[sel]]}-${loss}`);
    } else if (accResult === -3) {
        for (let i = 0; i < 2; i++) {
            const sel = d(6) - 1;
            const loss = d(8) + d(8) + d(8);
            c[props[sel]] -= loss;
            c.luc += d(8);
            c.cal -= d(4);
        }
        msgs.push(`<span class="fail">[傻逼]</span> 发生了傻逼事！！`);
    }
    return msgs;
}

function deathCheck(c) {
    if (c.age >= c.hel && !c.exitStatus) {
        handleExit(c, 'natural');
        return true;
    }
    return false;
}

function overallCheck(c) {
    const msgs = [];
    msgs.push(...grow(c).map(m => `<span class="log-growth">[成长]</span> ${m}`));
    msgs.push(...accident(c));
    if (c.sta < 5 && !c.exitStatus) {
        const loss = d(6);
        c.hel -= loss;
        msgs.push(`<span class="fail">[虚弱]</span> 体力过低，寿命缩短${loss}年。`);
    }
    if (deathCheck(c)) {
        msgs.push(`<span class="log-death">[死亡]</span> ${c.name} 死了。`);
    }
    return msgs;
}

function handleExit(c, reason) {
    c.exitStatus = reason;
    c.isDead = (reason === 'natural' || reason === 'killed');
    c.exitYear = G.time;
    if (!c.entryAge && c.entryAge !== 0) c.entryAge = c.age;
    // Conquest participant death → remove from conquest
    if (c.isDead) handleConquestDeath(c.id);
    const exitLabels = { natural: '寿终正寝', killed: '被杀', retired: '隐退', exiled: '流放' };
    logLifeEvent(c, 'exit', exitLabels[reason] || '离场');
    logFamilyExitEvent(c, exitLabels[reason] || '离场');

    if (reason === 'natural') {
        const spouse = c.spouseId ? G.chars.find(x => x.id === c.spouseId) : null;
        if (spouse && !spouse.exitStatus) {
            spouse.wel += c.wel;
            addLog(`<span class="info">[遗产]</span> ${c.name} 的 ${c.wel}财 全部转赠给了配偶 ${spouse.name}。`);
            c.wel = 0;
        } else {
            const children = G.chars.filter(x => x.parents.includes(c.id) && !x.exitStatus);
            if (children.length >= 2) {
                children.sort((a, b) => a.age - b.age);
                const youngest = children[0];
                const oldest = children[children.length - 1];
                const half = Math.floor(c.wel / 2);
                oldest.wel += half;
                youngest.wel += half;
                const remainder = c.wel - half * 2;
                if (remainder > 0) oldest.wel += remainder;
                addLog(`<span class="info">[遗产]</span> ${c.name} 的 ${c.wel}财 平分给了子女 ${oldest.name} 和 ${youngest.name}。`);
                c.wel = 0;
            } else if (children.length === 1) {
                children[0].wel += c.wel;
                addLog(`<span class="info">[遗产]</span> ${c.name} 的 ${c.wel}财 全部转赠给了子女 ${children[0].name}。`);
                c.wel = 0;
            } else {
                const half = Math.floor(c.wel / 2);
                G.organization.current.btre += half;
                addLog(`<span class="info">[遗产]</span> ${c.name} 的 ${half}财 上缴国库（无人继承）。`);
                c.wel -= half;
            }
        }
    } else {
        c.wel = 0;
    }

    // mdt penalty for non-natural exits (retired is not penalized)
    if (reason !== 'natural' && reason !== 'retired') {
        G.mdtPenalty += 20;
        addLog(`<span class="log-death">[天命]</span> ${c.name} 非正常离场，天命基础-20。`);
    }

    // mdt penalty for laborer death
    if (c.profession === '劳工') {
        G.mdtPenalty += d(10);
        addLog(`<span class="log-death">[天命]</span> ${c.name} 是劳工，天命基础额外-${d(10)}。`);
    }

    // Move to appropriate list (remove from active pool)
    const idx = G.chars.indexOf(c);
    if (idx >= 0) {
        G.chars.splice(idx, 1);
        if (reason === 'natural' || reason === 'killed') {
            if (!G.deadChars) G.deadChars = [];
            G.deadChars.push(c);
        } else {
            if (!G.unavailableChars) G.unavailableChars = [];
            G.unavailableChars.push(c);
        }
    }

    // Succession: if the deceased is the current leader
    if (c.id === G.leaderId) {
        let successor = null;
        let dynastyChangeSource = null; // 'spouse' | 'other' | 'any'

        // 1. Pick oldest among 储君
        const heirs = G.chars.filter(x => !x.exitStatus && (x._class === '储君' || (x.parents && x.parents.includes(c.id))));
        if (heirs.length > 0) {
            heirs.sort((a, b) => b.age - a.age);
            successor = heirs[0];
        }

        // 2. If no 储君, pick oldest child
        if (!successor) {
            const children = G.chars.filter(x => x.parents && x.parents.includes(c.id) && !x.exitStatus);
            if (children.length > 0) {
                children.sort((a, b) => b.age - a.age);
                successor = children[0];
            }
        }

        // 3. If no children, pick highest con among 正宫/宰相/监工/将军
        if (!successor) {
            const candidates = G.chars.filter(x =>
                ['正宫', '宰相', '监工', '将军'].includes(x.profession) && !x.exitStatus
            );
            if (candidates.length > 0) {
                candidates.sort((a, b) => b.con - a.con);
                successor = candidates[0];
                dynastyChangeSource = successor.profession === '正宫' ? 'spouse' : 'other';
            }
        }

        // 4. If still none, pick highest con among all characters
        if (!successor) {
            const all = G.chars.filter(x => !x.exitStatus);
            if (all.length > 0) {
                all.sort((a, b) => b.con - a.con);
                successor = all[0];
                dynastyChangeSource = 'any';
            }
        }

        if (successor) {
            G._successionPending = true;
            const doSucc = (newName) => {
                if (newName) {
                    successor.givenname = newName;
                    successor.name = successor.surname + (successor.middlename || '') + successor.givenname;
                }
                G.leaderId = successor.id;
                successor.profession = '皇帝';
                delete successor._class;
                G._successionPending = false;
                logLifeEvent(successor, 'appoint', '继位成为新皇帝');

                // If successor is child of deceased emperor, retire the old consort
                if (successor.parents && successor.parents.includes(c.id)) {
                    const oldConsort = G.chars.find(x =>
                        x.profession === '正宫' && x.spouseId === c.id && !x.exitStatus
                    );
                    if (oldConsort) {
                        handleExit(oldConsort, 'retired');
                        addLog(`<span class="info">[隐退]</span> 先帝驾崩，正宫 ${oldConsort.name} 隐退。`);
                    }
                }

                // Gender change: clear all harem members to 无业者
                if (successor.gender !== c.gender) {
                    G.chars.filter(x =>
                        x.profession === '正宫' && !x.exitStatus && x.id !== successor.id
                    ).forEach(x => {
                        x.profession = '无业者';
                        addLog(`<span class="info">[改制]</span> 后宫成员 ${x.name} 转为无业者。`);
                    });
                    G.chars.filter(x =>
                        isConsort(x) && !x.exitStatus && x.id !== successor.id
                    ).forEach(x => {
                        if (x.lovers) x.lovers = x.lovers.filter(id => id !== G.leaderId);
                        addLog(`<span class="info">[改制]</span> 情人 ${x.name} 不再是皇帝情人。`);
                    });
                }

                // New emperor's existing spouse/lover becomes consort
                if (successor.married && successor.spouseId !== null) {
                    const spouse = G.chars.find(x => x.id === successor.spouseId && !x.exitStatus);
                    if (spouse && spouse.id !== G.leaderId) {
                        spouse.profession = '正宫';
                        addLog(`<span class="success">[册封]</span> ${spouse.name} 成为正宫。`);
                    }
                }
                if (successor.lovers && successor.lovers.length > 0) {
                    const firstLover = G.chars.find(x =>
                        x.id === successor.lovers[0] && !x.exitStatus && x.id !== G.leaderId
                    );
                    if (firstLover && firstLover.profession !== '正宫') {
                        if (!firstLover.lovers) firstLover.lovers = [];
                        if (!firstLover.lovers.includes(successor.id)) firstLover.lovers.push(successor.id);
                        addLog(`<span class="success">[册封]</span> ${firstLover.name} 成为情人。`);
                    }
                }

                // Dynasty name change logic
                let shouldChange = false;
                let newSurname = null;

                if (dynastyChangeSource === 'spouse') {
                    shouldChange = Math.random() < 0.25;
                    if (shouldChange) newSurname = G.founderSurname;
                } else if (dynastyChangeSource === 'other') {
                    shouldChange = Math.random() < 0.5;
                    if (shouldChange) {
                        newSurname = successor.middlename ? G.founderSurname : successor.surname;
                    }
                } else if (dynastyChangeSource === 'any') {
                    shouldChange = Math.random() < 0.75;
                    if (shouldChange) {
                        newSurname = successor.middlename ? G.founderSurname : successor.surname;
                    }
                }

                if (shouldChange) {
                    G.imperialSurname = newSurname;
                    G.mdtPenalty += 100;

                    G.chars.forEach(ch => {
                        if (ch.middlename) {
                            ch.surname = ch.middlename;
                            ch.middlename = '';
                            ch.name = ch.surname + ch.givenname;
                        }
                    });

                    successor.surname = newSurname;
                    successor.name = successor.surname + successor.givenname;

                    addLog(`<span class="info">[改朝]</span> 国姓改为「${newSurname}」，天命受损！`);
                }

                if (!G.reignHistory) G.reignHistory = [];
                G.reignHistory.push(G.reignName);
                if (G.isPseudoDynasty) {
                    if (G.imperialSurname === G.founderSurname) {
                        G.reignName = generateReignName();
                        G.isPseudoDynasty = false;
                    } else {
                        G.reignName = '伪' + G.imperialSurname;
                    }
                } else {
                    G.reignName = generateReignName();
                }
                G.reignYear = 1;
                addLog(`<span class="log-succession">[继位]</span> ${successor.name} 成为新领袖。`);
            };
            showNameInputOverlay('新皇帝即位', successor.givenname, successor.gender, doSucc);
        } else {
            addLog(`<span class="log-death">[灭亡]</span> 无人继承，王朝覆灭。`);
        }
    }
}

// ---- Game Over ----

function checkGameOver() {
    if (G.gameOver) return G.gameOver.reason;
    const cur = G.organization && G.organization.current;
    if (cur && cur.mdt < 0) {
        showGameOver('天命已尽！');
        return '天命已尽！';
    }
    const alive = G.chars.filter(c => !c.isDead && !c.exitStatus);
    if (alive.length === 0) {
        showGameOver('树倒猢狲散！');
        return '树倒猢狲散！';
    }
    return null;
}

function showGameOver(reason) {
    if (G.gameOver) return;
    G.gameOver = { reason, year: G.time };
    document.getElementById('btnNextYear').disabled = true;
    document.getElementById('btnNextYear').textContent = '⚫ 游戏结束';
    const title = document.getElementById('gameOverTitle');
    const content = document.getElementById('gameOverContent');
    title.textContent = reason;
    const cur = G.organization && G.organization.current;
    const years = G.time;
    const peak = G.organization ? G.organization.peak : {};
    content.innerHTML = `
        <div style="font-size:1.2rem;color:#e94560;margin:16px 0;">${reason}</div>
        <div style="font-size:0.85rem;color:#aaa;margin-bottom:12px;">纪元 ${years}年</div>
        <div class="detail-stats">
            <span>科技: ${cur ? cur.tec : '?'}</span>
            <span>文化: ${cur ? cur.cul : '?'}</span>
            <span>生产: ${cur ? cur.prd : '?'}</span>
            <span>人口: ${cur ? cur.pop : '?'}</span>
            <span>天命: ${cur ? cur.mdt : '?'}</span>
            <span>等级: ${cur ? cur.lvl : '?'}</span>
        </div>
        <div class="detail-stats" style="margin-top:6px;">
            <span>存活的角色: ${G.chars.filter(c => !c.isDead && !c.exitStatus).length}</span>
            <span>退场角色: ${(G.unavailableChars || []).length + (G.deadChars || []).length}</span>
            <span>历史人物: ${(G.historicalFigures || []).length}</span>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button onclick="exportSettlement()" style="background:#e94560;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">导出结算</button>
            <button onclick="closeGameOver()" style="background:#444;color:#fff;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">返回浏览</button>
        </div>
    `;
    document.getElementById('gameOverOverlay').style.display = 'flex';
    addLog(`<span class="log-death">[终结]</span> ${reason}`);
    updateOrganization();
}

function closeGameOver() {
    document.getElementById('gameOverOverlay').style.display = 'none';
}

function exportSettlement() {
    const cur = G.organization && G.organization.current;
    const lines = [];
    lines.push('=== 海地老皇帝 结算报告 ===');
    lines.push(`游戏结束原因: ${G.gameOver ? G.gameOver.reason : '未知'}`);
    lines.push(`纪元: ${G.time}年`);
    lines.push('');
    lines.push('--- 组织数值 ---');
    if (cur) {
        lines.push(`科技: ${cur.tec}`);
        lines.push(`文化: ${cur.cul}`);
        lines.push(`生产: ${cur.prd}`);
        lines.push(`人口: ${cur.pop}`);
        lines.push(`军事: ${cur.mil}`);
        lines.push(`信息: ${cur.inf}`);
        lines.push(`银库: ${cur.tre}`);
        lines.push(`支持: ${cur.apo}`);
        lines.push(`天命: ${cur.mdt}`);
        lines.push(`等级: ${cur.lvl}`);
    }
    lines.push('');
    lines.push('--- 角色统计 ---');
    lines.push(`存活角色: ${G.chars.filter(c => !c.isDead && !c.exitStatus).length}`);
    lines.push(`退场角色: ${(G.unavailableChars || []).length + (G.deadChars || []).length}`);
    lines.push(`历史人物: ${(G.historicalFigures || []).length}`);
    lines.push('');
    lines.push('--- 所有角色 ---');
    const allChars = [...G.chars, ...(G.unavailableChars || []), ...(G.deadChars || []), ...(G.historicalFigures || [])];
    allChars.sort((a, b) => (a.id || 0) - (b.id || 0));
    allChars.forEach(c => {
        const status = c.exitStatus ? (c.exitStatus === 'natural' ? '已故' : c.exitStatus === 'killed' ? '被杀' : c.exitStatus === 'retired' ? '隐退' : c.exitStatus === 'exiled' ? '流放' : c.exitStatus) : (c.isDead ? '死亡' : '存活');
        lines.push(`${c.name} (${c.gender === 'm' ? '男' : '女'}, ${c.age}岁, ${c.profession || '无业'}) [${status}]`);
    });
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `海地老皇帝_结算_${G.initialCharName || '未知'}_纪元${G.time}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    addLog('<span class="info">[结算]</span> 结算报告已导出。');
}

// ---- Age-based action list ----

function getActionsForAge(age, c) {
    const isLeader = c && c.id === G.leaderId;
    const donate = isLeader ? [{ id: 'donate', label: '理财' }] : [];
    const childbirth = isLeader ? [{ id: 'childbirth', label: '生育' }] : [];
    const exileKill = isLeader ? [
        { id: 'exile', label: '流放' },
        { id: 'kill', label: '杀害' },
        { id: 'summon', label: '召见' },
        { id: 'appointHeir', label: '立嗣' }
    ] : [];
    if (age < 7) return [{ id: 'nothing', label: '无所事事' }];
    if (age < 12) return [
        { id: 'learnScience', label: '学术' },
        { id: 'learnArt', label: '学艺' },
        { id: 'exercise', label: '锻炼' },
        { id: 'nothing', label: '无所事事' }
    ];
    if (age < 31) return [
        ...donate,
        ...childbirth,
        ...exileKill,
        { id: 'retire', label: '隐退' },
        { id: 'learnScience', label: '学术' },
        { id: 'learnArt', label: '学艺' },
        { id: 'labor', label: '劳动' },
        { id: 'exercise', label: '锻炼' },
        { id: 'pursue', label: '追求' },
        { id: 'propose', label: '求婚' },
        { id: 'rest', label: '养生' },
        { id: 'elderlyCare', label: '养老' },
        { id: 'exploit', label: '剥削' },
        { id: 'transfer', label: '转账' },
        { id: 'appoint', label: '指派' },
        { id: 'bestowSurname', label: '赐姓' },
        { id: 'governPolicy', label: '施政' },
        { id: 'nothing', label: '无所事事' }
    ];
    if (age < 81) return [
        ...donate,
        ...childbirth,
        ...exileKill,
        { id: 'retire', label: '隐退' },
        { id: 'labor', label: '劳动' },
        { id: 'exercise', label: '锻炼' },
        { id: 'pursue', label: '追求' },
        { id: 'propose', label: '求婚' },
        { id: 'rest', label: '养生' },
        { id: 'elderlyCare', label: '养老' },
        { id: 'exploit', label: '剥削' },
        { id: 'transfer', label: '转账' },
        { id: 'appoint', label: '指派' },
        { id: 'bestowSurname', label: '赐姓' },
        { id: 'governPolicy', label: '施政' },
        { id: 'nothing', label: '无所事事' }
    ];
    return [
        ...donate,
        ...childbirth,
        ...exileKill,
        { id: 'retire', label: '隐退' },
        { id: 'pursue', label: '追求' },
        { id: 'propose', label: '求婚' },
        { id: 'rest', label: '养生' },
        { id: 'elderlyCare', label: '养老' },
        { id: 'exploit', label: '剥削' },
        { id: 'transfer', label: '转账' },
        { id: 'appoint', label: '指派' },
        { id: 'bestowSurname', label: '赐姓' },
        { id: 'governPolicy', label: '施政' },
        { id: 'nothing', label: '无所事事' }
    ];
}

function needsLaborType(actionId) {
    return actionId === 'labor';
}

function needsPursueType(actionId) {
    return actionId === 'pursue';
}

function needsProposeType(actionId) {
    return actionId === 'propose';
}

function needsExploitType(actionId) {
    return actionId === 'exploit';
}

function needsTransferType(actionId) {
    return actionId === 'transfer';
}

function needsBestowSurnameType(actionId) {
    return actionId === 'bestowSurname';
}

function needsAppointType(actionId) {
    return actionId === 'appoint';
}

function needsExileType(actionId) {
    return actionId === 'exile';
}

function needsKillType(actionId) {
    return actionId === 'kill';
}

function needsSummonType(actionId) {
    return actionId === 'summon';
}

function needsRetireType(actionId) {
    return actionId === 'retire';
}

function needsAppointHeirType(actionId) {
    return actionId === 'appointHeir';
}

// ---- Game Flow ----

function showIntro() {
    showScreen('screenIntro');
}

function startNewGame() {
    const options = generateCharOptions();
    window._charOptions = options;
    showScreen('screenCreate');
    renderCharOptions(options);
}

function renderCharOptions(options) {
    const container = document.getElementById('charOptions');
    container.innerHTML = '';
    options.forEach((c, idx) => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.dataset.idx = idx;
        card.innerHTML = `
            <h4>角色 ${idx + 1} ${c.gender === 'm' ? '♂' : '♀'}</h4>
            <div class="char-stats">
                <span><span class="stat-label">智力:</span> <span class="stat-val">${c.int}</span></span>
                <span><span class="stat-label">魅力:</span> <span class="stat-val">${c.cha}</span></span>
                <span><span class="stat-label">劳动力:</span> <span class="stat-val">${c.sta}</span></span>
                <span><span class="stat-label">性能力:</span> <span class="stat-val">${c.sex}</span></span>
                <span><span class="stat-label">体格:</span> <span class="stat-val">${c.psq}</span></span>
                <span><span class="stat-label">寿命:</span> <span class="stat-val">${c.hel}</span></span>
                <span><span class="stat-label">魄力:</span> <span class="stat-val">${c.con}</span></span>
            </div>
            <div class="char-stats" style="color:#666;font-size:0.8rem;margin-top:4px;text-align:center;">
                <span>（运气与灾厄将在选择后展示）</span>
            </div>
        `;
        card.addEventListener('click', () => selectCharOption(idx));
        container.appendChild(card);
    });
    window._selectedCharIdx = -1;
}

function selectCharOption(idx) {
    const cards = document.querySelectorAll('#charOptions .char-card');
    cards.forEach(c => c.classList.remove('selected'));
    cards[idx].classList.add('selected');
    window._selectedCharIdx = idx;
    document.getElementById('nameInputArea').style.display = 'block';
    const nameInput = document.getElementById('charNameInput');
    nameInput.value = '';
    nameInput.focus();

    // Render imperial surname picker
    const sp = document.getElementById('surnamePicker');
    sp.innerHTML = '';
    _imperialSurnames.forEach(s => {
        const btn = document.createElement('button');
        btn.textContent = s;
        btn.className = 'surname-btn' + (s === _imperialSurnames[0] ? ' active' : '');
        btn.addEventListener('click', () => {
            sp.querySelectorAll('.surname-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window._selectedImperialSurname = s;
        });
        sp.appendChild(btn);
    });
    window._selectedImperialSurname = _imperialSurnames[0];
}

function randomizeName() {
    const idx = window._selectedCharIdx;
    if (idx < 0) return;
    const chosen = window._charOptions[idx];
    const surname = _imperialSurnames[Math.floor(Math.random() * _imperialSurnames.length)];
    const isMale = chosen.gender === 'm';
    const givenFirstPool = isMale ? MALE_GIVEN_FIRST : FEMALE_GIVEN_FIRST;
    const givenSecondPool = isMale ? ALL_MALE_GIVEN : ALL_FEMALE_GIVEN;

    let given;
    if (Math.random() < 0.3 && givenFirstPool.length > 0) {
        // 生成三字名
        const first = givenFirstPool[Math.floor(Math.random() * givenFirstPool.length)];
        const second = givenSecondPool[Math.floor(Math.random() * givenSecondPool.length)];
        given = first + second;
    } else {
        given = givenSecondPool[Math.floor(Math.random() * givenSecondPool.length)];
    }

    document.getElementById('charNameInput').value = given;
    window._selectedImperialSurname = surname;
    const sp = document.getElementById('surnamePicker');
    sp.querySelectorAll('.surname-btn').forEach(b => {
        b.classList.toggle('active', b.textContent === surname);
    });
}

function getStateName(lvl) {
    const levelNames = ['办公室', '街道', '镇', '县', '省', '国'];
    if (lvl >= 5) return '小海帝国';
    return '小海地' + levelNames[lvl];
}

function validateNameInput(input) {
    let fullwidth = 0, halfwidth = 0;
    for (const ch of input.value) {
        const code = ch.charCodeAt(0);
        if (code > 255) {
            fullwidth++;
        } else {
            halfwidth++;
        }
    }
    if (fullwidth * 3 + halfwidth > 12 || halfwidth > 8) {
        input.value = input._lastValid;
    } else {
        input._lastValid = input.value;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const pid = document.getElementById('playerIdInput');
    const hq = document.getElementById('hqNameInput');
    if (pid) { pid._lastValid = pid.value; pid.addEventListener('input', () => validateNameInput(pid)); }
    if (hq) { hq._lastValid = hq.value; hq.addEventListener('input', () => validateNameInput(hq)); }
});

function confirmCharacter() {
    const idx = window._selectedCharIdx;
    if (idx < 0) { alert('请先选择一个角色'); return; }
    const surname = window._selectedImperialSurname || '张';
    const givenName = document.getElementById('charNameInput').value.trim();
    if (!givenName) { alert('请输入角色名字'); return; }
    const playerId = document.getElementById('playerIdInput').value.trim() || 'player';
    const headquarterName = document.getElementById('hqNameInput').value.trim() || '办公室';
    // Validate player ID and HQ name width
    const inputs = [
        { el: document.getElementById('playerIdInput'), val: playerId, label: '玩家ID' },
        { el: document.getElementById('hqNameInput'), val: headquarterName, label: '驻地名称' }
    ];
    for (const inp of inputs) {
        let fw = 0, hw = 0;
        for (const ch of inp.val) {
            if (ch.charCodeAt(0) > 255) fw++; else hw++;
        }
        if (fw * 3 + hw > 12 || hw > 8) {
            alert(`${inp.label}过长：最多4个全角或8个半角字符`);
            return;
        }
    }
    const chosen = JSON.parse(JSON.stringify(window._charOptions[idx]));
    chosen.surname = surname;
    chosen.givenname = givenName;
    chosen.middlename = '';
    chosen.name = surname + givenName;
    chosen.id = 0;
    chosen.profession = '皇帝';
    chosen.cal = Math.max(0, Math.round((25 - chosen.luc / 5) * 3) - d(10, 2));

    G = {
        playerId: playerId,
        enrollTime: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        time: 1840,
        leaderId: 0,
        imperialSurname: surname,
        founderSurname: surname,
        reignName: '开元',
        reignYear: 1,
        isPseudoDynasty: false,
        reignHistory: [],
        headquarterName: headquarterName,
        mdtRestorerAccum: 0,
        initialCharName: chosen.name,
        mdtPenalty: 0,
        coupCooldown: 0,
        coupYears: 0,
        chars: [chosen],
        nextCharId: 1,
        unavailableChars: [],
        deadChars: [],
        bounties: [],
        specialTalent: null,
        specialTalentRefresh: 0,
        historicalFigures: [],
        engagements: [],
        mapData: {
            targets: [
                { id: 'headquarter', name: headquarterName, type: 'admin', conquered: true },
                { id: 'keji', name: '科技大学', type: 'infrastructure', conquered: false },
                { id: 'caijing', name: '财经大学', type: 'infrastructure', conquered: false },
                { id: 'magang', name: '玛钢厂', type: 'infrastructure', conquered: false },
                { id: 'yiyuan', name: '第四医院', type: 'infrastructure', conquered: false },
                { id: 'donghai', name: '东海居委会', type: 'admin', conquered: false },
                { id: 'chentang', name: '陈塘庄居委会', type: 'admin', conquered: false },
                { id: 'liulin', name: '柳林居委会', type: 'admin', conquered: false }
            ]
        }
    };
    G.mapData.targets.forEach(t => initTargetProps(t));

    initOrganization();
    updateOrganization();
    G.coupCooldown = d(10);
    G.coupYears = 0;
    generateTalentMarket();
    showScreen('screenGame');
    renderGame();
    logLifeEvent(chosen, 'entry', '出生，成为部落领袖');
    addLog(`<span class="log-year">=== 纪元 ${G.time} 年开始 ===</span>`);
    addLog(`${chosen.name} 加入了部落。`);
    yearActionsDone = false;
    beginYearActions();
}

function renderGame() {
    const cur = G.organization.current;
    document.getElementById('gameInfo').textContent =
        `玩家: ${G.playerId}  |  纪元: ${G.time}年`;
    const reignDisplay = G.reignYear === 1 ? '元年' : `${G.reignYear}年`;
    const historyText = G.reignHistory && G.reignHistory.length > 0
        ? '年号历史: ' + G.reignHistory.join(' → ')
        : '';
    document.getElementById('orgLevelInfo').textContent =
        `${G.founderSurname}  ${G.reignName}${reignDisplay}  等级：${ORG_LEVEL_NAMES[cur.lvl]}`;
    document.getElementById('orgLevelInfo').title = historyText;
    const legendEl = document.getElementById('classLegend');
    if (legendEl) {
        legendEl.innerHTML = Object.entries(CLASS_COLORS).map(([k,v]) =>
            `<span style="color:${v}">■${k}</span>`
        ).join('');
    }
    renderCharList();
    renderRecruitPanel();
    renderMap();
    renderCombinedPanel();
    renderHistoryPanel();
    refreshActionPanelTabs();
}

function toggleMap() {
    document.getElementById('mapPanel').classList.toggle('collapsed');
}

function renderHistoryPanel() {
    const container = document.getElementById('historyPanelContent');
    if (!container) return;
    container.innerHTML = '';
    const figs = G.historicalFigures || [];
    if (figs.length === 0) {
        container.innerHTML = '<div style="color:#555;padding:6px 0;font-size:0.75rem;">暂无历史人物。</div>';
        return;
    }
    figs.slice(-10).reverse().forEach(c => {
        const entry = document.createElement('div');
        entry.className = 'hist-entry';
        entry.innerHTML = `
            <span class="name">${c.name}</span>
            <span style="color:#666;font-size:0.7rem;">${({ natural:'寿终', killed:'被杀', retired:'隐退', exiled:'流放' })[c.exitStatus] || '存活'}</span>
            <button class="detail-btn" onclick="showHistoryDetail(${c.id})">📋</button>
        `;
        container.appendChild(entry);
    });
    if (figs.length > 10) {
        const more = document.createElement('div');
        more.style.cssText = 'text-align:right;margin-top:4px;';
        more.innerHTML = '<button onclick="openHistory()" style="background:none;border:none;color:#e94560;cursor:pointer;font-size:0.75rem;">查看更多 →</button>';
        container.appendChild(more);
    }
}

function showHistoryDetail(charId) {
    const c = (G.historicalFigures || []).find(x => x.id === charId);
    if (!c) return;
    document.getElementById('charDetailTitle').textContent = `${c.name} 详细`;
    document.getElementById('charDetailContent').innerHTML = renderDetailPanel(c, true);
    document.getElementById('charDetailOverlay').style.display = 'flex';
}

function renderMap() {
    const container = document.getElementById('mapContent');
    if (!container) return;
    const md = G.mapData;
    if (!md) return;

    const levelNames = ['办公室', '街道', '镇', '县', '省', '国'];
    const curLvl = G.organization.current.lvl;
    const stateName = getStateName(curLvl);

    let html = `<div class="map-title">${stateName} · ${G.headquarterName || '办公室'}</div>`;
    html += '<div class="map-targets">';

    md.targets.forEach(t => {
        let typeLabel = t.type === 'infrastructure' ? '基础设施' : '行政中心';
        let typeColor = t.type === 'infrastructure' ? '#4fc3f7' : '#ffb74d';
        if (t.id === 'headquarter') {
            typeLabel = '驻地中心';
            typeColor = '#e94560';
        }
        html += `
            <div class="map-target ${t.conquered ? 'conquered' : 'unconquered'}" data-id="${t.id}">
                <div class="map-target-name">${t.name}</div>
                <div class="map-target-type" style="color:${typeColor}">${typeLabel}</div>
                <div class="map-target-status">${t.conquered ? '已占领' : '未占领'}</div>
                ${t.tec !== undefined ? `<div class="map-target-stats">民${targetMinxin(t)} 天${targetTiantian(t)}</div>` : ''}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Click to select target (with dblclick guard)
    container.querySelectorAll('.map-target').forEach(el => {
        el.style.cursor = 'pointer';
        let clickTimer = null;
        el.addEventListener('click', () => {
            if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; return; }
            clickTimer = setTimeout(() => { clickTimer = null; selectMapTarget(el.dataset.id); }, 250);
        });
    });

    // Double-click to show target detail
    container.querySelectorAll('.map-target').forEach(el => {
        el.addEventListener('dblclick', () => showTargetDetail(el.dataset.id));
    });

    // Restore selection highlight
    if (window._selectedTargetId) {
        const sel = container.querySelector(`.map-target[data-id="${window._selectedTargetId}"]`);
        if (sel) sel.style.borderColor = '#e94560';
    }
}

function switchCombinedTab(tab) {
    document.querySelectorAll('#combinedTabBar .court-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#combinedPanel .court-tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector(`#combinedTabBar .court-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('combined' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
}

function renderCombinedPanel() {
    // Cabinet tab
    const cabinetEl = document.getElementById('combinedCabinet');
    const haremEl = document.getElementById('combinedHarem');
    const unavailableEl = document.getElementById('combinedUnavailable');
    const deadEl = document.getElementById('combinedDead');
    if (!cabinetEl || !haremEl || !unavailableEl || !deadEl) return;

    // ---- Render Cabinet ----
    const alive = G.chars.filter(c => !c.isDead);
    const emp = alive.find(c => c.id === G.leaderId);

    const empEdu = emp?.edu || 0;
    const empInt = emp?.int || 0;
    const empCha = emp?.cha || 0;
    const empSta = emp?.sta || 0;
    const empSex = emp?.sex || 0;
    const empPsq = emp?.psq || 0;
    const empCon = emp?.con || 0;

    function condLabel(statLabel, charVal, empVal, fixedTh) {
        const th = Math.min(empVal, fixedTh);
        if (th === fixedTh) return `${statLabel}${charVal}>${fixedTh}`;
        return `${statLabel}${charVal}>帝${statLabel}${th}`;
    }

    function chancellorConds(c) {
        const conds = [];
        if (c.edu > Math.min(empEdu, 70)) conds.push(condLabel('教', c.edu, empEdu, 70));
        if (c.int > Math.min(empInt, 90)) conds.push(condLabel('智', c.int, empInt, 90));
        if (c.cha > Math.min(empCha, 80)) conds.push(condLabel('魅', c.cha, empCha, 80));
        if ((c.profession === '学者' || c.profession === '艺人') && c.age > 60) conds.push(`年${c.age}>60`);
        return conds;
    }
    function overseerConds(c) {
        const conds = [];
        if (c.sta > Math.min(empSta, 80)) conds.push(condLabel('劳', c.sta, empSta, 80));
        if (c.sex > Math.min(empSex, 80)) conds.push(condLabel('性', c.sex, empSex, 80));
        if (c.profession === '劳工' && c.age > 40) conds.push(`年${c.age}>40`);
        return conds;
    }
    function generalConds(c) {
        const conds = [];
        if (c.psq > Math.min(empPsq, 80)) conds.push(condLabel('体', c.psq, empPsq, 80));
        if (c.con > Math.min(empCon, 80)) conds.push(condLabel('魄', c.con, empCon, 80));
        if (c.profession === '士兵' && c.age > 40) conds.push(`年${c.age}>40`);
        return conds;
    }

    const minProfessions = ['正宫', '宰相', '监工', '将军'];

    // Current ministers: show age and qualifying stats
    let cabHtml = '';
    if (emp) {
        cabHtml += '<div class="court-section-title">现任重臣</div>';
        minProfessions.forEach(prof => {
            const ch = alive.find(c => c.profession === prof);
            if (!ch) return;
            let condStr = '';
            if (prof === '宰相') condStr = chancellorConds(ch).join('; ');
            else if (prof === '监工') condStr = overseerConds(ch).join('; ');
            else if (prof === '将军') condStr = generalConds(ch).join('; ');
            cabHtml += `<div class="court-entry">
                <div><span class="court-name">${ch.name}</span><span class="court-title">[${prof}]</span><span class="court-stats" style="margin-left:6px;">${ch.age}岁</span></div>
                <div style="text-align:right;"><span class="court-stats">${condStr}</span> <span class="court-status active-minister">现任</span></div>
            </div>`;
        });
    }

    // Eligible characters
    const eligible = alive.filter(c => {
        if (c.id === emp?.id || c.isDead) return false;
        if (!emp) return false;
        return chancellorConds(c).length > 0 || overseerConds(c).length > 0 || generalConds(c).length > 0;
    }).filter(c => !minProfessions.includes(c.profession));

    if (eligible.length > 0) {
        cabHtml += '<div class="court-section-title">具备当政资格</div>';
        eligible.forEach(c => {
            const parts = [];
            const cc = chancellorConds(c); if (cc.length > 0) parts.push(`宰相(${cc.join('; ')})`);
            const oc = overseerConds(c); if (oc.length > 0) parts.push(`监工(${oc.join('; ')})`);
            const gc = generalConds(c); if (gc.length > 0) parts.push(`将军(${gc.join('; ')})`);
            cabHtml += `<div class="court-entry">
                <div><span class="court-name">${c.name}</span><span class="court-title">[${c.profession}]</span><span class="court-stats" style="margin-left:6px;">${c.age}岁</span></div>
                <div style="text-align:right;"><span class="court-stats">${parts.join(' | ')}</span> <span class="court-status eligible">候补</span></div>
            </div>`;
        });
    }
    if (!cabHtml) cabHtml = '<div style="color:#666;padding:8px 0;">暂无重臣或具备资格的角色。</div>';
    cabinetEl.innerHTML = cabHtml;

    // --- 后宫 ---
    const consort = alive.find(c => c.profession === '正宫');
    const concubines = alive.filter(c => isConsort(c));
    let harHtml = '';
    if (consort) {
        harHtml += '<div class="court-section-title">正宫</div>';
        harHtml += `<div class="court-entry">
            <div><span class="court-name">${consort.name}</span><span class="court-stats" style="margin-left:6px;">${consort.age}岁</span></div>
            <div><span class="court-stats">魅:${consort.cha} 性:${consort.sex} 魄:${consort.con}</span></div>
        </div>`;
    }
    if (concubines.length > 0) {
        harHtml += `<div class="court-section-title">情人（${concubines.length}人）</div>`;
        concubines.forEach(c => {
            harHtml += `<div class="court-entry">
                <div><span class="court-name">${c.name}</span><span class="court-stats" style="margin-left:6px;">${c.age}岁</span></div>
                <div><span class="court-stats">魅:${c.cha} 性:${c.sex} 魄:${c.con}</span></div>
            </div>`;
        });
    }
    if (!harHtml) harHtml = '<div style="color:#666;padding:8px 0;">后宫空虚。</div>';
    haremEl.innerHTML = harHtml;

    // --- 不可用角色与死亡角色 ---
    const list = G.unavailableChars || [];
    const aliveUnavail = list.filter(c => !c.exitStatus || c.exitStatus === 'exiled' || c.exitStatus === 'retired');
    const deadUnavail = list.filter(c => c.exitStatus === 'natural' || c.exitStatus === 'killed');
    const deadList = G.deadChars || [];

    if (list.length === 0 && deadList.length === 0) {
        unavailableEl.innerHTML = '<div style="color:#555;font-size:0.75rem;padding:4px 0;">无</div>';
        deadEl.innerHTML = '<div style="color:#555;font-size:0.75rem;padding:4px 0;">无</div>';
    } else {
        // Unavailable tab (alive)
        if (aliveUnavail.length > 0) {
            let uHtml = '';
            aliveUnavail.forEach(c => {
                let statusClass = 'unawakened';
                let statusText = '未觉醒';
                if (c.exitStatus === 'exiled') { statusClass = 'exiled'; statusText = '流放'; }
                uHtml += `<div class="unavailable-entry" style="cursor:pointer;" ondblclick="showUnavailableDetail(${c.id})">
                    <span class="name">${c.name}</span>
                    <span style="margin-left:6px;color:#888;">${c.gender === 'm' ? '♂' : '♀'} ${c.age}岁</span>
                    <span class="status ${statusClass}" style="margin-left:6px;">${statusText}</span>
                </div>`;
            });
            unavailableEl.innerHTML = uHtml;
        } else {
            unavailableEl.innerHTML = '<div style="color:#555;font-size:0.75rem;padding:4px 0;">无</div>';
        }
        // Dead tab
        const allDead = [...deadUnavail, ...deadList];
        if (allDead.length > 0) {
            let dHtml = '';
            allDead.forEach(c => {
                let statusClass = 'natural';
                let statusText = '已故';
                if (c.exitStatus === 'killed') { statusClass = 'exiled'; statusText = '被杀'; }
                else if (c.exitStatus === 'retired') { statusClass = 'retired'; statusText = '隐退'; }
                dHtml += `<div class="unavailable-entry"${c.exitStatus ? ' style="cursor:pointer;"' : ''}>
                    <span class="name">${c.name}</span>
                    <span class="status ${statusClass}">${statusText}</span>
                    <button class="hist-btn" onclick="showDeadDetail(${c.id})" title="查看详情">📋</button>
                </div>`;
            });
            deadEl.innerHTML = dHtml;
        } else {
            deadEl.innerHTML = '<div style="color:#555;font-size:0.75rem;padding:4px 0;">无</div>';
        }
    }
}

function conquerTarget(targetId) {
    const target = G.mapData.targets.find(t => t.id === targetId);
    if (!target || target.conquered) return;

    const actor = G.chars.find(c => c.id === actingCharId);
    if (!actor) { alert('请先选择一个角色。'); return; }
    if (actor.profession !== '皇帝' && actor.profession !== '将军') {
        alert('只有皇帝或将军可以发起进攻。');
        return;
    }
    if (actor._actedThisYear) {
        alert('该角色今年已行动。');
        return;
    }

    const cost = 30;
    if (actor.wel < cost) {
        alert(`财产不足（需要 ${cost} 财）。`);
        return;
    }

    const mil = G.organization.current.mil || 0;
    const roll = ch(mil);
    let resultHtml = '';

    if (roll >= 1) {
        target.conquered = true;
        actor.wel -= cost;
        resultHtml = `<span class="success">[征服]</span> ${actor.name} 成功征服 ${target.name}！`;

        const allConquered = G.mapData.targets.every(t => t.conquered);
        if (allConquered && G.organization.current.lvl < 5) {
            G.organization.current.lvl += 1;
            resultHtml += `<br><span class="extreme">[升级]</span> 全境统一！${getStateName(G.organization.current.lvl)} 建立！`;
            addLog(resultHtml);
            showActionResult(resultHtml);
            finalizeCharAction(actor);
            renderMap();
            renderOrganization();
            return;
        }
    } else {
        actor.wel -= cost;
        resultHtml = `<span class="fail">[征服]</span> ${actor.name} 进攻 ${target.name} 失败（损失 ${cost} 财）。`;
    }

    addLog(resultHtml);
    showActionResult(resultHtml);
    finalizeCharAction(actor);
    renderMap();
    renderOrganization();
}

function showUnavailableDetail(charId) {
    const c = (G.unavailableChars || []).find(x => x.id === charId);
    if (!c) return;
    document.getElementById('charDetailTitle').textContent = `${c.name} 详细`;
    document.getElementById('charDetailContent').innerHTML = renderDetailPanel(c, false);
    document.getElementById('charDetailOverlay').style.display = 'flex';
}

function showDeadDetail(charId) {
    const c = (G.deadChars || []).find(x => x.id === charId) || (G.unavailableChars || []).find(x => x.id === charId && x.exitStatus);
    if (!c) return;
    document.getElementById('charDetailTitle').textContent = `${c.name} 详细`;
    document.getElementById('charDetailContent').innerHTML = renderDetailPanel(c, false);
    document.getElementById('charDetailOverlay').style.display = 'flex';
}

function showUnavailableDetail(charId) {
    const c = (G.unavailableChars || []).find(x => x.id === charId);
    if (!c) return;
    document.getElementById('charDetailTitle').textContent = `${c.name} 详细`;
    document.getElementById('charDetailContent').innerHTML = renderDetailPanel(c, false);
    document.getElementById('charDetailOverlay').style.display = 'flex';
}

let charListTab = 'free';

function renderCharList() {
    const container = document.getElementById('charList');
    container.innerHTML = '';

    document.querySelectorAll('#charListTabs .char-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === charListTab);
    });

    if (charListTab === 'free') {
        renderFreeChars(container);
    } else {
        renderWorkerChars(container);
    }
}

function renderFreeChars(container) {
    const EXIT_LABELS = { natural:'寿终', killed:'被杀', retired:'隐退', exiled:'流放' };
    const aliveChars = G.chars.filter(c => !c.isDead);
    const keyLabels = 'abcdefghijklmnopqrstuvwxyz';

    const autoWorkProfessions = ['学者','艺人','劳工','士兵','普侍'];
    G.chars.forEach(c => {
        if (autoWorkProfessions.includes(c.profession)) return;
        const exited = !!c.exitStatus;
        const aliveIdx = aliveChars.indexOf(c);
        const keyChar = aliveIdx >= 0 && aliveIdx < 26 ? keyLabels[aliveIdx] : null;
        const entry = document.createElement('div');
        const actedThisYear = c._actedThisYear;
        entry.className = 'char-entry' + (exited ? ' dead' : '') + (actingCharId === c.id ? ' active' : '') + (actedThisYear ? ' acted' : '');
        entry.innerHTML = `
            <div>
                ${keyChar ? `<span class="key-badge">${keyChar}</span>` : ''}
                <span class="name">${c.name} ${c.gender === 'm' ? '♂' : '♀'}</span>
                <span class="age">${c.age}岁</span>
                <span class="profession-tag">[${c.profession}]</span>
                <span class="class-tag" style="color:${CLASS_COLORS[charClass(c)]||'#a0a0b0'};font-size:0.75rem;margin-left:4px;">[${charClass(c)}]</span>
                ${c.id === G.leaderId ? '<span class="leader-tag">领袖</span>' : ''}
                <span class="status-tag ${exited ? 'dead' : 'alive'}">${EXIT_LABELS[c.exitStatus] || (c.isDead ? '已死' : '存活')}</span>
                ${actedThisYear ? '<span class="acted-tag" style="color:#888;font-size:0.7rem;margin-left:4px;">[已行动]</span>' : ''}
                ${c.married && c.spouseId !== null ? `<span style="color:#f48fb1;font-size:0.8rem;margin-left:6px;">💍 ${G.chars.find(s => s.id === c.spouseId)?.name || '未知'}</span>` : ''}
            </div>
            <div class="stats-desc">
                ${(() => {
                    const sorted = STAT_KEYS.map(k => ({ key: k, val: c[k] })).sort((a, b) => b.val - a.val);
                    const top3 = sorted.slice(0, 3).map(s => `<span style="color:${statColor(s.key, c)}">${STAT_LABELS[s.key]}:${statDesc(s.key, s.val)}</span>`).join('');
                    const bot3 = sorted.slice(-3).map(s => `<span style="color:${statColor(s.key, c)}">${STAT_LABELS[s.key]}:${statDesc(s.key, s.val)}</span>`).join('');
                    return `<div style="display:flex;gap:4px;flex-wrap:wrap;">${top3}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:1px;">${bot3}</div>`;
                })()}
            </div>
            <div class="stats-mini" style="color:#8888a0;margin-top:2px;font-size:0.65rem;opacity:0.75;">
                ${c.parents && c.parents.length > 0 ? `<span>父母:${getParents(c).map(p=>p.name).join('/')}</span>` : ''}
                ${c.children && c.children.length > 0 ? `<span>后代:${getChildren(c).map(p=>p.name).join('/')}</span>` : ''}
                ${c.grandparents && c.grandparents.length > 0 ? `<span>祖辈:${getGrandparents(c).map(p=>p.name).join('/')}</span>` : ''}
                ${c.lovers && c.lovers.length > 0 ? `<span>情人:${c.lovers.map(id=>findCharById(id)?.name||'?').join('/')}</span>` : ''}
            </div>
        `;
        if (!c.exitStatus && !c.isDead) {
            entry.style.cursor = 'pointer';
            entry.addEventListener('click', () => selectChar(c.id));
        }
        entry.addEventListener('dblclick', () => showCharDetail(c));
        container.appendChild(entry);
    });
}

function renderWorkerChars(container) {
    const autoWorkProfessions = ['学者','艺人','劳工','士兵','普侍'];
    const IMPORTANT_STATS = { 学者:'int', 艺人:'cha', 劳工:'sta', 士兵:'psq', 监工:'sta', 将军:'psq', 普侍:'sex' };
    const workers = G.chars.filter(c => !c.isDead && !c.exitStatus && autoWorkProfessions.includes(c.profession));

    const groups = {};
    workers.forEach(c => {
        if (!groups[c.profession]) groups[c.profession] = [];
        groups[c.profession].push(c);
    });

    autoWorkProfessions.forEach(prof => {
        const list = groups[prof];
        if (!list || list.length === 0) return;

        const statKey = IMPORTANT_STATS[prof];
        const statLabel = STAT_LABELS[statKey];

        const group = document.createElement('div');
        group.className = 'worker-group collapsed';

        let bodyHtml = '';
        list.forEach(c => {
            const actedThisYear = c._actedThisYear;
            const active = actingCharId === c.id;
            const sVal = c[statKey] || 0;
            const s評語 = statDesc(statKey, sVal);
            const sColor = statColor(statKey, c);
            bodyHtml += `<div class="worker-entry${actedThisYear ? ' acted' : ''}${active ? ' active' : ''}" data-id="${c.id}">
                <span class="w-name">${c.name} ${c.gender === 'm' ? '♂' : '♀'}</span>
                <span class="w-age">${c.age}岁</span>
                <span class="w-class" style="color:${CLASS_COLORS[charClass(c)]||'#a0a0b0'}">[${charClass(c)}]</span>
                <span class="w-stat" style="color:${sColor}">${statLabel}:${s評語}</span>
            </div>`;
        });

        group.innerHTML = `
            <div class="worker-group-header">
                <span class="worker-group-title">[${prof}]</span>
                <span class="worker-group-count">${list.length}人</span>
                <span class="worker-group-arrow">▶</span>
            </div>
            <div class="worker-group-body">${bodyHtml}</div>
        `;

        group.querySelector('.worker-group-header').addEventListener('click', () => {
            group.classList.toggle('collapsed');
        });

        group.querySelectorAll('.worker-entry').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                selectChar(parseInt(el.dataset.id));
            });
            const cData = G.chars.find(ch => ch.id === parseInt(el.dataset.id));
            if (cData) {
                el.addEventListener('dblclick', () => showCharDetail(cData));
            }
        });

        container.appendChild(group);
    });
}

function switchCharTab(tab) {
    charListTab = tab;
    renderCharList();
}

function showCharDetail(c, inHistory) {
    document.getElementById('charDetailTitle').textContent = `${c.name} 详细`;
    document.getElementById('charDetailContent').innerHTML = renderDetailPanel(c, inHistory);
    document.getElementById('charDetailOverlay').style.display = 'flex';
}

function closeCharDetail() {
    document.getElementById('charDetailOverlay').style.display = 'none';
}

function closeTargetDetail() {
    document.getElementById('targetDetailOverlay').style.display = 'none';
}

function handleConquestSuccess(cq, t, resultType) {
    t.conquered = true;
    const allAdmin = G.mapData.targets.filter(x => x.type === 'admin').every(x => x.conquered);
    let msg = `<span style="color:#ffd700;font-size:1.1em;">[征服成功]</span> ${t.name} 被征服！（${resultType}）`;
    if (allAdmin && G.organization.current.lvl < 5) {
        G.organization.current.lvl += 1;
        const newName = getStateName(G.organization.current.lvl);
        msg += `<br><span class="extreme">[升级]</span> 全境统一！${newName} 建立！`;
        addLog(msg);
        showActionResult(msg);
        if (G.organization.current.lvl === 1) {
            showVictoryScreen(newName);
        }
    } else {
        addLog(msg);
        showActionResult(msg);
    }
    renderMap();
    renderOrganization();
    refreshActionPanelTabs();
}

function showVictoryScreen(stateName) {
    const overlay = document.createElement('div');
    overlay.id = 'victoryOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    const win = document.createElement('div');
    win.style.cssText = 'background:#1a1a2e;padding:40px;border-radius:12px;min-width:360px;text-align:center;border:2px solid #ffd700;box-shadow:0 0 40px rgba(255,215,0,0.3);';
    win.innerHTML = `
        <div style="font-size:28px;font-weight:bold;color:#ffd700;margin-bottom:20px;">${stateName}成立了！</div>
        <div style="font-size:16px;color:#e0e0e0;margin-bottom:12px;">做的不错！</div>
        <div style="font-size:14px;color:#888;margin-bottom:30px;">请期待后续更新！</div>
        <div style="font-size:48px;color:#ffd700;margin-bottom:20px;">🏆</div>
        <button onclick="document.getElementById('victoryOverlay').remove()" style="background:#e94560;color:#fff;border:none;padding:10px 30px;border-radius:6px;cursor:pointer;font-size:16px;">继续游戏</button>
    `;
    overlay.appendChild(win);
    document.body.appendChild(overlay);
}

// ---- 征服系统 ----

function canStartConquest() {
    if ((G._conquests || []).some(c => c.status === 'active')) return false;
    const autoWork = ['学者','艺人','劳工','士兵','普侍'];
    const free = G.chars.filter(c => !c.isDead && !c._actedThisYear && !autoWork.includes(c.profession));
    const emperorOk = free.some(c => c.id === G.leaderId);
    const ministerOk = free.some(c => ['正宫','宰相','监工','将军'].includes(c.profession));
    return free.length >= 3 && emperorOk && ministerOk;
}

function selectMapTarget(targetId) {
    window._selectedTargetId = targetId;
    const t = G.mapData.targets.find(x => x.id === targetId);
    const actionEl = document.getElementById('mapAction');
    if (!actionEl) return;

    const existing = (G._conquests || []).find(c => c.targetId === targetId);
    const isConquering = existing && existing.status === 'active';

    let html = `<div style="font-size:0.75rem;color:#e0e0e0;margin-bottom:6px;">选中: ${t.name}</div>`;
    if (t.conquered) {
        html += `<span style="color:#66bb6a;font-size:0.75rem;">已占领</span>`;
    } else if (isConquering) {
        html += renderConquestStatus(existing, t);
    } else if (!canStartConquest()) {
        html += `<span style="color:#888;font-size:0.75rem;">条件不足：需要皇帝空闲、至少一位重臣以及其他共3名可行动角色</span>`;
    } else {
        html += `<button onclick="startConquest('${targetId}')" style="background:#e94560;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;font-size:0.75rem;">征服</button>`;
    }
    actionEl.innerHTML = html;
    actionEl.style.display = 'block';

    const container = document.getElementById('mapContent');
    if (container) {
        container.querySelectorAll('.map-target').forEach(el => el.style.borderColor = '');
        const sel = container.querySelector(`.map-target[data-id="${targetId}"]`);
        if (sel) sel.style.borderColor = '#e94560';
    }
}

function startConquest(targetId) {
    const t = G.mapData.targets.find(x => x.id === targetId);
    if (!t || t.conquered) return;
    if ((G._conquests || []).some(c => c.status === 'active')) { alert('已有进行中的征服进程。'); return; }
    if (!canStartConquest()) { alert('条件不足。'); return; }
    if (!confirm(`开启对 ${t.name} 的征服进程？征战角色的行动面板将立即改变。`)) return;

    const autoWork = ['学者','艺人','劳工','士兵','普侍'];
    const free = G.chars.filter(c => !c.isDead && !c._actedThisYear && !autoWork.includes(c.profession));

    // Participants: emperor + free 正宫/宰相/监工/将军
    const participants = free.filter(c => c.id === G.leaderId || ['正宫','宰相','监工','将军'].includes(c.profession));

    const duration = d(3);
    if (!G._conquests) G._conquests = [];
    G._conquests.push({
        targetId, startYear: G.time, duration,
        participants: participants.map(c => c.id),
        validated: [],
        status: 'active',
        budget: { tec:100, cul:100, prd:100, pop:100, mil:100, inf:100, tre:100 }
    });

    participants.forEach(c => {
        addLog(`<span style="color:#e94560;">[征服]</span> ${c.name} 加入征服进程（${t.name}，${duration}年内完成）。行动面板已变更。`);
    });
    showActionResult(`<span style="color:#e94560;">[征服]</span> 对 ${t.name} 的征服进程已启动，需在${duration}年内完成。`);
    selectMapTarget(targetId);
    renderMap();
    refreshActionPanelTabs();
}

function renderConquestStatus(cq, t) {
    const remain = cq.startYear + cq.duration - G.time;
    const pNames = cq.participants.map(id => G.chars.find(c => c.id === id)?.name || '?').join('、');
    let h = `<div style="font-size:0.75rem;color:#e94560;">征服进行中 · 剩余${remain}年</div>`;
    h += `<div style="font-size:0.7rem;color:#888;margin:4px 0;">征战: ${pNames}</div>`;
    h += `<div style="font-size:0.65rem;color:#666;margin:2px 0;">详情请查看行动面板的「征服」选项卡</div>`;
    return h;
}

// ---- Action Panel Tabs (conquest mode) ----

function getActiveConquest() {
    return (G._conquests || []).find(c => c.status === 'active');
}

function refreshActionPanelTabs() {
    const cq = getActiveConquest();
    const panel = document.getElementById('actionPanel');
    if (!panel) return;
    let tabBar = document.getElementById('actionTabBar');
    let conquestPanel = document.getElementById('actionConquestPanel');
    if (!cq) {
        if (tabBar) tabBar.remove();
        if (conquestPanel) conquestPanel.remove();
        const content = document.getElementById('actionContent');
        if (content) content.style.display = '';
        return;
    }
    // Ensure tab bar exists
    if (!tabBar) {
        tabBar = document.createElement('div');
        tabBar.id = 'actionTabBar';
        tabBar.style.cssText = 'display:flex;gap:0;border-bottom:1px solid #0f3460;margin-bottom:6px;';
        tabBar.innerHTML = `
            <span class="ap-tab active" data-aptab="action" style="padding:4px 10px;cursor:pointer;font-size:0.75rem;color:#e0e0e0;border-bottom:2px solid #e94560;">行动</span>
            <span class="ap-tab" data-aptab="conquest" style="padding:4px 10px;cursor:pointer;font-size:0.75rem;color:#888;">征服</span>
        `;
        tabBar.querySelectorAll('.ap-tab').forEach(el => {
            el.addEventListener('click', () => switchActionTab(el.dataset.aptab));
        });
        const h3 = panel.querySelector('h3');
        if (h3) h3.after(tabBar);
    }
    // Ensure conquest panel exists
    if (!conquestPanel) {
        conquestPanel = document.createElement('div');
        conquestPanel.id = 'actionConquestPanel';
        conquestPanel.style.display = 'none';
        const content = document.getElementById('actionContent');
        if (content) content.after(conquestPanel);
    }
    const content = document.getElementById('actionContent');
    if (content) content.style.display = '';
    conquestPanel.style.display = 'none';
    // Reset to action tab
    tabBar.querySelectorAll('.ap-tab').forEach(el => {
        if (el.dataset.aptab === 'action') {
            el.style.color = '#e0e0e0';
            el.style.borderBottom = '2px solid #e94560';
        } else {
            el.style.color = '#888';
            el.style.borderBottom = 'none';
        }
    });
    // Refresh conquest content
    const t = cq ? G.mapData.targets.find(x => x.id === cq.targetId) : null;
    if (cq && t) conquestPanel.innerHTML = renderConquestActionTab(cq, t);
}

function switchActionTab(tab) {
    const bar = document.getElementById('actionTabBar');
    if (bar) {
        bar.querySelectorAll('.ap-tab').forEach(el => {
            if (el.dataset.aptab === tab) {
                el.style.color = '#e0e0e0';
                el.style.borderBottom = '2px solid #e94560';
            } else {
                el.style.color = '#888';
                el.style.borderBottom = 'none';
            }
        });
    }
    const content = document.getElementById('actionContent');
    const conquestPanel = document.getElementById('actionConquestPanel');
    if (content) content.style.display = tab === 'action' ? '' : 'none';
    if (conquestPanel) {
        conquestPanel.style.display = tab === 'conquest' ? '' : 'none';
        if (tab === 'conquest') {
            const cq = getActiveConquest();
            const t = cq ? G.mapData.targets.find(x => x.id === cq.targetId) : null;
            if (cq && t) conquestPanel.innerHTML = renderConquestActionTab(cq, t);
        }
    }
}

function renderConquestActionTab(cq, t) {
    const remain = cq.startYear + cq.duration - G.time;
    const pNames = cq.participants.map(id => G.chars.find(c => c.id === id)?.name || '?').join('、');
    let h = `<div style="font-size:0.75rem;color:#e94560;">征服进行中 · 剩余${remain}年</div>`;
    h += `<div style="font-size:0.7rem;color:#888;margin:4px 0;">征战: ${pNames}</div>`;
    const keys = CONQUEST_KEYS[t.name] || [];
    const validatedIdx = cq.validated.map(v => v.condIdx);
    const unverifiedKeys = keys.filter(i => !validatedIdx.includes(i));
    h += `<div style="font-size:0.7rem;color:#aaa;margin:6px 0;">关键条件待验证: ${unverifiedKeys.length}条</div>`;
    // Budget display
    const budget = cq.budget || { tec:100, cul:100, prd:100, pop:100, mil:100, inf:100, tre:100 };
    const bLabels = { tec:'科技', cul:'文化', prd:'生产', pop:'人口', mil:'军事', inf:'民心', tre:'银库' };
    h += `<div style="font-size:0.65rem;color:#666;margin:4px 0;">剩余权重: ${Object.keys(budget).map(k => `<span style="color:${budget[k]<=0?'#444':'#888'}">${bLabels[k]}${budget[k]}%</span>`).join(' ')}</div>`;
    CONQUEST_CONDS.forEach((cond, i) => {
        const done = validatedIdx.includes(i);
        const isKey = keys.includes(i);
        const v = done ? cq.validated.find(x => x.condIdx === i) : null;
        const color = done ? (v && v.success ? '#66bb6a' : '#e94560') : (isKey ? '#e0e0e0' : '#888');
        const deco = done ? 'line-through' : 'none';
        h += `<div style="display:flex;align-items:center;gap:4px;font-size:0.7rem;margin:2px 0;color:${color};text-decoration:${deco};">`;
        if (done) {
            h += `<span style="width:16px;">${v && v.success ? '✓' : '✗'}</span>`;
        } else {
            h += `<span style="width:16px;"></span>`;
        }
        h += `${isKey ? '★' : '·'} ${cond.name}`;
        if (!done) {
            h += ` <button onclick="verifySingleCondition(${i})" style="margin-left:auto;background:#e94560;color:#fff;border:none;padding:1px 8px;border-radius:3px;cursor:pointer;font-size:0.65rem;">验证</button>`;
        }
        h += `</div>`;
    });
    return h;
}

function verifySingleCondition(condIdx) {
    const cq = getActiveConquest();
    if (!cq) return;
    const t = G.mapData.targets.find(x => x.id === cq.targetId);
    if (!t) return;
    const cond = CONQUEST_CONDS[condIdx];
    const panel = document.getElementById('actionConquestPanel');
    if (!panel) return;

    const attrFields = ['tec','cul','prd','pop','mil','inf','tre'];
    const attrLabels = { tec:'科技', cul:'文化', prd:'生产', pop:'人口', mil:'军事', inf:'民心', tre:'银库' };
    let weights = {};
    attrFields.forEach(f => weights[f] = 0);
    const budget = cq.budget || { tec:100, cul:100, prd:100, pop:100, mil:100, inf:100, tre:100 };
    const org = G.organization.current;

    let html = `<div style="color:#e0e0e0;font-size:15px;font-weight:bold;margin-bottom:8px;">验证条件: ${cond.name}</div>`;
    html += `<div style="color:#888;font-size:0.7rem;margin-bottom:6px;">分配权重（每项最大值=${budget[cond.field]}%，总计≤100%）</div>`;
    attrFields.forEach(f => {
        const maxVal = Math.max(0, budget[f] || 0);
        const depleted = maxVal <= 0;
        html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
            <span style="color:${depleted?'#444':'#aaa'};font-size:0.75rem;width:50px;">${attrLabels[f]}</span>
            <input type="range" min="0" max="${Math.max(1,maxVal)}" step="5" value="0" data-attr="${f}" style="flex:1;${depleted?'opacity:0.3;':''}" ${depleted?'disabled':''} oninput="document.getElementById('iw_${f}').textContent=this.value+'%'">
            <span id="iw_${f}" style="color:${depleted?'#444':'#e0e0e0'};font-size:0.75rem;width:40px;text-align:right;">0%</span>
        </div>`;
    });
    html += `<div style="color:#888;font-size:0.7rem;margin:6px 0;">总权重: <span id="itotalW">0</span>%</div>`;
    html += `<div id="iweightErr" style="color:#e94560;font-size:0.7rem;display:none;">总权重超过100%</div>`;
    html += `<div style="margin:8px 0;padding:6px;background:#0f3460;border-radius:4px;font-size:0.75rem;text-align:center;">
        <span style="color:#66bb6a;">玩家 <span id="livePlayerCheck">-</span></span>
        <span style="color:#888;"> vs </span>
        <span style="color:#e94560;">对手 <span id="liveOppCheck">-</span></span>
    </div>`;
    html += `<div style="font-size:0.6rem;color:#666;margin-bottom:4px;text-align:center;">基础检定值（不含军事/民心/天命随机修正）</div>`;
    html += `<div style="text-align:center;margin-top:10px;">
        <button id="iconfirmValBtn" style="background:#e94560;color:#fff;border:none;padding:4px 14px;border-radius:4px;cursor:pointer;font-size:0.75rem;">确认验证</button>
        <button onclick="cancelInlineValidation()" style="margin-left:6px;background:transparent;color:#aaa;border:1px solid #555;padding:4px 14px;border-radius:4px;cursor:pointer;font-size:0.75rem;">取消</button>
    </div>`;
    panel.innerHTML = html;

    const inputs = panel.querySelectorAll('input[type=range]');
    const updateLive = () => {
        let total = 0;
        inputs.forEach(i => { weights[i.dataset.attr] = parseInt(i.value) || 0; total += weights[i.dataset.attr]; });
        document.getElementById('itotalW').textContent = total;
        document.getElementById('iweightErr').style.display = total > 100 ? '' : 'none';
        document.getElementById('iconfirmValBtn').disabled = total > 100;
        if (total > 0) {
            const live = computeConquestChecks(org, t, condIdx, weights);
            document.getElementById('livePlayerCheck').textContent = live.playerCheck;
            document.getElementById('liveOppCheck').textContent = live.opponentCheck;
        } else {
            document.getElementById('livePlayerCheck').textContent = '-';
            document.getElementById('liveOppCheck').textContent = '-';
        }
    };
    inputs.forEach(inp => inp.addEventListener('input', updateLive));
    document.getElementById('iconfirmValBtn').onclick = () => {
        let total = 0;
        inputs.forEach(i => { weights[i.dataset.attr] = parseInt(i.value) || 0; total += weights[i.dataset.attr]; });
        if (total > 100) { alert('总权重不可超过100%'); return; }
        doConquestValidation(cq, t, condIdx, weights);
    };
}

function computeConquestChecks(org, t, condIdx, weights) {
    const cond = CONQUEST_CONDS[condIdx];
    const oppField = cond.field;
    let playerScore = 0;
    const orgFields = { tec:'tec', cul:'cul', prd:'prd', pop:'pop', mil:'mil', inf:'inf', tre:'btre' };
    Object.keys(weights).forEach(f => {
        const w = weights[f] / 100;
        let val = 0;
        if (f === 'tre') val = org.btre || 0;
        else val = (org[f] || 0);
        playerScore += val * w;
    });
    const opponentScore = t[oppField] || 0;
    const total = playerScore + opponentScore;
    if (total <= 0) return { playerCheck: 0, opponentCheck: 0, playerScore: 0, opponentScore: 0, total: 0 };

    const pct = playerScore / total;
    const playerBase = Math.max(10, Math.min(190, Math.floor(pct * 200)));
    const opponentBase = Math.max(10, Math.min(190, 200 - playerBase));

    return { playerCheck: playerBase, opponentCheck: opponentBase, playerScore, opponentScore, total };
}

function cancelInlineValidation() {
    const cq = getActiveConquest();
    const t = cq ? G.mapData.targets.find(x => x.id === cq.targetId) : null;
    const panel = document.getElementById('actionConquestPanel');
    if (panel && cq && t) panel.innerHTML = renderConquestActionTab(cq, t);
}

function doConquestValidation(cq, t, condIdx, weights) {
    const cond = CONQUEST_CONDS[condIdx];
    const org = G.organization.current;

    const checks = computeConquestChecks(org, t, condIdx, weights);
    const playerBase = checks.playerCheck;
    const opponentBase = checks.opponentCheck;
    const opponentScore = checks.opponentScore;
    let playerScore = checks.playerScore;
    const total = checks.total;

    const oppMdt = targetTiantian(t);

    // Apply mil/inf/mdt random modifiers
    const orgMil = org.mil || 0;
    const orgInf = org.inf || 0;
    const playerMdt = org.mdt || 0;
    const oppMil = t.mil || 0;
    const oppInf = t.inf || 0;

    let playerMod = 0, oppMod = 0;
    if (orgMil > oppMil) oppMod -= d(10);
    if (orgInf > oppInf) playerMod -= d(10);
    if (playerMdt > oppMdt) { oppMod += d(20); }

    const finalPlayerCheck = Math.max(1, playerBase + playerMod);
    const finalOppCheck = Math.max(1, opponentBase + oppMod);

    // Contest
    const playerResult = ch(finalPlayerCheck);
    const oppResult = ch(finalOppCheck);
    const diff = playerResult - oppResult;
    let success;
    if (diff > 0) success = true;
    else if (diff < 0) success = false;
    else {
        const playerTiantian = org.mdt || 0;
        success = playerTiantian >= oppMdt;
    }

    // Deduct weights from budget
    if (!cq.budget) cq.budget = { tec:100, cul:100, prd:100, pop:100, mil:100, inf:100, tre:100 };
    Object.keys(weights).forEach(f => {
        cq.budget[f] = Math.max(0, (cq.budget[f] || 0) - (weights[f] || 0));
    });

    cq.validated.push({ condIdx, success, playerScore, opponentScore, total, playerCheck:finalPlayerCheck, opponentCheck:finalOppCheck, playerResult, oppResult });

    // Always log individual validation result
    addLog(`<span class="info">[验证]</span> ${cond.name} 验证${success ? '成功' : '失败'}（玩家${finalPlayerCheck} vs 对手${finalOppCheck}，差值${diff}）。`);

    // Only evaluate victory when ALL conditions are validated
    const allValidated = cq.validated.length >= CONQUEST_CONDS.length;
    if (allValidated) {
        const vResult = checkConquestFinal(cq, t);
        if (vResult === 'victory') {
            cq.status = 'success';
            handleConquestSuccess(cq, t, '胜利');
        } else {
            cq.status = 'fail';
            addLog(`<span style="color:#e94560;">[征服失败]</span> 对 ${t.name} 的征服进程失败——所有条件已验证但未达胜利标准。`);
        }
    }
    selectMapTarget(cq.targetId);
    renderMap();
    refreshActionPanelTabs();
}

function checkConquestFinal(cq, t) {
    const keys = CONQUEST_KEYS[t.name] || [];
    const validatedIdx = cq.validated.map(v => v.condIdx);
    const unverifiedKeys = keys.filter(i => !validatedIdx.includes(i));
    
    const keySuccess = cq.validated.filter(v => keys.includes(v.condIdx) && v.success).length;
    const keyFailed = cq.validated.filter(v => keys.includes(v.condIdx) && !v.success).length;
    const nonKeyFailed = cq.validated.filter(v => !keys.includes(v.condIdx) && !v.success).length;
    const totalSuccess = cq.validated.filter(v => v.success).length;

    if (unverifiedKeys.length === 0) {
        if (keySuccess === keys.length && totalSuccess >= 4) return 'victory';
    }
    if (unverifiedKeys.length <= 1) {
        if (keyFailed <= 1 && nonKeyFailed <= 1) return 'victory';
    }
    return 'fail';
}

function processConquests() {
    if (!G._conquests) G._conquests = [];
    G._conquests.forEach(cq => {
        if (cq.status !== 'active') return;
        const t = G.mapData.targets.find(x => x.id === cq.targetId);
        if (!t) { cq.status = 'fail'; return; }

        const org = G.organization.current;
        const playerMdt = org.mdt || 0;
        const oppMdt = targetTiantian(t);

        // Player mil > opponent mil: opponent conds -1d10
        if ((org.mil||0) > (t.mil||0)) {
            // applied in validation, no yearly effect needed
        }
        // Player inf > opponent inf: player conds -1d10
        if ((org.inf||0) > (t.inf||0)) {
            // applied in validation
        }
        // Player mdt > opponent mdt: opponent attrs 20% -1d10 each
        if (playerMdt > oppMdt) {
            ['tec','cul','prd','pop','mil','inf','tre'].forEach(f => {
                if (Math.random() < 0.2) {
                    const loss = d(10);
                    t[f] = Math.max(0, (t[f]||0) - loss);
                }
            });
        }

        // Check expiry
        if (G.time >= cq.startYear + cq.duration) {
            const result = checkConquestFinal(cq, t);
            if (result === 'victory') {
                cq.status = 'success';
                handleConquestSuccess(cq, t, '胜利');
            } else {
                cq.status = 'fail';
                addLog(`<span style="color:#e94560;">[征服失败]</span> 对 ${t.name} 的征服进程超时失败。`);
                renderMap();
                refreshActionPanelTabs();
            }
        }
    });
}

// 征服角色行动限制（在 getActionsForAge 过滤时使用）
function isConquestParticipant(c) {
    return (G._conquests || []).some(cq =>
        cq.status === 'active' && cq.participants.includes(c.id)
    );
}

// 征服角色禁止流放/归隐；死亡时移出列表
function handleConquestDeath(charId) {
    (G._conquests || []).forEach(cq => {
        if (cq.status !== 'active') return;
        const idx = cq.participants.indexOf(charId);
        if (idx >= 0) cq.participants.splice(idx, 1);
    });
}

function renderLifeEvents(c) {
    if (!c.lifeEvents || c.lifeEvents.length === 0) return '';
    const events = [...c.lifeEvents].sort((a, b) => a.year - b.year);
    const entryYear = events[0].year;
    const birthYear = entryYear - (c.entryAge !== undefined ? c.entryAge : 0);

    let html = '<div class="life-events"><div class="detail-section-title">📜生平</div>';
    html += `<div class="life-birth">出生年份: ${birthYear}年`;
    if (c.entryAge > 0) html += `（${c.entryAge}岁入场）`;
    html += '</div>';

    for (const ev of events) {
        const icon = LIFE_EVENT_ICONS[ev.type] || '';
        const age = ev.year - birthYear;
        html += `<div class="life-event"><span class="life-year">[纪元${ev.year}]</span><span class="life-age">${age}岁</span><span class="life-icon">${icon}</span><span class="life-desc">${ev.desc}</span></div>`;
    }

    html += '</div>';
    return html;
}

function renderDetailPanel(c, inHistory) {
    const streakHtml = `
        <div class="detail-streaks">
            <span>科学连击:${c.scienceStreak}yr</span>
            <span>艺术连击:${c.artStreak}yr</span>
            <span>劳动连击:${c.laborStreak}yr</span>
            <span>求偶连击:${c.datingStreak}yr</span>
            <span>出轨连击:${c.marriedDatingStreak}yr</span>
            <span>科学累计:${c.history.science}yr</span>
            <span>艺术累计:${c.history.art}yr</span>
            <span>劳动累计:${c.history.labor}yr</span>
            <span>锻炼累计:${c.history.exercise}yr</span>
        </div>
    `;

    const statHtml = STAT_KEYS.map(k =>
        `<span><span class="stat-label">${STAT_LABELS[k]}:</span> <span class="stat-val">${c[k]}</span></span>`
    ).join('');

    return `
        <div class="detail-header">${c.name} ${c.gender === 'm' ? '♂' : '♀'} ${c.age}岁</div>
        <div class="detail-tags">
            <span class="profession-tag">[${c.profession}]</span>
            <span class="class-tag" style="color:${CLASS_COLORS[charClass(c)]}">[${charClass(c)}]</span>
            ${c.married && c.spouseId !== null ? `<span>💍 ${findCharById(c.spouseId)?.name || '未知'}</span>` : ''}
            ${c.id === G.leaderId ? '<span class="leader-tag">领袖</span>' : ''}
        </div>
        <div class="detail-life" style="font-size:0.75rem;color:#8888a0;margin-bottom:6px;">
            <span>入场年龄: ${c.entryAge !== undefined ? c.entryAge : '?'}岁</span>
            ${c.exitYear !== null ? `<span style="margin-left:12px;">离场: 纪元${c.exitYear}年（${c.age}岁）</span>` : ''}
        </div>
        <div class="detail-stats">${statHtml}</div>
        ${streakHtml}
        <div class="detail-lineage">
            ${c.parents && c.parents.length > 0 ? `<span>父母: ${getParents(c).map(p=>p.name).join(' / ')}</span><br>` : ''}
            ${c.children && c.children.length > 0 ? `<span>子女: ${getChildren(c).map(p=>p.name).join(' / ')}</span><br>` : ''}
            ${c.grandparents && c.grandparents.length > 0 ? `<span>祖辈: ${getGrandparents(c).map(p=>p.name).join(' / ')}</span><br>` : ''}
            ${c.lovers && c.lovers.length > 0 ? `<span>情人: ${c.lovers.map(id => findCharById(id)?.name || '?').join(' / ')}</span>` : ''}
        </div>
        ${inHistory ? renderLifeEvents(c) : ''}
        ${inHistory
            ? `<div style="margin-top:10px;text-align:center;display:flex;gap:6px;justify-content:center;">
                <button onclick="removeFromHistorical(${c.id})">移出历史</button>
                <button onclick="exportBiography(${c.id})">导出生平</button>
               </div>`
            : c.exitStatus
                ? `<div style="margin-top:10px;text-align:center;"><button onclick="moveToHistorical(${c.id})">移入历史人物</button></div>`
                : ''}
    `;
}

function moveToHistorical(charId) {
    let c = G.chars.find(c => c.id === charId);
    let src = 'chars';
    if (!c) {
        c = (G.unavailableChars || []).find(c => c.id === charId);
        src = 'unavailable';
    }
    if (!c) {
        c = (G.deadChars || []).find(c => c.id === charId);
        src = 'dead';
    }
    if (!c || !c.exitStatus) return;
    G.historicalFigures.push(c);
    if (src === 'chars') {
        const idx = G.chars.indexOf(c);
        G.chars.splice(idx, 1);
    } else if (src === 'unavailable') {
        const idx = G.unavailableChars.indexOf(c);
        G.unavailableChars.splice(idx, 1);
    } else {
        const idx = G.deadChars.indexOf(c);
        G.deadChars.splice(idx, 1);
    }
    closeCharDetail();
    renderGame();
    addLog(`<span class="info">[历史]</span> ${c.name} 被移入历史人物。`);
}

function removeFromHistorical(charId) {
    const idx = G.historicalFigures.findIndex(c => c.id === charId);
    if (idx === -1) return;
    G.historicalFigures.splice(idx, 1);
    closeCharDetail();
    closeHistory();
    renderGame();
    addLog(`<span class="info">[历史]</span> 已移除历史人物。`);
}

function exportBiography(charId) {
    const c = (G.historicalFigures || []).find(x => x.id === charId);
    if (!c) return;
    const exitLabel = c.exitStatus === 'natural' ? '寿终正寝' : c.exitStatus === 'killed' ? '被杀' : c.exitStatus === 'retired' ? '隐退' : c.exitStatus === 'exiled' ? '流放' : '离场';
    const birthYear = c.entryAge !== undefined ? (c.exitYear || 0) - c.age : '?';
    let text = `姓名: ${c.name}\n`;
    text += `性别: ${c.gender === 'm' ? '男' : '女'}\n`;
    text += `职业: ${c.profession}\n`;
    text += `出生年份: ${birthYear}年\n`;
    text += `入场年龄: ${c.entryAge !== undefined ? c.entryAge + '岁' : '?'}\n`;
    text += `离场: 纪元${c.exitYear}年（${c.age}岁），${exitLabel}\n`;
    text += `\n属性:\n`;
    STAT_KEYS.forEach(k => { text += `  ${STAT_LABELS[k]}: ${c[k] || 0}\n`; });
    if (c.parents && c.parents.length > 0) {
        text += `\n父母: ${c.parents.map(id => findCharById(id)?.name || '?').join(' / ')}\n`;
    }
    if (c.children && c.children.length > 0) {
        text += `子女: ${c.children.map(id => findCharById(id)?.name || '?').join(' / ')}\n`;
    }
    if (c.lovers && c.lovers.length > 0) {
        text += `情人: ${c.lovers.map(id => findCharById(id)?.name || '?').join(' / ')}\n`;
    }
    if (c.lifeEvents && c.lifeEvents.length > 0) {
        const startYear = c.lifeEvents.reduce((min, e) => Math.min(min, e.year), Infinity);
        text += `\n生平:\n`;
        const sorted = [...c.lifeEvents].sort((a, b) => a.year - b.year);
        sorted.forEach(ev => {
            const age = ev.year - (startYear - (c.entryAge || 0));
            text += `  纪元${ev.year}年（${age}岁）${ev.desc}\n`;
        });
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${c.name}_生平.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function restoreFromHistorical(charId) {
    const idx = G.historicalFigures.findIndex(c => c.id === charId);
    if (idx === -1) return;
    const c = G.historicalFigures[idx];
    G.historicalFigures.splice(idx, 1);
    G.chars.push(c);
    closeHistory();
    renderGame();
    addLog(`${c.name} 已从历史人物中恢复。`);
}

function openHistory() {
    document.getElementById('historyOverlay').style.display = 'flex';
    renderHistoricalPanel();
}

function closeHistory() {
    document.getElementById('historyOverlay').style.display = 'none';
}

function renderHistoricalPanel() {
    const container = document.getElementById('historyContent');
    let html = '';
    if (!G.historicalFigures || G.historicalFigures.length === 0) {
        html = '<div style="color:#888;padding:12px;">暂无历史人物。</div>';
    } else {
        G.historicalFigures.forEach(c => {
            const exitLabel = c.exitStatus === 'natural' ? '寿终' : c.exitStatus === 'killed' ? '被杀' : c.exitStatus === 'retired' ? '隐退' : c.exitStatus === 'exiled' ? '流放' : '离场';
            html += `<div class="char-entry" style="cursor:pointer;">
                <div>
                    <span class="name">${c.name} ${c.gender === 'm' ? '♂' : '♀'}</span>
                    <span class="profession-tag">[${c.profession}]</span>
                    <span class="class-tag" style="color:${CLASS_COLORS[charClass(c)]||'#a0a0b0'};font-size:0.75rem;margin-left:4px;">[${charClass(c)}]</span>
                </div>
                <div class="stats-mini" style="color:#8888a0;margin-top:2px;font-size:0.7rem;">
                    <span>${c.entryAge !== undefined ? c.entryAge : '?'}岁入场</span>
                    <span style="margin-left:12px;">${exitLabel}于纪元${c.exitYear !== null ? c.exitYear : '?'}年（${c.age}岁）</span>
                </div>
            </div>`;
        });
    }
    container.innerHTML = html;
    // Add double-click listener for detail
    Array.from(container.children).forEach((entry, i) => {
        entry.addEventListener('dblclick', () => {
            showCharDetail(G.historicalFigures[i], true);
        });
    });
}

function renderCompactDetail(c) {
    const sorted = STAT_KEYS
        .map(k => ({ key: k, val: c[k] }))
        .sort((a, b) => b.val - a.val);
    const top4 = sorted.slice(0, 4);
    const row1 = top4.slice(0, 2).map(s =>
        `<span style="color:${statColor(s.key, c)};flex:1;">${STAT_LABELS[s.key]}:${statDesc(s.key, s.val)}</span>`
    ).join('');
    const row2 = top4.slice(2, 4).map(s =>
        `<span style="color:${statColor(s.key, c)};flex:1;">${STAT_LABELS[s.key]}:${statDesc(s.key, s.val)}</span>`
    ).join('');

    return `
        <div class="detail-header">${c.name} ${c.gender === 'm' ? '♂' : '♀'} ${c.age}岁</div>
        <div class="detail-tags">
            <span class="profession-tag">[${c.profession}]</span>
            <span class="class-tag" style="color:${CLASS_COLORS[charClass(c)]}">[${charClass(c)}]</span>
            ${c.id === G.leaderId ? '<span class="leader-tag">领袖</span>' : ''}
        </div>
        <div class="detail-top4" style="font-size:0.72rem;margin-top:4px;">
            <div style="display:flex;gap:8px;">${row1}</div>
            <div style="display:flex;gap:8px;margin-top:2px;">${row2}</div>
        </div>
    `;
}

function selectChar(charId) {
    if (yearActionsDone) return;
    const c = G.chars.find(ch => ch.id === charId);
    if (!c || c.isDead || c._actedThisYear) return;

    actingCharId = charId;
    renderCharList();

    const actionContent = document.getElementById('actionContent');

    const isAutoWorkProfession = ['学者','艺人','劳工','士兵','普侍'].includes(c.profession);
    if (isAutoWorkProfession) {
        const label = { 学者:'研究', 艺人:'表演', 劳工:'劳动', 士兵:'训练', 普侍:'服侍' }[c.profession] || '工作';
        const description = {
            学者: '每年自动进行研究，增加科技和国库收入',
            艺人: '每年自动进行表演，增加文化和民心',
            劳工: '每年自动进行劳动，增加生产和国库收入',
            士兵: '每年自动进行训练，增加军事能力',
            普侍: '每年自动进行服侍，增加人口但增加皇帝灾厄和天灾'
        }[c.profession] || '是自动工作角色，无需手动操作。';
        actionContent.innerHTML = `
            <div class="char-detail-box">
                ${renderCompactDetail(c)}
            </div>
            <p id="actionPrompt" style="margin-top:8px;">${c.name} 是${c.profession}，${description}。</p>
            <div id="actionBtns"></div>
        `;
        return;
    }

    actionContent.innerHTML = `
        <div class="char-detail-box">
            ${renderCompactDetail(c)}
        </div>
        <p id="actionPrompt" style="margin-top:8px;">为 ${c.name} 选择行动：</p>
        <div id="actionBtns"></div>
    `;
    const btnContainer = document.getElementById('actionBtns');

    const actions = getActionsForAge(c.age, c)
        .filter(a => a.id !== 'exploit' || c.profession === '皇帝' || c.profession === '正宫')
        .filter(a => a.id !== 'appoint' || c.profession === '皇帝')
        .filter(a => a.id !== 'bestowSurname' || c.profession === '皇帝')
        .filter(a => a.id !== 'transfer' || ((c.wel || 0) >= 5 && (['天子','大臣','储君'].includes(charClass(c)) || c.profession === '正宫')))
        .filter(a => a.id !== 'pursue' || c.profession === '皇帝')
        .filter(a => a.id !== 'propose' || c.profession === '皇帝')
        .filter(a => a.id !== 'governPolicy' || c.profession === '皇帝');
    // 征服角色行动限制
    if (isConquestParticipant(c)) {
        const allowed = c.id === G.leaderId
            ? ['transfer', 'donate', 'nothing']
            : ['transfer', 'nothing'];
        actions.length = 0;
        allowed.forEach(id => {
            const a = getActionsForAge(c.age, c).find(x => x.id === id);
            if (a) actions.push(a);
        });
    }
    // 宰相 has 理政, 执教 and 无所事事
    if (c.profession === '宰相') {
        const allowed = ['govern', 'teach', 'nothing'];
        actions.length = 0;
        if (allowed.includes('govern')) actions.push({ id: 'govern', label: '理政' });
        if (allowed.includes('teach')) actions.push({ id: 'teach', label: '执教' });
        if (allowed.includes('nothing')) actions.push({ id: 'nothing', label: '无所事事' });
    }
    // 休养者 only has limited actions
    if (c.profession === '休养者') {
        const allowed = ['retire', 'rest', 'elderlyCare', 'nothing'];
        actions.length = 0;
        if (allowed.includes('retire')) actions.push({ id: 'retire', label: '隐退' });
        if (allowed.includes('rest')) actions.push({ id: 'rest', label: '养生' });
        if (allowed.includes('elderlyCare')) actions.push({ id: 'elderlyCare', label: '养老' });
        if (allowed.includes('nothing')) actions.push({ id: 'nothing', label: '无所事事' });
    }
    // 监工 has 压榨, 执教 and 无所事事
    if (c.profession === '监工') {
        actions.length = 0;
        actions.push({ id: 'squeeze', label: '压榨' });
        actions.push({ id: 'teach', label: '执教' });
        actions.push({ id: 'nothing', label: '无所事事' });
    }
    // 将军 has 演兵, 执教 and 无所事事
    if (c.profession === '将军') {
        actions.length = 0;
        actions.push({ id: 'drill', label: '演兵' });
        actions.push({ id: 'teach', label: '执教' });
        actions.push({ id: 'nothing', label: '无所事事' });
    }
    actions.forEach(a => {
        const btn = document.createElement('button');
        btn.textContent = a.label;
        btn.addEventListener('click', () => executeAction(c, a.id));
        btnContainer.appendChild(btn);
    });

    document.querySelector('#actionContent .action-result')?.remove();
}

function labelActionBtns() {
}

// Auto-label action buttons when they change
const _actionBtnObserver = new MutationObserver(() => labelActionBtns());
document.addEventListener('DOMContentLoaded', () => {
    const target = document.getElementById('actionBtns');
    if (target) _actionBtnObserver.observe(target, { childList: true, subtree: true });
});

function executeAction(c, actionId) {
    if (c.isDead) return;
    currentActionId = actionId;

    if (needsLaborType(actionId)) {
        showSubAction(c, '劳动类型', [
            { id: 'labor_int', label: '智力劳动', execute: () => labor(c, 1) },
            { id: 'labor_sta', label: '体力劳动', execute: () => labor(c, 2) }
        ], actionId);
        return;
    }
    if (needsPursueType(actionId)) {
        showPursueTargets(c);
        return;
    }
    if (needsProposeType(actionId)) {
        showProposeTargets(c);
        return;
    }
    if (needsExploitType(actionId)) {
        showExploitTargets(c);
        return;
    }
    if (needsTransferType(actionId)) {
        showTransferTargets(c);
        return;
    }
    if (needsAppointType(actionId)) {
        showAppointMenu(c);
        return;
    }
    if (needsBestowSurnameType(actionId)) {
        showBestowSurnameTargets(c);
        return;
    }
    if (needsChildbirthType(actionId)) {
        showChildbirthTargets(c);
        return;
    }
    if (needsExileType(actionId)) {
        if (c.id !== G.leaderId) return;
        showExileTargets(c);
        return;
    }
    if (needsKillType(actionId)) {
        if (c.id !== G.leaderId) return;
        showKillTargets(c);
        return;
    }
    if (needsSummonType(actionId)) {
        if (c.id !== G.leaderId) return;
        showSummonTargets(c);
        return;
    }
    if (needsRetireType(actionId)) {
        executeRetire(c);
        return;
    }
    if (needsAppointHeirType(actionId)) {
        if (c.id !== G.leaderId) return;
        showAppointHeirTargets(c);
        return;
    }
    if (actionId === 'donate') {
        showDonatePrompt(c);
        return;
    }
    if (actionId === 'govern') { showGovernOptions(c); return; }
    if (actionId === 'teach') { showTeachTargets(c); return; }
    if (actionId === 'governPolicy') { showGovernPolicy(c); return; }
    if (actionId === 'squeeze') { showSqueezeOptions(c); return; }
    if (actionId === 'drill') { showDrillOptions(c); return; }

    let resultHtml = '';
    switch (actionId) {
        case 'learnScience': resultHtml = learnScience(c); break;
        case 'learnArt': resultHtml = learnArt(c); break;
        case 'exercise': resultHtml = exercise(c); break;
        case 'rest': resultHtml = rest(c); break;
        case 'elderlyCare': resultHtml = elderlyCare(c); break;
        case 'nothing': resultHtml = nothing(c); break;
    }

    showActionResult(resultHtml);
    finalizeCharAction(c, actionId);
}

function showSubAction(c, title, options, parentActionId) {
    const btnContainer = document.getElementById('actionBtns');
    document.getElementById('actionPrompt').textContent = `${c.name}: 选择${title}`;
    btnContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
            const resultHtml = opt.execute();
            showActionResult(resultHtml);
            finalizeCharAction(c, parentActionId || opt.id);
        });
        btnContainer.appendChild(btn);
    });
    labelActionBtns();
}

function showActionResult(html) {
    const existing = document.querySelector('#actionContent .action-result');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'action-result';
    div.innerHTML = html;
    document.getElementById('actionContent').appendChild(div);
}

function doesActionConsumeTurn(actionId) {
    if (!actionId) return true; // 没有actionId时默认消耗行动次数（向后兼容）
    
    // 以下行动不消耗行动次数
    const noTurnActions = [
        'donate',      // 理财
        'appoint',     // 指派
        'exploit',     // 剥削
        'bestowSurname', // 赐姓
        'retire',      // 隐退
        'exile',       // 流放
        'appointHeir', // 立嗣
        // 招募人才相关行动（需要在具体函数中检查）
    ];
    return !noTurnActions.includes(actionId);
}

function finalizeCharAction(c, actionId) {
    if (checkGameOver()) {
        yearActionsDone = true;
        document.getElementById('actionPrompt').textContent = '游戏结束。';
        document.getElementById('actionBtns').innerHTML = '';
        renderCharList();
        renderGame();
        return;
    }
    
    // 优先使用传入的actionId，否则使用全局currentActionId
    const effectiveActionId = actionId || currentActionId;
    
    // 如果该行动不消耗行动次数，则不标记为已行动
    if (!doesActionConsumeTurn(effectiveActionId)) {
        // 不消耗行动次数，不设置_actedThisYear
    } else {
        c._actedThisYear = true;
    }

    const isAutoWork = p => ['学者','艺人','劳工','士兵','普侍'].includes(p);
    const allDone = G.chars.every(ch => ch.isDead || ch._actedThisYear || isAutoWork(ch.profession));
    if (allDone) {
        yearActionsDone = true;
        document.getElementById('actionPrompt').textContent = '所有角色已完成行动。点击"下一年"继续。';
        document.getElementById('actionBtns').innerHTML = '';
    } else {
        document.getElementById('actionPrompt').textContent = '选择下一个角色...';
        document.getElementById('actionBtns').innerHTML = '';
    }

    renderCharList();
    renderGame();
}

function beginYearActions() {
    if (G.gameOver) return;
    yearActionsDone = false;
    actingCharId = null;
    G.chars.forEach(c => c._actedThisYear = false);
    // Auto-work professions skip manual action phase
    G.chars.filter(c => !c.isDead && ['学者','艺人','劳工','士兵','普侍'].includes(c.profession)).forEach(c => {
        c._actedThisYear = true;
    });
    document.getElementById('actionPrompt').textContent = '点击一个角色来执行行动';
    document.getElementById('actionBtns').innerHTML = '';
    document.querySelector('#actionContent .action-result')?.remove();
    renderCharList();
    renderGame();
}

function runCoup(hqList) {
    const emp = G.chars.find(e => e.id === G.leaderId);
    if (!emp) return;

    // Tournament: highest con fights others from lowest to highest con
    const sorted = [...hqList].sort((a, b) => b.con - a.con);
    let champion = sorted[0];
    const challengers = [...hqList].sort((a, b) => a.con - b.con).filter(c => c.id !== champion.id);

    for (const challenger of challengers) {
        const result = xch(champion.con, challenger.con);
        if (result <= 0) {
            champion = challenger;
        }
    }

    // Coup leader vs Emperor: use highest stat among the 7
    const coupStats = ['int','cha','sta','sex','psq','con','wel'];
    const chMax = Math.max(...coupStats.map(s => champion[s] || 0));
    const empMax = Math.max(...coupStats.map(s => emp[s] || 0));
    const coupResult = xch(chMax, empMax);

    if (coupResult >= 2) {
        addLog(`<span class="log-death">[政变]</span> ${champion.name} 发动政变成功！皇帝 ${emp.name} 被流放！`);
        logLifeEvent(champion, 'coup', '政变成功，推翻' + emp.name + '成为新皇帝');
        logLifeEvent(emp, 'coup', '被' + champion.name + '政变推翻');
        // Emperor exiled, 80% wealth to treasury
        const exileAmount = Math.floor((emp.wel || 0) * 80 / 100);
        emp.wel -= exileAmount;
        G.organization.current.btre += exileAmount;
        addLog(`<span class="info">[抄家]</span> 从 ${emp.name} 的财产中没收80%（${exileAmount}财）归入国库。`);
        G.leaderId = null;
        handleExit(emp, 'exiled');

        G.leaderId = champion.id;
        champion.profession = '皇帝';
        delete champion._class;
        G._successionPending = false;
        champion.cal += d(10, 2);

        G.imperialSurname = champion.surname;
        G.mdtPenalty += 100;
        G.chars.forEach(ch => {
            if (ch.middlename) {
                ch.surname = ch.middlename;
                ch.middlename = '';
                ch.name = ch.surname + ch.givenname;
            }
        });
        champion.surname = G.imperialSurname;
        const doCoupSucc = (newName) => {
            if (newName) {
                champion.givenname = newName;
            }
            champion.name = champion.surname + champion.givenname;
            addLog(`<span class="info">[改朝]</span> 国姓改为「${G.imperialSurname}」，天命受损！`);
            if (!G.reignHistory) G.reignHistory = [];
            G.reignHistory.push(G.reignName);
            if (G.imperialSurname !== G.founderSurname) {
                G.reignName = '伪' + G.imperialSurname;
                G.isPseudoDynasty = true;
            } else {
                G.reignName = generateReignName();
                G.isPseudoDynasty = false;
            }
            G.reignYear = 1;
            updateOrganization();
        };
        showNameInputOverlay('新皇帝即位', champion.givenname, champion.gender, doCoupSucc);
        return;
    } else if (coupResult >= 0) {
        addLog(`<span class="log-event">[暗流]</span> 朝中似有暗流涌动……`);
    } else {
        addLog(`<span class="log-death">[政变]</span> 政变阴谋败露！领袖 ${champion.name} 的身份被揭露！`);
    }
}

function processPushiAnnualActions() {
    // 处理所有普侍的年度行为
    const pushiChars = G.chars.filter(c => !c.isDead && !c.exitStatus && c.profession === '普侍');
    
    if (pushiChars.length === 0) return;
    
    // 每年初，递减所有角色的普侍生育冷却
    G.chars.forEach(c => {
        if (c._pushiBirthCooldown && c._pushiBirthCooldown > 0) {
            c._pushiBirthCooldown--;
        }
    });
    
    pushiChars.forEach(pushi => {
        // 1. 每位普侍每年使epop+1, cal_0+1d10, eapo+1d5
        G.organization.current.epop += 1;
        
        const emperor = G.chars.find(c => c.id === G.leaderId);
        if (emperor && !emperor.isDead) {
            emperor.cal += d(10);
        }
        
        G.organization.current.eapo += d(5);
        
        // 2. 生育逻辑
        // 筛选可生育对象（仅G.chars中的活跃角色，不可用角色不参与交互）
        const potentialPartners = G.chars.filter(c => 
            !c.isDead && !c.exitStatus && 
            c.id !== pushi.id && 
            c.gender !== pushi.gender && 
            c.profession !== '皇帝' && 
            c.profession !== '正宫' && 
            c.profession !== '普侍' &&
            c.age >= 12 && c.age <= 50 &&
            (!c._pushiBirthCooldown || c._pushiBirthCooldown <= 0)
        );
        
        let shouldTryBirth = false;
        let partner = null;

        if (potentialPartners.length > 0 && pushi.age >= 12 && pushi.age <= 50) {
            // 随机选择一名预计伴侣
            partner = potentialPartners[Math.floor(Math.random() * potentialPartners.length)];

            const enoughPartners = potentialPartners.length >= 3;
            const newPartner = !pushi._lastPartnerId || partner.id !== pushi._lastPartnerId;

            let prob = 0;
            if (enoughPartners && newPartner) {
                prob = 1.0;   // 两个条件均满足 → 100%
            } else if (enoughPartners || newPartner) {
                prob = 0.5;   // 仅满足一个条件 → 50%
            } else {
                prob = 0.25;  // 两个条件均不满足 → 25%
            }

            shouldTryBirth = Math.random() < prob;
            pushi._lastPartnerId = partner.id;

            const conditionStr = `条件：可育同伴${potentialPartners.length}个（${enoughPartners ? '≥3' : '<3'}）| ${newPartner ? '不同人' : '与上年重复'} → ${Math.round(prob * 100)}%概率`;
            addLog(`<span class="info">[普侍生育]</span> ${pushi.name}: ${conditionStr}，${shouldTryBirth ? '触发检定' : '跳过生育'}。`);
        } else if (pushi.age < 12 || pushi.age > 50) {
            addLog(`<span class="info">[普侍生育]</span> ${pushi.name} 年龄${pushi.age}岁，不在生育年龄范围内（12-50岁）。`);
        } else {
            addLog(`<span class="info">[普侍生育]</span> ${pushi.name} 没有合适的生育对象。`);
        }

        if (shouldTryBirth && partner) {
            const tier = 'd';
            const tierName = CHILDBIRTH_TIER_LABELS[tier] || tier;
            const mod = CHILDBIRTH_TIER_MOD[tier] || 0;
            const sexSum = pushi.sex + partner.sex;
            const target = Math.max(1, sexSum + mod);
            const r = ch(target);
            
            const resultLabels = ['失败', '成功', '大成功', '超大成功'];
            const resultStr = resultLabels[r] || '未知';
            addLog(`<span class="info">[普侍生育检定]</span> ${pushi.name} 与 ${partner.name} 性能力${pushi.sex}+${partner.sex}=${sexSum}，d类修正${mod}，目标值${target}，结果：${resultStr}`);
            
            if (r >= 1) {
                const child = generateChild(pushi, partner, tier, r);
                
                if (!G.unavailableChars) G.unavailableChars = [];
                child._actedThisYear = true;
                child.entryAge = child.age;
                G.unavailableChars.push(child);
                
                const isGreat = r === 2;
                const isExtreme = r === 3;
                
                const helLoss = isGreat ? 0 : d(4);
                const staLoss = isExtreme ? 1 : d(4);
                const calGain = isExtreme ? d(10, 2) : isGreat ? d(8, 2) : d(6, 2);
                const conGain = d(6);
                
                pushi.hel = Math.max(1, (pushi.hel || 0) - helLoss);
                partner.hel = Math.max(1, (partner.hel || 0) - helLoss);
                pushi.sta = Math.max(1, (pushi.sta || 0) - staLoss);
                partner.sta = Math.max(1, (partner.sta || 0) - staLoss);
                if (calGain) pushi.cal = (pushi.cal || 0) + calGain;
                if (conGain) pushi.con = (pushi.con || 0) + conGain;
                
                const sexLoss = d(10, 3);
                pushi.sex = Math.max(1, (pushi.sex || 0) - sexLoss);
                partner.sex = Math.max(1, (partner.sex || 0) - sexLoss);
                
                // 设置伴侣的普侍生育冷却（1d8年内不能再次与任何普侍生育）
                partner._pushiBirthCooldown = d(8);
                
                let effects = [];
                if (helLoss > 0) effects.push(`寿-${helLoss}`);
                if (staLoss > 0) effects.push(`劳-${staLoss}`);
                if (calGain > 0) effects.push(`灾+${calGain}`);
                if (conGain > 0) effects.push(`魄+${conGain}`);
                effects.push(`性-${sexLoss}`);
                const effectStr = effects.length > 0 ? `（${effects.join('，')}）` : '';
                
                addLog(`<span class="success">[普侍生育]</span> ${pushi.name} 与 ${partner.name}（${tierName}）生育了 ${child.name}${effectStr}。${partner.name}进入${partner._pushiBirthCooldown}年冷却。`);
            } else {
                addLog(`<span class="fail">[普侍生育]</span> ${pushi.name} 与 ${partner.name} 生育失败，无子女产生。`);
            }
        }
        
        addLog(`<span style="color:#888">[普侍服侍]</span> ${pushi.name} 自动服侍（人口+1，皇帝灾厄+${d(10)}，天灾+${d(5)}）`);
    });
    
    // 更新组织数据
    updateOrganization();
}

function processAutoRetirement() {
    // 储君/大臣归隐倾向降低
    G.chars.filter(c => !c.isDead && !c.exitStatus).forEach(c => {
        const cls = charClass(c);
        if (cls === '储君') {
            const reduction = d(8);
            if (c._retireAccumulator) c._retireAccumulator = Math.max(0, c._retireAccumulator - reduction);
        } else if (cls === '大臣') {
            const reduction = d(4);
            if (c._retireAccumulator) c._retireAccumulator = Math.max(0, c._retireAccumulator - reduction);
        }
    });

    // 每年角色归隐判定
    // 排除：皇帝、正宫、休养者、普侍
    const candidates = G.chars.filter(c =>
        !c.isDead && !c.exitStatus &&
        c.age >= 18 &&
        c.profession !== '皇帝' &&
        c.profession !== '正宫' &&
        c.profession !== '休养者' &&
        c.profession !== '普侍' &&
        !isConquestParticipant(c)
    );

    candidates.forEach(c => {
        // 归隐条件：wel<10、sta<10、有活跃子女、配偶已隐退、年龄>80、con<15
        const hasActiveChildren = (c.children || []).some(childId => {
            const child = G.chars.find(x => x.id === childId);
            return child && !child.exitStatus && !child.isDead;
        });
        const spouseRetired = c.spouseId ? (G.unavailableChars || []).some(x => x.id === c.spouseId && x.exitStatus === 'retired') : false;

        const conditions = [
            (c.wel || 0) < 10,
            (c.sta || 0) < 10,
            hasActiveChildren,
            spouseRetired,
            c.age > 80,
            (c.con || 0) < 15
        ];

        const anyMet = conditions.some(Boolean);
        const wasTired = !!c._wasTired;

        if (anyMet && !wasTired) {
            // 第一次满足归隐条件
            c._wasTired = true;
            addLog(`<span style="color:#ffb74d;">[状态]</span> ${c.name} 有点累了。`);
            return; // 今年不进行检定，只是提示
        }

        if (!anyMet && wasTired) {
            // 不再满足任何归隐条件
            c._wasTired = false;
            c._retireAccumulator = 0;
            addLog(`<span style="color:#81c784;">[状态]</span> ${c.name} 感觉不错。`);
            return;
        }

        if (!anyMet) {
            c._retireAccumulator = 0;
            return;
        }

        // 持续满足条件，进行归隐检定
        if (!c._retireAccumulator) c._retireAccumulator = 0;
        const totalProb = 10 + c._retireAccumulator;
        c._retireAccumulator += d(4);

        if (Math.random() * 100 < totalProb) {
            handleExit(c, 'retired');
            const condDesc = [];
            if ((c.wel || 0) < 10) condDesc.push(`财${c.wel}<10`);
            if ((c.sta || 0) < 10) condDesc.push(`劳${c.sta}<10`);
            if (hasActiveChildren) condDesc.push('有活跃子女');
            if (spouseRetired) condDesc.push('配偶已隐退');
            if (c.age > 80) condDesc.push(`年${c.age}>80`);
            if ((c.con || 0) < 15) condDesc.push(`魄${c.con}<15`);
            addLog(`<span class="info">[归隐]</span> ${c.name} 归隐（${condDesc.join('，')}）。`);
        } else {
            addLog(`<span style="color:#888;font-size:0.75rem;">[归隐检定]</span> ${c.name} 满足条件，归隐概率 ${totalProb}%，未触发。`);
        }
    });
}

const HAOQIANG_STATS = ['int','cha','sta','sex','psq','con','wel'];
function isHaoQiang(ch) {
    if (!ch || ch.isDead || ch.exitStatus || ch.id === G.leaderId) return false;
    const emp = G.chars.find(e => e.id === G.leaderId);
    if (!emp) return false;
    let count = 0;
    HAOQIANG_STATS.forEach(s => { if ((ch[s] || 0) > (emp[s] || 0)) count++; });
    return count >= 3;
}

function nextYear() {
    console.log('nextYear called, yearActionsDone:', yearActionsDone);
    try {
        if (!G) {
            console.error('G is not defined');
            alert('游戏数据未初始化');
            return;
        }
        const prevLeaderId = G.leaderId;
    if (!yearActionsDone) {
    const autoWorkProfessions = ['学者','艺人','劳工','士兵','普侍'];
        const unfinished = G.chars.filter(c => !c.isDead && !c._actedThisYear && !autoWorkProfessions.includes(c.profession));
        if (unfinished.length > 0) {
            if (!confirm(`还有角色未行动 (${unfinished.map(c => c.name).join(', ')})，确定要跳过吗？`)) {
                // 用户取消，保持当前年份
                return;
            }
            // 用户确认跳过，设置yearActionsDone为true，避免下一年再次询问
            yearActionsDone = true;
        }
    }

    G.chars.forEach(c => c._actedThisYear = false);
    G.time += 1;
    G.reignYear += 1;

    // 目标地点年度数值波动
    processTargetFluctuations();

    // 征服进程年度处理
    processConquests();
    refreshActionPanelTabs();

    // 压榨效果时效处理
    if (G._squeezeEffects) {
        G._squeezeEffects = G._squeezeEffects.filter(eff => {
            if (G.time >= eff.endYear) {
                if (eff.type === 'prd') {
                    G.organization.current.aprd = Math.max(0, (G.organization.current.aprd || 0) - eff.amount);
                } else {
                    G.organization.current.apop = Math.max(0, (G.organization.current.apop || 0) - eff.amount);
                }
                addLog(`<span style="color:#81c784">[压榨到期]</span> ${eff.type === 'prd' ? '生产' : '人口'}提升效果已消退（-${eff.amount}）。`);
                return false;
            }
            return true;
        });
    }

    // 理政效果时效处理
    if (G._governEffects) {
        G._governEffects = G._governEffects.filter(eff => {
            if (G.time >= eff.endYear) {
                if (eff.type === 'tech') {
                    G.organization.current.atec = Math.max(0, (G.organization.current.atec || 0) - eff.amount);
                } else {
                    G.organization.current.acul = Math.max(0, (G.organization.current.acul || 0) - eff.amount);
                }
                addLog(`<span style="color:#4fc3f7">[理政到期]</span> ${eff.type === 'tech' ? '科技' : '文化'}提升效果已消退（-${eff.amount}）。`);
                return false;
            }
            return true;
        });
    }

    // 演兵效果时效处理
    if (G._drillEffects) {
        G._drillEffects = G._drillEffects.filter(eff => {
            if (G.time >= eff.endYear) {
                G.organization.current.amil = Math.max(0, (G.organization.current.amil || 0) - eff.amount);
                addLog(`<span style="color:#e94560">[演兵到期]</span> 军事提升效果已消退（-${eff.amount}）。`);
                return false;
            }
            return true;
        });
    }

    G.chars.forEach(c => {
        if (!c.exitStatus) c.age += 1;
    });
    const movedToDead = [];
    (G.unavailableChars || []).forEach(c => {
        c.age += 1;
        if (c.age >= c.hel) {
            c.exitStatus = 'natural';
            c.exitYear = G.time;
            if (c.entryAge === undefined) c.entryAge = c.age;
            logLifeEvent(c, 'exit', '寿终正寝');
            logFamilyExitEvent(c, '寿终正寝');
            addLog(`<span class="log-death">[死亡]</span> 不可用角色 ${c.name} 寿终正寝。`);
            movedToDead.push(c);
        }
    });
    movedToDead.forEach(c => {
        const i = G.unavailableChars.indexOf(c);
        if (i >= 0) G.unavailableChars.splice(i, 1);
        if (!G.deadChars) G.deadChars = [];
        G.deadChars.push(c);
    });
    (G.deadChars || []).forEach(c => {
        c.age += 1;
    });
    // Talent market characters age
    (G.talentMarket || []).forEach(t => {
        if (!t._purchased) t.age += 1;
    });
    if (G.specialTalent && !G.specialTalent._purchased) {
        G.specialTalent.age += 1;
    }
    generateTalentMarket();

    // Process bounties: decrement timer, generate character when ready
    if (G.bounties) {
        const completed = [];
        G.bounties.forEach(b => {
            b.yearRemaining--;
            if (b.yearRemaining <= 0) {
                const c = generateBountyCharacter(b);
                c._isTalent = true;
                c._actedThisYear = true;
                c.entryAge = c.age;
                G.chars.push(c);
                completed.push(b);
                addLog(`<span class="success">[悬赏到货]</span> 悬赏人才 ${c.name} 已加入！`);
            }
        });
        G.bounties = G.bounties.filter(b => !completed.includes(b));
    }

    addLog(`<span class="log-year">=== 纪元 ${G.time}年 ===</span>`);

    // 灾厄过重折寿
    G.chars.forEach(c => {
        if (!c.exitStatus && !c.isDead && (c.cal || 0) >= 90) {
            let loss;
            const r = d(100);
            if (c.cal >= 120) {
                loss = r <= 25 ? 1 : d(4);
            } else if (c.cal >= 100) {
                loss = r <= 50 ? 1 : d(4);
            } else {
                loss = r <= 75 ? 1 : d(4);
            }
            c.hel = Math.max(1, (c.hel || 0) - loss);
            addLog(`<span class="log-death">[折寿]</span> 罪业笼罩在${c.name}附近…`);
        }
    });

    G.chars.forEach(c => {
        if (!c.exitStatus && !c.isDead) {
            const checkMsgs = overallCheck(c);
            if (checkMsgs.length > 0) {
                checkMsgs.forEach(m => addLog(`${c.name}: ${m}`));
            }
        }
    });

    // End-of-year talent welfare: low wel < 5 triggers highest-wel talent charity
    const slaves = G.chars.filter(c => c._isTalent && !c.isDead);
    const lowWelSlaves = slaves.filter(c => c.wel < 5);
    if (lowWelSlaves.length > 0) {
        const richestSlave = slaves.reduce((a, b) => a.wel > b.wel ? a : b);
        lowWelSlaves.forEach(recipient => {
            if (d(100) <= 10) {
                const gift = d(6);
                const actualGift = Math.min(gift, richestSlave.wel);
                if (actualGift > 0) {
                    richestSlave.wel -= actualGift;
                    recipient.wel += actualGift;
                    addLog(`<span class="success">[互助]</span> ${richestSlave.name} 向 ${recipient.name} 转赠了 ${actualGift}财。`);
                }
            }
        });
    }

    // Reset extra values each year (tre and its components are the only accumulators)
    const cur = G.organization.current;
    cur.etec = 0; cur.ecul = 0; cur.eprd = 0; cur.epop = 0; cur.emil = 0;
    cur.einf = 0; cur.eapo = 0; cur.emdt = 0;

    // ---- Auto-work: 学者 ----
    G.chars.filter(x => x.profession === '学者' && !x.isDead).forEach(sch => {
        G.organization.current.etec += 1;
        G.organization.current.etre += 1;

        const r = ch(sch.int);
        let msg = '';
        if (r === 0) {
            sch.exp += 1;
            msg = `研究失败（经+1）`;
        } else if (r === 1) {
            sch.exp += 1; sch.int += 1; sch.wel += 1;
            msg = `研究成功（经+1 智+1 财+1）`;
        } else if (r === 2) {
            const iG = d(4), wG = d(4), eG = d(4);
            sch.exp += 1; sch.int += iG; sch.wel += wG; sch.edu += 1;
            G.organization.current.etec += 1;
            const emp = G.chars.find(c => c.id === G.leaderId);
            if (emp && !emp.isDead) emp.int += 1;
            msg = `研究大成功（经+1 智+${iG} 财+${wG} 教+1 科技+1 帝智+1）`;
        } else {
            const iG = d(4, 2), wG = d(6), eG = d(4), etecG = d(4);
            const expG = d(4), empIG = d(4), chancIG = d(4);
            sch.exp += expG; sch.int += iG; sch.wel += wG; sch.edu += eG;
            G.organization.current.etec += etecG;
            const emp = G.chars.find(c => c.id === G.leaderId);
            if (emp && !emp.isDead) emp.int += empIG;
            const chancellor = G.chars.find(c => c.profession === '宰相' && !c.isDead);
            if (chancellor) chancellor.int += chancIG;
            logLifeEvent(sch, 'dice_crit', '研究检定特大成功');
            msg = `研究牛逼！（经+${expG} 智+${iG} 财+${wG} 教+${eG} 科技+${etecG} 帝智+${empIG} 相智+${chancIG}）`;
        }
        addLog(`<span style="color:#4fc3f7">[学者]</span> ${sch.name}: ${msg}`);
    });

    // ---- Auto-work: 艺人 ----
    G.chars.filter(x => x.profession === '艺人' && !x.isDead).forEach(art => {
        G.organization.current.ecul += 1;
        G.organization.current.einf += d(4);

        const r = ch(art.cha);
        let msg = '';
        if (r === 0) {
            art.exp += 1; art.sta -= 1;
            msg = `表演失败（经+1 劳-1）`;
        } else if (r === 1) {
            art.exp += 1; art.cha += 1; art.wel += 1;
            msg = `表演成功（经+1 魅+1 财+1）`;
        } else if (r === 2) {
            const chG = d(4), wG = d(4), stG = d(4);
            art.exp += 1; art.cha += chG; art.wel += wG; art.sta += stG;
            G.organization.current.ecul += 1;
            const emp = G.chars.find(c => c.id === G.leaderId);
            if (emp && !emp.isDead) emp.sex += 1;
            G.chars.filter(x => (x.profession === '正宫' || isConsort(x)) && !x.isDead).forEach(x => x.sex += 1);
            msg = `表演大成功（经+1 魅+${chG} 财+${wG} 劳+${stG} 文化+1 帝性+1 后宫性+1）`;
        } else {
            const chG = d(8), wG = d(6), stG = d(6), eculG = d(4);
            const expG = d(4), empSexG = d(4), haremSexG = d(4);
            art.exp += expG; art.cha += chG; art.wel += wG; art.sta += stG;
            G.organization.current.ecul += eculG;
            const emp = G.chars.find(c => c.id === G.leaderId);
            if (emp && !emp.isDead) emp.sex += empSexG;
            G.chars.filter(x => (x.profession === '正宫' || isConsort(x)) && !x.isDead).forEach(x => x.sex += haremSexG);
            logLifeEvent(art, 'dice_crit', '表演检定特大成功');
            msg = `表演牛逼！（经+${expG} 魅+${chG} 财+${wG} 劳+${stG} 帝性+${empSexG} 后宫性+${haremSexG} 文化+${eculG}）`;
        }
        addLog(`<span style="color:#ffb74d">[艺人]</span> ${art.name}: ${msg}`);
    });

    // ---- Auto-work: 劳工 ----
    G.chars.filter(x => x.profession === '劳工' && !x.isDead).forEach(lab => {
        cur.eprd += 1;
        cur.etre += d(4);

        const r = ch(lab.sta);
        let msg = '';
        if (r === 0) {
            const sL = d(4);
            lab.exp += 1; lab.sta -= sL;
            msg = `劳动失败（经+1 劳-${sL}）`;
        } else if (r === 1) {
            const sL = d(4), wG = d(4), eprdG = d(4), etreG = d(4);
            lab.exp += 1; lab.sta -= sL; lab.wel += wG;
            cur.eprd += eprdG; cur.etre += etreG;
            msg = `劳动成功（经+1 劳-${sL} 财+${wG} 生产+${eprdG} 银库+${etreG}）`;
        } else if (r === 2) {
            const sL = d(4) + 1, wG = d(6), eprdG = d(6), etreG = d(6);
            lab.exp += 1; lab.sta -= sL; lab.wel += wG;
            cur.eprd += eprdG; cur.etre += etreG;
            msg = `劳动大成功（经+1 劳-${sL} 财+${wG} 生产+${eprdG} 银库+${etreG}）`;
        } else {
            const expG = d(6), hL = d(4), wG = d(6, 2), eprdG = d(6, 2), etreG = d(6, 2);
            lab.exp += expG; lab.sta -= 1; lab.hel -= hL; lab.wel += wG;
            cur.eprd += eprdG; cur.etre += etreG;
            logLifeEvent(lab, 'dice_crit', '劳动检定特大成功');
            msg = `劳动牛逼！（经+${expG} 劳-1 寿-${hL} 财+${wG} 生产+${eprdG} 银库+${etreG}）`;
        }
        addLog(`<span style="color:#81c784">[劳工]</span> ${lab.name}: ${msg}`);
    });

    // ---- Auto-work: 士兵 ----
    G.chars.filter(x => x.profession === '士兵' && !x.isDead).forEach(sol => {
        cur.emil += 2;

        const r = ch(sol.psq);
        const emp = G.chars.find(c => c.id === G.leaderId);
        let msg = '';
        if (r === 0) {
            sol.exp += 1; sol.psq += 1;
            msg = `训练（经+1 体+1）`;
        } else if (r === 1) {
            sol.exp += 1; sol.psq += 1; sol.con += 1;
            cur.emil += 1;
            if (emp && !emp.isDead) emp.con += 1;
            msg = `训练成功（经+1 体+1 魄+1 军事+1 帝魄+1）`;
        } else if (r === 2) {
            const psqG = d(4), conG = d(4), emilG = d(4), empConG = d(4);
            sol.exp += 1; sol.psq += psqG; sol.con += conG;
            cur.emil += emilG;
            if (emp && !emp.isDead) emp.con += empConG;
            msg = `训练大成功（经+1 体+${psqG} 魄+${conG} 军事+${emilG} 帝魄+${empConG}）`;
        } else {
            const expG = d(4), psqG = d(6, 2), conG = d(10), emilG = d(6, 2), empConG = d(6, 2);
            sol.exp += expG; sol.psq += psqG; sol.con += conG;
            cur.emil += emilG;
            if (emp && !emp.isDead) emp.con += empConG;
            logLifeEvent(sol, 'dice_crit', '训练检定特大成功');
            msg = `训练牛逼！（经+${expG} 体+${psqG} 魄+${conG} 军事+${emilG} 帝魄+${empConG}）`;
        }
        addLog(`<span style="color:#e94560">[士兵]</span> ${sol.name}: ${msg}`);
});
 
     // === 剥削系统 ===
     const aliveChars = G.chars.filter(c => !c.isDead && !c.exitStatus);
     
     // 宰相剥削学者、艺人、无业者
     const chancellor = aliveChars.find(c => c.profession === '宰相');
     if (chancellor) {
         // 目标职业
         const targets = aliveChars.filter(c => 
             ['学者', '艺人', '无业者'].includes(c.profession) && c.id !== chancellor.id
         );
         if (targets.length > 0) {
             // 1. 从财富最高的3人中选2人
             const top3 = targets.sort((a, b) => b.wel - a.wel).slice(0, 3);
             const picks1 = [];
             if (top3.length > 0) {
                 // 从top3中随机选2人（可能重复）
                 for (let i = 0; i < 2; i++) {
                     if (top3.length > 0) {
                         const idx = Math.floor(Math.random() * top3.length);
                         picks1.push(top3[idx]);
                     }
                 }
             }
             // 2. 从全部目标中随机选1人
             const picks2 = targets.length > 0 ? [targets[Math.floor(Math.random() * targets.length)]] : [];
             
             const allPicks = [...new Set([...picks1, ...picks2])]; // 去重
             allPicks.forEach(victim => {
                 if (Math.random() < 0.5) {  // 50%概率实施剥削
                     const amount = d(4) + d(4);  // 2d4
                     if (victim.wel >= amount) {
                         victim.wel -= amount;
                         chancellor.wel += amount;
                         chancellor.cal += d(4);
                         chancellor.con += d(8);
                         addLog(`<span style="color:#ff9800">[剥削]</span> 宰相 ${chancellor.name} 剥削 ${victim.name} ${amount}财 (智+${d(4)}, 魄+${d(8)})`);
                     } else {
                         const actual = victim.wel;
                         victim.wel = 0;
                         chancellor.wel += actual;
                         chancellor.cal += d(4);
                         chancellor.con += d(8);
                         addLog(`<span style="color:#ff9800">[剥削]</span> 宰相 ${chancellor.name} 剥削 ${victim.name} ${actual}财 (智+${d(4)}, 魄+${d(8)})`);
                     }
                 }
             });
         }
     }
 
     // 监工剥削劳工、普侍、无业者
     const overseer = aliveChars.find(c => c.profession === '监工');
     if (overseer) {
         const targets = aliveChars.filter(c => 
             ['劳工', '普侍', '无业者'].includes(c.profession) && c.id !== overseer.id
         );
         if (targets.length > 0) {
             const top3 = targets.sort((a, b) => b.wel - a.wel).slice(0, 3);
             const picks1 = [];
             if (top3.length > 0) {
                 for (let i = 0; i < 2; i++) {
                     if (top3.length > 0) {
                         const idx = Math.floor(Math.random() * top3.length);
                         picks1.push(top3[idx]);
                     }
                 }
             }
             const picks2 = targets.length > 0 ? [targets[Math.floor(Math.random() * targets.length)]] : [];
             
             const allPicks = [...new Set([...picks1, ...picks2])];
             allPicks.forEach(victim => {
                 if (Math.random() < 0.5) {
                     const amount = d(4) + d(4);
                     if (victim.wel >= amount) {
                         victim.wel -= amount;
                         overseer.wel += amount;
                         overseer.cal += d(4);
                         overseer.con += d(8);
                         addLog(`<span style="color:#81c784">[剥削]</span> 监工 ${overseer.name} 剥削 ${victim.name} ${amount}财 (智+${d(4)}, 魄+${d(8)})`);
                     } else {
                         const actual = victim.wel;
                         victim.wel = 0;
                         overseer.wel += actual;
                         overseer.cal += d(4);
                         overseer.con += d(8);
                         addLog(`<span style="color:#81c784">[剥削]</span> 监工 ${overseer.name} 剥削 ${victim.name} ${actual}财 (智+${d(4)}, 魄+${d(8)})`);
                     }
                 }
             });
         }
     }
 
     // 将军剥削士兵、无业者
     const general = aliveChars.find(c => c.profession === '将军');
     if (general) {
         const targets = aliveChars.filter(c => 
             ['士兵', '无业者'].includes(c.profession) && c.id !== general.id
         );
         if (targets.length > 0) {
             const top3 = targets.sort((a, b) => b.wel - a.wel).slice(0, 3);
             const picks1 = [];
             if (top3.length > 0) {
                 for (let i = 0; i < 2; i++) {
                     if (top3.length > 0) {
                         const idx = Math.floor(Math.random() * top3.length);
                         picks1.push(top3[idx]);
                     }
                 }
             }
             const picks2 = targets.length > 0 ? [targets[Math.floor(Math.random() * targets.length)]] : [];
             
             const allPicks = [...new Set([...picks1, ...picks2])];
             allPicks.forEach(victim => {
                 if (Math.random() < 0.5) {
                     const amount = d(4) + d(4);
                     if (victim.wel >= amount) {
                         victim.wel -= amount;
                         general.wel += amount;
                         general.cal += d(4);
                         general.con += d(8);
                         addLog(`<span style="color:#e94560">[剥削]</span> 将军 ${general.name} 剥削 ${victim.name} ${amount}财 (智+${d(4)}, 魄+${d(8)})`);
                     } else {
                         const actual = victim.wel;
                         victim.wel = 0;
                         general.wel += actual;
                         general.cal += d(4);
                         general.con += d(8);
                         addLog(`<span style="color:#e94560">[剥削]</span> 将军 ${general.name} 剥削 ${victim.name} ${actual}财 (智+${d(4)}, 魄+${d(8)})`);
                     }
                 }
             });
         }
     }
 
     // ---- Sanity check: multiple emperors ----
     const emperors = G.chars.filter(c => c.profession === '皇帝' && !c.exitStatus);
    if (emperors.length > 1) {
        addLog(`<span class="log-death">[错误]</span> 检测到多个皇帝（${emperors.map(e => e.name).join('、')}），请报告开发者！`);
    }

    const leaderChanged = prevLeaderId !== G.leaderId;
    const successionYear = leaderChanged || G._successionPending;

    // ---- Coup Check ----
    const hqList = G.chars.filter(isHaoQiang);

    // 豪强变动检测
    const prevIds = G._prevHaoQiangIds || [];
    const curIds = hqList.map(h => h.id);
    hqList.forEach(hq => {
        if (!prevIds.includes(hq.id)) {
            addLog(`<span style="color:#ff9800">[警示]</span> ${hq.name} 好像在想着什么……`);
        }
    });
    prevIds.forEach(pid => {
        if (!curIds.includes(pid)) {
            const former = G.chars.find(c => c.id === pid) || (G.deadChars || []).find(c => c.id === pid) || (G.unavailableChars || []).find(c => c.id === pid);
            if (former) {
                addLog(`<span style="color:#4caf50">[忠义]</span> ${former.name} 只效忠于国家。`);
            }
        }
    });
    G._prevHaoQiangIds = curIds;

    // 最高 con 豪强每回合尊敬
    if (hqList.length > 0) {
        const topHq = hqList.reduce((a, b) => ((a.con || 0) >= (b.con || 0) ? a : b));
        addLog(`<span style="color:#ff9800">[敬畏]</span> 有些人在尊敬${topHq.name}。`);
    }

    hqList.forEach(hq => {
        if ((G.coupYears || 0) % 5 === 0) {
            hq.con += d(4);
        }
    });

    G.coupCooldown = (G.coupCooldown || 0) - 1;
    if (G.coupCooldown <= 0 && hqList.length >= 2) {
        if (successionYear) {
            addLog(`<span style="color:#ff9800">[稳固]</span> 新帝即位，政权尚不稳固，暂无人敢妄动。`);
            G.coupCooldown = d(10) + 2;
            G.coupYears = 0;
        } else {
            runCoup(hqList);
            G.coupCooldown = d(10);
            G.coupYears = 0;
        }
    } else {
        G.coupYears = (G.coupYears || 0) + 1;
    }

    // ---- Engagement resolution ----
    if (G.engagements) {
        const resolved = [];
        G.engagements.forEach(e => {
            e.yearsLeft--;
            if (e.yearsLeft <= 0) {
                const c1 = G.chars.find(x => x.id === e.id1);
                const c2 = G.chars.find(x => x.id === e.id2);
                if (c1 && c2 && !c1.exitStatus && !c2.exitStatus && !c1.married && !c2.married) {
                    if (['皇帝','正宫','普侍'].includes(c1.profession) || isConsort(c1) || ['皇帝','正宫','普侍'].includes(c2.profession) || isConsort(c2)) {
                        resolved.push(e);
                        return;
                    }
                    c1.married = true;
                    c1.spouseId = c2.id;
                    c2.married = true;
                    c2.spouseId = c1.id;
                    const empId = G.leaderId;
                    if (c1.id === empId || c2.id === empId) {
                        const spouse = c1.id === empId ? c2 : c1;
                        const old = G.chars.find(x => x.profession === '正宫');
                        if (old && old.id !== spouse.id) {
                            old.profession = '无业者';
                            logLifeEvent(old, 'demote', '被新正宫取代');
                        }
                        spouse.profession = '正宫';
                        logLifeEvent(spouse, 'appoint', '因婚姻被立为正宫');
                    }
                    logLifeEvent(c1, 'marry', '与' + c2.name + '成婚');
                    logLifeEvent(c2, 'marry', '与' + c1.name + '成婚');
                    addLog(`<span class="success">[结婚]</span> ${c1.name} 与 ${c2.name} 结为夫妻。`);
                }
                resolved.push(e);
            }
        });
        G.engagements = G.engagements.filter(e => !resolved.includes(e));
    }

    // ---- Annual random pairing ----
    const engagedIds = new Set();
    if (G.engagements) G.engagements.forEach(e => { engagedIds.add(e.id1); engagedIds.add(e.id2); });
    const pairingPool = G.chars.filter(c =>
        !c.isDead && !c.exitStatus && c.profession !== '皇帝' && c.profession !== '正宫' && !isConsort(c) && c.profession !== '普侍' && !c.married && c.age >= 12 && !engagedIds.has(c.id)
    );
    if (pairingPool.length > 0) {
        const initiator = pairingPool[Math.floor(Math.random() * pairingPool.length)];
        if (d(100) <= 25) {
            const candidates = G.chars.filter(x =>
                !x.isDead && !x.exitStatus && x.id !== initiator.id && x.gender !== initiator.gender && !x.married && x.age >= 12 && x.profession !== '皇帝' && x.profession !== '正宫' && !isConsort(x) && x.profession !== '普侍'
            );
            if (candidates.length > 0) {
                const partner = candidates[Math.floor(Math.random() * candidates.length)];
                const bestStat = Math.max(...['int','cha','sta','sex','psq','wel','con'].map(s => initiator[s] || 0));
                if (ch(bestStat) >= 1) {
                    if (!initiator.lovers) initiator.lovers = [];
                    if (!partner.lovers) partner.lovers = [];
                    initiator.lovers.push(partner.id);
                    partner.lovers.push(initiator.id);
                    const years = d(4);
                    if (!G.engagements) G.engagements = [];
                    G.engagements.push({ id1: initiator.id, id2: partner.id, yearsLeft: years });
                    addLog(`<span class="success">[交往]</span> ${initiator.name} 与 ${partner.name} 开始交往，将在${years}年后成婚。`);
                }
            }
        }
    }

    // ---- Random NPC childbirth ----
    const npcMarriedPool = G.chars.filter(c =>
        !c.isDead && !c.exitStatus && c.married && c.spouseId !== null && c.id !== G.leaderId
    );
    if (npcMarriedPool.length > 0 && d(100) <= 10) {
        const p1 = npcMarriedPool[Math.floor(Math.random() * npcMarriedPool.length)];
        const p2 = G.chars.find(x => x.id === p1.spouseId);
        if (p2 && !p2.isDead && !p2.exitStatus && p2.id !== G.leaderId) {
            // b-tier parent effects
            const helL = d(4), staL = d(4), sexL = d(10, 3);
            p1.hel = Math.max(1, (p1.hel || 0) - helL);
            p2.hel = Math.max(1, (p2.hel || 0) - helL);
            p1.sta = Math.max(1, (p1.sta || 0) - staL);
            p2.sta = Math.max(1, (p2.sta || 0) - staL);
            p1.sex = Math.max(1, (p1.sex || 0) - sexL);
            p2.sex = Math.max(1, (p2.sex || 0) - sexL);

            const child = createChar();
            child.id = G.nextCharId;
            G.nextCharId++;
            child.age = 0;
            child.entryAge = 0;
            child.parents = [p1.id, p2.id];
            child.grandparents = [...new Set([
                ...(p1.parents || []), ...(p2.parents || []),
                ...(p1.grandparents || []), ...(p2.grandparents || [])
            ])];
            child.surname = Math.random() < 0.5 ? p1.surname : p2.surname;
            const givenPool = child.gender === 'm' ? _maleGiven : _femaleGiven;
            child.givenname = givenPool[Math.floor(Math.random() * givenPool.length)];
            child.middlename = '';
            child.name = child.surname + child.givenname;

            // Random per-stat from one parent
            ['int','cha','sta','sex','psq','hel','con'].forEach(stat => {
                const src = Math.random() < 0.5 ? p1 : p2;
                child[stat] = src[stat] || 0;
            });
            child.luc = d(20, 5);
            child.cal = Math.max(0, Math.round((25 - child.luc / 5) * 3) - d(10, 2));
            child.wel = 0;

            if (!G.unavailableChars) G.unavailableChars = [];
            G.unavailableChars.push(child);
            logLifeEvent(child, 'entry', '出生，父' + p1.name + '母' + p2.name);
            logLifeEvent(p1, 'childbirth', '与' + p2.name + '生下' + child.name);
            logLifeEvent(p2, 'childbirth', '与' + p1.name + '生下' + child.name);
            addLog(`<span class="success">[生育]</span> ${p1.name} 与 ${p2.name} 生下 ${child.name}。`);
            updateOrganization();
        }
    }

    // Transfer etre to btre (year-end settlement)
    cur.btre += cur.etre;
    cur.etre = 0;

    // Process 普侍 annual actions
    processPushiAnnualActions();

    // ---- Annual 休养者 processing ----
    const restorers = G.chars.filter(c => !c.isDead && !c.exitStatus && c.profession === '休养者');
    if (restorers.length > 0) {
        const emperor = G.chars.find(c => c.id === G.leaderId);
        const cur = G.organization.current;
        const costThreshold = restorers.length * 4;
        let totalPaid = 0;
        if (cur.btre >= costThreshold) {
            restorers.forEach(r => {
                const payment = d(4);
                r.wel = (r.wel || 0) + payment;
                cur.btre -= payment;
                totalPaid += payment;
                if (emperor && !emperor.isDead) {
                    emperor.cal -= 1;
                }
                G.mdtRestorerAccum = (G.mdtRestorerAccum || 0) + 1;
                addLog(`<span style="color:#a5d6a7">[休养者]</span> ${r.name} 获得休养金 ${payment}财（国库余${cur.btre}，皇帝cal-1，mdt基础+1）。`);
            });
            addLog(`<span style="color:#a5d6a7">[休养者]</span> 共 ${restorers.length} 位休养者，支付 ${totalPaid} 财休养金。`);
        } else {
            addLog(`<span style="color:#ffab91">[休养者]</span> 国库不足（${cur.btre} < ${costThreshold}），所有休养者未获得休养金。`);
        }
    }

    // Process auto-retirement for eligible characters
    processAutoRetirement();

    updateOrganization();

    if (checkGameOver()) {
        yearActionsDone = true;
        actingCharId = null;
        updateOrganization();
        addLog(`<span class="log-death">[终结]</span> 游戏结束。`);
        return;
    }

    yearActionsDone = false;
    actingCharId = null;
    beginYearActions();
    addLog(`新的纪元开始了。`);
    } catch (e) {
        console.error('nextYear error:', e);
        alert('下一年操作出错: ' + e.message);
    }
}

// ---- Save / Load ----

function saveGame() {
    if (!G) { alert('没有进行中的游戏'); return; }
    G.chars.forEach(c => delete c._actedThisYear);
    G.chars.forEach(c => delete c._unplayable);
    (G.unavailableChars || []).forEach(c => delete c._actedThisYear);
    (G.unavailableChars || []).forEach(c => delete c._unplayable);
    (G.deadChars || []).forEach(c => delete c._actedThisYear);
    (G.deadChars || []).forEach(c => delete c._unplayable);
    const key = 'pslavery_save_' + G.playerId;
    localStorage.setItem(key, JSON.stringify(G));
    addLog('<span class="info">[存档]</span> 游戏已保存。');
    alert('游戏已保存！');
}

function exportSave() {
    if (!G) { alert('没有进行中的游戏'); return; }
    G.chars.forEach(c => delete c._actedThisYear);
    G.chars.forEach(c => delete c._unplayable);
    (G.unavailableChars || []).forEach(c => delete c._actedThisYear);
    (G.unavailableChars || []).forEach(c => delete c._unplayable);
    (G.deadChars || []).forEach(c => delete c._actedThisYear);
    (G.deadChars || []).forEach(c => delete c._unplayable);
    const now = new Date();
    const ds = now.toISOString().slice(0,10).replace(/-/g,'');
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const filename = `海地老皇帝_${G.initialCharName || '未知'}_${ds}.txt`;
    const json = JSON.stringify(G, null, 2);
    const blob = new Blob([json], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    addLog('<span class="info">[导出]</span> 存档已导出为 ' + filename);
}

function importSave() {
    document.getElementById('importFileInput').click();
}

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = ev.target.result;
            G = JSON.parse(data);
            // re-run migration like doLoad
            if (!G.bounties) G.bounties = [];
            if (!G.specialTalent) G.specialTalent = null;
            if (G.specialTalentRefresh === undefined) G.specialTalentRefresh = 0;
            // Migrate old _unplayable chars to unavailableChars
            if (!G.unavailableChars) G.unavailableChars = [];
            const oldChars = G.chars || [];
            G.chars = [];
            oldChars.forEach(c => {
                if (c._unplayable) {
                    delete c._unplayable;
                    G.unavailableChars.push(c);
                } else {
                    if (c.profession === '侧室') c.profession = '无业者';
                    delete c._unplayable;
                    G.chars.push(c);
                }
            });
            (G.unavailableChars || []).forEach(c => { delete c._unplayable; if (c.profession === '侧室') c.profession = '无业者'; });
            (G.historicalFigures || []).forEach(c => { delete c._unplayable; if (c.profession === '侧室') c.profession = '无业者'; });
            (G.deadChars || []).forEach(c => { delete c._unplayable; if (c.profession === '侧室') c.profession = '无业者'; });
            // Migrate old unavailableChars: natural/killed → deadChars
            if (!G.deadChars) G.deadChars = [];
            const deadMoved = (G.unavailableChars || []).filter(c => c.exitStatus === 'natural' || c.exitStatus === 'killed');
            deadMoved.forEach(c => { const i = G.unavailableChars.indexOf(c); if (i >= 0) G.unavailableChars.splice(i, 1); G.deadChars.push(c); });
            (G.chars || []).forEach(c => {
                c._actedThisYear = false;
                if (c.exitStatus === undefined) c.exitStatus = null;
                if (c.entryAge === undefined) c.entryAge = c.exitStatus ? c.age : 0;
                if (c.exitYear === undefined) c.exitYear = null;
                if (c.profession === '侧室') c.profession = '无业者';
                if (!c.surname) {
                    if (c.name && c.name.length >= 2) {
                        c.surname = c.name[0];
                        c.givenname = c.name.slice(1);
                    } else {
                        c.surname = '张';
                        c.givenname = c.name || '伟';
                    }
                    c.middlename = '';
                    c.name = c.surname + c.givenname;
                }
                if (!c.lifeEvents) c.lifeEvents = [];
            });
            if (!G.imperialSurname) {
                const leader = (G.chars || []).find(c => c.id === G.leaderId);
                G.imperialSurname = leader ? leader.surname : '张';
            }
            if (G.mdtPenalty === undefined) G.mdtPenalty = 0;
            if (G.mdtRestorerAccum === undefined) G.mdtRestorerAccum = 0;
            if (!G.founderSurname) G.founderSurname = G.imperialSurname;
            if (!G.initialCharName) G.initialCharName = (G.chars && G.chars[0]) ? G.chars[0].name : (G.founderSurname + '帝');
            if (G.coupCooldown === undefined) G.coupCooldown = 0;
            if (G.coupYears === undefined) G.coupYears = 0;
            if (!G.reignName) { G.reignName = generateReignName(); G.reignYear = 1; G.isPseudoDynasty = false; G.reignHistory = []; }
            if (!G.historicalFigures) G.historicalFigures = [];
            if (!G.engagements) G.engagements = [];
            if (!G.unavailableChars) G.unavailableChars = [];
            if (!G.deadChars) G.deadChars = [];
            if (!G.organization) initOrganization();
            const cur = G.organization && G.organization.current;
            if (cur) {
                ['btec','etec','bcul','ecul','bprd','eprd','bpop','epop','bmil','emil','binf','einf','btre','etre','bapo','eapo','bmdt','emdt'].forEach(k => {
                    if (cur[k] === undefined) cur[k] = 0;
                });
                if (cur.btre === 0 && cur.tre > 0) cur.btre = cur.tre;
            }
            if (!G.mapData) {
                G.mapData = {
                    targets: [
                        { id: 'keji', name: '科技大学', type: 'infrastructure', conquered: false },
                        { id: 'caijing', name: '财经大学', type: 'infrastructure', conquered: false },
                        { id: 'magang', name: '玛钢厂', type: 'infrastructure', conquered: false },
                        { id: 'yiyuan', name: '第四医院', type: 'infrastructure', conquered: false },
                        { id: 'donghai', name: '东海居委会', type: 'admin', conquered: false },
                        { id: 'chentang', name: '陈塘庄居委会', type: 'admin', conquered: false },
                        { id: 'liulin', name: '柳林居委会', type: 'admin', conquered: false }
                    ]
                };
            }
            if (!G.headquarterName) G.headquarterName = '办公室';
            if (G.mapData && !G.mapData.targets.some(t => t.id === 'headquarter')) {
                G.mapData.targets.unshift({ id: 'headquarter', name: G.headquarterName, type: 'admin', conquered: true });
            }
            G.mapData.targets.forEach(t => { if (!t.hasOwnProperty('tec')) initTargetProps(t); });
            updateOrganization();
            showScreen('screenGame');
            renderGame();
            document.getElementById('logContent').innerHTML = '';
            addLog('<span class="info">[导入]</span> 存档已导入。');
            addLog(`<span class="log-year">=== 纪元 ${G.time}年 ===</span>`);
            yearActionsDone = false;
            beginYearActions();
        } catch (e) {
            alert('导入失败: ' + e.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function loadGame() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('pslavery_save_'));
    if (keys.length === 0) { alert('没有找到存档'); return; }

    if (keys.length === 1) {
        doLoad(keys[0]);
        return;
    }

    const choice = prompt(`找到多个存档:\n${keys.map((k, i) => `${i}: ${k}`).join('\n')}\n输入编号加载:`);
    const idx = parseInt(choice);
    if (isNaN(idx) || idx < 0 || idx >= keys.length) { alert('无效选择'); return; }
    doLoad(keys[idx]);
}

function doLoad(key) {
    try {
        const data = localStorage.getItem(key);
        if (!data) { alert('存档数据为空'); return; }
        G = JSON.parse(data);
        if (!G.bounties) G.bounties = [];
        if (!G.specialTalent) G.specialTalent = null;
        if (G.specialTalentRefresh === undefined) G.specialTalentRefresh = 0;
        G.chars.forEach(c => {
            c._actedThisYear = false;
            if (c.exitStatus === undefined) c.exitStatus = null;
            if (c.entryAge === undefined) c.entryAge = c.exitStatus ? c.age : 0;
            if (c.exitYear === undefined) c.exitYear = null;
            if (c.profession === '侧室') c.profession = '无业者';
            if (!c.surname) {
                // Backward compat: extract from c.name
                if (c.name && c.name.length >= 2) {
                    c.surname = c.name[0];
                    c.givenname = c.name.slice(1);
                } else {
                    c.surname = '张';
                    c.givenname = c.name || '伟';
                }
                c.middlename = '';
                c.name = c.surname + c.givenname;
            }
            if (!c.lifeEvents) c.lifeEvents = [];
        });
        // Migrate old _unplayable chars to unavailableChars
        if (!G.unavailableChars) G.unavailableChars = [];
        const oldChars = G.chars || [];
        G.chars = [];
        oldChars.forEach(c => {
            if (c._unplayable) {
                delete c._unplayable;
                G.unavailableChars.push(c);
            } else {
                delete c._unplayable;
                G.chars.push(c);
            }
        });
        (G.unavailableChars || []).forEach(c => { delete c._unplayable; if (c.profession === '侧室') c.profession = '无业者'; });
        (G.historicalFigures || []).forEach(c => { delete c._unplayable; if (c.profession === '侧室') c.profession = '无业者'; });
        (G.deadChars || []).forEach(c => { delete c._unplayable; if (c.profession === '侧室') c.profession = '无业者'; });
        // Migrate old unavailableChars: natural/killed → deadChars
        if (!G.deadChars) G.deadChars = [];
        const deadMoved = (G.unavailableChars || []).filter(c => c.exitStatus === 'natural' || c.exitStatus === 'killed');
        deadMoved.forEach(c => { const i = G.unavailableChars.indexOf(c); if (i >= 0) G.unavailableChars.splice(i, 1); G.deadChars.push(c); });
        if (!G.imperialSurname) {
            const leader = G.chars.find(c => c.id === G.leaderId);
            G.imperialSurname = leader ? leader.surname : '张';
        }
        if (G.mdtPenalty === undefined) G.mdtPenalty = 0;
        if (G.mdtRestorerAccum === undefined) G.mdtRestorerAccum = 0;
        if (!G.founderSurname) G.founderSurname = G.imperialSurname;
        if (!G.initialCharName) G.initialCharName = G.chars[0]?.name || G.founderSurname + '帝';
        if (G.coupCooldown === undefined) G.coupCooldown = 0;
        if (G.coupYears === undefined) G.coupYears = 0;
        if (!G.reignName) { G.reignName = generateReignName(); G.reignYear = 1; G.isPseudoDynasty = false; G.reignHistory = []; }
        if (!G.historicalFigures) G.historicalFigures = [];
        if (!G.engagements) G.engagements = [];
        if (!G.unavailableChars) G.unavailableChars = [];
        if (!G.deadChars) G.deadChars = [];
        if (!G.organization) initOrganization();
        const cur = G.organization.current;
        ['btec','etec','bcul','ecul','bprd','eprd','bpop','epop','bmil','emil','binf','einf','btre','etre','bapo','eapo','bmdt','emdt'].forEach(k => {
            if (cur[k] === undefined) cur[k] = 0;
        });
        // Old save migration: tre → btre
        if (cur.btre === 0 && cur.tre > 0) cur.btre = cur.tre;
        if (!G.mapData) {
            G.mapData = {
                targets: [
                    { id: 'keji', name: '科技大学', type: 'infrastructure', conquered: false },
                    { id: 'caijing', name: '财经大学', type: 'infrastructure', conquered: false },
                    { id: 'magang', name: '玛钢厂', type: 'infrastructure', conquered: false },
                    { id: 'yiyuan', name: '第四医院', type: 'infrastructure', conquered: false },
                    { id: 'donghai', name: '东海居委会', type: 'admin', conquered: false },
                    { id: 'chentang', name: '陈塘庄居委会', type: 'admin', conquered: false },
                    { id: 'liulin', name: '柳林居委会', type: 'admin', conquered: false }
                ]
            };
        }
        if (!G.headquarterName) G.headquarterName = '办公室';
        if (G.mapData && !G.mapData.targets.some(t => t.id === 'headquarter')) {
            G.mapData.targets.unshift({ id: 'headquarter', name: G.headquarterName, type: 'admin', conquered: true });
        }
        G.mapData.targets.forEach(t => { if (!t.hasOwnProperty('tec')) initTargetProps(t); });
        updateOrganization();
        showScreen('screenGame');
        renderGame();
        document.getElementById('logContent').innerHTML = '';
        addLog('<span class="info">[读档]</span> 游戏已加载。');
        addLog(`<span class="log-year">=== 纪元 ${G.time}年 ===</span>`);
        yearActionsDone = false;
        beginYearActions();
    } catch (e) {
        alert('读档失败: ' + e.message);
    }
}

function resetGame() {
    if (!confirm('确定要重新开始吗？未保存的进度将丢失。')) return;
    G = null;
    showScreen('screenMenu');
    document.getElementById('gameInfo').textContent = '';
}

// ---- UI Helpers ----

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const isGame = id === 'screenGame';
    document.getElementById('orgPanel').style.display = isGame ? 'flex' : 'none';
    document.getElementById('recruitPanel').style.display = isGame ? 'flex' : 'none';
    document.getElementById('bottomPanels').style.display = isGame ? 'flex' : 'none';
    if (isGame) {
        document.querySelector('header').style.display = 'flex';
        document.addEventListener('keydown', handleGameKeydown);
    } else {
        document.querySelector('header').style.display = 'none';
        document.removeEventListener('keydown', handleGameKeydown);
    }
}

function handleGameKeydown(e) {
    if (document.getElementById('screenGame').classList.contains('active')) {
        // Character selection (a-z)
        if (!actingCharId && !yearActionsDone) {
            const key = e.key.toLowerCase();
            if (key >= 'a' && key <= 'z') {
                const idx = key.charCodeAt(0) - 97;
                const chars = G.chars.filter(c => !c.isDead);
                if (idx < chars.length) {
                    const c = chars[idx];
                    // Don't auto-skip 学者/艺人/劳工/士兵 — let the user see their auto-work result
                    selectChar(c.id);
                }
            }
        }

        // Action execution (1-9, shift+1-shift+0 for 10+)
        if (actingCharId) {
            const buttons = document.querySelectorAll('#actionBtns button');
            let actionIdx = -1;
            const key = e.key;
            if (!e.shiftKey && key >= '1' && key <= '9') {
                actionIdx = parseInt(key) - 1;
            } else if (e.shiftKey) {
                const shiftMap = { '!':0, '@':1, '#':2, '$':3, '%':4, '^':5, '&':6, '*':7, '(':8, ')':9 };
                if (shiftMap[key] !== undefined) {
                    actionIdx = shiftMap[key] + 9;
                }
            }

            if (actionIdx >= 0 && actionIdx < buttons.length) {
                e.preventDefault();
                buttons[actionIdx].click();
            }
        }

        // Enter on char detail to confirm action — not needed, but keep Enter for dismiss
        if (e.key === 'Escape') {
            closeOrgBreakdown();
            closeCharDetail();
        }
    }
}

function addLog(html) {
    const container = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = html;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function clearLog() {
    document.getElementById('logContent').innerHTML = '';
}

function exportLog() {
    const entries = document.querySelectorAll('#logContent .log-entry');
    const data = [];
    entries.forEach(e => data.push(e.innerHTML));
    const blob = new Blob([JSON.stringify(data)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'logs.txt';
    a.click();
    URL.revokeObjectURL(a.href);
}

function importLog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!Array.isArray(data)) throw new Error('格式错误');
                const container = document.getElementById('logContent');
                data.forEach(html => {
                    const entry = document.createElement('div');
                    entry.className = 'log-entry';
                    entry.innerHTML = html;
                    container.appendChild(entry);
                });
                container.scrollTop = container.scrollHeight;
            } catch (err) {
                alert('导入失败：文件格式不正确');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function toggleLayout() {
    const layout = document.getElementById('gameLayout');
    layout.classList.toggle('flipped');
}

// ---- Dev Mode ----

let DEV_CLICK_COUNT = 0;
let DEV_CLICK_TIMER = null;

toggleLayout = (function(orig) {
    return function() {
        orig.call(this);
        DEV_CLICK_COUNT++;
        const btn = document.getElementById('devCheatBtn');
        if (DEV_CLICK_COUNT >= 6) {
            DEV_CLICK_COUNT = 0;
            if (DEV_CLICK_TIMER) clearTimeout(DEV_CLICK_TIMER);
            const key = prompt('输入开发者密钥：');
            if (key === 'HsuHsieh') {
                if (btn) btn.style.display = '';
            } else {
                DEV_CLICK_COUNT = 0;
            }
        } else {
            if (DEV_CLICK_TIMER) clearTimeout(DEV_CLICK_TIMER);
            DEV_CLICK_TIMER = setTimeout(() => { DEV_CLICK_COUNT = 0; }, 2000);
        }
        if (DEV_CLICK_COUNT >= 4 && btn && btn.style.display !== 'none') {
            DEV_CLICK_COUNT = 0;
            if (DEV_CLICK_TIMER) clearTimeout(DEV_CLICK_TIMER);
            btn.style.display = 'none';
        } else {
            if (DEV_CLICK_TIMER) clearTimeout(DEV_CLICK_TIMER);
            DEV_CLICK_TIMER = setTimeout(() => { DEV_CLICK_COUNT = 0; }, 2000);
        }
    };
})(toggleLayout);

function showDevCheat() {
    const overlay = document.getElementById('devCheatOverlay');
    if (overlay) { overlay.remove(); return; }
    const div = document.createElement('div');
    div.id = 'devCheatOverlay';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:20000;display:flex;align-items:center;justify-content:center;';
    div.addEventListener('click', e => { if (e.target === div) div.remove(); });
    const box = document.createElement('div');
    box.style.cssText = 'background:#1a1a2e;border:1px solid #e94560;border-radius:12px;padding:24px;min-width:400px;max-width:600px;max-height:80vh;overflow-y:auto;';
    const title = document.createElement('h3');
    title.textContent = '开发者模式 - 角色编辑器';
    title.style.cssText = 'margin:0 0 12px;color:#e94560;';
    const sel = document.createElement('select');
    sel.style.cssText = 'width:100%;padding:6px;margin-bottom:12px;background:#16213e;color:#ccc;border:1px solid #0f3460;border-radius:4px;';
    const allChars = G ? getAllChars() : [];
    allChars.forEach((c, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = c.name + ' (' + STAT_LABELS[c.clazz] + ')';
        sel.appendChild(opt);
    });
    sel.addEventListener('change', renderDevStatFields);
    const fieldsDiv = document.createElement('div');
    fieldsDiv.id = 'devStatFields';
    const btn = document.createElement('button');
    btn.textContent = '应用修改';
    btn.style.cssText = 'margin-top:12px;padding:8px 24px;background:#e94560;color:#fff;border:none;border-radius:6px;cursor:pointer;';
    btn.addEventListener('click', applyDevEdits);
    box.appendChild(title);
    box.appendChild(sel);
    box.appendChild(fieldsDiv);
    box.appendChild(btn);
    div.appendChild(box);
    document.body.appendChild(div);
    renderDevStatFields();
}

function renderDevStatFields() {
    const sel = document.querySelector('#devCheatOverlay select');
    const fieldsDiv = document.getElementById('devStatFields');
    if (!sel || !fieldsDiv) return;
    const idx = parseInt(sel.value);
    const allChars = G ? getAllChars() : [];
    const c = allChars[idx];
    if (!c) return;
    const DEV_STAT_LABELS = { int:'智力', cha:'魅力', sta:'劳动力', sex:'性能力', psq:'体格', hel:'寿命', con:'魄力', wel:'财富', luc:'运气', cal:'灾厄', edu:'教育', exp:'经验' };
    let h = '<table style="width:100%;">';
    const devStats = ['int','cha','sta','sex','psq','hel','con','wel','luc','cal','edu','exp'];
    devStats.forEach(f => {
        h += `<tr><td style="padding:3px 6px;color:#aaa;">${DEV_STAT_LABELS[f]}</td>`;
        h += `<td><input type="number" data-field="${f}" value="${c[f] || 0}" style="width:60px;padding:2px 4px;background:#16213e;color:#fff;border:1px solid #0f3460;border-radius:3px;"></td></tr>`;
    });
    h += '</table>';
    fieldsDiv.innerHTML = h;
}

function applyDevEdits() {
    const sel = document.querySelector('#devCheatOverlay select');
    const idx = parseInt(sel.value);
    const allChars = G ? getAllChars() : [];
    const c = allChars[idx];
    if (!c) return;
    document.querySelectorAll('#devStatFields input[type="number"]').forEach(inp => {
        const f = inp.dataset.field;
        const v = parseInt(inp.value);
        if (!isNaN(v) && f in c) c[f] = v;
    });
    renderGame();
}

// ---- i18n / Localization ----

const LOCALE_DATA = {
  "_meta": {"locale":"zh-CN","name":"简体中文"},
  "UI_HEADER":{"game_title":"海地老皇帝","title_sub":"Monarchy L'Haiti Petit","btn_save":"存档","btn_export":"导出","btn_import":"读取","btn_load":"读档","btn_new_game":"新游戏","btn_toggle_layout":"⇔翻转","btn_docs":"文件","doc_info":"设定文档","doc_tutorial":"新手教程","doc_stats_char":"角色属性详解","doc_stats_org":"组织属性详解","year_display":"年{year}"},
  "UI_MENU":{"new_game":"新游戏","load_game":"读档","version":"v0.1.1.0","intro_title":"\"皇帝轮流坐，明年到我家。\"","intro_body":"在小海地这片土地上，在新秩序形成之前，这里除了腐朽的人们，什么都没有。但你不一样！你是一位有识之士，注定要领导、征战，在这片传奇的土地上用血与泪写下你的传奇！","intro_begin":"开始征程","select_character":"选择你的角色","select_surname":"选择国姓：","given_name":"名：","name_placeholder":"输入名字...","random":"随机","player_id":"玩家ID：","player_id_placeholder":"输入玩家ID...","hq_name":"驻地名称：","hq_placeholder":"输入办公地点...","hq_default":"办公室","confirm":"确认"},
  "UI_GAME":{"log_title":"游戏日志","btn_clear_log":"清空日志","btn_export_log":"导出日志","btn_import_log":"导入日志","char_list":"角色列表","btn_free_chars":"自由角色","btn_worker_chars":"职人角色","action_title":"行动","action_hint":"选择一个角色来执行行动","btn_next_year":"下一年 →","tab_court":"内阁","tab_harem":"后宫","tab_unavailable":"不可用角色","tab_dead":"死亡角色","panel_recruit_normal":"常规人才","panel_recruit_bounty":"悬赏招募","panel_recruit_special":"特殊人才","panel_map":"地图","panel_history":"历史人物"},
  "UI_CHAR_CARD":{"age_year":"{age}岁","leader":"领袖","acted":"已行动","status_alive":"存活","status_dead":"已故","status_killed":"被杀","status_retired":"隐退","status_exiled":"流放","status_dormant":"未觉醒","parents":"父母：","children":"子女：","grandparents":"祖辈：","lovers":"情人：","spouse":"配偶","none":"无","yr":"岁"},
  "UI_CONQUEST":{"tab_action":"行动","tab_conquest":"征服","in_progress":"征服进行中 · 剩余{remain}年","expedition":"征战：{names}","pending_keys":"关键条件待验证：{count}条","verify":"验证","confirm_verify":"确认验证","cancel":"取消","verify_condition":"验证条件：{name}","weight_hint":"分配权重（每项最大值={max}%，总计≤100%）","live_hint":"基础检定值（不含军事/民心/天命随机修正）","total_weight":"总权重：{weight}%","weight_exceed":"总权重超过100%","player_label":"玩家","opponent_label":"对手","conquest_hint":"详情请查看行动面板的「征服」选项卡","victory_screen_continue":"继续游戏","condition_labels":{"tec":"科技","cul":"文化","prd":"生产","pop":"人口","mil":"军事","inf":"民心","tre":"银库"}},
  "STAT_LABELS":{"int":"智力","cha":"魅力","sta":"劳动力","sex":"性能力","psq":"体格","hel":"寿命","con":"魄力","wel":"财富","luc":"运气","cal":"灾厄","edu":"教育","exp":"经验"},
  "ORG_LABELS":{"tec":"科技","cul":"文化","prd":"生产","pop":"人口","mil":"军事","inf":"民心","tre":"银库","apo":"灾厄","mdt":"天命","lvl":"等级"},
  "HISTORY_LABELS":{"science":"科学","art":"艺术","labor":"劳动","dating":"约会","rest":"休息","birth":"生育"},
  "CH_LABELS":{"0":"失败","1":"成功","2":"大成功","3":"超大成功"},
  "EVENT_LABELS":{"entry":"入场","exit":"退场","appoint":"就职","demote":"解职","marry":"娶亲","childbirth":"生育","coup":"政变","dice_crit":"大成功","dice_fail":"大失败","exile":"流放","kill":"杀害","summon":"召集","family_exit":"家族退场"},
  "ORG_LEVEL_NAMES":["办公室","街道","镇","县","省","国"],
  "TARGET_TYPES":{"infrastructure":"基础设施","admin":"行政区域","hq":"驻地范围"},
  "MISC":{"player_info":"玩家: {id}  |  纪元: {year}年","founder_info":"{surname} 等级:{level}","year_display":"年{year}","click_char_to_act":"点击一个角色来执行行动"},
  "MAP":{"conquered":"已占领","unconquered":"未占领","selected":"选中：{name}","minxin":"民{val}","tiantian":"天{val}"},
  "TARGET_DETAIL":{"stats_tec":"科技：","stats_cul":"文化：","stats_prd":"生产：","stats_pop":"人口：","stats_mil":"军事：","stats_inf":"民心：","stats_tre":"银库：","stats_apo":"灾厄：","stats_mdt":"天命："},
  "ACTIONS":{"govern":"理政","teach":"执教","nothing":"无所事事","retire":"隐退","rest":"休息","elderly_care":"养老","squeeze":"压榨","drill":"演兵"},
  "HISTORY":{"no_figures":"暂无历史人物。","view_more":"查看更多 →"},
  "BIOGRAPHY":{"btn_remove_from_history":"移出历史","btn_export_biography":"导出生平","btn_move_to_history":"移入历史记录"},
  "DETAIL_PANEL":{"entry_age":"入场年龄：{age}岁","exit_info":"退场于纪元{year}年（{age}岁）","parents":"父母：","children":"子女：","grandparents":"祖辈：","lovers":"情人：","char_header":"{name} {gender} {age}岁"},
  "GAME_OVER":{"reason_mdt_depleted":"天命已尽","reason_collapse":"组织已散","btn_export":"导出存档","btn_return":"返回菜单","stat_tech":"科技：","stat_culture":"文化：","stat_prod":"生产：","stat_pop":"人口：","stat_mdt":"天命：","stat_level":"等级：","survivors":"存活角色：","departed":"退场角色：","historical":"历史人物：","era":"纪元 {years}年","title":"· 游戏结束","filename":"海地老皇帝_存档_{name}_纪元{year}.txt"},
  "COURT_TAB":{"chancellor":"宰相","overseer":"监工","general":"将军","empress":"正宫","lovers":"情人","harem_empty":"后宫空缺。","unavailable":"不可用角色","dead":"死亡角色","current":"{name}[{prof}]{age}岁","qualified":"具备任职资格","candidate":"候","none":"没有任何具备资格的角色。"}
};
let CURRENT_LOCALE = 'zh-CN';

function __(key, params) {
    const keys = key.split('.');
    let val = LOCALE_DATA;
    for (const k of keys) {
        if (!val || typeof val !== 'object') return key;
        val = val[k];
    }
    if (typeof val !== 'string') return key;
    if (!params) return val;
    return val.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}

function loadLocale(locale, callback) {
    if (locale === 'zh-CN') {
        CURRENT_LOCALE = 'zh-CN';
        if (callback) callback();
        return;
    }
    const embedded = { 'en-US': window.LOCALE_EN_US, 'zh-TW': window.LOCALE_ZH_TW };
    if (embedded[locale]) {
        CURRENT_LOCALE = locale;
        Object.assign(LOCALE_DATA, embedded[locale]);
        if (callback) callback();
        return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'lang/' + locale + '.json', true);
    xhr.onload = function() {
        if (xhr.status === 0 || xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                Object.assign(LOCALE_DATA, data);
                CURRENT_LOCALE = locale;
            } catch (e) {
                CURRENT_LOCALE = 'zh-CN';
            }
        } else {
            CURRENT_LOCALE = 'zh-CN';
        }
        if (callback) callback();
    };
    xhr.onerror = function() {
        CURRENT_LOCALE = 'zh-CN';
        if (callback) callback();
    };
    xhr.send();
}

function setLanguage(locale) {
    loadLocale(locale, () => {
        if (G && G.organization) renderGame();
        document.querySelectorAll('.i18n').forEach(el => {
            const k = el.dataset.i18n;
            if (k) el.textContent = __(k, el.dataset.i18nParams ? JSON.parse(el.dataset.i18nParams) : undefined);
        });
    });
}

function showLangMenu(event) {
    const existing = document.getElementById('langMenuOverlay');
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'langMenuOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;';
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const rect = event.target.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.style.cssText = `position:fixed;top:${rect.bottom + 4}px;${rect.left > window.innerWidth/2 ? 'right' : 'left'}:${rect.left > window.innerWidth/2 ? window.innerWidth - rect.right : rect.left}px;background:#1a1a2e;border:1px solid #0f3460;border-radius:6px;padding:12px 16px;z-index:10001;min-width:140px;box-shadow:0 4px 16px rgba(0,0,0,0.4);text-align:center;`;
    menu.addEventListener('click', e => e.stopPropagation());

    const msg = document.createElement('div');
    msg.textContent = '本地化功能开发中！';
    msg.style.cssText = 'color:#888;font-size:0.8rem;';

    menu.appendChild(msg);
    overlay.appendChild(menu);
    document.body.appendChild(overlay);
}

// ---- Documents ----

function showDocsMenu(event) {
    const dd = document.getElementById('docsDropdown');
    if (dd.style.display === 'block') { dd.style.display = 'none'; return; }
    dd.style.display = 'block';
    event.stopPropagation();
    const close = e => { dd.style.display = 'none'; document.removeEventListener('click', close); };
    setTimeout(() => document.addEventListener('click', close), 0);
}

function openDoc(filename) {
    document.getElementById('docsDropdown').style.display = 'none';
    const overlay = document.getElementById('docOverlay');
    const title = document.getElementById('docOverlayTitle');
    const body = document.getElementById('docOverlayBody');
    title.textContent = filename === 'info.txt' ? '设定文档' : filename === 'tutorial.txt' ? '新手教程' : filename === 'stats_char.txt' ? '角色属性详解' : '组织属性详解';
    body.textContent = window.DOC_DATA && window.DOC_DATA[filename] ? window.DOC_DATA[filename] : '文档内容不可用。';
    overlay.style.display = 'flex';
}

function closeDocOverlay() {
    document.getElementById('docOverlay').style.display = 'none';
}

// ---- Init ----

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('header').style.display = 'none';
    showScreen('screenMenu');

    // Load default locale
    loadLocale('zh-CN');

    // Check URL for auto-load
    if (localStorage.length > 0) {
        const saveKeys = Object.keys(localStorage).filter(k => k.startsWith('pslavery_save_'));
        if (saveKeys.length > 0) {
            const autoLoad = confirm('检测到存档，是否自动加载？');
            if (autoLoad) {
                doLoad(saveKeys[0]);
            }
        }
    }
});

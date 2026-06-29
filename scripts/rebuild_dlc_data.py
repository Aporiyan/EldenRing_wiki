"""
Rebuild ALL DLC non-weapon data files from v1.16.1 param data + HigorFr FMG Chinese names.

Strategy:
- For each DLC type, iterate over EXISTING frontend items (keyed by English name)
- Look up Chinese name from name_map.json (and DLC_NAME_MAP as fallback)
- Search FMG entries for a fuzzy match to find the param ID
- Update the item with the correct v1.16.1 ID and numeric values
- Keep existing descriptions, summaries, and other non-param fields
"""
import json, os, sys, re
sys.stdout.reconfigure(encoding='utf-8')

ROOT = r'D:\Aporiyan\EldenRing_wiki'
V116_DIR = os.path.join(ROOT, 'data', 'v1.16.1_named')
DATA_DIR = os.path.join(ROOT, 'public', 'data')
TMP_DIR = os.path.join(ROOT, 'tmp_conv')

# ============================================================
#  Loaders
# ============================================================
def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    def round_floats(o, precision=4):
        if isinstance(o, float):
            return round(o, precision)
        elif isinstance(o, dict):
            return {k: round_floats(v, precision) for k, v in o.items()}
        elif isinstance(o, list):
            return [round_floats(v, precision) for v in o]
        return o
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(round_floats(data), f, ensure_ascii=False, indent=1)

def load_v116(name):
    path = os.path.join(V116_DIR, f'{name}.param.json')
    return load_json(path) if os.path.exists(path) else None

def load_fmg(higor_data, fmg_path):
    for key, fmg in higor_data.items():
        if key.endswith(fmg_path):
            return fmg
    return {}

# ============================================================
#  Chinese name normalization & matching
# ============================================================
# Suffix variations to strip when comparing
CN_SUFFIXES = ['子', '儿', '派', '帽', '铠', '裤', '鞋', '脚', '头']
CN_CHAR_MAP = {
    '米丽安的消失': '米莉安的隐身',
    '辉石指爪': '辉石钉',
    '辉石繁指爪': '辉石钉雨',
    '辉石迅魔砾': '迅辉石魔砾',
    '辉石彗星': '辉石彗星',
    '旋飞魔砾': '旋飞魔砾',
    '辉石流星': '辉石流星',
    '流星雨': '流星雨',
    '结晶连弹': '结晶连弹',
    '辉石弯弧': '辉石弯弧',
    '海摩炮弹': '海摩炮弹',
    '结晶散射': '结晶散射',
    '爆碎岩盘': '爆碎岩盘',
    '爆破岩盘': '爆破岩盘',
    '海摩大槌': '海摩大槌',
    '魔法之境': '魔法之境',
    '星光': '星光',
    '彗星亚兹勒': '彗星亚兹勒',
    '创星雨': '创星雨',
    '毁灭流星': '毁灭流星',
    '辉剑圆阵': '辉剑圆阵',
    '卡利亚圆阵': '卡利亚圆阵',
    '巨剑阵': '巨剑阵',
    '蕾娜菈的满月': '蕾娜菈的满月',
    '菈妮的暗月': '菈妮的暗月',
    '天降魔力': '天降魔力',
    '罗蕾塔的大弓': '罗蕾塔的大弓',
    '罗蕾塔的绝招': '罗蕾塔的绝招',
    '魔法辉剑': '魔法辉剑',
    '辉石冰块': '辉石冰块',
    '萨米尔冰风暴': '萨米尔冰风暴',
    '冰雾': '冰雾',
    '卡利亚大剑': '卡利亚大剑',
    '亚杜拉的月光剑': '亚杜拉的月光剑',
    '卡利亚迅剑': '卡利亚迅剑',
    '卡利亚贯刺': '卡利亚贯刺',
    '魔力武器': '魔力武器',
    '魔力盾牌': '魔力盾牌',
    '镇定': '镇定',
    '结冰武器': '结冰武器',
    '爆散结晶': '爆散结晶',
    '飞散结晶': '飞散结晶',
    '奔放结晶': '奔放结晶',
    '奇袭魔砾': '奇袭魔砾',
    '黑夜魔砾': '黑夜魔砾',
    '黑夜彗星': '黑夜彗星',
    '托普斯的力场': '托普斯的力场',
    '卡利亚式奉还': '卡利亚式奉还',
    '亘古黑暗': '亘古黑暗',
    '无形刀刃': '无形刀刃',
    '化为无形': '化为无形',
    '陨石': '陨石',
    '艾丝缇陨石': '艾丝缇陨石',
    '岩石球': '岩石球',
    '重力球': '重力球',
    '碎星': '碎星',
    '熔岩球': '熔岩球',
    '格密尔之怒': '格密尔之怒',
    '滚烫熔岩': '滚烫熔岩',
    '拉卡德的怨魂': '拉卡德的怨魂',
    '罪恶荆棘': '罪恶荆棘',
    '责罚荆棘': '责罚荆棘',
    '召唤怨魂': '召唤怨魂',
    '古老死亡怨魂': '古老死亡怨魂',
    '迸发灵火': '迸发灵火',
    '菲雅烟雾': '菲雅烟雾',
    '提比亚的唤声': '提比亚的唤声',
    '死亡雷击': '死亡雷击',
    '神谕泡泡': '神谕泡泡',
    '神谕大泡泡': '神谕大泡泡',
    '多重合羽': '多重合羽',
}

# Hardcoded FMG Chinese → English name mappings for items where fuzzy matching fails
# Format: (FMG_chinese_name, english_name)
FMG_TO_ENGLISH_OVERRIDE = {
    # === ARMOR ===
    '丹恩帽子': "Dane's Hat",
    '落叶派长袍': "Dryleaf Robe",
    '落叶派腕套': "Dryleaf Arm Wraps",
    '落叶派长靴': "Dryleaf Cuissardes",
    '落叶派长袍（轻装）': "Dryleaf Robe (Altered)",
    '盖乌斯头盔': "Gaius's Helm",
    '盖乌斯铠甲': "Gaius's Armor",
    '盖乌斯臂甲': "Gaius's Gauntlets",
    '盖乌斯腿甲': "Gaius's Greaves",
    '誓约骑士头盔': "Oathseeker Knight Helm",
    '誓约骑士铠甲': "Oathseeker Knight Armor",
    '誓约骑士臂甲': "Oathseeker Knight Gauntlets",
    '誓约骑士腿甲': "Oathseeker Knight Greaves",
    '蕾妲铠甲': "Leda's Armor",
    '铜绿头盔': "Verdigris Helm",
    '铜绿铠甲': "Verdigris Armor",
    '铜绿臂甲': "Verdigris Gauntlets",
    '铜绿腿甲': "Verdigris Greaves",
    '拉鲁瓦毛皮': "Pelt of Ralva",
    '铁铆钉上衣': "Iron Rivet Armor",
    '铁铆钉臂甲': "Iron Rivet Gauntlets",
    '铁铆钉腿甲': "Iron Rivet Greaves",
    '狮牙头盔': "Fang Helm",
    '休里耶面具': "Thiollier's Mask",
    '休里耶上衣': "Thiollier's Garb",
    '休里耶长手套': "Thiollier's Gloves",
    '休里耶长裤': "Thiollier's Trousers",
    '休里耶上衣（轻装）': "Thiollier's Garb (Altered)",
    '大祭司帽子': "High Priest Hat",
    '大祭司长袍': "High Priest Robe",
    '大祭司长手套': "High Priest Gloves",
    '大祭司衬裤': "High Priest Undergarments",
    '指头长袍': "Finger Robe",
    '毛虫面具': "Caterpillar Mask",
    '编绳长袍': "Braided Cord Robe",
    '编绳腕套': "Braided Arm Wraps",
    '破旧兜裆布': "Soiled Loincloth",
    '舞娘风帽': "Dancer's Hood",
    '舞娘连身裙': "Dancer's Dress",
    '舞娘臂甲': "Dancer's Bracer",
    '舞娘长裤': "Dancer's Trousers",
    '舞娘连身裙（轻装）': "Dancer's Dress (Altered)",
    '黑夜头盔': "Helm of Night",
    '黑夜铠甲': "Armor of Night",
    '黑夜臂甲': "Gauntlets of Night",
    '黑夜腿甲': "Greaves of Night",
    '埃贡头盔': "Igon's Helm",
    '埃贡铠甲': "Igon's Armor",
    '埃贡臂甲': "Igon's Gauntlets",
    '埃贡腰巾': "Igon's Loincloth",
    '埃贡头盔（轻装）': "Igon's Helm (Altered)",
    '埃贡铠甲（轻装）': "Igon's Armor (Altered)",
    '老贤者面具': "Wise Man's Mask",
    '安帕赫上衣': "Ansbach's Attire",
    '安帕赫腕套': "Ansbach's Manchettes",
    '安帕赫靴子': "Ansbach's Boots",
    '安帕赫上衣（轻装）': "Ansbach's Attire (Altered)",
    '弗蕾亚头盔': "Freyja's Helm",
    '弗蕾亚铠甲': "Freyja's Armor",
    '弗蕾亚臂甲': "Freyja's Gauntlets",
    '弗蕾亚腿甲': "Freyja's Greaves",
    '弗蕾亚铠甲（轻装）': "Freyja's Armor (Altered)",
    '孤牢头盔': "Helm of Solitude",
    '孤牢铠甲': "Armor of Solitude",
    '孤牢臂甲': "Gauntlets of Solitude",
    '孤牢腿甲': "Greaves of Solitude",
    '孤牢铠甲（轻装）': "Armor of Solitude (Altered)",
    '梅瑟莫士兵头盔': "Messmer Soldier Helm",
    '梅瑟莫士兵铠甲': "Messmer Soldier Armor",
    '梅瑟莫士兵臂甲': "Messmer Soldier Gauntlets",
    '梅瑟莫士兵腿甲': "Messmer Soldier Greaves",
    '梅瑟莫士兵铠甲（轻装）': "Messmer Soldier Armor (Altered)",
    '梅瑟莫头盔': "Messmer's Helm",
    '梅瑟莫铠甲': "Messmer's Armor",
    '梅瑟莫臂甲': "Messmer's Gauntlets",
    '梅瑟莫腿甲': "Messmer's Greaves",
    '梅瑟莫铠甲（轻装）': "Messmer's Armor (Altered)",
    '幽影恶兵头盔': "Shadow Militiaman Helm",
    '幽影恶兵铠甲': "Shadow Militiaman Armor",
    '幽影恶兵臂甲': "Shadow Militiaman Gauntlets",
    '幽影恶兵腿甲': "Shadow Militiaman Greaves",
    '黑骑士头盔': "Black Knight Helm",
    '黑骑士铠甲': "Black Knight Armor",
    '黑骑士臂甲': "Black Knight Gauntlets",
    '黑骑士腿甲': "Black Knight Greaves",
    '黑骑士头盔（轻装）': "Black Knight Helm (Altered)",
    '黑骑士铠甲（轻装）': "Black Knight Armor (Altered)",
    '神兽头盔': "Divine Beast Helm",
    '神兽铠甲': "Divine Beast Armor",
    '神兽臂甲': "Divine Beast Gauntlets",
    '神兽腿甲': "Divine Beast Greaves",
    '神兽头盔（轻装）': "Divine Beast Helm (Altered)",
    '神兽铠甲（轻装）': "Divine Beast Armor (Altered)",
    '角民风帽': "Hornsent Hood",
    '角民铠甲': "Hornsent Armor",
    '角民臂甲': "Hornsent Gauntlets",
    '角民腿甲': "Hornsent Greaves",
    '角民风帽（轻装）': "Hornsent Hood (Altered)",
    '角民铠甲（轻装）': "Hornsent Armor (Altered)",
    '罗刹头盔': "Rakshasa Helm",
    '罗刹铠甲': "Rakshasa Armor",
    '罗刹臂甲': "Rakshasa Gauntlets",
    '罗刹腿甲': "Rakshasa Greaves",
    '蕾菈娜头盔': "Rellana's Helm",
    '蕾菈娜铠甲': "Rellana's Armor",
    '蕾菈娜臂甲': "Rellana's Gauntlets",
    '蕾菈娜腿甲': "Rellana's Greaves",
    '蕾菈娜铠甲（轻装）': "Rellana's Armor (Altered)",
    '蕾菈娜手套': "Rellana's Gloves",
    '红熊铠甲': "Red Bear's Armor",
    '红熊铠甲（轻装）': "Red Bear's Armor (Altered)",
    '火焰骑士头盔': "Fire Knight Helm",
    '火焰骑士铠甲': "Fire Knight Armor",
    '火焰骑士臂甲': "Fire Knight Gauntlets",
    '火焰骑士腿甲': "Fire Knight Greaves",
    '火焰骑士铠甲（轻装）': "Fire Knight Armor (Altered)",
    '死骑士头盔': "Death Knight Helm",
    '死骑士铠甲': "Death Knight Armor",
    '死骑士臂甲': "Death Knight Gauntlets",
    '死骑士腿甲': "Death Knight Greaves",
    '摩尔头盔': "Moore's Helm",
    '摩尔铠甲': "Moore's Armor",
    '摩尔臂甲': "Moore's Gauntlets",
    '摩尔腿甲': "Moore's Greaves",
    '摩尔铠甲（轻装）': "Moore's Armor (Altered)",
    '角战士头盔': "Horned Warrior Helm",
    '角战士铠甲': "Horned Warrior Armor",
    '角战士臂甲': "Horned Warrior Gauntlets",
    '角战士腿甲': "Horned Warrior Greaves",
    '角战士铠甲（轻装）': "Horned Warrior Armor (Altered)",
    '年少狮子头盔': "Young Lion's Helm",
    '年少狮子铠甲': "Young Lion's Armor",
    '年少狮子臂甲': "Young Lion's Gauntlets",
    '年少狮子腿甲': "Young Lion's Greaves",
    '年少狮子铠甲（轻装）': "Young Lion's Armor (Altered)",
    '士兵头盔': "Common Soldier Helm",
    '士兵软铠甲': "Common Soldier Cloth Armor",
    '普通士兵铠甲': "Common Soldier Armor",
    '士兵臂甲': "Common Soldier Gauntlets",
    '士兵腿甲': "Common Soldier Greaves",
    '修行者风帽': "Ascetic's Hood",
    '修行者长袍': "Ascetic's Robe",
    '修行者腰巾': "Ascetic's Loincloth",
    '修行者风帽（轻装）': "Ascetic's Hood (Altered)",
    '修行者长袍（轻装）': "Ascetic's Robe (Altered)",
    '修行者手环': "Ascetic's Wrist Guards",
    '修行者脚环': "Ascetic's Ankle Guards",
    '荣誉上衣': "Gloried Attire",
    '荣誉上衣（轻装）': "Gloried Attire (Altered)",
    '黑夜套装风帽': "Night's Set Hood",
    '高原头盔': "Highland Helm",
    '高原铠甲': "Highland Armor",
    '高原臂甲': "Highland Gauntlets",
    '高原腿甲': "Highland Greaves",
    '高原铠甲（轻装）': "Highland Armor (Altered)",
    '高地上衣': "Highland Attire",
    '光芒头冠': "Circlet of Light",
    '熔炉槌形盔': "Crucible Hammer-Helm",
    '死亡面具头盔': "Death Mask Helm",
    '神兽头部': "Divine Beast Head",
    '托莉娜孤花': "St. Trina's Blossom",
    '大壶头罩': "Greatjar",
    '小恶魔头罩（狮子）': "Imp Head (Lion)",
    '带翼蛇头盔': "Winged Serpent Helm",
    '圣兽头部': "Sacred Beast Head",
    '萨赞风帽': "Salza's Hood",
    '神兽战士铠甲': "Divine Beast Warrior Armor",
    '神鸟头盔': "Divine Bird Helm",
    '神鸟战士铠甲': "Divine Bird Warrior Armor",
    '神鸟战士臂甲': "Divine Bird Warrior Gauntlets",
    '神鸟战士腿甲': "Divine Bird Warrior Greaves",
    '守墓鸟脚环': "Gravebird Anklets",
    '守墓鸟手环': "Gravebird Bracelets",
    '守墓鸟黑羽铠甲': "Gravebird's Blackquill Armor",
    '守墓鸟头盔': "Gravebird Helm",
    '守墓鸟铠甲': "Gravebird Armor",
    '墓鸟臂甲': "Gravebird Gauntlets",
    '墓鸟腿甲': "Gravebird Greaves",
    '皮革头带': "Leather Headband",
    '皮革腕套': "Leather Arm Wraps",
    '皮革绑腿': "Leather Leg Wraps",
    '皮革头盔': "Leather Crown",
    '咒剑士面具': "Curseblade Mask",
    '梅瑟莫头盔（轻装）': "Messmer's Helm (Altered)",

    # === GEMS (Ashes of War) ===
    '战灰：落叶旋风脚': "Ash of War: Dryleaf Whirlwind",
    '战灰：熔炉百相之羽': "Ash of War: Aspects of the Crucible: Wings",
    '战灰：重力旋刺': "Ash of War: Spinning Gravity Thrust",
    '战灰：发劲': "Ash of War: Palm Blast",
    '战灰：贯穿投掷': "Ash of War: Piercing Throw",
    '战灰：多重投掷': "Ash of War: Scattershot Throw",
    '战灰：四面火花香': "Ash of War: Wall of Sparks",
    '战灰：串联火花香': "Ash of War: Rolling Sparks",
    '战灰：野兽突袭': "Ash of War: Raging Beast",
    '战灰：野兽爪击': "Ash of War: Savage Claws",
    '战灰：死角一击': "Ash of War: Blind Spot",
    '战灰：迅斩': "Ash of War: Swift Slash",
    '战灰：大上段': "Ash of War: Overhead Stance",
    '战灰：单翼架式': "Ash of War: Wing Stance",
    '战灰：瞬雷': "Ash of War: Blinkbolt",
    '战灰：火焰穿刺': "Ash of War: Flame Skewer",
    '战灰：勇猛狮子斩': "Ash of War: Savage Lion's Claw",
    '战灰：神兽冻霜踏地': "Ash of War: Divine Beast Frost Stomp",
    '战灰：火焰枪': "Ash of War: Flame Spear",
    '战灰：尊矣卡利亚': "Ash of War: Carian Sovereignty",
    '战灰：悲恸惨叫': "Ash of War: Shriek of Sorrow",
    '战灰：唤起灵火': "Ash of War: Ghostflame Call",
    '战灰：双刺毒花': "Ash of War: The Poison Flower Blooms Twice",
    '战灰：埃贡的猎龙': "Ash of War: Igon's Drake Hunt",
    '战灰：盾牌攻击': "Ash of War: Shield Strike",

    # === SPELLS (from GoodsName_dlc01) ===
    '米丽安的消失': "Miriam's Vanishing",
    '魔法三辉剑': "Glintblade Trio",
    '蕾菈娜的双月': "Rellana's Twin Moons",
    '辉石指爪': "Glintstone Nail",
    '辉石繁指爪': "Glintstone Nails",
    '岩块刀刃': "Blades of Stone",
    '引力球': "Gravitational Missile",
    '棘刺上身': "Mantle of Thorns",
    '拒绝的刺': "Impenetrable Thorns",
    '灵魂光环': "Rings of Spectral Light",
    '融泥漩': "Vortex of Putrescence",
    '融泥块': "Mass of Putrescence",
    '安帕赫的狂刃': "Furious Blade of Ansbach",
    '远方之恢复': "Heal from Afar",
    '熔炉百相之针': "Aspects of the Crucible: Thorns",
    '熔炉百相之花': "Aspects of the Crucible: Bloom",
    '小黄金树': "Minor Erdtree",
    '幽影之地': "Land of Shadow",
    '远方之怒': "Wrath from Afar",
    '米凯拉的光': "Light of Miquella",
    '相迭光环': "Multilayered Ring of Light",
    '鲁格利亚的咆哮': "Roar of Rugalea",
    '骑士雷电枪': "Knight's Lightning Spear",
    '芙柔桑克斯的龙雷': "Dragonbolt of Florissax",
    '带电': "Electrocharge",
    '贝勒的残虐': "Bayle's Tyranny",
    '贝勒的焰雷': "Bayle's Flame Lightning",
    '灵火吐息': "Ghostflame Breath",
    '腐败蝶': "Rotten Butterflies",
    '虫丝枪': "Pest-Thread Spears",
    '米德拉的癫火': "Midra's Flame of Frenzy",
    '虚幻小宇宙': "Fleeting Microcosm",
    '守护指头': "Cherishing Fingers",
    '守护灵': "Watchful Spirit",
    '黄金弯弧': "Golden Arcs",
    '黄金大弯弧': "Giant Golden Arc",
    '旋流': "Spira",
    '神兽龙卷风': "Divine Beast Tornado",
    '神鸟羽毛': "Divine Bird Feathers",
    '火焰蛇': "Fire Serpent",
    '火焰雨': "Rain of Fire",
    '梅瑟莫的火球': "Messmer's Orb",

    # === TALISMANS ===
    '红琥珀链坠＋３': "Crimson Amber Medallion +3",
    '蓝琥珀链坠＋３': "Cerulean Amber Medallion +3",
    '绿琥珀链坠＋３': "Viridian Amber Medallion +3",
    '健壮角饰品＋２': "Stalwart Horn Charm +2",
    '免疫角饰品＋２': "Immunizing Horn Charm +2",
    '理智角饰品＋２': "Clarifying Horn Charm +2",
    '斑斓项链＋２': "Mottled Necklace +2",
    '魔力龙徽护符＋３': "Spelldrake Talisman +3",
    '火龙徽护符＋３': "Flamedrake Talisman +3",
    '雷龙徽护符＋３': "Boltdrake Talisman +3",
    '珍珠龙徽护符＋３': "Pearldrake Talisman +3",
    '红种子护符＋１': "Crimson Seed Talisman +1",
    '蓝种子护符＋１': "Cerulean Seed Talisman +1",
    '金黄色编发': "Golden Braid",
    '恩惠蓝露滴护符': "Blessed Blue Dew Talisman",
    '熔炉薄翼护符': "Fine Crucible Feather Talisman",
    '外在神祇的传说': "Outer God Heirloom",
    '裂石护符': "Shattered Stone Talisman",
    '圣战徽章': "Crusade Insignia",
    '老翁的欢愉': "Aged One's Exultation",
    '远硬箭护符': "Arrow's Soaring Sting Talisman",
    '干枯花束': "Dried Bouquet",
    '锻造术护符': "Smithing Talisman",
    '疾病护符': "Ailment Talisman",
    '回击交错树': "Retaliatory Crossed-Tree",
    '贯刺交错树': "Lacerating Crossed-Tree",
    '狙击弓护符': "Sharpshot Talisman",
    '狂龙护符': "Talisman of the Dread",
    '狂怒神兽': "Enraged Divine Beast",
    '亲爱的星尘': "Beloved Stardust",
    '王受赐护符': "Talisman of Lord's Bestowal",
    '铜绿圆碟': "Verdigris Discus",
    '蕾菈娜的浮雕坠饰': "Rellana's Cameo",
    '介错刀': "Blade of Mercy",

    # === SPIRIT ASHES ===
    '咒剑士米拉': "Curseblade Meera",
    '血怪咒术师的骨灰': "Bloodfiend Hexer's Ashes",
    '守墓鸟的骨灰': "Gravebird Ashes",
    '蜘蛛蝎的骨灰': "Spider Scorpion Ashes",
    '拷问官的骨灰': "Inquisitor Ashes",
    '梅瑟莫士兵的骨灰': "Messmer Soldier Ashes",
    '大嘴小恶魔的骨灰': "Bigmouth Imp Ashes",
    '人形苍蝇的骨灰': "Man-Fly Ashes",
    '角战士的骨灰': "Horned Warrior Ashes",
    '指虫的骨灰': "Fingercreeper Ashes",
    '约兰与安娜': "Jolán and Anna",
}

# Overrides for base-game items that share FMG entries (only match DLC IDs)
SPIRIT_ASH_DLC_OVERRIDE = {
    '咒剑士米拉': "Curseblade Meera",
    '血怪咒术师的骨灰': "Bloodfiend Hexer's Ashes",
    '守墓鸟的骨灰': "Gravebird Ashes",
    '火焰骑士希德': "Fire Knight Hilde",
    '蜘蛛蝎的骨灰': "Spider Scorpion Ashes",
    '拷问官的骨灰': "Inquisitor Ashes",
    '亚人剑士约西': "Demi-Human Swordsman Yosh",
    '梅瑟莫士兵的骨灰': "Messmer Soldier Ashes",
    '黑骑士团长安卓斯': "Black Knight Commander Andreas",
    '黑骑士副团长修': "Black Knight Captain Huw",
    '大嘴小恶魔的骨灰': "Bigmouth Imp Ashes",
    '人形苍蝇的骨灰': "Man-Fly Ashes",
    '锻造魔像泰乌尔': "Taylew the Golem Smith",
    '神鸟战士奥尼斯': "Divine Bird Warrior Ornis",
    '角战士的骨灰': "Horned Warrior Ashes",
    '古龙芙柔桑克斯': "Ancient Dragon Florissax",
    '指虫的骨灰': "Fingercreeper Ashes",
    '火焰骑士昆兰': "Fire Knight Queelign",
    '黑夜剑士约兰': "Swordhand of Night Jolán",
    '约兰与安娜': "Jolán and Anna",
}

def normalize_cn(s):
    """Normalize Chinese name for comparison."""
    s = s.strip()
    # Strip leading/trailing quotes
    s = s.strip('"''"')
    # Remove common trailing suffix chars
    for suffix in CN_SUFFIXES:
        if s.endswith(suffix) and len(s) > 3:
            s = s[:-1]
            break
    return s

def find_english_name(eng_name, fmg_cn_map, name_map, reverse_map, existing_data):
    """
    For a given English item name, find its Chinese name and then find the
    matching FMG entry. Returns param_id or None.
    """
    # 1. Check override map first
    for fmg_cn, fmg_eng in FMG_TO_ENGLISH_OVERRIDE.items():
        if fmg_eng == eng_name and fmg_cn in fmg_cn_map:
            return fmg_cn_map[fmg_cn]

    # 2. Try from name_map
    cn = name_map.get(eng_name, '')
    if cn:
        if cn in fmg_cn_map:
            return fmg_cn_map[cn]
        cn_norm = normalize_cn(cn)
        for fmg_cn, fmg_id in fmg_cn_map.items():
            fmg_norm = normalize_cn(fmg_cn)
            if cn_norm == fmg_norm:
                return fmg_id
            if cn in fmg_cn or fmg_cn in cn:
                return fmg_id

    # 3. Special handling for spirit ashes: try to match only the base name
    # e.g., "咒剑士米拉" vs "咒剑士米拉＋１"
    if '＋' in eng_name or '骨灰' in eng_name:
        base_cn = cn
        if base_cn:
            for fmg_cn, fmg_id in fmg_cn_map.items():
                if base_cn in fmg_cn:
                    return fmg_id

    return None


def find_param_id(eng_name, fmg_cn_map, name_map):
    """
    Direct lookup: given English name, find Chinese name, then find FMG key.
    Only used for non-armor types where the override map + name_map should cover everything.
    """
    # Override map
    for fmg_cn, fmg_eng in FMG_TO_ENGLISH_OVERRIDE.items():
        if fmg_eng == eng_name and fmg_cn in fmg_cn_map:
            return fmg_cn_map[fmg_cn]

    # name_map
    cn = name_map.get(eng_name, '')
    if cn and cn in fmg_cn_map:
        return fmg_cn_map[cn]

    # fuzzy
    if cn:
        for fmg_cn, fmg_id in fmg_cn_map.items():
            if cn in fmg_cn or fmg_cn in cn:
                return fmg_id
            if normalize_cn(cn) == normalize_cn(fmg_cn):
                return fmg_id

    return None


# ============================================================
#  Armor (EquipParamProtector) field mapping
# ============================================================
ARMOR_SLOT_FLAGS = [
    ('headEquip:1', 'Head'),
    ('bodyEquip:1', 'Body'),
    ('armEquip:1', 'Arms'),
    ('legEquip:1', 'Legs'),
]

ABSORPTION_MAP = [
    ('neutralDamageCutRate', 'physical'),
    ('slashDamageCutRate', 'slash'),
    ('blowDamageCutRate', 'strike'),
    ('thrustDamageCutRate', 'pierce'),
    ('magicDamageCutRate', 'magic'),
    ('fireDamageCutRate', 'fire'),
    ('thunderDamageCutRate', 'lightning'),
    ('darkDamageCutRate', 'holy'),
]

RESISTANCE_MAP = [
    ('resistPoison', 'immunity'),
    ('resistBlood', 'robustness'),
    ('resistSleep', 'focus'),
    ('resistMadness', 'vitality'),
    ('resistFreeze', 'freeze'),
    ('resistCurse', 'curse'),
    ('resistDisease', 'disease'),
]

def update_armor_from_param(item, row):
    item['weight'] = row.get('weight', item.get('weight', 0))
    item['icon'] = row.get('iconIdM', item.get('icon', 0))
    item['icon_fem'] = row.get('iconIdF', item.get('icon_fem', item['icon']))
    item['price_sold'] = row.get('sellValue', item.get('price_sold', 0))

    for flag, cat in ARMOR_SLOT_FLAGS:
        if row.get(flag, 0) == 1:
            item['category'] = cat
            break

    absorp = item.get('absorptions', {})
    for src, tgt in ABSORPTION_MAP:
        val = row.get(src)
        if val is not None:
            absorp[tgt] = round((1.0 - val) * 100, 1)
    item['absorptions'] = absorp

    res = item.get('resistances', {})
    for src, tgt in RESISTANCE_MAP:
        val = row.get(src)
        if val is not None:
            res[tgt] = val
    item['resistances'] = res


# ============================================================
#  Processors
# ============================================================
def process_armor(existing_data, v116_rows, fmg_cn_map, name_map):
    updated = 0
    unmatched = []
    for eng_name, item in existing_data.items():
        param_id = find_english_name(eng_name, fmg_cn_map, name_map, None, existing_data)
        if param_id is not None:
            row = v116_rows.get(str(param_id))
            if row:
                item['id'] = param_id
                update_armor_from_param(item, row)
                updated += 1
                continue
        unmatched.append(eng_name)
    return existing_data, updated, unmatched


def process_ashes(existing_data, v116_rows, fmg_cn_map, name_map):
    updated = 0
    unmatched = []
    for eng_name, item in existing_data.items():
        param_id = find_param_id(eng_name, fmg_cn_map, name_map)
        if param_id is not None:
            row = v116_rows.get(str(param_id))
            if row:
                item['id'] = param_id
                item['icon'] = row.get('iconId', item.get('icon', 0))
                item['price_sold'] = row.get('sellValue', item.get('price_sold', 0))
                item.pop('weight', None)  # Ashes of war don't have weight
                updated += 1
                continue
        unmatched.append(eng_name)
    return existing_data, updated, unmatched


def process_spells(existing_data, v116_rows, fmg_cn_map, name_map):
    updated = 0
    unmatched = []
    for eng_name, item in existing_data.items():
        param_id = find_param_id(eng_name, fmg_cn_map, name_map)
        if param_id is not None:
            row = v116_rows.get(str(param_id))
            if row:
                item['id'] = param_id
                item['fp_cost'] = row.get('mp', item.get('fp_cost', 0))
                item['slots_used'] = row.get('slotLength', item.get('slots_used', 1))
                item['icon'] = row.get('iconId', item.get('icon', 0))
                item['sp_cost'] = row.get('stamina', item.get('sp_cost', 0))
                cat = row.get('ezStateBehaviorType', 0)
                item['category'] = 'Sorcery' if cat == 0 else 'Incantation'
                req = item.get('requirements', {})
                req['intelligence'] = row.get('requirementIntellect', req.get('intelligence', 0))
                req['faith'] = row.get('requirementFaith', req.get('faith', 0))
                req['arcane'] = row.get('requirementLuck', req.get('arcane', 0))
                item['requirements'] = req
                updated += 1
                continue
        unmatched.append(eng_name)
    return existing_data, updated, unmatched


def process_spirit_ashes(existing_data, v116_goods_rows, goods_fmg, name_map):
    # Build FMG map for ALL DLC spirit ash goods (ID range 2200000-2229999)
    # DLC spirit ashes may have goodsType=7 or 8
    spirit_fmg = {}
    def clean_cn(s):
        # Remove ALL double-quote characters (fancy Unicode and ASCII)
        for ch in ('"', '\u201c', '\u201d', '\u201e', '\u201f'):
            s = s.replace(ch, '')
        return s.strip()
    for fmg_key, cn_name in goods_fmg.items():
        if cn_name in ('%null%', '') or '[ERROR]' in cn_name:
            continue
        kid = int(fmg_key)
        if 2200000 <= kid <= 2229999:
            fmg_key_str = str(fmg_key)
            if fmg_key_str in v116_goods_rows:
                # Only base entries (no +N), skip upgraded versions
                if '＋' not in cn_name:
                    clean_name = clean_cn(cn_name)
                    spirit_fmg[clean_name] = kid

    updated = 0
    unmatched = []
    for eng_name, item in existing_data.items():
        param_id = None

        # Check SPIRIT_ASH_DLC_OVERRIDE (reverse: eng_name → fmg_cn)
        for fmg_cn, fmg_eng in SPIRIT_ASH_DLC_OVERRIDE.items():
            if fmg_eng == eng_name:
                if fmg_cn in spirit_fmg:
                    param_id = spirit_fmg[fmg_cn]
                break

        if param_id is None:
            cn = name_map.get(eng_name, '')
            if cn and cn in spirit_fmg:
                param_id = spirit_fmg[cn]

        if param_id is not None:
            row = v116_goods_rows.get(str(param_id))
            if row:
                item['id'] = param_id
                item['icon'] = row.get('iconId', item.get('icon', 0))
                item['price_sold'] = row.get('sellValue', item.get('price_sold', 0))
                mp = row.get('consumeMP', -1)
                hp = row.get('consumeHP', -1)
                if mp > 0: item['fp_cost'] = mp
                if hp > 0: item['hp_cost'] = hp
                gt = row.get('goodsType', 0)
                if gt == 7:
                    item['upgrade_material'] = 'Grave Glovewort'
                    item['category_cn'] = '普通骨灰'
                elif gt == 8:
                    item['upgrade_material'] = 'Ghost Glovewort'
                    item['category_cn'] = '灵依骨灰'
                updated += 1
                continue
        unmatched.append(eng_name)
    return existing_data, updated, unmatched


def process_talismans(existing_data, v116_rows, fmg_cn_map, name_map):
    updated = 0
    unmatched = []
    for eng_name, item in existing_data.items():
        param_id = find_param_id(eng_name, fmg_cn_map, name_map)
        if param_id is not None:
            row = v116_rows.get(str(param_id))
            if row:
                item['id'] = param_id
                item['icon'] = row.get('iconId', item.get('icon', 0))
                item['price_sold'] = row.get('sellValue', item.get('price_sold', 0))
                item['weight'] = row.get('weight', item.get('weight', 0))
                updated += 1
                continue
        unmatched.append(eng_name)
    return existing_data, updated, unmatched


# ============================================================
#  Main
# ============================================================
def main():
    print('=' * 60)
    print('  Elden Ring Wiki DLC Data Rebuilder (v1.16.1)')
    print('=' * 60)

    # Load name_map
    print('\n>>> Loading name_map...')
    name_map = load_json(os.path.join(DATA_DIR, 'name_map.json'))
    print(f'  {len(name_map)} entries')

    # Load Higor FMG data
    print('\n>>> Loading Higor FMG data...')
    higor_item = load_json(os.path.join(TMP_DIR, 'higor_item.json'))
    higor_dlc = load_json(os.path.join(TMP_DIR, 'higor_dlc01.json'))
    print(f'  Base: {len(higor_item)} FMG files, DLC: {len(higor_dlc)} FMG files')

    # ============================================================
    #  DLC Armor
    # ============================================================
    print('\n' + '-' * 50)
    print('  dlc-armor.json')
    print('-' * 50)
    v116_prot = load_v116('EquipParamProtector')
    prot_fmg = load_fmg(higor_dlc, 'ProtectorName_dlc01.fmg')

    # Build FMG name→id map for valid DLC protector rows
    fmg_prot = {}
    for k, v in prot_fmg.items():
        if v not in ('%null%', '') and '[ERROR]' not in v and k in v116_prot['rows']:
            fmg_prot[v] = int(k)
    print(f'  FMG entries: {len(fmg_prot)}')

    armor_data = load_json(os.path.join(DATA_DIR, 'dlc-armor.json'))
    armor_data, armor_updated, armor_unmatched = process_armor(armor_data, v116_prot['rows'], fmg_prot, name_map)
    save_json(os.path.join(DATA_DIR, 'dlc-armor.json'), armor_data)
    print(f'  Updated: {armor_updated}/{len(armor_data)}')
    if armor_unmatched:
        print(f'  Unmatched: {len(armor_unmatched)}')
        for n in armor_unmatched[:5]:
            print(f'    - {n}')

    # ============================================================
    #  DLC Ashes of War
    # ============================================================
    print('\n' + '-' * 50)
    print('  dlc-ashes-of-war.json')
    print('-' * 50)
    v116_gem = load_v116('EquipParamGem')
    gem_fmg = load_fmg(higor_dlc, 'GemName_dlc01.fmg')

    fmg_gem = {}
    for k, v in gem_fmg.items():
        if v not in ('%null%', '') and '[ERROR]' not in v and k in v116_gem['rows']:
            fmg_gem[v] = int(k)
    print(f'  FMG entries: {len(fmg_gem)}')

    ashes_data = load_json(os.path.join(DATA_DIR, 'dlc-ashes-of-war.json'))
    ashes_data, ashes_updated, ashes_unmatched = process_ashes(ashes_data, v116_gem['rows'], fmg_gem, name_map)
    save_json(os.path.join(DATA_DIR, 'dlc-ashes-of-war.json'), ashes_data)
    print(f'  Updated: {ashes_updated}/{len(ashes_data)}')
    if ashes_unmatched:
        print(f'  Unmatched: {len(ashes_unmatched)}')
        for n in ashes_unmatched:
            print(f'    - {n}')

    # ============================================================
    #  DLC Spells
    # ============================================================
    print('\n' + '-' * 50)
    print('  dlc-spells.json')
    print('-' * 50)
    v116_magic = load_v116('Magic')
    goods_fmg_dlc = load_fmg(higor_dlc, 'GoodsName_dlc01.fmg')

    # Only consider GoodsName entries that are actual spell IDs (2004300-2007820)
    fmg_spell = {}
    for k, v in goods_fmg_dlc.items():
        if v in ('%null%', '') or '[ERROR]' in v:
            continue
        kid = int(k)
        if 2004300 <= kid <= 2007820 and k in v116_magic['rows']:
            fmg_spell[v] = kid
    print(f'  FMG entries: {len(fmg_spell)}')

    spells_data = load_json(os.path.join(DATA_DIR, 'dlc-spells.json'))
    spells_data, spells_updated, spells_unmatched = process_spells(spells_data, v116_magic['rows'], fmg_spell, name_map)
    save_json(os.path.join(DATA_DIR, 'dlc-spells.json'), spells_data)
    print(f'  Updated: {spells_updated}/{len(spells_data)}')
    if spells_unmatched:
        print(f'  Unmatched: {len(spells_unmatched)}')
        for n in spells_unmatched:
            print(f'    - {n}')

    # ============================================================
    #  DLC Spirit Ashes
    # ============================================================
    print('\n' + '-' * 50)
    print('  dlc-spirit-ashes.json')
    print('-' * 50)
    v116_goods = load_v116('EquipParamGoods')

    spirit_data = load_json(os.path.join(DATA_DIR, 'dlc-spirit-ashes.json'))
    spirit_data, spirit_updated, spirit_unmatched = process_spirit_ashes(
        spirit_data, v116_goods['rows'], goods_fmg_dlc, name_map
    )
    save_json(os.path.join(DATA_DIR, 'dlc-spirit-ashes.json'), spirit_data)
    print(f'  Updated: {spirit_updated}/{len(spirit_data)}')
    if spirit_unmatched:
        print(f'  Unmatched: {len(spirit_unmatched)}')
        for n in spirit_unmatched:
            print(f'    - {n}')

    # ============================================================
    #  DLC Talismans
    # ============================================================
    print('\n' + '-' * 50)
    print('  dlc-talismans.json')
    print('-' * 50)
    v116_acc = load_v116('EquipParamAccessory')
    acc_fmg = load_fmg(higor_dlc, 'AccessoryName_dlc01.fmg')
    base_acc_fmg = load_fmg(higor_item, 'AccessoryName.fmg')

    fmg_acc = {}
    for k, v in acc_fmg.items():
        if v not in ('%null%', '') and '[ERROR]' not in v and k in v116_acc['rows']:
            fmg_acc[v] = int(k)
    # Also add base game FMG entries that aren't in DLC FMG
    for k, v in base_acc_fmg.items():
        if v not in ('%null%', '') and '[ERROR]' not in v and k in v116_acc['rows']:
            rid = int(k)
            if 7000 <= rid <= 8240 and v not in fmg_acc:
                fmg_acc[v] = rid
    print(f'  FMG entries: {len(fmg_acc)}')

    tal_data = load_json(os.path.join(DATA_DIR, 'dlc-talismans.json'))
    tal_data, tal_updated, tal_unmatched = process_talismans(tal_data, v116_acc['rows'], fmg_acc, name_map)
    save_json(os.path.join(DATA_DIR, 'dlc-talismans.json'), tal_data)
    print(f'  Updated: {tal_updated}/{len(tal_data)}')
    if tal_unmatched:
        print(f'  Unmatched: {len(tal_unmatched)}')
        for n in tal_unmatched:
            print(f'    - {n}')

    # ============================================================
    #  Summary
    # ============================================================
    print('\n' + '=' * 50)
    print('  SUMMARY')
    print('=' * 50)
    print(f'  dlc-armor.json:       {armor_updated}/{len(armor_data)} updated')
    print(f'  dlc-ashes-of-war.json: {ashes_updated}/{len(ashes_data)} updated')
    print(f'  dlc-spells.json:       {spells_updated}/{len(spells_data)} updated')
    print(f'  dlc-spirit-ashes.json: {spirit_updated}/{len(spirit_data)} updated')
    print(f'  dlc-talismans.json:    {tal_updated}/{len(tal_data)} updated')
    print('  Done!')


if __name__ == '__main__':
    main()

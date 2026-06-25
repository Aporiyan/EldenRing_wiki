"""
Generate DLC item data files, name_map, and desc_map additions.
Uses item_ids.yml from eldenring-practice-tool for game IDs.
"""
import json, re, os, sys

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'data')
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'data')

# === KNOWN CHINESE NAME MAPPINGS for DLC items ===
# Compiled from Gamersky, SteamXO, and various sources
DLC_NAME_MAP = {
    # === WEAPONS ===
    # Daggers
    "Main-gauche": "左手匕首",
    "Fire Knight's Shortsword": "火焰骑士短剑",
    "Velvet Sword of St. Trina": "托莉娜暗剑",
    "Star-Lined Sword": "连星剑",
    "Carian Sorcery Sword": "卡利亚魔法剑",
    # Straight Swords
    "Sword of Night": "黑夜剑",
    # Greatswords
    "Greatsword of Damnation": "永罚大剑",
    "Greatsword of Radahn (Light)": "拉塔恩的大剑（光）",
    "Greatsword of Radahn (Lord)": "拉塔恩的大剑（王）",
    "Freyja's Greatsword": "弗蕾亚的大剑",
    "Leda's Sword": "蕾妲的剑",
    "Sword of Light": "光明剑",
    # Colossal Swords
    "Ancient Meteoric Ore Greatsword": "古铁陨石大剑",
    "Fire Knight's Greatsword": "火焰骑士大剑",
    "Moonrithyll's Knight Sword": "穆利缇尔的骑士剑",
    # Colossal Weapons
    "Devonia's Hammer": "泥盆亚的大槌",
    "Shadow Sunflower Blossom": "影轮草大花",
    "Bloodfiend's Arm": "血怪手臂",
    "Anvil Hammer": "铁砧大锤",
    "Gazing Finger": "凝望指头",
    # Thrusting Swords
    "Queelign's Greatsword": "昆兰的大剑",
    # Curved Swords
    "Horned Warrior's Sword": "角战士曲剑",
    "Curseblade's Cirque": "咒剑士圆刃刀",
    "Swift Sword": "迅剑",
    # Curved Greatswords
    "Horned Warrior's Greatsword": "角战士大曲剑",
    "Rakshasa's Great Katana": "罗刹大刀",
    # Katanas (already have Great Katana as a new type)
    "Great Katana": "大刀",
    "Dragon-Hunter's Great Katana": "猎龙大刀",
    "Rakshasa's Great Katana": "罗刹大刀",
    # Twinblades
    "Abundance and Decay Twinblade": "丰饶与腐败双头剑",
    "Abundance Twinblade": "丰饶双头剑",
    "Euporia": "艾珀莉亚",
    # Axes
    "Smithscript Axe": "流纹斧",
    "Death Knight's Twin Axes": "死骑士对斧",
    "Messmer Soldier's Axe": "梅瑟莫士兵斧",
    "Forked-Tongue Hatchet": "分岔舌手斧",
    "Bonny Butchering Knife": "波尼肢解菜刀",
    # Greataxes
    "Death Knight's Longhaft Axe": "死骑士长柄斧",
    "Putrescence Cleaver": "融泥大柴刀",
    # Spears
    "Smithscript Spear": "流纹矛",
    "Swift Spear": "迅矛",
    "Barbed Staff-Spear": "倒刺杖矛",
    "Messmer Soldier's Spear": "梅瑟莫士兵矛",
    "Bloodfiend's Fork": "血怪叉矛",
    "Bloodfiend's Sacred Spear": "血怪圣矛",
    "Sword Lance": "剑型长矛",
    # Halberds
    "Soulsaber": "灵魂剑刃戟",
    # Reapers
    "Obsidian Lamina": "黑曜薄刀",
    # Whips
    "Tooth Whip": "畸齿软鞭",
    "Flowerstone Gavel": "花岩槌",
    # Fists
    "Thiollier's Hidden Needle": "休里耶的暗针",
    "Pata": "帕塔剑",
    "Golem Fist": "魔像拳头",
    "Dryleaf Arts": "落叶格斗术",
    "Dane's Footwork": "丹恩流踢击术",
    # Claws
    "Claws of Night": "黑夜爪",
    "Beast Claw": "野兽爪",
    "Red Bear's Claw": "红熊爪",
    # Hammers
    "Black Steel Greathammer": "黑铁大锤",
    "Smithscript Greathammer": "流纹大槌",
    "Flowerstone Gavel": "花岩槌",
    # Colossal Weapons
    "Gazing Finger": "凝望指头",
    # Torches
    "Nana's Candle": "娜娜亚烛火",
    # Light Greatswords (new type)
    "Milady": "仕女剑",
    "Leda's Sword": "蕾妲的剑",
    "Rellana's Twin Blades": "蕾菈娜的对剑",
    # Backhand Blades (new type)
    "Backhand Blade": "反手剑",
    "Smithscript Cirque": "流纹圆刃刀",
    "Curseblade's Cirque": "咒剑士圆刃刀",
    # Great Katanas (new type)
    "Great Katana": "大刀",
    "Dragon-Hunter's Great Katana": "猎龙大刀",
    # Hand-to-Hand Arts (new type)
    "Dryleaf Arts": "落叶格斗术",
    "Dane's Footwork": "丹恩流踢击术",
    # Perfume Bottles (new type)
    "Firespark Perfume Bottle": "火花调香瓶",
    "Chilling Perfume Bottle": "寒气调香瓶",
    "Lightning Perfume Bottle": "雷电调香瓶",
    "Frenzied Perfume Bottle": "癫火调香瓶",
    "Deadly Perfume Bottle": "剧毒调香瓶",
    # Throwing Blades (new type)
    "Smithscript Dagger": "流纹短剑",
    # Small Shields
    "Smithscript Shield": "流纹盾",
    "Messmer Soldier Shield": "梅瑟莫士兵盾",
    "Wolf Crest Shield": "狼纹盾",
    "Dueling Shield": "决斗盾",
    # Medium Shields
    "Carian Thrusting Shield": "卡利亚突刺盾",
    "Golden Lion Shield": "金狮盾",
    # Greatshields
    "Black Steel Greatshield": "黑铁大盾",
    # Staves
    "Maternal Staff": "母亲杖",
    # Seals
    "Dryleaf Seal": "落叶圣印记",
    "Fire Knight's Seal": "火焰骑士圣印记",
    "Spiraltree Seal": "螺旋树圣印记",
    # Bows
    "Bone Bow": "骸骨弓",
    "Igon's Bow": "埃贡的大弓",
    "Ansbach's Longbow": "安帕赫的长弓",
    # Crossbows
    "Repeating Crossbow": "多击发弩",
    "Buckshot Crossbow": "连射弩",
    "Rabbath's Cannon": "拉巴斯大炮",
    # Bolts
    "Rabbath's Greatbolt": "拉巴斯的大弩箭",
    # New weapon types (misc)
    "Lamenting Visage": "喟叹头颅",
    # Already listed weapons from Gamersky index:
    "Sword of Light": "光明剑",
    "Sword of Night": "黑夜剑",
    "Milady": "仕女剑",
    "Carian Sorcery Sword": "卡利亚魔法剑",
    "Star-Lined Sword": "连星剑",
    "Velvet Sword of St. Trina": "托莉娜暗剑",
    "Fire Knight's Shortsword": "火焰骑士短剑",
    "Main-gauche": "左手匕首",
    "Curseblade's Cirque": "咒剑士圆刃刀",
    "Backhand Blade": "反手剑",
    "Smithscript Cirque": "流纹圆刃刀",
    "Great Katana": "大刀",
    "Dragon-Hunter's Great Katana": "猎龙大刀",
    "Rakshasa's Great Katana": "罗刹大刀",
    "Firespark Perfume Bottle": "火花调香瓶",
    "Chilling Perfume Bottle": "寒气调香瓶",
    "Lightning Perfume Bottle": "雷电调香瓶",
    "Frenzied Perfume Bottle": "癫火调香瓶",
    "Deadly Perfume Bottle": "剧毒调香瓶",
    "Smithscript Dagger": "流纹短剑",
    "Dryleaf Arts": "落叶格斗术",
    "Dane's Footwork": "丹恩流踢击术",
    "Beast Claw": "野兽爪",
    "Red Bear's Claw": "红熊爪",
    "Claws of Night": "黑夜爪",
    "Pata": "帕塔剑",
    "Thiollier's Hidden Needle": "休里耶的暗针",
    "Golem Fist": "魔像拳头",
    "Tooth Whip": "畸齿软鞭",
    "Serpent Flail": "蛇连枷",
    "Flowerstone Gavel": "花岩槌",
    "Horned Warrior's Sword": "角战士曲剑",
    "Swift Sword": "迅剑",
    "Obsidian Lamina": "黑曜薄刀",
    "Blade of Mercy": "慈悲之刃",
    "Horned Warrior's Greatsword": "角战士大曲剑",
    "Sword Lance": "剑型长矛",
    "Soulsaber": "灵魂剑刃戟",
    "Barbed Staff-Spear": "倒刺杖矛",
    "Swift Spear": "迅矛",
    "Smithscript Spear": "流纹矛",
    "Bloodfiend's Fork": "血怪叉矛",
    "Bloodfiend's Sacred Spear": "血怪圣矛",
    "Messmer Soldier's Spear": "梅瑟莫士兵矛",
    "Smithscript Axe": "流纹斧",
    "Death Knight's Twin Axes": "死骑士对斧",
    "Messmer Soldier's Axe": "梅瑟莫士兵斧",
    "Forked-Tongue Hatchet": "分岔舌手斧",
    "Death Knight's Longhaft Axe": "死骑士长柄斧",
    "Bonny Butchering Knife": "波尼肢解菜刀",
    "Putrescence Cleaver": "融泥大柴刀",
    "Black Steel Greathammer": "黑铁大锤",
    "Smithscript Greathammer": "流纹大槌",
    "Anvil Hammer": "铁砧大锤",
    "Devonia's Hammer": "泥盆亚的大槌",
    "Bloodfiend's Arm": "血怪手臂",
    "Gazing Finger": "凝望指头",
    "Shadow Sunflower Blossom": "影轮草大花",
    "Milady": "仕女剑",
    "Rellana's Twin Blades": "蕾菈娜的对剑",
    "Leda's Sword": "蕾妲的剑",
    "Swift Sword": "迅剑",
    "Greatsword of Damnation": "永罚大剑",
    "Freyja's Greatsword": "弗蕾亚的大剑",
    "Ancient Meteoric Ore Greatsword": "古铁陨石大剑",
    "Fire Knight's Greatsword": "火焰骑士大剑",
    "Moonrithyll's Knight Sword": "穆利缇尔的骑士剑",
    "Greatsword of Radahn (Light)": "拉塔恩的大剑（光）",
    "Greatsword of Radahn (Lord)": "拉塔恩的大剑（王）",
    "Smithscript Shield": "流纹盾",
    "Messmer Soldier Shield": "梅瑟莫士兵盾",
    "Wolf Crest Shield": "狼纹盾",
    "Dueling Shield": "决斗盾",
    "Carian Thrusting Shield": "卡利亚突刺盾",
    "Golden Lion Shield": "金狮盾",
    "Black Steel Greatshield": "黑铁大盾",
    "Spiraltree Seal": "螺旋树圣印记",
    "Dryleaf Seal": "落叶圣印记",
    "Fire Knight's Seal": "火焰骑士圣印记",
    "Maternal Staff": "母亲杖",
    "Bone Bow": "骸骨弓",
    "Igon's Bow": "埃贡的大弓",
    "Ansbach's Longbow": "安帕赫的长弓",
    "Repeating Crossbow": "多击发弩",
    "Buckshot Crossbow": "连射弩",
    "Rabbath's Cannon": "拉巴斯大炮",
    "Lamenting Visage": "喟叹头颅",
    "Nana's Candle": "娜娜亚烛火",
    "Euporia": "艾珀莉亚",
    "Abundance Twinblade": "丰饶双头剑",
    "Abundance and Decay Twinblade": "丰饶与腐败双头剑",
    "Great Katana": "大刀",
    "Sword of Light": "光明剑",
    "Sword of Night": "黑夜剑",
    "Queelign's Greatsword": "昆兰的大剑",
    "Sword of Night": "黑夜刀",  # also called 黑夜刀 

    # === ARMOR ===
    "Dane's Hat": "丹恩帽",
    "Dryleaf Robe": "落叶长袍",
    "Dryleaf Arm Wraps": "落叶腕套",
    "Dryleaf Cuissardes": "落叶腿甲",
    "Dryleaf Robe (Altered)": "落叶长袍（轻装）",
    "Gaius's Helm": "盖乌斯头盔",
    "Gaius's Armor": "盖乌斯铠甲",
    "Gaius's Gauntlets": "盖乌斯臂甲",
    "Gaius's Greaves": "盖乌斯腿甲",
    "Oathseeker Knight Helm": "寻誓者骑士头盔",
    "Leda's Armor": "蕾妲铠甲",
    "Oathseeker Knight Gauntlets": "寻誓者骑士臂甲",
    "Oathseeker Knight Greaves": "寻誓者骑士腿甲",
    "Oathseeker Knight Armor": "寻誓者骑士铠甲",
    "Verdigris Helm": "铜绿盔",
    "Verdigris Armor": "铜绿铠甲",
    "Verdigris Gauntlets": "铜绿臂甲",
    "Verdigris Greaves": "铜绿腿甲",
    "Pelt of Ralva": "拉尔瓦毛皮",
    "Iron Rivet Armor": "铁铆钉铠甲",
    "Iron Rivet Gauntlets": "铁铆钉臂甲",
    "Iron Rivet Greaves": "铁铆钉腿甲",
    "Fang Helm": "尖牙头盔",
    "Thiollier's Mask": "休里耶面具",
    "Thiollier's Garb": "休里耶服装",
    "Thiollier's Gloves": "休里耶手套",
    "Thiollier's Trousers": "休里耶裤子",
    "Thiollier's Garb (Altered)": "休里耶服装（轻装）",
    "High Priest Hat": "祭司帽子",
    "High Priest Robe": "祭司长袍",
    "High Priest Gloves": "祭司手套",
    "High Priest Undergarments": "祭司内衬",
    "Finger Robe": "指头长袍",
    "Caterpillar Mask": "毛虫面具",
    "Braided Cord Robe": "编绳长袍",
    "Braided Arm Wraps": "编绳腕套",
    "Soiled Loincloth": "污秽腰布",
    "Dancer's Hood": "舞者风帽",
    "Dancer's Dress": "舞者连衣裙",
    "Dancer's Bracer": "舞者臂甲",
    "Dancer's Trousers": "舞者裤子",
    "Dancer's Dress (Altered)": "舞者连衣裙（轻装）",
    "Helm of Night": "黑夜头盔",
    "Armor of Night": "黑夜铠甲",
    "Gauntlets of Night": "黑夜臂甲",
    "Greaves of Night": "黑夜腿甲",
    "Igon's Helm": "埃贡头盔",
    "Igon's Armor": "埃贡铠甲",
    "Igon's Gauntlets": "埃贡臂甲",
    "Igon's Loincloth": "埃贡腰布",
    "Igon's Helm (Altered)": "埃贡头盔（轻装）",
    "Igon's Armor (Altered)": "埃贡铠甲（轻装）",
    "Wise Man's Mask": "贤者面具",
    "Ansbach's Attire": "安帕赫服装",
    "Ansbach's Manchettes": "安帕赫腕套",
    "Ansbach's Boots": "安帕赫靴子",
    "Ansbach's Attire (Altered)": "安帕赫服装（轻装）",
    "Freyja's Helm": "弗蕾亚头盔",
    "Freyja's Armor": "弗蕾亚铠甲",
    "Freyja's Gauntlets": "弗蕾亚臂甲",
    "Freyja's Greaves": "弗蕾亚腿甲",
    "Freyja's Armor (Altered)": "弗蕾亚铠甲（轻装）",
    "Helm of Solitude": "孤牢头盔",
    "Armor of Solitude": "孤牢铠甲",
    "Gauntlets of Solitude": "孤牢臂甲",
    "Greaves of Solitude": "孤牢腿甲",
    "Armor of Solitude (Altered)": "孤牢铠甲（轻装）",
    "Messmer Soldier Helm": "梅瑟莫士兵头盔",
    "Messmer Soldier Armor": "梅瑟莫士兵铠甲",
    "Messmer Soldier Gauntlets": "梅瑟莫士兵臂甲",
    "Messmer Soldier Greaves": "梅瑟莫士兵腿甲",
    "Messmer's Helm": "梅瑟莫头盔",
    "Messmer's Armor": "梅瑟莫铠甲",
    "Messmer's Gauntlets": "梅瑟莫臂甲",
    "Messmer's Greaves": "梅瑟莫腿甲",
    "Messmer's Armor (Altered)": "梅瑟莫铠甲（轻装）",
    "Shadow Militiaman Helm": "幽影民兵头盔",
    "Shadow Militiaman Armor": "幽影民兵铠甲",
    "Shadow Militiaman Gauntlets": "幽影民兵臂甲",
    "Shadow Militiaman Greaves": "幽影民兵腿甲",
    "Black Knight Helm": "黑骑士头盔",
    "Black Knight Armor": "黑骑士铠甲",
    "Black Knight Gauntlets": "黑骑士臂甲",
    "Black Knight Greaves": "黑骑士腿甲",
    "Black Knight Helm (Altered)": "黑骑士头盔（轻装）",
    "Black Knight Armor (Altered)": "黑骑士铠甲（轻装）",
    "Divine Beast Helm": "神兽头盔",
    "Divine Beast Armor": "神兽铠甲",
    "Divine Beast Gauntlets": "神兽臂甲",
    "Divine Beast Greaves": "神兽腿甲",
    "Divine Beast Helm (Altered)": "神兽头盔（轻装）",
    "Divine Beast Armor (Altered)": "神兽铠甲（轻装）",
    "Gravebird Helm": "墓鸟头盔",
    "Gravebird Armor": "墓鸟铠甲",
    "Gravebird Gauntlets": "墓鸟臂甲",
    "Gravebird Greaves": "墓鸟腿甲",
    "Hornsent Hood": "角民风帽",
    "Hornsent Armor": "角民铠甲",
    "Hornsent Gauntlets": "角民臂甲",
    "Hornsent Greaves": "角民腿甲",
    "Hornsent Hood (Altered)": "角民风帽（轻装）",
    "Hornsent Armor (Altered)": "角民铠甲（轻装）",
    "Rakshasa Helm": "罗刹头盔",
    "Rakshasa Armor": "罗刹铠甲",
    "Rakshasa Gauntlets": "罗刹臂甲",
    "Rakshasa Greaves": "罗刹腿甲",
    "Rellana's Helm": "蕾菈娜头盔",
    "Rellana's Armor": "蕾菈娜铠甲",
    "Rellana's Gauntlets": "蕾菈娜臂甲",
    "Rellana's Greaves": "蕾菈娜腿甲",
    "Rellana's Armor (Altered)": "蕾菈娜铠甲（轻装）",
    "Red Bear's Armor": "红熊铠甲",
    "Red Bear's Armor (Altered)": "红熊铠甲（轻装）",
    "Fire Knight Helm": "火焰骑士头盔",
    "Fire Knight Armor": "火焰骑士铠甲",
    "Fire Knight Gauntlets": "火焰骑士臂甲",
    "Fire Knight Greaves": "火焰骑士腿甲",
    "Fire Knight Armor (Altered)": "火焰骑士铠甲（轻装）",
    "Death Knight Helm": "死骑士头盔",
    "Death Knight Armor": "死骑士铠甲",
    "Death Knight Gauntlets": "死骑士臂甲",
    "Death Knight Greaves": "死骑士腿甲",
    "Moore's Helm": "摩尔头盔",
    "Moore's Armor": "摩尔铠甲",
    "Moore's Gauntlets": "摩尔臂甲",
    "Moore's Greaves": "摩尔腿甲",
    "Moore's Armor (Altered)": "摩尔铠甲（轻装）",
    "Horned Warrior Helm": "角战士头盔",
    "Horned Warrior Armor": "角战士铠甲",
    "Horned Warrior Gauntlets": "角战士臂甲",
    "Horned Warrior Greaves": "角战士腿甲",
    "Horned Warrior Armor (Altered)": "角战士铠甲（轻装）",
    "Young Lion's Helm": "幼狮头盔",
    "Young Lion's Armor": "幼狮铠甲",
    "Young Lion's Gauntlets": "幼狮臂甲",
    "Young Lion's Greaves": "幼狮腿甲",
    "Young Lion's Armor (Altered)": "幼狮铠甲（轻装）",
    "Common Soldier Helm": "普通士兵头盔",
    "Common Soldier Armor": "普通士兵铠甲",
    "Common Soldier Gauntlets": "普通士兵臂甲",
    "Common Soldier Greaves": "普通士兵腿甲",
    "Ascetic's Hood": "苦修者风帽",
    "Ascetic's Robe": "苦修者长袍",
    "Ascetic's Loincloth": "苦修者腰布",
    "Ascetic's Hood (Altered)": "苦修者风帽（轻装）",
    "Ascetic's Robe (Altered)": "苦修者长袍（轻装）",
    "Gloried Attire": "荣光服装",
    "Gloried Attire (Altered)": "荣光服装（轻装）",
    "Night's Set Hood": "黑夜套装风帽",
    "Highland Helm": "高原头盔",
    "Highland Armor": "高原铠甲",
    "Highland Gauntlets": "高原臂甲",
    "Highland Greaves": "高原腿甲",
    "Highland Armor (Altered)": "高原铠甲（轻装）",
    # Unique armor pieces
    "Circlet of Light": "光明头冠",
    "Crucible Hammer-Helm": "熔炉锤盔",
    "Death Mask Helm": "死亡面具盔",
    "Divine Beast Head": "神兽头",
    "Greatjar": "大壶",
    "Imp Head (Lion)": "小恶魔头罩（狮）",
    "Salza's Hood": "萨尔萨风帽",
    "St. Trina's Blossom": "托莉娜花朵",
    "Winged Serpent Helm": "翼蛇头盔",
    "Sacred Beast Head": "圣兽头",
    
    # === TALISMANS ===
    "Crimson Amber Medallion +3": "红琥珀链坠+3",
    "Cerulean Amber Medallion +3": "蓝琥珀链坠+3",
    "Viridian Amber Medallion +3": "绿琥珀链坠+3",
    "Two-Headed Turtle Talisman": "双首龟护符",
    "Talisman of the Dread": "畏吓护符",
    "Talisman of Lord's Bestowal": "王者遗物护符",
    "Talisman of All Crucibles": "熔炉全护符",
    "Rellana's Cameo": "蕾菈娜的浮雕",
    "Beloved Stardust": "爱之星尘",
    "Golden Braid": "金辫子",
    "Blade of Mercy": "慈悲之刃",
    "Crusade Insignia": "十字军徽章",
    "Lacerating Crossed-Tree": "裂伤十字树",
    "Retaliatory Crossed-Tree": "反击十字树",
    "Fine Crucible Feather Talisman": "优质熔炉羽护符",
    "Shattered Stone Talisman": "碎石护符",
    "Smithing Talisman": "锻造护符",
    "Sharpshot Talisman": "精准射击护符",
    "Arrow's Soaring Sting Talisman": "箭羽飞刺护符",
    "Aged One's Exultation": "老者欢愉",
    "Enraged Divine Beast": "怒之神兽",
    "Pearl Shield Talisman": "珍珠盾护符",
    "Pearldrake Talisman +3": "龙辉大盾护符+3",
    "Flamedrake Talisman +3": "火龙徽护符+3",
    "Boltdrake Talisman +3": "雷龙徽护符+3",
    "Spelldrake Talisman +3": "魔龙徽护符+3",
    "Immunizing Horn Charm +1": "免疫角饰品+1",
    "Immunizing Horn Charm +2": "免疫角饰品+2",
    "Clarifying Horn Charm +1": "清醒角饰品+1",
    "Clarifying Horn Charm +2": "清醒角饰品+2",
    "Stalwart Horn Charm +1": "健壮角饰品+1",
    "Stalwart Horn Charm +2": "健壮角饰品+2",
    "Mottled Necklace +2": "斑驳项链+2",
    "Crimson Seed Talisman +1": "红种子护符+1",
    "Cerulean Seed Talisman +1": "蓝种子护符+1",
    "Blessed Blue Dew Talisman": "祝福蓝露护符",
    "Two-Handed Sword Talisman": "双手剑护符",
    "Verdigris Discus": "铜绿圆盘",
    "Outer God Heirloom": "外神传家宝",
    "St. Trina's Smile": "托莉娜的微笑",

    # === SPELLS ===
    "Miriam's Vanishing": "米莉安的隐身",
    "Glintblade Trio": "辉剑三连",
    "Rellana's Twin Moons": "蕾菈娜的双月",
    "Glintstone Nail": "辉石钉",
    "Glintstone Nails": "辉石钉雨",
    "Blades of Stone": "石刃",
    "Gravitational Missile": "重力飞弹",
    "Mantle of Thorns": "荆棘斗篷",
    "Impenetrable Thorns": "不可穿透的荆棘",
    "Rings of Spectral Light": "灵光环",
    "Vortex of Putrescence": "融泥旋涡",
    "Mass of Putrescence": "融泥块",
    "Furious Blade of Ansbach": "安帕赫的怒刃",
    "Heal from Afar": "远方恢复",
    "Aspects of the Crucible: Thorns": "熔炉百相之荆棘",
    "Aspects of the Crucible: Bloom": "熔炉百相之花",
    "Minor Erdtree": "小黄金树",
    "Land of Shadow": "幽影之地",
    "Wrath from Afar": "远方 wrath",
    "Light of Miquella": "米凯拉之光",
    "Multilayered Ring of Light": "多层光环",
    "Roar of Rugalea": "卢加尔的咆哮",
    "Knight's Lightning Spear": "骑士雷电枪",
    "Dragonbolt of Florissax": "弗罗里萨克斯的龙雷",
    "Electrocharge": "雷电充能",
    "Bayle's Tyranny": "贝勒的暴政",
    "Bayle's Flame Lightning": "贝勒的火焰雷电",
    "Ghostflame Breath": "鬼火吐息",
    "Rotten Butterflies": "腐败蝶",
    "Pest-Thread Spears": "虫丝枪",
    "Midra's Flame of Frenzy": "米德拉的癫火",
    "Fleeting Microcosm": "刹那微缩宇宙",
    "Cherishing Fingers": "慈爱手指",
    "Watchful Spirit": "守护之灵",
    "Golden Arcs": "黄金弧",
    "Giant Golden Arc": "巨大黄金弧",
    "Spira": "螺旋",
    "Divine Beast Tornado": "神兽龙卷",
    "Divine Bird Feathers": "神鸟羽毛",
    "Fire Serpent": "火蛇",
    "Rain of Fire": "火雨",
    "Messmer's Orb": "梅瑟莫的球",
    
    # === ASHES OF WAR ===
    "Ash of War: Dryleaf Whirlwind": "战灰：落叶旋风",
    "Ash of War: Aspects of the Crucible: Wings": "战灰：熔炉百相之翼",
    "Ash of War: Spinning Gravity Thrust": "战灰：回旋重力刺",
    "Ash of War: Palm Blast": "战灰：掌波",
    "Ash of War: Piercing Throw": "战灰：贯穿投掷",
    "Ash of War: Scattershot Throw": "战灰：散射投掷",
    "Ash of War: Wall of Sparks": "战灰：火花墙",
    "Ash of War: Rolling Sparks": "战灰：滚球火花",
    "Ash of War: Raging Beast": "战灰：狂怒野兽",
    "Ash of War: Savage Claws": "战灰：野蛮爪击",
    "Ash of War: Blind Spot": "战灰：盲点",
    "Ash of War: Swift Slash": "战灰：迅斩",
    "Ash of War: Overhead Stance": "战灰：上段架势",
    "Ash of War: Wing Stance": "战灰：翼架势",
    "Ash of War: Blinkbolt": "战灰：雷闪",
    "Ash of War: Flame Skewer": "战灰：火焰串刺",
    "Ash of War: Savage Lion's Claw": "战灰：野蛮狮子斩",
    "Ash of War: Divine Beast Frost Stomp": "战灰：神兽冰踏",
    "Ash of War: Flame Spear": "战灰：火焰矛",
    "Ash of War: Carian Sovereignty": "战灰：卡利亚主权",
    "Ash of War: Shriek of Sorrow": "战灰：悲鸣",
    "Ash of War: Ghostflame Call": "战灰：鬼火召唤",
    "Ash of War: The Poison Flower Blooms Twice": "战灰：毒花绽放两次",
    "Ash of War: Igon's Drake Hunt": "战灰：埃贡的龙猎",
    "Ash of War: Shield Strike": "战灰：盾击",

    # === SPIRIT ASHES ===
    "Curseblade Meera": "咒剑士米拉",
    "Bloodfiend Hexer's Ashes": "血怪咒术士骨灰",
    "Gravebird Ashes": "墓鸟骨灰",
    "Fire Knight Hilde": "火焰骑士希尔德",
    "Spider Scorpion Ashes": "蜘蛛蝎骨灰",
    "Inquisitor Ashes": "审判者骨灰",
    "Demi-Human Swordsman Yosh": "亚人剑士约什",
    "Messmer Soldier Ashes": "梅瑟莫士兵骨灰",
    "Black Knight Commander Andreas": "黑骑士指挥官安德烈亚斯",
    "Black Knight Captain Huw": "黑骑士队长休",
    "Bigmouth Imp Ashes": "大嘴小恶魔骨灰",
    "Man-Fly Ashes": "蝇人骨灰",
    "Taylew the Golem Smith": "魔像铁匠泰勒",
    "Divine Bird Warrior Ornis": "神鸟战士奥尼斯",
    "Horned Warrior Ashes": "角战士骨灰",
    "Ancient Dragon Florissax": "古龙弗罗里萨克斯",
    "Fingercreeper Ashes": "指虫骨灰",
    "Fire Knight Queelign": "火焰骑士昆林",
    "Swordhand of Night Jolán": "夜剑之手约兰",
    "Jolán and Anna": "约兰与安娜",
}

# === CATEGORY MAPPING ===
WEAPON_CATEGORY_MAP = {
    "Main-gauche": "Dagger", "Fire Knight's Shortsword": "Dagger",
    "Velvet Sword of St. Trina": "Dagger", "Star-Lined Sword": "Dagger",
    "Carian Sorcery Sword": "Thrusting Sword",
    "Sword of Night": "Straight Sword", "Sword of Light": "Straight Sword",
    "Greatsword of Damnation": "Greatsword", "Freyja's Greatsword": "Greatsword",
    "Leda's Sword": "Light Greatsword", "Sword of Light": "Straight Sword",
    "Milady": "Light Greatsword", "Rellana's Twin Blades": "Light Greatsword",
    "Swift Sword": "Thrusting Sword",
    "Ancient Meteoric Ore Greatsword": "Colossal Sword",
    "Fire Knight's Greatsword": "Colossal Sword",
    "Moonrithyll's Knight Sword": "Colossal Sword",
    "Greatsword of Radahn (Light)": "Colossal Sword",
    "Greatsword of Radahn (Lord)": "Colossal Sword",
    "Bloodfiend's Arm": "Colossal Weapon",
    "Anvil Hammer": "Colossal Weapon",
    "Devonia's Hammer": "Colossal Weapon",
    "Shadow Sunflower Blossom": "Colossal Weapon",
    "Gazing Finger": "Colossal Weapon",
    "Smithscript Dagger": "Throwing Blade",
    "Backhand Blade": "Backhand Blade",
    "Curseblade's Cirque": "Backhand Blade",
    "Smithscript Cirque": "Backhand Blade",
    "Great Katana": "Great Katana",
    "Dragon-Hunter's Great Katana": "Great Katana",
    "Rakshasa's Great Katana": "Great Katana",
    "Abundance and Decay Twinblade": "Twinblade",
    "Abundance Twinblade": "Twinblade",
    "Euporia": "Twinblade",
    "Smithscript Axe": "Axe",
    "Death Knight's Twin Axes": "Axe",
    "Messmer Soldier's Axe": "Axe",
    "Forked-Tongue Hatchet": "Axe",
    "Bonny Butchering Knife": "Greataxe",
    "Death Knight's Longhaft Axe": "Greataxe",
    "Putrescence Cleaver": "Greataxe",
    "Black Steel Greathammer": "Great Hammer",
    "Smithscript Greathammer": "Great Hammer",
    "Flowerstone Gavel": "Hammer",
    "Serpent Flail": "Flail",
    "Smithscript Spear": "Spear",
    "Swift Spear": "Spear",
    "Barbed Staff-Spear": "Spear",
    "Messmer Soldier's Spear": "Spear",
    "Bloodfiend's Fork": "Spear",
    "Bloodfiend's Sacred Spear": "Great Spear",
    "Sword Lance": "Great Spear",
    "Soulsaber": "Halberd",
    "Obsidian Lamina": "Reaper",
    "Tooth Whip": "Whip",
    "Pata": "Fist",
    "Thiollier's Hidden Needle": "Fist",
    "Golem Fist": "Fist",
    "Dryleaf Arts": "Hand-to-Hand",
    "Dane's Footwork": "Hand-to-Hand",
    "Claws of Night": "Claw",
    "Beast Claw": "Claw",
    "Red Bear's Claw": "Claw",
    "Firespark Perfume Bottle": "Perfume Bottle",
    "Chilling Perfume Bottle": "Perfume Bottle",
    "Lightning Perfume Bottle": "Perfume Bottle",
    "Frenzied Perfume Bottle": "Perfume Bottle",
    "Deadly Perfume Bottle": "Perfume Bottle",
    "Nana's Candle": "Torch",
    "Lamenting Visage": "Colossal Weapon",
    "Horned Warrior's Sword": "Curved Sword",
    "Horned Warrior's Greatsword": "Curved Greatsword",
    "Queelign's Greatsword": "Greatsword",
    "Smithscript Shield": "Small Shield",
    "Messmer Soldier Shield": "Small Shield",
    "Wolf Crest Shield": "Small Shield",
    "Dueling Shield": "Thrusting Shield",
    "Carian Thrusting Shield": "Thrusting Shield",
    "Golden Lion Shield": "Medium Shield",
    "Black Steel Greatshield": "Greatshield",
    "Maternal Staff": "Glintstone Staff",
    "Dryleaf Seal": "Sacred Seal",
    "Fire Knight's Seal": "Sacred Seal",
    "Spiraltree Seal": "Sacred Seal",
    "Bone Bow": "Bow",
    "Igon's Bow": "Greatbow",
    "Ansbach's Longbow": "Bow",
    "Repeating Crossbow": "Crossbow",
    "Buckshot Crossbow": "Crossbow",
    "Rabbath's Cannon": "Ballista",
    "Rabbath's Greatbolt": "Great Bolt",
    "Sword of Light": "Straight Sword",
    "Sword of Night": "Straight Sword",
    "Carian Sorcery Sword": "Thrusting Sword",
}

ARMOR_CATEGORY_MAP = {}
for name in DLC_NAME_MAP:
    if any(kw in name for kw in ['Hat', 'Helm', 'Hood', 'Crown', 'Mask', 'Head', 'Helm', 'Cap']):
        ARMOR_CATEGORY_MAP[name] = "Head"
    elif any(kw in name for kw in ['Robe', 'Armor', 'Garb', 'Attire', 'Dress', 'Clothes', 'Coat', 'Raiment', 'Vest']):
        ARMOR_CATEGORY_MAP[name] = "Body"
    elif any(kw in name for kw in ['Gauntlets', 'Gloves', 'Bracer', 'Wraps', 'Manchettes', 'Bracelets']):
        ARMOR_CATEGORY_MAP[name] = "Arms"
    elif any(kw in name for kw in ['Greaves', 'Trousers', 'Boots', 'Leggings', 'Skirt', 'Cuissardes', 'Loincloth', 'Legwraps', 'Undergarments']):
        ARMOR_CATEGORY_MAP[name] = "Legs"

# Add specific overrides
ARMOR_CATEGORY_MAP.update({
    "Circlet of Light": "Head",
    "Crucible Hammer-Helm": "Head",
    "Death Mask Helm": "Head",
    "Divine Beast Head": "Head",
    "Greatjar": "Head",
    "Imp Head (Lion)": "Head",
    "Salza's Hood": "Head",
    "St. Trina's Blossom": "Head",
    "Winged Serpent Helm": "Head",
    "Sacred Beast Head": "Head",
    "Pelt of Ralva": "Body",
    "Braided Cord Robe": "Body",
    "Finger Robe": "Body",
    "Dancer's Hood": "Head",
    "Dancer's Dress": "Body",
    "Dancer's Bracer": "Arms",
    "Dancer's Trousers": "Legs",
    "Dancer's Dress (Altered)": "Body",
    "Ascetic's Hood": "Head",
    "Ascetic's Robe": "Body",
    "Ascetic's Loincloth": "Legs",
    "Ascetic's Robe (Altered)": "Body",
    "Ascetic's Hood (Altered)": "Head",
    "Gloried Attire": "Body",
    "Gloried Attire (Altered)": "Body",
    "Soiled Loincloth": "Legs",
    "Night's Set Hood": "Head",
})


def generate_dlc_data():
    # Load existing name map
    existing_names = {}
    try:
        with open(os.path.join(OUT_DIR, 'name_map.json'), 'r', encoding='utf-8') as f:
            existing_names = json.load(f)
    except FileNotFoundError:
        print("No existing name_map.json found, will create new")
    
    # Load existing ERDB data to know which items are base game
    existing_erdb_names = set()
    for fname in os.listdir(DATA_DIR):
        if not fname.endswith('.json') or fname in ('reinforcements.json', 'correction-attack.json', 'correction-graph.json', 'shop.json', 'gestures.json', 'info.json'):
            continue
        with open(os.path.join(DATA_DIR, fname), 'r', encoding='utf-8') as f:
            data = json.load(f)
        for item in data.values():
            existing_erdb_names.add(item.get('name', ''))
    
    print(f"Existing ERDB items: {len(existing_erdb_names)}")
    
    # Load parsed item IDs
    with open('scripts/dlc_item_ids.json', 'r', encoding='utf-8') as f:
        all_items = json.load(f)
    
    # Count new unique names we're adding
    new_name_entries = {}
    for eng_name, chn_name in DLC_NAME_MAP.items():
        if eng_name not in existing_erdb_names:
            new_name_entries[eng_name] = chn_name
    
    # Also add name_map entries for base game items that we already have 
    # but that exist in the YAML (for completeness)
    for eng_name in existing_erdb_names:
        if eng_name in DLC_NAME_MAP and eng_name not in existing_names:
            new_name_entries[eng_name] = DLC_NAME_MAP[eng_name]
    
    # Generate DLC data additions
    dlc_armaments = {}
    dlc_armor = {}
    dlc_talismans = {}
    dlc_spells = {}
    dlc_ashes = {}
    dlc_spirit = {}
    
    # Load Chinese weapon descriptions from FMG for DLC weapons
    try:
        from parse_fmg import parse_fmg
        import sys
        sys.path.insert(0, os.path.dirname(__file__))
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dlc_fmg = parse_fmg(os.path.join(root_dir, 'tmp_conv', 'origin', 'zhoCN', 'item_dlc02', 'WeaponCaption_dlc01.fmg'))
        print(f"  Loaded {len(dlc_fmg)} DLC weapon descriptions from FMG")
    except Exception as e:
        print(f"  Warning: could not load FMG descriptions: {e}")
        dlc_fmg = {}
    
    # Process DLC Weapons
    dlc_weapons = all_items.get('DLC Weapons', {})
    for eng_name, hex_id in dlc_weapons.items():
        if eng_name in existing_erdb_names:
            continue  # skip base game items
        if 'Arrow' in eng_name or 'Bolt' in eng_name or 'Harpoon' in eng_name or 'Greatbolt' in eng_name:
            continue  # skip ammunition (not weapons)
        cat = WEAPON_CATEGORY_MAP.get(eng_name, "Dagger")
        
        # Get real description from FMG if available
        if hex_id in dlc_fmg and isinstance(dlc_fmg[hex_id], str) and dlc_fmg[hex_id].strip():
            raw_desc = dlc_fmg[hex_id].strip()
            desc_lines = [line.strip() for line in raw_desc.split('\n') if line.strip()]
        else:
            desc_lines = [f"DLC item: {eng_name}"]
        
        item = {
            "full_hex_id": format(hex_id, '08X'),
            "id": hex_id,
            "name": eng_name,
            "summary": "no summary",
            "description": desc_lines,
            "is_tradable": True,
            "price_sold": 0,
            "rarity": "Common",
            "icon": 0,
            "max_held": 999,
            "max_stored": 999,
            "locations": [{"summary": "Shadow of the Erdtree DLC"}],
            "remarks": [],
            "category": cat,
            "weight": 2.0,
        }
        if cat in ('Dagger', 'Straight Sword', 'Greatsword', 'Colossal Sword',
                   'Curved Sword', 'Curved Greatsword', 'Katana', 'Twinblade',
                   'Thrusting Sword', 'Light Greatsword', 'Backhand Blade',
                   'Great Katana'):
            item.update({
                "default_skill_id": 800,
                "allow_ash_of_war": True,
                "is_buffable": True,
                "is_l1_guard": False,
                "upgrade_material": "Smithing Stone",
            })
            item["attack_attributes"] = ["Standard"]
            item["requirements"] = {"strength": 10, "dexterity": 10}
        dlc_armaments[eng_name] = item
    
    # Process DLC Armor
    dlc_armor_items = all_items.get('DLC Armor', {})
    for eng_name, hex_id in dlc_armor_items.items():
        if eng_name in existing_erdb_names:
            continue
        base = eng_name.replace(" (Altered)", "")
        cat = ARMOR_CATEGORY_MAP.get(eng_name, "Head")
        item = {
            "full_hex_id": format(hex_id, '08X'),
            "id": hex_id,
            "name": eng_name,
            "summary": "no summary",
            "description": [f"DLC armor: {eng_name}"],
            "is_tradable": True,
            "price_sold": 500,
            "rarity": "Common",
            "icon": 13000,
            "max_held": 999,
            "max_stored": 999,
            "locations": [{"summary": "Shadow of the Erdtree DLC"}],
            "remarks": [],
            "category": cat,
            "altered": " (Altered)" in eng_name,
            "weight": 3.0,
            "icon_fem": 13000,
            "absorptions": {"physical": 3.0, "strike": 2.5, "slash": 2.8, "pierce": 2.5,
                          "magic": 2.0, "fire": 2.5, "lightning": 2.0, "holy": 2.5},
            "resistances": {"immunity": 10, "robustness": 15, "focus": 8, "vitality": 8, "poise": 3},
            "effects": [],
        }
        dlc_armor[eng_name] = item
    
    # Process DLC Accessories (Talismans)
    dlc_accessories = all_items.get('DLC Accessories', {})
    for eng_name, hex_id in dlc_accessories.items():
        if eng_name in ('Perfumer\'s Talisman',):  # some base game items slipped into DLC list
            if eng_name in existing_erdb_names:
                continue
        item = {
            "full_hex_id": format(hex_id, '08X'),
            "id": hex_id,
            "name": eng_name,
            "summary": "DLC talisman",
            "description": [f"DLC talisman: {eng_name}"],
            "is_tradable": True,
            "price_sold": 500,
            "rarity": "Rare",
            "icon": 18000,
            "max_held": 999,
            "max_stored": 999,
            "locations": [{"summary": "Shadow of the Erdtree DLC"}],
            "remarks": [],
            "category": "Talisman",
            "weight": 0.5,
            "effects": [{"attribute": "Unknown", "value": 0, "model": "multiplicative", "type": "positive"}],
            "conflicts": [],
        }
        dlc_talismans[eng_name] = item
    
    # Process DLC Spells
    dlc_spell_items = all_items.get('DLC Spells', {})
    for eng_name, hex_id in dlc_spell_items.items():
        item = {
            "full_hex_id": format(hex_id, '08X'),
            "id": hex_id,
            "name": eng_name,
            "summary": "DLC spell",
            "description": [f"DLC spell: {eng_name}"],
            "is_tradable": True,
            "price_sold": 0,
            "rarity": "Common",
            "icon": 6000,
            "max_held": 99,
            "max_stored": 600,
            "locations": [{"summary": "Shadow of the Erdtree DLC"}],
            "remarks": [],
            "fp_cost": 15,
            "fp_cost_extra": 0,
            "sp_cost": 30,
            "sp_cost_extra": 0,
            "category": "Sorcery",
            "slots_used": 1,
            "hold_action": "None",
            "is_weapon_buff": False,
            "is_shield_buff": False,
            "is_horseback_castable": True,
            "requirements": {"intelligence": 10},
        }
        dlc_spells[eng_name] = item
    
    # Process DLC Ashes of War
    dlc_ash_items = all_items.get('DLC Ashes of War', {})
    for eng_name, hex_id in dlc_ash_items.items():
        item = {
            "full_hex_id": format(hex_id, '08X'),
            "id": hex_id,
            "name": eng_name,
            "summary": "no summary",
            "description": [f"DLC Ash of War"] if eng_name.startswith("Ash of War:") else [f"DLC Ash of War: {eng_name}"],
            "is_tradable": True,
            "price_sold": 500,
            "rarity": "Common",
            "icon": 8300,
            "max_held": 999,
            "max_stored": 999,
            "locations": [{"summary": "Shadow of the Erdtree DLC"}],
            "remarks": [],
            "category": "Ash of War",
            "weight": 0,
            "fp_cost": 10,
            "effects": [],
            "compatible_types": ["Melee"],
        }
        dlc_ashes[eng_name] = item
    
    # Process DLC Spirit Ashes
    dlc_spirit_items = all_items.get('DLC Spirit Ashes', {})
    for eng_name, hex_id in dlc_spirit_items.items():
        item = {
            "full_hex_id": format(hex_id, '08X'),
            "id": hex_id,
            "name": eng_name,
            "summary": "no summary",
            "description": [f"DLC Spirit Ash: {eng_name}"],
            "is_tradable": True,
            "price_sold": 0,
            "rarity": "Common",
            "icon": 102,
            "max_held": 1,
            "max_stored": 1,
            "locations": [{"summary": "Shadow of the Erdtree DLC"}],
            "remarks": [],
            "fp_cost": 50,
            "hp_cost": 0,
            "category": "Spirit Ash",
            "upgrade_material": "Glovewort",
        }
        dlc_spirit[eng_name] = item
    
    # Save DLC data files
    os.makedirs(OUT_DIR, exist_ok=True)
    
    data_files = {
        'dlc-armaments.json': dlc_armaments,
        'dlc-armor.json': dlc_armor,
        'dlc-talismans.json': dlc_talismans,
        'dlc-spells.json': dlc_spells,
        'dlc-ashes-of-war.json': dlc_ashes,
        'dlc-spirit-ashes.json': dlc_spirit,
    }
    
    for fname, data in data_files.items():
        if data:
            path = os.path.join(OUT_DIR, fname)
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved {len(data)} DLC items to {fname}")
    
    # Update name_map.json
    merged_names = {**existing_names}
    for eng_name, chn_name in new_name_entries.items():
        if eng_name not in merged_names:
            merged_names[eng_name] = chn_name
    
    name_map_path = os.path.join(OUT_DIR, 'name_map.json')
    with open(name_map_path, 'w', encoding='utf-8') as f:
        json.dump(merged_names, f, ensure_ascii=False, indent=2)
    print(f"Updated name_map.json: +{len(merged_names) - len(existing_names)} new entries")
    
    # Create/update desc_map.json with DLC descriptions
    existing_desc = {}
    try:
        with open(os.path.join(OUT_DIR, 'desc_map.json'), 'r', encoding='utf-8') as f:
            existing_desc = json.load(f)
    except FileNotFoundError:
        pass
    
    merged_desc = {**existing_desc}
    for eng_name in DLC_NAME_MAP:
        if eng_name not in merged_desc:
            merged_desc[eng_name] = f"{DLC_NAME_MAP[eng_name]}。黄金树幽影DLC新增物品。"
    
    desc_map_path = os.path.join(OUT_DIR, 'desc_map.json')
    with open(desc_map_path, 'w', encoding='utf-8') as f:
        json.dump(merged_desc, f, ensure_ascii=False, indent=2)
    print(f"Updated desc_map.json: +{len(merged_desc) - len(existing_desc)} new entries")
    
    print(f"\nSummary:")
    print(f"  Weapons: {len(dlc_armaments)}")
    print(f"  Armor: {len(dlc_armor)}")
    print(f"  Talismans: {len(dlc_talismans)}")
    print(f"  Spells: {len(dlc_spells)}")
    print(f"  Ashes of War: {len(dlc_ashes)}")
    print(f"  Spirit Ashes: {len(dlc_spirit)}")
    print(f"  Name map entries: {len(new_name_entries)}")
    print(f"  Description entries: {len(merged_desc) - len(existing_desc)}")


if __name__ == '__main__':
    generate_dlc_data()

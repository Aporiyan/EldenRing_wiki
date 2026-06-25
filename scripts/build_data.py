"""
主构建脚本: 使用 v1.16.1 参数替换现有前端数据的数值
"""
import json, os, shutil

ROOT = r'D:\Aporiyan\EldenRing_wiki'
V116_DIR = os.path.join(ROOT, 'data', 'v1.16.1_named')
DATA_DIR = os.path.join(ROOT, 'public', 'data')

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

def get_row(rows, item_id):
    return rows.get(str(item_id))

# 武器类型ID→英文名
WEAPON_CATEGORY_MAP = {
    0: 'Dagger', 1: 'Straight Sword', 2: 'Greatsword', 3: 'Colossal Sword',
    4: 'Colossal Weapon', 5: 'Thrusting Sword', 6: 'Heavy Thrusting Sword',
    7: 'Curved Sword', 8: 'Curved Greatsword', 9: 'Katana',
    10: 'Twinblade', 11: 'Hammer', 12: 'Great Hammer', 13: 'Flail',
    14: 'Axe', 15: 'Greataxe', 16: 'Halberd', 17: 'Spear',
    18: 'Great Spear', 19: 'Lance', 20: 'Reaper', 21: 'Whip',
    22: 'Fist', 23: 'Claw',
    24: 'Light Bow', 25: 'Bow', 26: 'Greatbow', 27: 'Crossbow', 28: 'Ballista',
    29: 'Glintstone Staff', 30: 'Sacred Seal',
    31: 'Small Shield', 32: 'Medium Shield', 33: 'Greatshield', 34: 'Torch',
    55: 'Backhand Blade', 56: 'Hand-to-Hand', 57: 'Perfume Bottle',
    58: 'Throwing Blade', 59: 'Thrusting Shield',
    60: 'Great Katana',
}

def add_dlc_names():
    """从 HigorFr 数据补充 DLC 武器中文名到 name_map.json"""
    print('>>> 补充 DLC 武器中文名')
    nm_path = os.path.join(DATA_DIR, 'name_map.json')
    if not os.path.exists(nm_path): return
    nm = load_json(nm_path)
    
    # 构建 FMG ID → Chinese name 映射 (From HigorFr, weapons use param ID as FMG key)
    higor = load_json(os.path.join(ROOT, 'tmp_conv', 'higor_item.json'))
    higor_dlc = load_json(os.path.join(ROOT, 'tmp_conv', 'higor_dlc01.json'))
    
    fmg_cn = {}
    for data in [higor, higor_dlc]:
        for key, fmg_data in data.items():
            fmg_file = key.split('/')[-1]
            if not ('WeaponName' in fmg_file and fmg_file.endswith('.fmg')): continue
            for msg_id, text in fmg_data.items():
                if not msg_id.isdigit(): continue
                if '[ERROR]' in text or '%null%' in text: continue
                fmg_cn[msg_id] = text
    
    added = 0
    # 从武器数据文件中获取英→中映射
    for fname in ['armaments.json', 'dlc-armaments.json']:
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath): continue
        data = load_json(fpath)
        for eng_name, item in data.items():
            if eng_name in nm: continue  # 已有映射
            cn = fmg_cn.get(str(item['id']), '')
            if cn:
                nm[eng_name] = cn
                added += 1
    
    save_json(nm_path, nm)
    print(f'  新增 {added} 个中文名')

def build_armaments():
    print('>>> 武器')
    v116 = load_v116('EquipParamWeapon')
    if not v116: return
    rows = v116['rows']

    for fname in ['armaments.json', 'dlc-armaments.json']:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path): continue
        data = load_json(path)
        count = 0
        for eng_name, item in data.items():
            rid = str(item['id'])
            if rid not in rows: continue
            r = rows[rid]
            count += 1

            # 基础字段
            item['weight'] = r.get('weight', item.get('weight', 0))
            item['icon'] = r.get('iconId', item.get('icon', 0))
            item['behavior_variation_id'] = r.get('behaviorVariationId', item.get('behavior_variation_id', 0))
            item['default_skill_id'] = r.get('swordArtsParamId', item.get('default_skill_id', -1))
            item['allow_ash_of_war'] = bool(r.get('isCustom', 1))
            item['is_buffable'] = bool(r.get('isEnhance', 1))
            item['is_l1_guard'] = bool(r.get('enableGuard', 0))
            item['sp_consumption_rate'] = r.get('staminaConsumptionRate', item.get('sp_consumption_rate', 1.0))
            item['upgrade_material'] = 'Somber Smithing Stone' if r.get('reinforceTypeId', 0) == 1 else 'Smithing Stone'
            item['price_sold'] = r.get('sellValue', item.get('price_sold', 0))

            wcat = r.get('weaponCategory', -1)
            if wcat in WEAPON_CATEGORY_MAP:
                item['category'] = WEAPON_CATEGORY_MAP[wcat]
                # Disambiguate: weaponCategory=8 is Curved Greatsword (wepType=57) or Sacred Seal (wepType=61)
                if wcat == 8 and r.get('wepType', -1) == 61:
                    item['category'] = 'Sacred Seal'

            # 攻击类型列表 (attack_attributes)
            atk_attrs = []
            atk_flag = r.get('atkAttribute', 0)
            if atk_flag & 1: atk_attrs.append('Standard')
            if atk_flag & 2: atk_attrs.append('Slash')
            if atk_flag & 4: atk_attrs.append('Strike')
            if atk_flag & 8: atk_attrs.append('Pierce')
            if atk_attrs:
                item['attack_attributes'] = atk_attrs

            # affinity.Standard (create if missing)
            if 'affinity' not in item:
                item['affinity'] = {}
            if 'Standard' not in item['affinity']:
                item['affinity']['Standard'] = {}
            aff = item['affinity']['Standard']
            aff['reinforcement_id'] = r.get('reinforceTypeId', 0)

            # damage
            dmg = aff.get('damage', {})
            dmg['physical'] = r.get('attackBasePhysics', dmg.get('physical', 0))
            dmg['magic'] = r.get('attackBaseMagic', dmg.get('magic', 0))
            dmg['fire'] = r.get('attackBaseFire', dmg.get('fire', 0))
            dmg['lightning'] = r.get('attackBaseThunder', dmg.get('lightning', 0))
            dmg['holy'] = r.get('attackBaseDark', dmg.get('holy', 0))
            dmg['stamina'] = r.get('attackBaseStamina', dmg.get('stamina', 0))
            aff['damage'] = dmg

            # scaling
            sca = aff.get('scaling', {})
            sca['strength'] = r.get('correctStrength', 0) / 100.0
            sca['dexterity'] = r.get('correctAgility', 0) / 100.0
            sca['intelligence'] = r.get('correctMagic', 0) / 100.0
            sca['faith'] = r.get('correctFaith', 0) / 100.0
            sca['arcane'] = r.get('correctLuck', 0) / 100.0
            aff['scaling'] = sca

            # guard
            gd = aff.get('guard', {})
            gd['physical'] = r.get('physGuardCutRate', gd.get('physical', 0))
            gd['magic'] = r.get('magGuardCutRate', gd.get('magic', 0))
            gd['fire'] = r.get('fireGuardCutRate', gd.get('fire', 0))
            gd['lightning'] = r.get('thunGuardCutRate', gd.get('lightning', 0))
            gd['holy'] = r.get('darkGuardCutRate', gd.get('holy', 0))
            gd['boost'] = r.get('staminaGuardDef', gd.get('boost', 0))
            aff['guard'] = gd

            # requirements
            req = aff.get('requirements', {})
            req['strength'] = r.get('properStrength', req.get('strength', 0))
            req['dexterity'] = r.get('properAgility', req.get('dexterity', 0))
            req['intelligence'] = r.get('properMagic', req.get('intelligence', 0))
            req['faith'] = r.get('properFaith', req.get('faith', 0))
            req['arcane'] = r.get('properLuck', req.get('arcane', 0))
            aff['requirements'] = req

            aff['weight'] = r.get('weight', aff.get('weight', 0))

            # 顶级 requirements
            item['requirements'] = req

        save_json(path, data)
        print(f'  {fname}: 更新 {count}/{len(data)} 条目')

def build_armor():
    print('>>> 防具')
    v116 = load_v116('EquipParamProtector')
    if not v116: return
    rows = v116['rows']

    for fname in ['armor.json', 'dlc-armor.json']:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path): continue
        data = load_json(path)
        count = 0
        for eng_name, item in data.items():
            rid = str(item['id'])
            if rid not in rows: continue
            r = rows[rid]
            count += 1

            item['weight'] = r.get('weight', item.get('weight', 0))
            item['icon'] = r.get('iconId', item.get('icon', 0))
            item['poise'] = r.get('poise', item.get('poise', 0))
            item['price_sold'] = r.get('sellValue', item.get('price_sold', 0))

            equip_slot = r.get('equipSlot', -1)
            if equip_slot in {0: 'Head', 1: 'Body', 2: 'Arms', 3: 'Legs'}:
                item['category'] = {0: 'Head', 1: 'Body', 2: 'Arms', 3: 'Legs'}[equip_slot]

            # absorption
            absorp = item.get('absorption', {})
            for k, src in [('Physical', 'physicsDef'), ('Magic', 'magicDef'), ('Fire', 'fireDef'),
                           ('Lightning', 'thunderDef'), ('Holy', 'darkDef')]:
                if src in r:
                    absorp[k] = r[src]

            # resistances
            res = item.get('resistances', {})
            for k, src in [('immunity', 'resistImmunity'), ('robustness', 'resistRobustness'),
                           ('vitality', 'resistFocus'), ('focus', 'resistSleep'), ('poise', 'poise')]:
                if src in r:
                    res[k] = r[src]

        save_json(path, data)
        print(f'  {fname}: 更新 {count}/{len(data)} 条目')

def build_talismans():
    print('>>> 护符')
    v116 = load_v116('EquipParamAccessory')
    if not v116: return
    rows = v116['rows']

    for fname in ['talismans.json', 'dlc-talismans.json']:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path): continue
        data = load_json(path)
        count = 0
        for eng_name, item in data.items():
            rid = str(item['id'])
            if rid not in rows: continue
            r = rows[rid]
            count += 1

            item['weight'] = r.get('weight', item.get('weight', 0))
            item['icon'] = r.get('iconId', item.get('icon', 0))

        save_json(path, data)
        print(f'  {fname}: 更新 {count}/{len(data)} 条目')

def build_spells():
    print('>>> 魔法')
    v116 = load_v116('Magic')
    if not v116: return
    rows = v116['rows']

    for fname in ['spells.json', 'dlc-spells.json']:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path): continue
        data = load_json(path)
        count = 0
        for eng_name, item in data.items():
            rid = str(item['id'])
            if rid not in rows: continue
            r = rows[rid]
            count += 1

            item['fp_cost'] = r.get('focusPoints', item.get('fp_cost', 0))
            item['slots'] = r.get('memorySlotNum', item.get('slots', 1))
            item['icon'] = r.get('iconId', item.get('icon', 0))

            req = item.get('requirements', {})
            req['intelligence'] = r.get('requirementInt', req.get('intelligence', 0))
            req['faith'] = r.get('requirementFaith', req.get('faith', 0))
            req['arcane'] = r.get('requirementLuck', req.get('arcane', 0))

            cat = r.get('ezStateBehaviorType', 0)
            item['category'] = 'Sorcery' if cat == 0 else 'Incantation'

        save_json(path, data)
        print(f'  {fname}: 更新 {count}/{len(data)} 条目')

def build_ashes_of_war():
    print('>>> 战灰')
    v116 = load_v116('EquipParamGem')
    if not v116: return
    rows = v116['rows']

    for fname in ['ashes-of-war.json', 'dlc-ashes-of-war.json']:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path): continue
        data = load_json(path)
        count = 0
        for eng_name, item in data.items():
            rid = str(item['id'])
            if rid not in rows: continue
            r = rows[rid]
            count += 1
            item['icon'] = r.get('iconId', item.get('icon', 0))
            item['price_sold'] = r.get('sellValue', item.get('price_sold', 0))

        save_json(path, data)
        print(f'  {fname}: 更新 {count}/{len(data)} 条目')

def build_reinforcements():
    print('>>> 强化曲线')
    rw = load_v116('ReinforceParamWeapon')
    rp = load_v116('ReinforceParamProtector')

    def extract(data):
        result = {}
        if not data: return result
        for row_id, row in data['rows'].items():
            if not row_id.isdigit(): continue
            rid = int(row_id)
            entry = {}
            for k, v in row.items():
                if k != '_name':
                    entry[k] = v
            result[rid] = entry
        return result

    save_json(os.path.join(DATA_DIR, 'reinforcements.json'),
              {'weapon': extract(rw), 'protector': extract(rp)})
    print(f'  武器曲线: {len(extract(rw))}, 防具曲线: {len(extract(rp))}')

def build_spirit_ashes():
    print('>>> 骨灰')
    # 保持现有骨灰数据不变 (来源于 EquipParamGoods，已有数据)
    pass

def build_tools():
    print('>>> 道具 (保持现有)')
    pass

def delete_old_v110():
    old_dir = os.path.join(ROOT, 'data', '1.10.0')
    if os.path.exists(old_dir):
        shutil.rmtree(old_dir)
        print(f'已删除 {old_dir}')

def main():
    print('=' * 50)
    print('  艾尔登法环 Wiki 数据生成 v1.16.1')
    print('=' * 50)
    add_dlc_names()
    build_reinforcements()
    build_armaments()
    build_armor()
    build_talismans()
    build_spells()
    build_ashes_of_war()
    build_spirit_ashes()
    build_tools()
    print('\n=== 完成 ===')

if __name__ == '__main__':
    main()

"""Parse soulstruct paramdef Python files to extract field definitions (name, type, offset)."""
import re, os, json

PARAMDEF_DIR = r"C:\Users\Administrator\AppData\Local\Programs\Python\Python311\Lib\site-packages\soulstruct\eldenring\params\paramdef"
GAMEPARAM_BND_PATH = os.path.join(os.path.dirname(PARAMDEF_DIR), "gameparambnd.py")

FIELD_TYPES = {
    "uint8": 1, "uint16": 2, "uint32": 4,
    "int8": 1, "int16": 2, "int32": 4, "int64": 8,
    "float32": 4, "float64": 8,
    "bool": 1, "uint64": 8,
}


def extract_entry_mapping():
    """Parse gameparambnd.py to get BND4 entry name → paramdef class name mapping."""
    text = open(GAMEPARAM_BND_PATH, "r", encoding="utf-8").read()
    mapping = {}
    # Match: ParamName = param_property("ParamName")  # type: Param[CLASS_NAME]
    pattern = re.compile(r'(\w+)\s*=\s*param_property\s*\(\s*"([^"]+)"\s*\).*?Param\s*\[\s*(\w+(?:_ST)?)\s*\]')
    for match in pattern.finditer(text):
        entry_name = match.group(2)
        class_name = match.group(3)
        mapping[entry_name] = class_name
    return mapping


def parse_paramdef_file(filepath):
    """Parse a single paramdef Python file, returning ordered list of field definitions."""
    text = open(filepath, "r", encoding="utf-8").read()
    
    # Extract class name
    class_match = re.search(r'class\s+(\w+)\s*\(', text)
    if not class_match:
        return None
    class_name = class_match.group(1)
    
    fields = []
    current_bit = 0  # bit position within current byte (0-7)
    current_byte = 0  # absolute byte offset
    
    # Match paramfield/pad/bitpad assignments: name = ParamField(...) or _Pad = ParamPad(...)
    # We process line by line to handle multi-line definitions
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip comments, blank lines, decorators, etc
        stripped = line.strip()
        if not stripped or stripped.startswith('#') or stripped.startswith('@'):
            i += 1
            continue
        if stripped.startswith('from ') or stripped.startswith('import ') or stripped.startswith('__all__'):
            i += 1
            continue
        if stripped.startswith('class ') and 'ParamRow' not in stripped:
            i += 1
            continue
        if stripped.startswith('class '):
            i += 1
            continue
        
        # Check for assignment that might span multiple lines
        if '=' in stripped:
            # Collect the full assignment (may span multiple lines)
            full_line = line
            while '{' not in full_line and not stripped.endswith(')') and i + 1 < len(lines):
                i += 1
                full_line += '\n' + lines[i]
                stripped = full_line.strip()
            
            # Determine if it's ParamField, ParamPad, or ParamBitPad
            if 'ParamField(' in stripped:
                field = _parse_paramfield(full_line)
                if field:
                    # Determine size
                    type_name = field['type']
                    bit_count = field.get('bit_count', 0)
                    size = FIELD_TYPES.get(type_name, 4)
                    
                    if bit_count:
                        # Bit field within current byte
                        if current_bit + bit_count > 8:
                            # Advance to next byte
                            current_byte += 1
                            current_bit = 0
                        field['offset'] = current_byte
                        field['bit_offset'] = current_bit
                        field['bit_count'] = bit_count
                        current_bit += bit_count
                    else:
                        # Full size field - align to size boundary
                        if current_bit > 0:
                            current_byte += 1
                            current_bit = 0
                        # Natural alignment
                        align = min(size, 4)
                        if current_byte % align != 0:
                            current_byte = ((current_byte // align) + 1) * align
                        field['offset'] = current_byte
                        field['bit_offset'] = -1
                        field['bit_count'] = 0
                        current_byte += size
                    
                    fields.append(field)
                    
            elif 'ParamPad(' in stripped:
                pad = _parse_parampad(full_line)
                if pad:
                    if current_bit > 0:
                        current_byte += 1
                        current_bit = 0
                    pad['offset'] = current_byte
                    pad['bit_offset'] = -1
                    current_byte += pad['size']
                    fields.append(pad)
                    
            elif 'ParamBitPad(' in stripped:
                bitpad = _parse_parambitpad(full_line)
                if bitpad:
                    bc = bitpad.get('bit_count', 0)
                    if current_bit + bc > 8:
                        current_byte += 1
                        current_bit = 0
                    bitpad['offset'] = current_byte
                    bitpad['bit_offset'] = current_bit
                    bitpad['bit_count'] = bc
                    current_bit += bc
                    fields.append(bitpad)
        
        i += 1
    
    # Final alignment
    if current_bit > 0:
        current_byte += 1
    
    return {
        'class_name': class_name,
        'total_size': current_byte,
        'fields': fields,
    }


def _parse_paramfield(text):
    """Parse a ParamField(...) definition."""
    # Extract field name
    name_match = re.search(r'^\s+(\w+)\s*:', text)
    if not name_match:
        return None
    name = name_match.group(1)
    
    # Skip private/pad fields
    if name.startswith('_'):
        return None
    
    # Extract type from ParamField(first_arg, ...)
    # Match the type name before the first quoted string
    m = re.search(r'ParamField\(\s*(\w+)', text)
    if not m:
        return None
    field_type = m.group(1)
    
    # Extract internal_name (first quoted string argument)
    m = re.search(r'"[^"]*"', text)
    internal_name = m.group(0).strip('"') if m else name
    
    # Check for bit_count
    bit_count = 0
    m = re.search(r'bit_count\s*=\s*(\d+)', text)
    if m:
        bit_count = int(m.group(1))
    
    # Check for game_type
    game_type = None
    m = re.search(r'game_type\s*=\s*(\w+)', text)
    if m:
        game_type = m.group(1)
    
    # Check for default
    default = None
    m = re.search(r'default\s*=\s*(-?\d+\.?\d*|True|False)', text)
    if m:
        dv = m.group(1)
        if dv == 'True':
            default = True
        elif dv == 'False':
            default = False
        else:
            try:
                default = int(dv) if '.' not in dv else float(dv)
            except ValueError:
                pass
    
    return {
        'name': name,
        'internal_name': internal_name,
        'type': field_type,
        'bit_count': bit_count,
        'game_type': game_type,
        'default': default,
    }


def _parse_parampad(text):
    """Parse a ParamPad(size, "internal_name") definition."""
    m = re.search(r'ParamPad\(\s*(\d+)', text)
    if not m:
        return None
    size = int(m.group(1))
    name_match = re.search(r'^\s+(__\w+|\w+)\s*:', text)
    name = name_match.group(1) if name_match else '__pad'
    return {'name': name, 'type': 'pad', 'size': size}


def _parse_parambitpad(text):
    """Parse a ParamBitPad(type, "internal_name", bit_count=N) definition."""
    m = re.search(r'bit_count\s*=\s*(\d+)', text)
    bit_count = int(m.group(1)) if m else 0
    m = re.search(r'ParamBitPad\(\s*(\w+)', text)
    field_type = m.group(1) if m else 'uint8'
    name_match = re.search(r'^\s+(_\w+)\s*:', text)
    name = name_match.group(1) if name_match else '__bitpad'
    return {'name': name, 'type': 'bitpad', 'field_type': field_type, 'bit_count': bit_count}


def extract_paramdef_field_mapping(entry_mapping):
    """For all known param types, extract field definitions."""
    all_defs = {}
    for entry_name, class_name in entry_mapping.items():
        filepath = os.path.join(PARAMDEF_DIR, class_name + '.py')
        if not os.path.exists(filepath):
            print(f"WARNING: paramdef file not found: {filepath}")
            continue
        parsed = parse_paramdef_file(filepath)
        if parsed:
            all_defs[entry_name] = parsed
        else:
            print(f"WARNING: could not parse paramdef: {filepath}")
    return all_defs


if __name__ == '__main__':
    entry_map = extract_entry_mapping()
    print(f"Found {len(entry_map)} entry→class mappings")
    defs = extract_paramdef_field_mapping(entry_map)
    print(f"Parsed {len(defs)} paramdef files")
    
    # Print summary for key types
    for name in ['EquipParamWeapon', 'EquipParamProtector', 'EquipParamAccessory', 'EquipParamGoods', 'Magic', 'SpEffectParam', 'ReinforceParamWeapon', 'ReinforceParamProtector']:
        if name in defs:
            d = defs[name]
            non_pad = [f for f in d['fields'] if f['type'] not in ('pad', 'bitpad')]
            print(f"\n{name}: size={d['total_size']}, fields={len(d['fields'])}, named={len(non_pad)}")
            for f in non_pad[:5]:
                print(f"  {f['name']}: type={f['type']} off={f['offset']} internal={f['internal_name']}")
            if len(non_pad) > 5:
                print(f"  ... ({len(non_pad)-5} more)")
    
    # Save all definitions
    out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'paramdef_mapping.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        # Convert to serializable format
        serializable = {}
        for entry_name, d in defs.items():
            serializable[entry_name] = {
                'class_name': d['class_name'],
                'total_size': d['total_size'],
                'fields': d['fields'],
            }
        json.dump(serializable, f, ensure_ascii=False, indent=1)
    print(f"\nSaved mapping to {out_path}")

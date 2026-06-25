#!/usr/bin/env python3
"""Parse FromSoftware FMG binary files (Elden Ring V2 format) and output JSON."""

import json
import struct
import sys
from pathlib import Path


def parse_fmg(filepath: str) -> dict:
    data = Path(filepath).read_bytes()
    size = len(data)

    # --- Header (40 bytes for V2) ---
    pos = 0
    pad1 = data[pos]; pos += 1
    big_endian = data[pos]; pos += 1
    version = data[pos]; pos += 1
    pad2 = data[pos]; pos += 1

    if version != 2:
        print(f"Warning: expected version 2 (Elden Ring), got {version}", file=sys.stderr)

    file_size = struct.unpack_from("<I", data, pos)[0]; pos += 4
    _one = data[pos]; pos += 1
    _zero = data[pos]; pos += 1
    _pad3 = struct.unpack_from("<H", data, pos)[0]; pos += 2
    range_count = struct.unpack_from("<I", data, pos)[0]; pos += 4
    string_count = struct.unpack_from("<I", data, pos)[0]; pos += 4
    unknown2 = struct.unpack_from("<I", data, pos)[0]; pos += 4
    string_offsets_offset = struct.unpack_from("<Q", data, pos)[0]; pos += 8
    _pad4 = struct.unpack_from("<I", data, pos)[0]; pos += 4
    _pad5 = struct.unpack_from("<I", data, pos)[0]; pos += 4

    print(f"FMG Info:", file=sys.stderr)
    print(f"  File size:       {file_size} bytes", file=sys.stderr)
    print(f"  Version:         {version}", file=sys.stderr)
    print(f"  Range count:     {range_count}", file=sys.stderr)
    print(f"  String count:    {string_count}", file=sys.stderr)
    print(f"  Offsets offset:  {string_offsets_offset}", file=sys.stderr)
    print(f"  Header size:     {pos} bytes", file=sys.stderr)

    # --- Range Table (16 bytes each) ---
    ranges = []
    for i in range(range_count):
        first_index = struct.unpack_from("<I", data, pos)[0]; pos += 4
        first_id = struct.unpack_from("<I", data, pos)[0]; pos += 4
        last_id = struct.unpack_from("<I", data, pos)[0]; pos += 4
        range_pad = struct.unpack_from("<I", data, pos)[0]; pos += 4
        ranges.append((first_index, first_id, last_id))

    range_table_end = pos
    print(f"  Range table end: {range_table_end}", file=sys.stderr)

    if range_table_end != string_offsets_offset:
        print(f"  Warning: range table ends at {range_table_end}, "
              f"but string_offsets_offset = {string_offsets_offset}", file=sys.stderr)

    # --- String Offset Table (8 bytes each) ---
    pos = string_offsets_offset
    string_offsets = []
    for i in range(string_count):
        str_off = struct.unpack_from("<Q", data, pos)[0]; pos += 8
        string_offsets.append(str_off)

    offset_table_end = pos
    print(f"  Offset table end: {offset_table_end} (string data starts here)", file=sys.stderr)
    print(f"  Total entries:   {string_count}", file=sys.stderr)

    # --- Read strings ---
    strings = {}
    for first_index, first_id, last_id in ranges:
        for string_id in range(first_id, last_id + 1):
            str_off = string_offsets[first_index]
            if str_off == 0:
                strings[string_id] = ""
            else:
                # Read null-terminated UTF-16LE string
                end = str_off
                while end + 1 < size and not (data[end] == 0 and data[end + 1] == 0):
                    end += 2
                raw = data[str_off:end]
                strings[string_id] = raw.decode("utf-16-le", errors="replace")
            first_index += 1

    return strings


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <fmg_file> [output_json]", file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]
    strings = parse_fmg(filepath)

    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(strings, f, ensure_ascii=False, indent=2)
        print(f"Written {len(strings)} entries to {output_path}", file=sys.stderr)
    else:
        print(json.dumps(strings, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

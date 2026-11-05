#!/usr/bin/env python3
"""Build a deterministic, offline Riverbend portable ZIP from an allowlist."""

from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
FIXED_TIME = (2026, 11, 6, 0, 0, 0)
TEACHER_DOCS = {
    ROOT / "README.md": "teacher-docs/README.md",
    ROOT / "docs" / "RUNNING_zh.md": "teacher-docs/RUNNING_zh.md",
    ROOT / "docs" / "TEST_REPORT.md": "teacher-docs/TEST_REPORT.md",
    ROOT / "docs" / "RIVERBEND_v06_LEARNING_DESIGN_zh.md": "teacher-docs/RIVERBEND_v06_LEARNING_DESIGN_zh.md",
    ROOT / "docs" / "LEVEL_AUDIT_v06.json": "teacher-docs/LEVEL_AUDIT_v06.json",
    ROOT / "docs" / "V06_LEVEL_DIVERSITY_zh.md": "teacher-docs/V06_LEVEL_DIVERSITY_zh.md",
    ROOT / "docs" / "V06_INDEPENDENT_ACCEPTANCE_61_zh.md": "teacher-docs/V06_INDEPENDENT_ACCEPTANCE_61_zh.md",
    ROOT / "docs" / "V06_DELIVERY_MATRIX_zh.md": "teacher-docs/V06_DELIVERY_MATRIX_zh.md",
    ROOT / "docs" / "research" / "bridge-games-comparison.md":
        "teacher-docs/research/bridge-games-comparison.md",
    ROOT / "docs" / "research" / "bridge-workshop-architecture.md":
        "teacher-docs/research/bridge-workshop-architecture.md",
    ROOT / "docs" / "research" / "riverbend-v04-decisions.md":
        "teacher-docs/research/riverbend-v04-decisions.md",
    ROOT / "docs" / "research" / "riverbend-v05-design-review.md":
        "teacher-docs/research/riverbend-v05-design-review.md",
}
DENIED_PARTS = {
    ".git",
    ".env",
    "node_modules",
    "work",
    "auth.json",
    "image-auth.json",
    "config.toml",
}

README = """Bridge Engineer - Riverbend v0.6 / 桥梁工程师 Riverbend v0.6
================================================================

ENGLISH
-------
Launch: keep this folder intact, then double-click index.html in a current
desktop Chromium-based browser. No server, account, API key or network is
required. Optional external reading links need a connection only when opened.

The package contains an eight-crossing campaign and a separate Free Build
laboratory. Campaign and sandbox work are stored locally when browser storage
is available. Help > Settings can export progress before moving computers.

Model limits: this is an educational axial-member simulation, not engineering
analysis software. It idealizes pin joints, self-weight, axial deformation,
simplified failure and tension-only cable. It omits beam bending, realistic
buckling shapes, joint failure, fatigue, wind and full wheel contact. The 12 cm
drop rule and material values are game rules. Passing is not proof of a safe or
optimal real bridge, and completion is not proof of learning outcomes.

The four story PNGs are local rasterizations of original code-authored SVG
illustrations. They are native project artwork, not successful API-generated
images and not downloaded third-party artwork. See assets/ART-PROVENANCE.md.

中文
----
启动：保持文件夹完整，使用当前桌面版 Chromium 内核浏览器双击
index.html。无需服务器、安装、账号、API Key 或联网。只有主动打开外部
参考链接时才需要网络。

游戏包含八关主线和独立 Free Build 实验室。浏览器允许本地存储时会保存
主线与沙盒进度；换电脑前可在 Help > Settings 导出进度。

模型边界：这是教学用轴向构件仿真，不是工程分析软件。它简化了铰接节点、
自重、轴向变形、构件失效和只受拉缆索，省略梁弯曲、真实屈曲形态、节点
破坏、疲劳、风和完整轮胎接触。12 cm 下落与材料参数是游戏规则。通关不
证明真实桥梁安全或数学最优，也不自动证明学习成效。

四张故事 PNG 是项目原创代码绘制 SVG 的本地栅格化版本，不是成功的 API
生图，也不是下载的第三方美术。详见 assets/ART-PROVENANCE.md。

Licenses and teaching references
--------------------------------
Phaser's MIT notice is in vendor/PHASER-LICENSE.md. Optional teacher-facing
design notes and the numerical audit are in teacher-docs/; they are not needed
to run the game.
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path,
                        help="Candidate or primary ZIP path")
    parser.add_argument("--copy-to", action="append", default=[], type=Path,
                        help="Optional additional release destination; repeatable")
    return parser.parse_args()


def validate_source() -> None:
    required = [
        SITE / "index.html",
        SITE / "styles.css",
        SITE / "vendor" / "phaser-3.90.0.min.js",
        SITE / "vendor" / "PHASER-LICENSE.md",
        SITE / "assets" / "ART-PROVENANCE.md",
        *[SITE / "assets" / f"story-panel-{i}.png" for i in range(1, 5)],
    ]
    missing = [str(path.relative_to(ROOT)) for path in required if not path.is_file()]
    missing += [str(path.relative_to(ROOT)) for path in TEACHER_DOCS if not path.is_file()]
    if missing:
        raise SystemExit("Missing package inputs: " + ", ".join(missing))


def package_entries() -> list[tuple[str, bytes]]:
    entries: list[tuple[str, bytes]] = [("README.txt", README.encode("utf-8"))]
    for path in SITE.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(SITE)
        lower_parts = {part.lower() for part in relative.parts}
        if lower_parts & DENIED_PARTS:
            raise SystemExit(f"Refusing denied runtime path: {relative}")
        if any(token in path.name.lower() for token in ("secret", "credential", "api-key")):
            raise SystemExit(f"Refusing credential-like runtime filename: {relative}")
        entries.append((relative.as_posix(), path.read_bytes()))
    for source, archive_name in TEACHER_DOCS.items():
        payload = source.read_bytes()
        if source.suffix.lower() == ".md":
            payload = rewrite_teacher_markdown(payload, archive_name)
        entries.append((archive_name, payload))
    names = [name for name, _ in entries]
    if len(names) != len(set(names)):
        raise SystemExit("Duplicate package entry")
    return sorted(entries, key=lambda item: item[0])


def rewrite_teacher_markdown(payload: bytes, archive_name: str) -> bytes:
    """Make copied repository docs internally navigable in the portable ZIP."""
    text = payload.decode("utf-8")
    if archive_name == "teacher-docs/README.md":
        text = text.replace("(docs/", "(")
        text = text.replace("(site/assets/", "(../assets/")
        text = text.replace("`site/", "`../")
    else:
        text = text.replace("`docs/research/", "`research/")
        text = text.replace("`docs/", "`")
    # These are development-repository paths, not promised package files.
    for prefix in ("tests/", "scripts/", "outputs/", "work/"):
        text = text.replace(f"`{prefix}", f"`repository:{prefix}")
    return text.encode("utf-8")


def zip_info(name: str) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(name, FIXED_TIME)
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    return info


def build(output: Path) -> tuple[str, int, int]:
    validate_source()
    entries = package_entries()
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(output.name + ".tmp")
    if temporary.exists():
        temporary.unlink()
    with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED,
                         compresslevel=9) as archive:
        for name, payload in entries:
            archive.writestr(zip_info(name), payload)
    temporary.replace(output)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    return digest, output.stat().st_size, len(entries)


def main() -> int:
    args = parse_args()
    digest, size, count = build(args.output)
    primary = args.output.resolve()
    for destination in args.copy_to:
        destination = destination.resolve()
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(primary, destination)
        if hashlib.sha256(destination.read_bytes()).hexdigest() != digest:
            raise SystemExit(f"Copied ZIP hash mismatch: {destination}")
    print(f"ZIP={primary}")
    print(f"ENTRIES={count}")
    print(f"BYTES={size}")
    print(f"SHA256={digest}")
    for destination in args.copy_to:
        print(f"COPY={destination.resolve()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

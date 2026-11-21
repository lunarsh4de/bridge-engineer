# 3D 与工程教学升级 1.3 · 2026-11-21

> 此文保留1.3渲染与操作升级记录。当前1.3.1按新要求更新了 `content.js` 的教学呈现；本轮保护范围与新验收见 `TEACHING-UPDATE_zh.md`。

离线入口为根目录 `index.html`，编辑源为 `site/`。本轮按照用户新增要求，修复不对称搭建，预置锁定道路，并在第一关之前增加真实操作教学。

## 本轮实现

- **对称建造**：一次操作创建一个逻辑构件，前后两侧立面同步显示，节点、断裂、松弛和受力同步。道路保持全宽。绕到后方时拾取、网格和预览切到后侧平面，避免点击后侧却投到前侧。
- **预置道路**：每关使用解析后有效参考结构的道路节点布置，避免额外添加未支撑铰节点。道路计预算、参与原有仿真，不能擦除或换材。Clear 只清支撑，可整体 Undo；旧存档进入时统一迁移道路。
- **首关前教学**：旋转/正视 → 金色端点连杆 → Undo/Redo → 第二根支撑 → Test/Pause/读力。支持跳过与菜单重做，练习不覆盖主线设计、测试数或实验笔记。
- **工程 Notebook**：最近60次正式实验的设计副本、可选预测、条件、持续时长、最大下落、峰值利用率、首断、松弛、成本和可选 CER。导出/导入可携带主线与笔记；原 version-1 进度格式不变，笔记存独立 sidecar key。
- **受控改进**：支持查看逐构件尺寸/拉压容量、追踪端点到支座的图连通、单根材料替换与原子撤销。不同跨度、载荷、支座、材料、预算或模型不能当同条件比较。失败或早停的小峰值不会被称为更优。
- **修复旧问题**：Inspect→Edit 后可以继续画；实时色使用当前利用率，Inspect 才使用峰值；Start over/导入不会被旧设计覆盖；模态打开时仿真暂停；添加暂停与键盘搭建路径。

## 结构边界

Three.js r165 和 OrbitControls 是本地经典脚本，无服务器、构建、CDN 或运行时 npm。编辑坐标以 `G=0.5` 转为米，求解器输出本来就是米。非道路构件镜像显示于 z=0 与 z=-0.92，道路中心 z=-0.46；前后拾取仍编辑同一个二维设计。

物理是原二维、铰接、轴向构件 XPBD；没有增加三维扭转/侧向稳定性或真实轮胎接触。断裂与屈曲容量是模型结果，12 cm 与价格是游戏值。连通不证明稳定或强度，低利用率不证明构件可以删除。

`site/js/core/` 五个文件、`ui/bus.js`、`ui/content.js` 和原 `tests/` 三个文件，合计10个受保护文件保持原 SHA-256。新增学习模块位于 `site/js/learning/engineering.js` 与 `site/js/ui/engineering-ui.js`，编排层适配显示，不改原教学源文件。

实际现有范围是六个关卡定义、八种场景配置；每条剧情五个过桥任务。历史交接中的八关/独立 Free Build 不是当前实现，不作新增内容承诺。

## 验证与可重复运行

- 原25项 Node 检查与新增15项工程证据检查：`node --test tests/campaign.test.cjs tests/model.test.cjs tests/progress.test.cjs scripts/verify-learning.cjs`。
- 浏览器完整检查：`node scripts/verify-3d.cjs [项目目录] [证据输出目录]`。工具依赖外部 Playwright，可设 `RIVERBEND_PLAYWRIGHT_MODULE`；它不是游戏运行依赖。
- 15组浏览器验收覆盖首关前真实练习、道路保护、背面搭建、两个实时鼠标通车关卡、单构件换材、实验/进度往返、完整 mill/keep/pier 剧情、八配置、键盘、五尺寸、25次资源重建、上下文恢复和原生触控模拟。
- Tabletop/Willow 的操作与通车使用真实鼠标及实时步进。后续剧情、八场景采用明确预置参考结构及原求解器固定1/60秒加速；这不是人类学习效果证据。
- 发布前 `python scripts/sync-pages.py` 和 `--check`；使用 `scripts/package-release.py` 生成1.3 ZIP，独立解压并核对 RELEASE-SHA256 清单，再对同一个解压包跑 Node 和离线浏览器验收。
- 源码证据位于 `output/playwright/v1.3/verification.json`；发布包证据位于 `output/releases/acceptance-v1.3/verification.json`；汇总位于 `output/stem-audit/completion-audit.json`。

## 教师材料与未验证范围

教学行为→证据映射见 `STEM_ALIGNMENT_zh.md`；课堂试玩见 `TEACHER_PLAYTEST_zh.md`。原评分附件缺失，未声称逐条符合未知量规。尚未做真实学生研究、实体触屏、Firefox/Safari 或正式无障碍评估。

# 如何使用这套完整小游戏规划

这是一套 Riverbend v0.5 升级规划，不是升级后的游戏，也不包含模型或训练权重。

## 先读哪份

1. MASTER_GAME_PROMPT_61_zh.md：权威提示词，包含仅规划和未来开发两种启动词。
2. GAME_COMPLETION_PLAN_61_zh.md：GPT-6.1 主计划、有限成品范围及 G0–G4 门禁。
3. DETAIL_BACKLOG_56_zh.md：GPT-5.6-sol 细化的 RB-001 至 RB-017。
4. RESEARCH_AND_ITERATION_zh.md：资料学习和现场审查范围。
5. ACCEPTANCE_61_zh.md：作者自我修订记录。
6. INDEPENDENT_REVIEW_61_zh.md：另一 GPT-6.1 角色的独立审查；保留首轮失败和修订后结论。

旧输出 STEM游戏开发_优化Prompt.md 保留作历史，不能再以“未开始编程”等过期状态指挥当前项目。

## 在当前项目启动后续开发

用户之后明确发送：

> 按 docs/planning/MASTER_GAME_PROMPT_61_zh.md 的开发模式执行。以当前 v0.5 为基线，完成 G0–G4；先将第 1/4 关做到成品品质，再完成其余六关、全流程 UI、教学反馈、路线后果、结局及离线包。由 GPT-5.6-sol 实施，GPT-6.1 独立验收并循环修复，必要时 6.1 定向接管后由另一审阅者复验。不要停在 demo、切片或功能清单；合理实现自主推进，保护已有改动。

这条启动词授权本地实施，不包含公开发布。文件存在本身不表示已开始开发。

## 迁移到其他电脑

把完整游戏工程（含 site、tests、scripts、package.json、PROJECT_STATUS.md 和 docs）一起迁移。本规划包只补充 docs/planning，不包含游戏运行资产；不得将其当作可玩游戏包。

在新电脑将本包 docs/planning 放回工程同名目录，让 Codex 先读实际源码和当前状态，再用 MASTER 的开发启动词。Playwright/Node 等仅开发测试时需要，最终离线游戏仍以解压双击 index.html 为目标。指定模型须由目标环境实际支持，不能仅在 prompt 中写模型名就声称完成路由。

## 完成口径

工程关键路径、作者/代理真实输入试玩与离线包验证必须执行；没有真实学习者研究时可以在明确边界下交付软件，但不能声称学生已学会或保证评分。新版本必须独立验收，文档通过不等于游戏通过。

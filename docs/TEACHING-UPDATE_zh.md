# 教学呈现优化 1.3.1 · 2026-11-21

按本次提供的教学法修订文本实施，延续 1.3 的对称桁架、锁定道路和首关操作练习。此次只改教学内容、交互编排及可选笔记记录；不改物理、关卡、评分、主线存档格式、事件定义和原 tests。

## 信息释放

`content.js` 的 `taskBlock1/2/3` 分别承担：

1. **进入任务**：叙事、目标、荷载/跨度/预算、通关约束、可展开的材料限制、Bloom 标签。首屏和未测试的 Notebook 不提前给出结构解释。
2. **首次失败**：角色台词解释原理，配该关第一条提示。显示在失败结果中，并追加到 Task 的 Block 1 之后。后续失败不会再次自动追加。
3. **首次成功**：现实连接、多解提示与储备后果。显示在成功结果中，Task 保留已有信息。同关返回菜单再进入会保留释放状态；切换关卡或刷新开始新的工作台会话。

原事件 `test:started/test:finished` 保持不变，编排层转接 `test:start/test:fail/level:pass`。这里 `level:pass` 指测试满足游戏标准；实际主线结算仍在 Deliver & continue 后完成。

现实桥梁描述区分悬索与本游戏的直接斜拉索，角色台词不把首断位置断言为完整失效原因。Bloom 标签表示预期认知任务，不把标签、通关或答题当作学习掌握证据。

## 逐次实验 CER

Notebook 四字段为 Predict、Claim、Evidence、Reasoning，均有问题提示与示例占位符：

- **Predict** 在下一次测试草稿中填写，开始测试时创建关卡内新编号并冻结预测；新测试不继承旧 Claim/Evidence/Reasoning。
- **Claim/Evidence/Reasoning** 在测试之后填写，最新记录默认打开，Previous/Next 与选择器可翻查同关历史。
- 输入等待 500ms 自动写入。切换记录、关闭、开始测试、导出、刷新前会保存待写入内容。
- 中断的测试保留编号，明确没有完整测量数据，不借用上一条结果。操作练习不创建正式编号。
- 独立 localStorage key 为 `riverbend_notebook`，数据形状为 `{levelId: {testIndex: {predict, claim, evidence, reasoning, ts}}}`。编号 `0` 是下一次测试草稿；正整数为实际已开始的测试。另用 `.context` key 匹配当前主线，避免新旅程混入旧笔记。
- 1.3 的测量数据与旧版进度继续可读。旧记录的预测和最后一份关卡说明迁移到对应测试，不覆盖数值。Notebook 导出增加可选 `inquiry` 段；不改变 version-1 主线进度格式。

## 储备后果的必要修正

`level.reserve` 是进入关卡时带入的旧储备，不是本关赚得的积分。因此采用原 `applyResult` 对世界副本预演，分别显示本关新增携带、旧储备消耗、配送后的总储备。提示明确“配送后”才生效。

例如 Willow：带入41、造价159、关卡预算220，按原规则只有余款的一半即30进入储备；配送后为71。没有把41误称为“本关节省”。Tabletop 不携带积分；终章提示其为最后一关。

## About 与课堂证据

About 的“Model limits, sources and teaching methods”中列出7种教学设计：Chunking、Bottom-up Discovery/5E、Demonstration→Practice→Feedback、CER+Inquiry、Storytelling+SBL、Bloom、Branch and Bottleneck。它们描述设计意图。按实际剧情说明路线、分享与支座三个决策位置，不声称仅有两个决策。

未在本轮重新读取原课程 PDF；本文对应用户提供的修订文本，不冒称完成了缺失评分附件的逐条认证。

## 验证

- `node --test tests/campaign.test.cjs tests/model.test.cjs tests/progress.test.cjs scripts/verify-learning.cjs scripts/verify-teaching.cjs`：原25项、工程证据15项、教学数据8项，共48项。
- `node scripts/verify-pedagogy.cjs [目录] [输出目录]`：12组，覆盖Willow首屏、实时首次失败、真实鼠标搭建后成功、500ms保存、刷新、逐条历史、取消测试、积分结算、跨关与练习隔离、移动端与导入导出。
- `node scripts/verify-3d.cjs [目录] [输出目录]`：15组原有3D/流程回归，含八场景、触屏模拟、相机、资源与存档。
- `python scripts/sync-pages.py --check`：根入口与 site 一致。
- 交付包使用全新目录解压，核验 RELEASE-SHA256，再对同一个包重复 Node 和两组离线浏览器验收。

源码证据：`output/playwright/teaching/verification.json`、`output/playwright/teaching-regression/verification.json`。发布验收证据与 SHA 见 `output/teaching-upgrade/completion.json`。

浏览器自动化不是学生学习效果研究。未做实体触屏、Firefox/Safari 或正式无障碍认证；三维视觉仍共用原二维轴向杆件求解器。

---
title: Gitflow 工作流程
---

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250920142126.png)

# 🩸 写在前面

在工作场合实施 Git 的时候，有很多种工作流程可供选择，此时反而会让你手足无措。企业团队最常用的一些 Git 工作流程，包括 Centralized Workflow、Feature Branch Workflow、Gitflow Workflow、Forking Workflow。

在你开始阅读之前，请记住：这些 Git 工作流程应被视作为指导方针，而非“铁律”。我们只是想告诉你可能的做法。因此，如果有必要的话，你可以组合使用不同的流程。

本文主要介绍 Gitflow Workflow，愿以此文抛砖引玉……
# GitFlow 介绍

## 1.什么是 GitFlow

**GitFlow** 是一种 Git 工作流，这个工作流程围绕着 project 的发布 (release) 定义了一个严格的如何建立分支的模型。它是团队成员遵守的一种代码管理方案。
Git 建分支是非常 cheap 的，我们可以任意建立分支，对任意分支再分支，分支开发完后再合并。
比较推荐、多见的做法是特性驱动 (Feature Driven) 的建立分支法 (Feature Branch Workflow)。
简而言之，就是每一个特性 (feature) 的开发并不直接在主干上开发，而是在分支上开发，分支开发完毕后再合并到主干上。
这样做的好处是：
1. 还处于半成品状态的 feature 不会影响到主干
2. 各个开发人员之间做自己的分支，互不干扰
3. 主干永远处于可编译、可运行的状态
GitFlow 则在这个基础上更进一步，规定了如何建立、合并分支，如何发布，如何维护历史版本等工作流程。

> [!NOTE] 在工作场合实施 Git 的时候，有很多种工作流程可供选择，此时反而会让你手足无措。企业团队最常用的一些 Git 工作流程，包括 Centralized Workflow、Feature Branch Workflow、Gitflow Workflow、Forking Workflow。

在你开始阅读之前，请记住：这些 Git 工作流程应被视作为指导方针，而非“铁律”。我们只是想告诉你可能的做法。因此，如果有必要的话，你可以组合使用不同的流程。

本文主要介绍 Gitflow Workflow，愿以此文抛砖引玉……

## 2.GitFlow 常用分支说明

|分支名称|分支说明|
|---|---|
|Production|生产分支，即 Master分支。只能从其他分支合并，不能直接修改|
|Release|发布分支，基于 Develop 分支创建，待发布完成后合并到 Develop 和 Production 分支去|
|Develop|主开发分支，包含所有要发布到下一个 Release 的代码，该分支主要合并其他分支内容|
|Feature|新功能分支，基于 Develop 分支创建，开发新功能，待开发完毕合并至 Develop 分支|
|Hotfix|修复分支，基于 Production 分支创建，待修复完成后合并到 Develop 和 Production 分支去，同时在 Master 上打一个tag|

## 3.Git flow中的分支介绍

Git Flow的核心就是分支(Branch），通过在项目的不同阶段对分支的不同操作（包括但不限于创建、合并、变基等）来实现一个完整的高效率的工作流程。Git Flow模型中定义了**主分支**和**辅助**分支两类分支。其中主分支包含主要分支和开发分支，用于组织与软件开发、部署相关的活动；辅助分支包含功能分支、预发分支、热修复分支以及其他自定义分支，是为了解决特定的问题而进行的各种开发活动。与主分支不同，这些分支总是有有限的生命时间，因为它们最终将被移除。

> [!NOTE] 主分支：master分支、develop分支；辅助分支：feature分支、release分支、hotfix分支

### 3.1 主要分支Master

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250920142320.png)

任何人不允许在主要分支上进行代码的直接提交，只接受其他分支的合入。原则上主要分支上的代码必须是合并自经过多轮测试及已经发布一段时间且线上稳定的预发分支。

> [!NOTE] master分支只存放历史发布(release)版本的源代码。即用于存放对外发布的版本，任何时候在这个分支获取到的都是稳定的已发布的版本。各个版本通过tag来标记。上图里的v0.1和v0.2就是tag。

### 3.2 开发分支（Develop）

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250920142354.png)

开发分支接受其他辅助分支的合入，最常见的就是功能分支，开发一个新功能时拉取新的功能分支，开发完成后再并入开发分支。需要注意的是，合入开发的分支必须保证功能完整，不影响开发分支的正常运行。

> [!NOTE] Note develop分支则用来整合各个feature分支。开发中的版本的源代码存放在这里。即用于日常开发，存放最新的开发版。

### 3.3 功能分支（Feature）
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250920142428.png)

功能分支只能拉取自开发分支，开发完成后要么合并回开发分支，要么因为新功能的尝试不如人意而直接丢弃。

> [!NOTE] 每一个特性(feature)都必须在自己的分支里开发，feature分支派生自develop分支。

feature分支只存在于开发者本地，不能被提交到远程库。当feature开发完毕后，要合并回develop分支。feature分支永远不会和master分支打交道。

### 3.4 预发分支（Release）
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250920142446.png)

预发分支需要提交到服务器上，交由测试工程师进行测试，并由开发工程师修复 Bug。同时根据该分支的特性我们可以部署自动化测试以及生产环境代码的自动化更新和部署。

预发分支只能拉取自开发分支，合并回开发分支和主要分支。

> [!NOTE] Release 分支不是一个放正式发布产品的分支，你可以将它理解为“待发布”分支。
>   1. 把这个分支打包给测试人员测试
>   2. 在这个分支里修复 bug  
>   3. 编写发布文档

我们用这个分支干所有和发布有关的事情，比如：
所以，在这个分支里面**绝对不会添加新的特性。**
当和发布相关的工作都完成后，release 分支合并回 develop 和 master 分支。
单独搞一个 release 分支的好处是，当一个团队在做发布相关的工作时，另一个团队则可以接着开发下一版本的东西。
### 3.5 热修复分支（Hotfix）
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250920142516.png)

热修复分支只能主要分支上拉取，测试通过后合并回主要分支和开发分支。

> [!NOTE] 一个项目发布后或多或少肯定会有一些 bug 存在，而 bug 的修复工作并不适合在 develop 上做，这是因为
>   1. Develop 分支上包含还未验证过的 feature
>   2. 用户未必需要 develop 上的 feature  
>   3. Develop 还不能马上发布，而客户急需这个 bug 的修复。

这时就需要新建 hotfix 分支，hotfix 分支派生自 master 分支，仅仅用于修复 bug，当 bug 修复完毕后，马上回归到 master 分支，然后发布一个新版本，比如，V0.1.1。

同时 hotfix 也要合并回 develop 分支，这样 develop 分支就能享受到 bug 修复的好处了。

## 4.GitFlow 工作流程

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250920143117.png)


# 后话

此套流程仅作为抛砖引玉的效果，没有最好的流程，只有最适合自己的流程，并不是要求一字不落的完全按照此流程走，可以从中获得感悟，找到自己最舒服的方式来控制版本。

参考链接：
[Git之GitFlow工作流 | Gitflow Workflow（万字整理，已是最详）-CSDN博客](https://blog.csdn.net/sunyctf/article/details/130587970)
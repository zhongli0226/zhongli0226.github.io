---
title: Stable_diffusion入门学习
---

# 前言

最近升级了一下电脑的显卡，搞了个4060ti 16g的，于是乎终于可以玩玩一直想玩的AI绘画了。简单学习了一下入门教程，了解了一下基本的情况，于是选择秋葉大佬的启动器学习。

但是要画出好看的绘画，还是需要借助于许多其他工具来优化和修复绘画的图形。接下来我将一一记录我在学习过程中所整理的笔记和资料。

# 提示词基本语法

教程视频：[20分钟搞懂Prompt与参数设置，你的AI绘画“咒语”学明白了吗？ | 零基础入门Stable Diffusion·保姆级新手教程 | Prompt关键词教学_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV12X4y1r7QB/?t=439&spm_id_from=333.1350.jump_directly&vd_source=11734be81396b0b99bb97a3048eeb2cd)

AI绘画中，最为重要的就是提示词，所以的AI绘画都是更加提示词需求描述而生成的。但AI绘画充满随机性，所以要想要达到想要的效果，准确表述提示词则是AI绘画的关键。
## 提示词类别

这个根据教程整理一个简易的通用提示词框架：

![提示词基本逻辑和分类](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/提示词基本逻辑和分类.png)

### 提示词类别通用模板

- **描述人物**
	(1girl:2.0),solo,niou\(genshin impact\),solo,long hair,jewelry,blue gemstone,earrings,horms,crown,cyan satin strapless dress,white veil,neck ring,red hair,{green eyes},
- **描述场景**
	indoor,room,house,sofa,wooden floor,plant,flowers,trees,windows,
- **描述环境（时间、光照）**
	day,morning,sunlight,dappled sunlight,backlight,light rays,cloudy sky,
- **描述画幅视角**
	full body,wide angle shot,depth of field,
- **其他画面要素**
	light particles,fantasy,wind blow,maple leaf,dusty, ...(其他往后增加)

- **高品质标准化**
	{{masterpiece}},{best quality},{highres},original,reflection,unreal engine,body shadow,artstationextremely detailed CG unity 8k wallpaper
- **画风标准化**
	(illustration),(painting),(sketch),anime coloring,fantasy,
- **其他特殊要求**
	exaggerated body proportions,greasy skin,realistic and delicate facial features,SFW,

## 提示词权重

![提示词权重语法.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/提示词权重语法.png)

## 进阶提示词用法

-  **混合**
	混合两个描述同一对象的提示词要素
	white|yellow flower,
	生成黄色和白色混合的花
-  **迁移**
	连续生成具有多个不同特征的对象，不断迁移
	[while|red|blue] flower,
	先生成百花，再生成红花，再生成蓝花
- **迭代**
	与采样进程关联，一定阶段以后再生成特定对象
	(while flower:bush:0.8),
	进程达到80%（0.8）之前生成白花，80%之后再生成灌木

## 负面提示词

不希望在画面中产生的。

通用模板：
``` txt
NSFW, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, (ugly:1.331), (duplicate:1.331), (morbid:1.21), (mutilated:1.21), (tranny:1.331), mutated hands, (poorly drawn hands:1.5), blurry, (bad anatomy:1.21), (bad proportions:1.331), extra limbs, (disfigured:1.331), (missing arms:1.331), (extra legs:1.331), (fused fingers:1.61051), (too many fingers:1.61051), (unclear eyes:1.331), lowers, bad hands, missing fingers, extra digit,bad hands, missing fingers, (((extra arms and legs))),
```

- **色情暴力**
	NSFW
- **低质量**
	(worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, 
- **单色灰度**
	((monochrome)), ((grayscale)),
- **畸形身体比例**
	bad proportions
- **丑陋不好看的**
	(ugly:1.331)
- **异常四肢**
	(poorly drawn hands:1.5), blurry, (bad anatomy:1.21), (bad proportions:1.331), extra limbs, (disfigured:1.331), (missing arms:1.331), (extra legs:1.331), (fused fingers:1.61051), (too many fingers:1.61051), (unclear eyes:1.331), lowers, bad hands, missing fingers, extra digit,bad hands, missing fingers, (((extra arms and legs))),




# 出图参数

## 1.采样步数

理论上来说，越大的采样步数，画面会更加精细，但随之而来，出图时间也会大大增加，合理选择恰当采样步数。
简易不要低于10.

## 2.采样方法

可以简单认为是AI进行图形生成的时候使用的某种特点的算法。

- **插画风格**
	Euler
- **速度快**
	DPM 2M , 2M Karras
- **细节丰富**
	SDE Karras
推荐使用带有+号的，一般+号是改进过的。
一些特殊的模型作者会告诉使用那个最好。例如：深渊橘推荐使用 DPM++ SDE Karras 
## 3.宽和高

默认 512 * 512 如果要提升按照倍数提高。
过高容易出现多人，多手，多脚。

## 4. 提示词相关性

提示词越高，AI画图内容程度越高。安全值7~12

## 5. 随机种子

-1 ： AI出图内容为随机
其他：会基于生成的图片，进行重新绘画。

## 6.生成批次

给出单图+格子预览图。

可以设置多批次，多次生成，选择最最优图。

批次数量是合成一个大图绘制的，建议性能不好不要调高，会爆显存。

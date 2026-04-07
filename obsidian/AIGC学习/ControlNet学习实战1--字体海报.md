---
title: ControlNet学习实战1--字体海报
---

最近玩AI绘画的过程中，突然发现了一个可以生成特点字体海报的技巧，特此记录学习一下。本片文章介绍大家制作一张2024龙年海报。

# ControlNet介绍
ControlNet是一个应用于Stable_diffusion一个插件，该插件可以让AI更加精准的生成准确的想要的图片，关于这些内容后期会专门更加细致的说明。
# 操作说明

1. 首先准备一张白纸黑字的图片，这里我准备一张写着 “2024” 的图片，我这里就用最简单字体生成一张图片。
![2024.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/2024.png)

2. 模型选择
	大模型：AWPainting
	 Lora：新年红包、3D龙 lora权重根据说明可自行调整。
![AWPainting.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/AWPainting.png)
![红包lora.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/%E7%BA%A2%E5%8C%85lora.png)
![3D龙lora.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/3D%E9%BE%99lora.png)

3. 正向提示词
```
dragon,new year
```

4. 反向提示词
```
EasyNegative,BadNegAnatomyV1-neg,badhandv4,BadDream,AS-YoungV2-neg,FastNegativeV2,NSFW,logo,text,blurry,low quality,bad anatomy,sketches,lowres,bad proportions,cropped,watermark,signature,worstquality,grayscale,monochrome,normal quality,out of focus,username,bad body,long body,(fat:1.2),long neck,deformed,mutated,mutation,ugly,disfigured,poorly drawn face,deformed,skin blemishes,skin spots,acnes,missing limb,malformed limbs,poorly drawn hands,mutated hands,extra arms,extra limb,disconnected limbs,floating limbs,malformed hands,mutated hands and fingers,bad hands,missing fingers,fused fingers,too many fingers,cross-eyed,bad feet,extra legs,
```

5. ControlNet配置
![](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/%E5%AD%97%E4%BD%93%E8%AE%BE%E7%BD%AE.png)
分辨率发至上方，点击生成。

6. 效果展示
![00358-3927416437-new year,dragon,(snowflakes_0.8),absurdres,cover,8k,poster style,3D effect,_lora_new_year_v1.0_0.6_,_lora_newyear_dragon_V1.0_0.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/00358-3927416437-new%20year,dragon,(snowflakes_0.8),absurdres,cover,8k,poster%20style,3D%20effect,_lora_new_year_v1.0_0.6_,_lora_newyear_dragon_V1.0_0.png)
![00346-2687739262-new year,dragon,(snowflakes_0.8),absurdres,cover,8k,poster style,3D effect,_lora_new_year_v1.0_0.6_,_lora_newyear_dragon_V1.0_0.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/00346-2687739262-new%20year,dragon,(snowflakes_0.8),absurdres,cover,8k,poster%20style,3D%20effect,_lora_new_year_v1.0_0.6_,_lora_newyear_dragon_V1.0_0.png)

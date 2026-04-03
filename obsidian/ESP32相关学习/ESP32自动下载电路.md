# 前言
 
在大多数ESP32开发板中，串口芯片是最为通用的一个IC，目前是为了方便给ESP32通过串口下载程序，且可以通过串口查看打印LOG信息，在下载阶段中，老早刚接触嵌入式时，学习51单片机的使用一般是复位冷启动才能进入到烧录模式，在STM32中更是需要使用跳线帽，改变启动方式才能下载。起始本质上这些都是大同小异的，都是需要先要将设备进行复位，然后控制BOOT脚，才能进入到串口烧录的阶段。而大部分串口芯片除了TX RX引脚外，还存在这其他可以控制IO引脚，DTR RTS等，在进入烧录模式前通过控制这些引脚实现对ESP32的自动复位且进入烧录模式。即可实现自动下载效果。
 
# 自动下载电路原理
 
不同型号的ESP32模组的自动下载电路起始2都是相同的，只是RST/EN,Boot的引脚略有不同。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241103163621.png)
根据电路原理：EN、IO0默认为高
DTR = 0; RTS = 0, 此时Q1截止，Q2截止，EN = 默认; IO0 = 默认
DTR = 0; RTS = 1，此时Q1导通，Q2截止, EN = 默认; IO0 = 0
DTR = 1; RTS = 0, 此时Q1截止，Q2导通, EN = 0; IO0 = 默认
DTR = 1; RTS = 1, 此时Q1截止，Q2截止, EN = 默认; IO0 = 默认
 
注意：在这种逻辑下可以发现，EN和IO0不能同时为0，但进入下载模式需要如下顺序：
1. IO0 = 0；EN = 0。
2. IO0 = 0；EN = 0 -> 1。
从逻辑上看没办法进入到下载模式，其实这部分还有另一部分电路在起作用。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241103163717.png)

 
EN信号连接在一个电容充放电电路上，EN由于电容充电，电平并不会立马变为高电平，而是缓慢上升，我们就可以使用这个时间差。
1、设置DTR = 1; RTS = 0, 此时 EN=0 IO=1
2、设置DTR = 0; RTS = 1, EN=0 IO=0 此时EN引脚由于电容充电，实际还是0
3、等待电容充电完成，此时 EN=1 IO=0，进入下载模式
 
> [!NOTE]
> 在有些环境下充电速度有时过快，可能导致芯片没有进入到下载模式，这时可以增大一下C6电容增长充电时间。
 
这里也可以看下官方提供的下载软件esptool.py看源码时就可以注意到设置顺序就是按照上面所说的设置顺序。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241103165323.png)

注意:这里False是设置为高电平，True设置为低电平
 
# 下载模式引脚配置
 
## 1.ESP32系列
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241103164738.png)

## 2.ESP32 C系列
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241103164358.png)
## 3.ESP32 S系列
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241103164131.png)

> [!NOTE]
> 对于这种多IO决定的，需要关注的IO是在不同启动模式下表现都不同的IO,以这个IO作为Boot控制脚。另一个IO可以外接固定上拉或下拉。
 
# 参考文章
 
- [【esp32 学习笔记】ESP32各型号模组进入下载模式的引脚配置及其自动下载电路 - FBshark - 博客园](https://www.cnblogs.com/FBsharl/p/18320709)
- [ESP32自动下载电路究竟是如何巧妙实现的-CSDN博客](https://blog.csdn.net/weixin_73588765/article/details/135441822)


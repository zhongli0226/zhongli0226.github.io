---
title: Luckfox开发--Flash镜像制作
---

在使用RV1103 Luckfox Pico开发板开发的过程中，由于板子上含有Flash封装口，但未焊上Flash，且Luckfox Pico Plus就是基于Flash制作的烧录镜像。所以，理论上来说，Luckfox Pico也是应该可以使用Flash制作镜像。

除了硬件上需要焊接上一块Flash以外，还需要修改SDK制作一个Flash的镜像。
# 焊接硬件

首先焊接Flash首先需要注意，芯片支持的Flash的型号，以及Flash的封装
，这里我选择**W25N04KVZEIR**。焊接时注意温度，不要影响到旁边其他器件。焊接完如同。
![IMG_20240921_200553.jpg](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/IMG_20240921_200553.jpg)

> [!NOTE]
> 将Flash焊接完成后，我这边使用官方的上位机烧录工具是无法得到正确的Flash烧录信息的，只有将Flash镜像制作完成，并且正确下载后才能确认焊接正常，所以这里无法验证是否焊接正确，需要对自己的焊接水平有一定自信。

# 制作镜像

进入之前搭建好的虚拟机系统中，找到SDK包的路径，在目录`luckfox-pico/project/cfg/BoardConfig_IPC`下，复制`BoardConfig-SD_CARD-Buildroot-RV1103_Luckfox_Pico-IPC.mk`文件，改名为`BoardConfig-SPI_NAND-Buildroot-RV1103_Luckfox_Pico_Pro-IPC.mk`并在新文件下修改下面几处：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240922133749.png)

> [!NOTE]
> 210M(rootfs)可以根据实际需要选择不同大小

在目录`luckfox-pico/sysdrv/source/kernel/arch/arm/boot/dts`下，复制`rv1103g-luckfox-pico.dts`，改名为`rv1103g-luckfox-pico-pro.dts`，并在新文件下修改下面几处：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240922134028.png)
完成后在根目录下编译镜像：
```
# 选择参考板级
RV1103/luckfox-pico$ ./build.sh lunch
You're building on Linux
  Lunch menu...pick the Luckfox Pico hardware version:
  选择 Luckfox Pico 硬件版本:
                [0] RV1103_Luckfox_Pico
                [1] RV1103_Luckfox_Pico_Mini_A
                [2] RV1103_Luckfox_Pico_Mini_B
                [3] RV1103_Luckfox_Pico_Plus
                [4] RV1106_Luckfox_Pico_Pro_Max
                [5] RV1106_Luckfox_Pico_Ultra
                [6] RV1106_Luckfox_Pico_Ultra_W
                [7] custom
Which would you like? [0~7][default:0]: 7
----------------------------------------------------------------
----------------------------------------------------------------
16. BoardConfig_IPC/BoardConfig-SPI_NAND-Buildroot-RV1103_Luckfox_Pico_Pro-IPC.mk
                             boot medium(启动介质): SPI_NAND
                          system version(系统版本): Buildroot
                        hardware version(硬件版本): RV1103_Luckfox_Pico_Pro
                              applicaton(应用场景): IPC
----------------------------------------------------------------
----------------------------------------------------------------
Which would you like? [default:0]: 16
[build.sh:info] Lunching for Default BoardConfig_IPC/BoardConfig-SPI_NAND-Buildroot-RV1103_Luckfox_Pico_Pro-IPC.mk boards...
[build.sh:info] Running build_select_board succeeded.

# 一键自动编译
RV1103/luckfox-pico$ ./build.sh

```
等待一会后，将`luckfox-pico/output`目录下的`image`文件夹复制到与window共享的文件夹下，并且使用usb连接开发板（先按住开发板的BOOT键，USB连接电脑，松开BOOT键）
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240922134725.png)
烧录成功显示如下：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240922140143.png)

# 系统验证

使用串口，登录系统，烧录的系统是buildroot
- 登录账号：root
- 登录密码：luckfox
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240922141851.png)
参考链接：
- [RV1103 Luckfox Pico使用SPI NAND Flash烧录镜像_rv1103烧录-CSDN博客](https://blog.csdn.net/weixin_45977690/article/details/140384421)
# 前言

嵌入式Linux，在我的认识当中一直属于是嵌入式技术上最顶层的技术，之前一直有学习过相关的基础知识，这次打算系统性的记录学习过程，将完整的从零开始，一步步自学提高相关知识。

# 虚拟机安装

在学习嵌入式Linux，首先需要的是一个虚拟机，虚拟机软件我接触过两个，一个是VMware，一个是VirtualBox。两者有些许区别，但对于我们只使用基础的功能来说的话其实差别不大，唯一的是后者为开源免费的软件，前者为付费软件（不提倡破解哈）。现在的我跟倾向于选择使用VirtualBox。接下来主要讲解一下VirtualBox安装流程。

## 一、下载安装软件

### 1.下载VirtualBox软件

下载地址：[Downloads – Oracle VM VirtualBox](https://www.virtualbox.org/wiki/Downloads)

### 2.Linux桌面发行版镜像

官网：[Ubuntu Releases](https://releases.ubuntu.com/)

国内镜像站：[Index of /ubuntu-releases/ | 清华大学开源软件镜像站 | Tsinghua Open Source Mirror](https://mirrors.tuna.tsinghua.edu.cn/ubuntu-releases/)

## 二、安装VirtualBox

打开软件一路点击“下一步”，留意下安装路径可以安装在别的盘上。

安装过程略过。

## 三、新建一个虚拟机
### 1.配置虚拟机

1. 运行VirtualBox，点击新建
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240809203535.png)
2. 新建页面如下，名称可以随意起，文件夹可以选择别的盘，类型选择Linux，版本选择Ubuntu（64-bit），暂时不要先选择虚拟光盘。设置完成后选择下一步。   
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240809204301.png)
3. 分配内存、处理器和磁盘大小
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240809204452.png)
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240809204551.png)
4. 确认好相关信息完成创建
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240809204728.png)
5. 选择刚才创建好的虚拟机进入设置界面
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240809211505.png)
6. 可以改变一下相关配置信息，显存大小建议拉满128MB
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240810145417.png)
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240810145456.png)
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240810145527.png)
7. 将之前下载好的镜像文件找到并放在对应路径上
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240810145824.png)
按照上面流程走完后就可以运行安装系统了。
### 2.安装系统
1. 点击启动，启动系统。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240810150303.png)
2. 安装Ubuntn
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811163005.png)

> [!可能出现的问题]
> 部分版本安装可能出现显示界面不全的情况，如上，可以使用`Ctrl + Alt + T`打开终端，输入`xrandr -s 1280x720`调节下分辨率。
> ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811163203.png)

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811163355.png)
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811163416.png)

3. 配置增强功能
- 自动适应全屏分辨率
  点击界面的“设备”，选择安装增强功能，点击运行。系统会显示出来安装了一个光盘。并弹出提示窗口，点击“运行”。
  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811171443.png)
  输入密码。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811171526.png)确认后命令行脚本自动运行，完成。
  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811165138.png)
   这时会发现“视图”选项中的“自动调整显示尺寸”就可以使用了，点击后就可以是显示窗口自动填满界面。
   ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811171855.png)

- 共享文件夹设置
  在设置中找到共享文件夹选择项，并按照如下设置。设置路径为win10下自行决定的一个路径。
  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240810194708.png)
  在虚拟机中新建一个文件夹就在桌面上，Win10
  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811172038.png)
  弹出光盘，重新安装增强功能，这次弹出窗口中，选择取消。
  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811172228.png)
  打开终端，按照如下操作来
  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811173339.png)
  在共享文件夹中创建一个文件后对应路径下也会同时创建好相应的文件。
  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20240811173512.png)
  最后选择设备->共享粘贴板和拖放都设置为双向，既可以将主系统的文件复制粘贴进去。
  
参考链接见
- [Ubuntu安装时界面显示不全的解决方法_ubuntu显示不完整-CSDN博客](https://blog.csdn.net/ATTAIN__/article/details/140287008)
- [虚拟机||使用VirtualBox安装Ubuntu详细图文教程（安装+调整分辨率+共享文件）_virtualbox安装ubuntu12-CSDN博客](https://blog.csdn.net/Inochigohan/article/details/119791518)
到此虚拟机系统环境安装和配置就基本完成了，下面是SDK环境的搭建。
# Luckfox-SDK环境搭建
官方Wiki指导资料如下：
参考链接：[SDK 环境部署（PC端） | LUCKFOX WIKI](https://wiki.luckfox.com/zh/Luckfox-Pico/Luckfox-Pico-SDK/)
## 1.1 搭建编译环境
1. 安装依赖环境：
```
sudo apt update  
  
sudo apt-get install -y git ssh make gcc gcc-multilib g++-multilib module-assistant expect g++ gawk texinfo libssl-dev bison flex fakeroot cmake unzip gperf autoconf device-tree-compiler libncurses5-dev pkg-config bc python-is-python3 passwd openssl openssh-server openssh-client vim file cpio rsync curl
```
2. 获取最新的 SDK ：
```
git clone https://gitee.com/LuckfoxTECH/luckfox-pico.git
```
3. 编译镜像：
```
luckfox@luckfox:~$ ./build.sh lunch  
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
Which would you like? [0~7][default:0]: 3  
Lunch menu...pick the boot medium:  
选择启动媒介:  
[0] SD_CARD  
[1] SPI_NAND  
Which would you like? [0~1][default:0]: 1  
Lunch menu...pick the system version:  
选择系统版本:  
[0] Buildroot(Support Rockchip official features)  
Which would you like? [0~1][default:0]: 0  
[build.sh:info] Lunching for Default BoardConfig_IPC/BoardConfig-SPI_NAND-Buildroot-RV1103_Luckfox_Pico_Plus-IPC.mk boards...  
[build.sh:info] Running build_select_board succeeded.  
  
luckfox@luckfox:~$ ./build.sh
```  
## 1.2 SDK 目录说明
1. SDK目录结构
```
├── build.sh -> project/build.sh ---- SDK编译脚本  
├── media --------------------------- 多媒体编解码、ISP等算法相关（可独立SDK编译）  
├── sysdrv -------------------------- U-Boot、kernel、rootfs目录（可独立SDK编译）  
├── project ------------------------- 参考应用、编译配置以及脚本目录  
├── output -------------------------- SDK编译后镜像文件存放目录  
└── tools --------------------------- 烧录镜像打包工具以及烧录工具
```
2. 镜像存放目录
```
output/  
├── image  
│ ├── download.bin ---------------- 烧录工具升级通讯的设备端程序，只会下载到板子内存  
│ ├── env.img --------------------- 包含分区表和启动参数  
│ ├── uboot.img ------------------- uboot镜像  
│ ├── idblock.img ----------------- loader镜像  
│ ├── boot.img -------------------- kernel镜像  
│ ├── rootfs.img ------------------ kernel镜像  
│ └── userdata.img ---------------- userdata镜像  
└── out  
├── app_out --------------------- 参考应用编译后的文件  
├── media_out ------------------- media相关编译后的文件  
├── rootfs_xxx ------------------ 文件系统打包目录  
├── S20linkmount ---------------- 分区挂载脚本  
├── sysdrv_out ------------------ sysdrv编译后的文件  
└── userdata -------------------- userdata
```
## 1.3 SDK配置文件说明
1. Luckfox-Pico 系列 SDK 配置文件存放在 project/cfg/BoardConfig_IPC 目录下。
```
BoardConfig-EMMC-Buildroot-RV1103_Luckfox_Pico-IPC.mk BoardConfig-SPI_NAND-Buildroot-RV1103_Luckfox_Pico_Mini_B-IPC.mk  
BoardConfig-EMMC-Buildroot-RV1103_Luckfox_Pico_Mini_A-IPC.mk BoardConfig-SPI_NAND-Buildroot-RV1103_Luckfox_Pico_Plus-IPC.mk  
BoardConfig-EMMC-Ubuntu-RV1103_Luckfox_Pico-IPC.mk BoardConfig-SPI_NAND-Buildroot-RV1106_Luckfox_Pico_Pro_Max-IPC.mk  
BoardConfig-EMMC-Ubuntu-RV1103_Luckfox_Pico_Mini_A-IPC.mk rv1103-spi_nor-post.sh  
BoardConfig-EMMC-Ubuntu-RV1103_Luckfox_Pico_Plus-IPC.mk rv1106-spi_nor-post.sh  
BoardConfig-EMMC-Ubuntu-RV1106_Luckfox_Pico_Pro_Max-IPC.mk
```
2. 我们将以 'BoardConfig-EMMC-Ubuntu-RV1106_Luckfox_Pico_Pro_Max-IPC.mk' 为例，详细介绍其中关键的文件配置。
```
# Config CMA size in environment  
export RK_BOOTARGS_CMA_SIZE="66M"  
  
# Kernel dts  
export RK_KERNEL_DTS=rv1106g-luckfox-pico-pro-max.dts  
  
# Target boot medium: emmc/spi_nor/spi_nand  
export RK_BOOT_MEDIUM=emmc  
  
export RK_PARTITION_CMD_IN_ENV="32K(env),512K@32K(idblock),256K(uboot),32M(boot),512M(oem),256M(userdata),6G(rootfs),-(media)"  
  
# Target rootfs : ubuntu(only emmc)/buildroot/busybox  
export LF_TARGET_ROOTFS=ubuntu  
  
# SUBMODULES : gitee/gitee  
export LF_SUBMODULES_BY=gitee  
  
# Buildroot defconfig  
export RK_BUILDROOT_DEFCONFIG=luckfox_pico_defconfig
```
-  `RK_BOOTARGS_CMA_SIZE`：给摄像头分配的内存，如果不使用摄像头可以将其修改为 1M
- `RK_KERNEL_DTS`：指定设备树文件
- `RK_BOOT_MEDIUM`：指定目标启动介质，可以是 emmc（指的是SD卡）、spi_nor（SPI NOR Flash）或 spi_nand（SPI NAND Flash）
- `RK_PARTITION_CMD_IN_ENV`：这是用于配置分区表的信息，如果需要与 SD 卡的存储空间匹配，您可以修改 rootfs 分区。
- `LF_TARGET_ROOTFS`：指定目标的根文件系统（Root File System）
- `LF_SUBMODULES_BY`：指定子模块的来源
- `RK_BUILDROOT_DEFCONFIG`：指定 Buildroot 的配置文件

## 1.4 编译镜像
从《1.3 SDK配置文件说明》可以得知，Ubuntu 镜像仅支持 SD 卡启动，而 Buildroot 镜像既支持TF卡启动又支持 SPI NAND FLASH 启动。
1. 如果需要编译ubuntu系统，并且使用gitee源，请修改对应的板型mk文件中LF_SUBMODULES_BY改为gitee，如：
```
LF_SUBMODULES_BY=gitee
```
2. 如果您希望编译 Buildroot 镜像，使其能够支持 TF 卡启动，请修改对应的板型 BoardConfig-EMMC-Ubuntu-xxx.mk文件中 LF_TARGET_ROOTFS 改为 buildroot，如：
```
export LF_TARGET_ROOTFS=buildroot
```
3. 安装交叉编译工具链：
 ```
cd {SDK_PATH}/tools/linux/toolchain/arm-rockchip830-linux-uclibcgnueabihf/  
source env_install_toolchain.sh
```
4. 全部编译镜像：
```
cd luckfox-pico  
  
#编译busybox/buildroot  
./build.sh lunch  
./build.sh  
  
#编译ubuntu  
sudo ./build.sh lunch  
sudo ./build.sh
```

- 注意编译ubuntu时需要注意使用sudo，否则会导致文件系统错误
- 下文就不一一区分两者指令区别，请自行根据情况选择

> [!NOTE] 注意
> 初次编译时间较长，且在初次编译的过程中会下载许多的工具包。有些网络情况不是很好的，有时会中断报错，一定要有耐心坚持编译完成，我这边第一次编译连续看了好几个晚上才完成第一次编译。
> 由于编译使用的是buildroot系统，可以进入其menuconfig的配置界面修改下载软件的镜像地址。

### 1.4.1 部分编译
1. 单独编译U-Boot
```
./build.sh clean uboot./build.sh uboot
```
- 生成镜像文件： output/image/MiniLoaderAll.bin output/image/uboot.img
2. 单独编译kernel
```
./build.sh clean kernel./build.sh kernel
```
- 生成镜像文件： output/image/boot.img
3. 单独编译rootfs
```
./build.sh clean rootfs./build.sh rootfs
```
- 注：编译后需使用`./build.sh firmware`命令重新打包
4. 单独编译media
```
./build.sh clean media./build.sh media
```
- 生成文件的存放目录：output/out/media_out ，编译后需使用`./build.sh firmware`命令重新打包
5. 单独编译参考应用
```
./build.sh clean app./build.sh app
```
- 注1：app依赖media
- 注2：编译后需使用`./build.sh firmware`命令重新打包
6. 固件打包
```
./build.sh firmware
```
7. 内核设置
```
./build.sh kernelconfig
```
打开 kernel 的 menuconfig 界面
8. buildroot 设置
```
./build.sh buildrootconfig
```
打开 buildroot 的 menuconfig 界面
- 注：仅在选择 buildroot 作为 rootfs 时才能正常运行

  





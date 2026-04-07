---
title: 认识ESP32_IDF环境
---

# 前言

最近在学习的过程中，推荐身边朋友使用$ESP32$但是由于$ESP32$官方并没有专门的IDE导致，身边很多朋友（包括我自己一开始也是）不知道如何入门$ESP32$。

本片文章将从$STM32$的视角出发，给想入门$ESP32$的朋友提供了解$ESP32$的环境概念帮助，并教大家如何和$STM32$一样去开发和学习$ESP32$。

$ESP32$环境不同与$STM32$。$STM32$可以采用$keil$直接一体化的软件，编译，下载，调试。但$ESP32$目前没有同一的IDE可以直接调试$ESP32$，故学习$ESP32$需要自行搭建开发环境，这也是为什么$ESP32$难于上手的原因。

# ESP32环境认识与使用

## 1.ESP32代码编译器选择

在学习STM32过程中，我们大多数采用keil进行开发，我们一般会把代码写在keil文本区，然后编译，编译结果显示在下方，我们可以根据编译结果进行修改代码错误。在此过程中我们用到了两个工具：

- 文本编辑器
- keil编译工具包。

举一反三，同样编译ESP32我们也需要这两种工具。这里我选择**vscode**作为我的文本编译器，**ESP32-IDF**为编译工具包。**vscode**作为一款插件丰富的代码编译器，是搭建许多开发环境的首选。而**ESP-IDF**可视为乐鑫官方提供给开发者的开发环境，例如keil分为ARM版，C51版，不同版对应不同单片机开发环境。**ESP-IDF**本质上是官方提供的基础库，可视为STM32的HAL库。但在提供库代码的基础上增加了编译环境，在此环境下进行编译开发，可以直接调用到官方的API接口。

## 2.编译终端的选择

上面说到，**ESP-IDF**会提供开发环境，提供开发环境的方法就是利用终端脚本，将基础库代码路径临时注册到你电脑的环境变量中，这样你在调用.h文件时就可以直接引用了。此时编译就要在刚刚创建完的终端里进行。乐鑫官方提供了默认的两个终端，分别为**win10**自带的**Cmd**和**Shell**。这里可以将此终端集成到**VScode**里在其内部进行编译。但此方法会将**VScode**变成专门的**ESP32**的开发环境。若感觉兴趣可以参考这篇[文章](https://hellobug.blog.csdn.net/article/details/108405073)。

本人采用的是第三方的一个终端，主要是终端颜值比**Win10**自带的好看，而且有很多丰富的功能可以发掘——[Tabby](https://www.oschina.net/p/tabby?hmsr=aladdin1e1)。采用第三方终端需要对终端有一定配置才能使用**ESP32**的开发环境。

建议新手还是使用官方提供的两个终端即可。

## 3.代码编译和烧录

现在已经完成了代码基本环境的搭建，下面将进行代码的编译，在$STM32$中我们编译和下载只需要点击软件界面下的几个小图标即可实现，但是，**ESP-IDF**只是一个代码底层库，所以，编译和烧录需要我们通过在编译终端栏处手动输入指令才可以实现。

基本概念已经介绍完了，下面介绍开发**ESP32**一整套流程。

# ESP32开发流程

## 1.创建一个新的工程

首先了解终端一个基础的命令：$cd$。

$cd$意思是进入某某路径，如图。这里我们一般进入自己设置的**ESP32**的工程目录下，可以看到前面的路径已经变成的自己设置的地址。

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程1.png)

接下来，我们输入指令：
```powershell
idf.py create-project --path <项目名> <主函数名>
```

创建**ESP32**工程，创建完成后输入$ls$命令，即可查看到自己刚刚创建的文件夹。

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程2.png)

然后我们进入到刚刚创建的目录下：

```powershell
 cd .\test\
 ls
```

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程3.png)

也可以打开资源管理器看到所创建的内容

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程4.png)

右键点击空白部分 选择**通过Code打开**

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程5.png)

至此**ESP32**工程建立完成。

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程6.png)

## 2.工程架构说明

### VScode必备插件

要正常使用VScode编译ESP32至少需要以下三个插件：

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程7.png)

### 目录结构说明

这里以我自己的一个详细工程说明

```powershell
C:.
│  .gitignore
│  CMakeLists.txt //ESP-IDF采用cmake链接工程
│  README.md
│  sdkconfig  //ESP-IDF配置文件
│  sdkconfig.old
│
├─.vscode  // VScode配置文件
│      c_cpp_properties.json
│      settings.json
│
├─build  // 编译代码输出
│
├─components  //工程项目组件，类似于keil工程下分类的不同文件夹
│  ├─dns_server  //每一个组件文件夹下必有一个CMakeLists.txt用于链接编程
│  │      CMakeLists.txt
│  │      dns_server.c
│  │      dns_server.h
│  │
│  ├─web_server
│  │      CMakeLists.txt
│  │      index.html
│  │      url.c
│  │      url.h
│  │      web_server.c
│  │      web_server.h
│  │      wifi.html
│  │
│  ├─wifi_nvs
│  │      CMakeLists.txt
│  │      wifi_nvs.c
│  │      wifi_nvs.h
│  │
│  ├─wifi_softap
│  │      CMakeLists.txt
│  │      wifi_softap.c
│  │      wifi_softap.h
│  │
│  └─wifi_station
│          CMakeLists.txt
│          wifi_station.c
│          wifi_station.h
│
└─main //主函数文件夹
        CMakeLists.txt
        main_app.c
        main_app.h
```

#### 1.VScode配置文件夹说明

在**VScode**界面下按下快捷键`Ctrl`+`Shift`+`P`打开命令输入菜单，点击如下选项，配置包含路径。

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程8.png)

生成`.vscode`文件夹，在`c_cpp_properties.json`文件下配置，参考配置代码（通用）

```json
{
    "configurations": [
        {
            "name": "Win32",
            "includePath": [
                "${workspaceFolder}/**",
                "${workspaceFolder}/build/config",
                "${IDF_PATH}/components/**",
                "${IDF_PATH}/components/freertos/include/**",
                "${IDF_PATH}/components/driver/include/**",
                "${IDF_PATH}/components/log/include/**",
                "${IDF_TOOLS_PATH}/tools/xtensa-esp32-elf/esp-2021r2-patch3-8.4.0/xtensa-esp32-elf/xtensa-esp32-elf/include/sys/**",
                "${IDF_TOOLS_PATH}/tools/xtensa-esp32-elf/esp-2021r2-patch3-8.4.0/xtensa-esp32-elf/xtensa-esp32-elf/include/**"
            ],
            "defines": [
                "_DEBUG",
                "UNICODE",
                "_UNICODE"
            ],
            "compilerPath": "C:/System Tools/mingw64/bin/gcc.exe",
            "cStandard": "gnu17",
            "cppStandard": "gnu++14",
            "intelliSenseMode": "windows-gcc-x64"
        }
    ],
    "version": 4
}
```

并且在系统环境变量中创建以下两个变量：路径为自己安装的ESP-IDF路径。

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程9.png)

#### 2.添加组件

打开ESP32特有终端，进入刚刚创建的工程下。使用指令创建组件：
```powershell
idf.py -C components create-component test1
```

$test1$为组件名。

创建完成后如图：

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程10.png)

此时，工程目录下生成了一个`components`文件夹，进入文件夹后，产生了刚刚创建的组件文件夹。

组件文件夹默认包含以下内容：可根据需要添加`.c / .h`文件。

```powershell
C:.
└─test1
    │  CMakeLists.txt
    │  test1.c
    │
    └─include
            test1.h
```

#### 3.CMakeLists.txt文件编写规范

这部分较为繁琐，但并不复杂，可在使用的过程中摸索。

### 3.编译调试说明

接下来可以编译，下载了。

退回到刚才的工程根目录下，使用指令`idf.py build`编译工程。初次编译时间较长，请耐心等待。

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程11.png)

编译完成后即可使用指令`idf.py -p PORT flash` 烧录下载到单片机中 `PORT`为下载设备端口，ESP32目前官方提供的下载方式为串口下载。也可采用JTAG下载，但必须采用官方下载器，较为麻烦，这里不做推荐。

![ESP32_IDF环境搭建流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/ESP32_IDF环境搭建流程12.png)

这样就可以愉快的开始你的ESP32之旅了。

# 补充：ES32_IDF指令说明

## 1.基础指令

|           功能            |                 命令                 |
| :-----------------------: | :----------------------------------: |
|         配置界面          |         `idf.py menuconfig`          |
|         清理工程          |          `idf.py fullclean`          |
|           编译            |            `idf.py build`            |
|         烧录下载          |        `idf.py -p PORT flash`        |
|         监视端口          |       `idf.py -p PORT monitor`       |
|  擦除整个flash并烧录下载  |    `idf.py (-p PORT) erase_flash`    |
|      编译+烧录+监视       | `idf.py -p PORT build flash monitor` |
| 设定目标芯片（默认ESP32） |    `idf.py set-target <芯片名称>`    |

## 2.开始新项目

```powershell
idf.py create-project --path <项目名> <主函数名>
```

以上命令会直接在 `<项目名>` 目录下创建一个名为 `<主函数名>` 的新项目

## 3.创建新组件

```powershell
idf.py -C components create-component <组件名>
```

该示例将在当前工作目录下的子目录 `components` 中创建一个新的组件。

如果在现有项目中通过将组件移动到一个新位置来覆盖它，项目不会自动看到新组件的路径。请运行`idf.py reconfigure`命令后（或删除项目构建文件夹）再重新构建。